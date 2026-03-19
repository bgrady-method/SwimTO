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
    <div className="lg:hidden h-14 border-t border-border bg-background flex items-center justify-around shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors',
            activeTab === tab.id
              ? 'text-sky-500'
              : 'text-muted-foreground'
          )}
        >
          <tab.icon className="h-5 w-5" />
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
