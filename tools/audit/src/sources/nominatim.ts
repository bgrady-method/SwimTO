import { fetchWithRetry } from "../utils/api-client.js";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = 1100; // 1 req/sec + buffer, matching GeocodingService.cs

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Geocode an address using Nominatim as a fallback for coordinate verification */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const query = `${address}, Toronto, Canada`;
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const results = (await fetchWithRetry(url, RATE_LIMIT_MS)) as NominatimResult[];
    if (!results || results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch (err) {
    console.warn(`  Nominatim geocoding failed for "${address}": ${err}`);
    return null;
  }
}
