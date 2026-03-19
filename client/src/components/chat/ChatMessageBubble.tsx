import { User, Waves } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ResultsCarousel } from './ResultsCarousel';
import type { ChatMessage } from '@/types/chat';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'flex-row-reverse' : '')}>
      {/* Avatar */}
      <div
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300'
            : 'bg-sky-500 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Waves className="h-4 w-4" />}
      </div>

      {/* Message */}
      <div className={cn('flex flex-col gap-2 max-w-[85%]', isUser ? 'items-end' : '')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-sky-500 text-white rounded-tr-md'
              : 'bg-muted text-foreground rounded-tl-md'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-strong:text-foreground overflow-hidden break-words">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {/* Pool references carousel */}
        {message.poolReferences && message.poolReferences.length > 0 && (
          <ResultsCarousel pools={message.poolReferences} />
        )}
      </div>
    </div>
  );
}
