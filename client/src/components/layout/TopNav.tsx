import { Waves, MapPin, MessageCircle, Compass, WifiOff, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

interface TopNavProps {
  activeTab: 'chat' | 'explore';
  onTabChange: (tab: 'chat' | 'explore') => void;
  locationName?: string;
}

export function TopNav({ activeTab, onTabChange, locationName }: TopNavProps) {
  const { isOffline } = useOfflineStatus();
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <nav className="pt-[var(--sat)] border-b border-border bg-background/95 backdrop-blur shrink-0 z-50">
      <div className="h-14 flex items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <Waves className="h-6 w-6 text-sky-500" />
          <span className="font-bold text-lg tracking-tight">
            <span className="text-sky-900 dark:text-sky-100">Swim</span>
            <span className="text-sky-500">TO</span>
          </span>
        </div>

        {/* Tabs — hidden on mobile, BottomTabBar handles it */}
        <div className="hidden lg:flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => onTabChange('chat')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === 'chat'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => onTabChange('explore')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === 'explore'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Compass className="h-4 w-4" />
            Explore
          </button>
        </div>

        <div className="flex-1" />

        {/* Offline indicator */}
        {isOffline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <WifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}

        {/* Install button */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-medium hover:bg-sky-200 dark:hover:bg-sky-800/50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Location badge */}
        {locationName && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{locationName}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
