import { ckanQueryAll } from "../utils/api-client.js";
import { buildAddress } from "../utils/text.js";

const RESOURCE_ID = "f23ac1ad-6f46-4b59-811f-eb34be9b1f7a";

export interface LocationRecord {
  locationId: number;
  locationName: string;
  locationType: string;
  accessibility: string | null;
  address: string;
  postalCode: string | null;
  district: string | null;
  description: string | null;
  intersection: string | null;
}

export async function fetchLocations(
  locationIds: number[]
): Promise<Map<number, LocationRecord>> {
  console.log(`  Fetching location details for ${locationIds.length} locations...`);

  // Fetch all location records and filter client-side (faster than per-ID queries)
  const allRecords = await ckanQueryAll(RESOURCE_ID);
  console.log(`  Got ${allRecords.length} total location records`);

  const idSet = new Set(locationIds);
  const locationMap = new Map<number, LocationRecord>();

  for (const r of allRecords) {
    const locId = Number(r["Location ID"]);
    if (!idSet.has(locId)) continue;

    const address = buildAddress(
      r["Street No"] ? String(r["Street No"]) : null,
      r["Street Name"] ? String(r["Street Name"]) : null,
      r["Street Type"] ? String(r["Street Type"]) : null,
      r["Street Direction"] ? String(r["Street Direction"]) : null
    );

    locationMap.set(locId, {
      locationId: locId,
      locationName: String(r["Location Name"] ?? ""),
      locationType: String(r["Location Type"] ?? ""),
      accessibility: r["Accessibility"] ? String(r["Accessibility"]) : null,
      address: address || "UNKNOWN",
      postalCode: r["Postal Code"] ? String(r["Postal Code"]) : null,
      district: r["District"] ? String(r["District"]) : null,
      description: r["Description"] ? String(r["Description"]) : null,
      intersection: r["Intersection"] ? String(r["Intersection"]) : null,
    });
  }

  console.log(`  Matched ${locationMap.size} of ${locationIds.length} location IDs`);
  return locationMap;
}
