import { useState, useEffect } from 'react';
import { TopNav } from './TopNav';
import { LeftPanel } from './LeftPanel';
import { BottomTabBar } from './BottomTabBar';
import { MapPanel } from '@/components/map/MapPanel';
import { usePoolSearch } from '@/hooks/usePoolSearch';
import { useRankedResults } from '@/hooks/useRankedResults';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useMapStore } from '@/stores/useMapStore';

type DesktopTab = 'chat' | 'explore';
type MobileTab = 'chat' | 'map' | 'explore';

export function AppLayout() {
  const [desktopTab, setDesktopTab] = useState<DesktopTab>('chat');
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');

  useUserLocation();
  const { results, isLoading } = usePoolSearch();
  const rankedResults = useRankedResults(results);
  const highlightedPools = useMapStore((s) => s.highlightedPools);
  const requestMapView = useMapStore((s) => s.requestMapView);

  // Auto-switch to map tab on mobile when a pool card is clicked
  useEffect(() => {
    if (requestMapView) {
      setMobileTab('map');
      useMapStore.getState().setRequestMapView(false);
    }
  }, [requestMapView]);

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Desktop nav */}
      <div className="hidden lg:block">
        <TopNav
          activeTab={desktopTab}
          onTabChange={setDesktopTab}
          locationName="Toronto"
        />
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden">
        <TopNav
          activeTab={mobileTab === 'map' ? 'chat' : mobileTab}
          onTabChange={(t) => setMobileTab(t)}
          locationName="Toronto"
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <LeftPanel
          activeTab={desktopTab}
          results={rankedResults}
          isLoading={isLoading}
        />
        <div className="flex-1 relative">
          <MapPanel results={rankedResults} activeTab={desktopTab} highlightedPools={highlightedPools} />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex-1 overflow-hidden">
        {mobileTab === 'chat' && (
          <div className="h-full">
            <LeftPanel activeTab="chat" results={rankedResults} isLoading={isLoading} />
          </div>
        )}
        {mobileTab === 'map' && (
          <div className="h-full relative">
            <MapPanel
              results={rankedResults}
              activeTab={mobileTab === 'map' ? 'chat' : mobileTab}
              highlightedPools={highlightedPools}
            />
          </div>
        )}
        {mobileTab === 'explore' && (
          <div className="h-full">
            <LeftPanel activeTab="explore" results={rankedResults} isLoading={isLoading} />
          </div>
        )}
      </div>

      <BottomTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  );
}
