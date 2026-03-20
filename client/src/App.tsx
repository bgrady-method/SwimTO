import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDataVersion } from '@/hooks/useDataVersion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'swimto-query-cache',
});

function DataVersionWatcher() {
  useDataVersion();
  return null;
}

function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <TooltipProvider>
        <DataVersionWatcher />
        <AppLayout />
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
