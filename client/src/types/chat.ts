export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  poolReferences?: PoolReference[];
  isStreaming?: boolean;
}

export interface PoolReference {
  poolId: number;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  poolType?: string;
  lengthMeters?: number;
  laneCount?: number;
  distanceKm?: number;
  website?: string;
  imageUrl?: string | null;
  amenities?: { name: string; verified: boolean }[];
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userLocation?: { lat: number; lng: number };
}
