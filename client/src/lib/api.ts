import axios from 'axios';
import type { PoolSearchRequest } from '@/types/filters';
import type { PoolSearchResponse } from '@/types/pool';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function searchPools(request: PoolSearchRequest): Promise<PoolSearchResponse> {
  const { data } = await api.post<PoolSearchResponse>('/pools/search', request);
  return data;
}

export async function getPool(id: number) {
  const { data } = await api.get(`/pools/${id}`);
  return data;
}

export async function getPoolSchedule(id: number, swimType?: string) {
  const params = swimType ? { swimType } : {};
  const { data } = await api.get(`/pools/${id}/schedule`, { params });
  return data;
}

export async function getSwimTypes(): Promise<string[]> {
  const { data } = await api.get<string[]>('/swim-types');
  return data;
}

export async function geocodeAddress(address: string) {
  const { data } = await api.post('/geocode', { address });
  return data as { lat: number; lng: number; displayName: string };
}

export default api;
