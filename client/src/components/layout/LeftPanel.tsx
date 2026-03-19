import { ChatView } from '@/components/chat/ChatView';
import { ExploreView } from '@/components/explore/ExploreView';
import type { PoolSearchResult } from '@/types/pool';

interface LeftPanelProps {
  activeTab: 'chat' | 'explore';
  results: PoolSearchResult[];
  isLoading: boolean;
}

export function LeftPanel({ activeTab, results, isLoading }: LeftPanelProps) {
  return (
    <div className="w-full lg:w-[420px] h-full border-r border-border flex flex-col overflow-hidden shrink-0">
      {activeTab === 'chat' ? (
        <ChatView />
      ) : (
        <ExploreView results={results} isLoading={isLoading} />
      )}
    </div>
  );
}
