import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/stores/useChatStore';
import { useMapStore } from '@/stores/useMapStore';
import { useFilterStore } from '@/stores/useFilterStore';
import { detectOfflineAI, createOfflineAISession } from '@/lib/offline-ai';
import type { PoolReference } from '@/types/chat';
import type { PoolSearchResult, PoolSearchResponse } from '@/types/pool';
import type { OfflineAIProvider } from '@/lib/offline-ai';

/** Extract cached pool results from React Query cache */
function getCachedPools(queryClient: ReturnType<typeof useQueryClient>): PoolSearchResult[] {
  const cache = queryClient.getQueryCache().getAll();
  for (const query of cache) {
    if (
      Array.isArray(query.queryKey) &&
      query.queryKey[0] === 'poolSearch' &&
      query.state.data
    ) {
      const data = query.state.data as PoolSearchResponse;
      if (data.results?.length) return data.results;
    }
  }
  return [];
}

export function useChatStream() {
  const {
    sessionId,
    isStreaming,
    addUserMessage,
    startAssistantMessage,
    appendToAssistant,
    finalizeAssistant,
    setStreaming,
  } = useChatStore();
  const { userLocation, setHighlightedPools } = useMapStore();
  const queryClient = useQueryClient();

  // Keep a ref to the offline session to reuse / destroy
  const offlineSessionRef = useRef<{ prompt(msg: string): AsyncGenerator<string>; destroy(): void } | null>(null);
  const offlineProviderRef = useRef<OfflineAIProvider | null>(null);

  const handleOffline = useCallback(
    async (message: string, assistantId: string) => {
      const cachedPools = getCachedPools(queryClient);

      // Try providers in order, falling back on failure
      const providers: OfflineAIProvider[] = [];

      if (!offlineSessionRef.current) {
        const detected = await detectOfflineAI();
        providers.push(detected);
        if (detected !== 'keyword-fallback') providers.push('keyword-fallback');
      }

      // If we already have a session, use it directly
      if (offlineSessionRef.current) {
        try {
          appendToAssistant(assistantId, '*_Offline mode_* — ');
          for await (const chunk of offlineSessionRef.current.prompt(message)) {
            appendToAssistant(assistantId, chunk);
          }
          return;
        } catch {
          offlineSessionRef.current?.destroy();
          offlineSessionRef.current = null;
          providers.length = 0;
          providers.push('keyword-fallback');
        }
      }

      // Try each provider in the fallback chain
      for (const provider of providers) {
        try {
          offlineProviderRef.current = provider;
          offlineSessionRef.current = await createOfflineAISession(provider, cachedPools);

          appendToAssistant(assistantId, '*_Offline mode_* — ');
          for await (const chunk of offlineSessionRef.current.prompt(message)) {
            appendToAssistant(assistantId, chunk);
          }
          return;
        } catch {
          offlineSessionRef.current?.destroy();
          offlineSessionRef.current = null;
        }
      }

      // All providers failed
      appendToAssistant(assistantId, "*_Offline mode_* — I'm currently offline and can't generate a response. Try the **Explore** tab to browse cached pool data.");
    },
    [appendToAssistant, queryClient]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (isStreaming || !message.trim()) return;

      addUserMessage(message);
      setStreaming(true);
      const assistantId = startAssistantMessage();

      // Check if offline
      if (!navigator.onLine) {
        await handleOffline(message, assistantId);
        finalizeAssistant(assistantId);
        setStreaming(false);
        return;
      }

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            sessionId,
            userLocation: userLocation
              ? { lat: userLocation[0], lng: userLocation[1] }
              : undefined,
          }),
        });

        if (!response.ok) throw new Error('Chat request failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let poolRefs: PoolReference[] = [];
        let hadToolCall = false;
        let hasContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const msg of messages) {
            let eventType = '';
            const dataLines: string[] = [];

            for (const line of msg.split('\n')) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                dataLines.push(line.slice(6));
              }
            }
            const data = dataLines.join('\n');

            if (!eventType) continue;

            switch (eventType) {
              case 'text':
                if (hadToolCall && hasContent) {
                  appendToAssistant(assistantId, '\n\n');
                  hadToolCall = false;
                }
                appendToAssistant(assistantId, data);
                hasContent = true;
                break;
              case 'tool_call':
                hadToolCall = true;
                try {
                  const toolInfo = JSON.parse(data);
                  if (toolInfo.tool === 'fetch_webpage') {
                    appendToAssistant(assistantId, '\n\n*Browsing the web...*\n\n');
                    hasContent = true;
                  }
                } catch { /* ignore parse errors */ }
                break;
              case 'tool_result':
                break;
              case 'applied_filters':
                try {
                  const filters = JSON.parse(data);
                  const fs = useFilterStore.getState();
                  if (filters.pool_type) fs.setAttributes({ poolType: filters.pool_type });
                  if (filters.swim_types) fs.setSwimTypes(filters.swim_types);
                  if (filters.days_of_week) fs.setDaysOfWeek(filters.days_of_week);
                  if (filters.time_from && filters.time_to) fs.setTimeRange(filters.time_from, filters.time_to);
                  if (filters.lat != null && filters.lng != null && filters.radius_km != null)
                    fs.setLocation({ lat: filters.lat, lng: filters.lng, radiusKm: filters.radius_km });
                  if (filters.amenities) fs.setAmenities(filters.amenities);
                } catch { /* ignore */ }
                break;
              case 'pool_references':
                try {
                  poolRefs = JSON.parse(data);
                  setHighlightedPools(poolRefs);
                } catch { /* ignore */ }
                break;
              case 'error':
                appendToAssistant(assistantId, `\n\n*Error: ${data}*`);
                break;
              case 'done':
                break;
            }
          }
        }

        finalizeAssistant(assistantId, poolRefs.length > 0 ? poolRefs : undefined);
      } catch {
        // Network error — try offline fallback
        await handleOffline(message, assistantId);
        finalizeAssistant(assistantId);
      } finally {
        setStreaming(false);
      }
    },
    [
      sessionId,
      isStreaming,
      userLocation,
      addUserMessage,
      startAssistantMessage,
      appendToAssistant,
      finalizeAssistant,
      setStreaming,
      setHighlightedPools,
      handleOffline,
    ]
  );

  return { sendMessage, isStreaming };
}
