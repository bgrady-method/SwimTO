import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface DataVersion {
  version: number;
  lastUpdated: string | null;
}

async function fetchDataVersion(): Promise<DataVersion> {
  const { data } = await api.get<DataVersion>('/data-version');
  return data;
}

export function useDataVersion() {
  const queryClient = useQueryClient();
  const previousVersion = useRef<number | null>(null);

  const { data } = useQuery({
    queryKey: ['dataVersion'],
    queryFn: fetchDataVersion,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data?.version) return;

    if (previousVersion.current !== null && previousVersion.current !== data.version) {
      queryClient.invalidateQueries({ queryKey: ['poolSearch'] });
      queryClient.invalidateQueries({ queryKey: ['swimTypes'] });
    }

    previousVersion.current = data.version;
  }, [data?.version, queryClient]);

  return data;
}
