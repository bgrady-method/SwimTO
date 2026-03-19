import { useCallback } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useMapStore } from '@/stores/useMapStore';
import { useFilterStore } from '@/stores/useFilterStore';
import type { PoolReference } from '@/types/chat';

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

  const sendMessage = useCallback(
    async (message: string) => {
      if (isStreaming || !message.trim()) return;

      addUserMessage(message);
      setStreaming(true);
      const assistantId = startAssistantMessage();

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

          // SSE messages are separated by double newlines
          const messages = buffer.split('\n\n');
          // Last element may be incomplete — keep it in the buffer
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
                // Add separator when text resumes after a tool call
                if (hadToolCall && hasContent) {
                  appendToAssistant(assistantId, '\n\n');
                  hadToolCall = false;
                }
                appendToAssistant(assistantId, data);
                hasContent = true;
                break;
              case 'tool_call':
                hadToolCall = true;
                break;
              case 'tool_result':
                // tool result received, next text will be the final answer
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
      } catch (error) {
        appendToAssistant(assistantId, '\n\n*Error: Could not connect to the chat service.*');
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
    ]
  );

  return { sendMessage, isStreaming };
}
