import { create } from 'zustand';
import type { ChatMessage, PoolReference } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  sessionId: string;
  isStreaming: boolean;
  addUserMessage: (content: string) => void;
  startAssistantMessage: () => string;
  appendToAssistant: (id: string, text: string) => void;
  finalizeAssistant: (id: string, poolRefs?: PoolReference[]) => void;
  setStreaming: (v: boolean) => void;
  clearChat: () => void;
}

let msgCounter = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: crypto.randomUUID(),
  isStreaming: false,
  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `msg-${++msgCounter}`, role: 'user', content },
      ],
    })),
  startAssistantMessage: () => {
    const id = `msg-${++msgCounter}`;
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: 'assistant', content: '', isStreaming: true },
      ],
    }));
    return id;
  },
  appendToAssistant: (id, text) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    })),
  finalizeAssistant: (id, poolRefs) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, isStreaming: false, poolReferences: poolRefs }
          : m
      ),
    })),
  setStreaming: (v) => set({ isStreaming: v }),
  clearChat: () =>
    set({ messages: [], sessionId: crypto.randomUUID() }),
}));
