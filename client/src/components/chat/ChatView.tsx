import { useRef, useEffect } from 'react';
import { Waves } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { ChatMessageBubble } from './ChatMessageBubble';
import { SuggestedQueries } from './SuggestedQueries';
import { useChatStream } from '@/hooks/useChatStream';
import { useChatStore } from '@/stores/useChatStore';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ChatView() {
  const { messages } = useChatStore();
  const { sendMessage, isStreaming } = useChatStream();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 overflow-x-hidden">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center px-4 pt-16 pb-8 gap-6">
            <div className="h-16 w-16 rounded-2xl bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
              <Waves className="h-8 w-8 text-sky-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">SwimTO</h2>
              <p className="text-sm text-muted-foreground max-w-[300px]">
                Find the perfect pool and swim time in Toronto. Ask me anything about public pools!
              </p>
            </div>
            <SuggestedQueries onSelect={sendMessage} />
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
