import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDataVersion } from '@/hooks/useDataVersion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function DataVersionWatcher() {
  useDataVersion();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataVersionWatcher />
        <AppLayout />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
