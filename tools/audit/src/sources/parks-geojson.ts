import { ckanQueryAll } from "../utils/api-client.js";

const RESOURCE_ID = "e8cd0f4d-4910-42a0-81f9-cf8c2218753a";

export interface GeoRecord {
  locationId: number;
  assetName: string;
  type: string;
  address: string;
  phone: string | null;
  url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function fetchGeoData(
  locationIds: number[]
): Promise<Map<number, GeoRecord>> {
  console.log(`  Fetching GeoJSON data for ${locationIds.length} locations...`);

  // Fetch all records — the dataset has ~1787 records, manageable
  const allRecords = await ckanQueryAll(RESOURCE_ID);
  console.log(`  Got ${allRecords.length} total geo records`);

  const idSet = new Set(locationIds);
  const geoMap = new Map<number, GeoRecord>();

  for (const r of allRecords) {
    const locId = Number(r["LOCATIONID"]);
    if (!idSet.has(locId)) continue;

    let lat: number | null = null;
    let lng: number | null = null;

    // Try to extract coordinates from geometry field
    const geometry = r["geometry"] as
      | { type?: string; coordinates?: number[] }
      | undefined;
    if (geometry?.coordinates && geometry.coordinates.length >= 2) {
      // GeoJSON uses [longitude, latitude] order
      lng = geometry.coordinates[0];
      lat = geometry.coordinates[1];
    }

    geoMap.set(locId, {
      locationId: locId,
      assetName: String(r["ASSET_NAME"] ?? ""),
      type: String(r["TYPE"] ?? ""),
      address: String(r["ADDRESS"] ?? ""),
      phone: r["PHONE"] ? String(r["PHONE"]) : null,
      url: r["URL"] ? String(r["URL"]) : null,
      latitude: lat,
      longitude: lng,
    });
  }

  console.log(`  Matched ${geoMap.size} of ${locationIds.length} location IDs`);
  return geoMap;
}
