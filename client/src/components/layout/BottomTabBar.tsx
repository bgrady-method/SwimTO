import { MessageCircle, Map, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

type MobileTab = 'chat' | 'map' | 'explore';

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const tabs = [
    { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'explore' as const, icon: Compass, label: 'Explore' },
  ];

  return (
    <div className="lg:hidden pb-[var(--sab)] border-t border-border bg-background shrink-0">
      <div className="h-14 flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-4 min-h-[44px] rounded-lg transition-colors',
              activeTab === tab.id
                ? 'text-sky-500'
                : 'text-muted-foreground active:bg-muted'
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
