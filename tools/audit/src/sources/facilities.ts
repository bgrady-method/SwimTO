import { ckanQueryAll } from "../utils/api-client.js";

const RESOURCE_ID = "e16505dc-f106-4b58-a689-ed0a2b8b0b69";

export interface FacilityRecord {
  facilityId: number;
  locationId: number;
  facilityType: string; // "Indoor Pool" or "Outdoor Pool"
  facilitySubType: string; // e.g. "Indoor Pool Tank - C"
  facilityRating: string | null;
  assetName: string;
}

export interface LocationFacilitySummary {
  locationId: number;
  assetName: string;
  poolType: "Indoor" | "Outdoor" | "Both";
  tankCount: number;
}

export async function fetchFacilities(): Promise<LocationFacilitySummary[]> {
  console.log("  Fetching indoor pool facilities...");
  const indoor = await ckanQueryAll(RESOURCE_ID, {
    "Facility Type (Display Name)": "Indoor Pool",
  });

  console.log(`  Got ${indoor.length} indoor tank records`);

  console.log("  Fetching outdoor pool facilities...");
  const outdoor = await ckanQueryAll(RESOURCE_ID, {
    "Facility Type (Display Name)": "Outdoor Pool",
  });

  console.log(`  Got ${outdoor.length} outdoor tank records`);

  const allRecords: FacilityRecord[] = [...indoor, ...outdoor].map((r) => ({
    facilityId: Number(r["Facility ID"] ?? r["_id"]),
    locationId: Number(r["Location ID"]),
    facilityType: String(r["Facility Type (Display Name)"] ?? ""),
    facilitySubType: String(r["FacilityType"] ?? ""),
    facilityRating: r["Facility Rating"] ? String(r["Facility Rating"]) : null,
    assetName: String(r["Asset Name"] ?? ""),
  }));

  // Group by Location ID
  const locationMap = new Map<number, FacilityRecord[]>();
  for (const rec of allRecords) {
    if (!locationMap.has(rec.locationId)) {
      locationMap.set(rec.locationId, []);
    }
    locationMap.get(rec.locationId)!.push(rec);
  }

  const summaries: LocationFacilitySummary[] = [];
  for (const [locationId, records] of locationMap) {
    const hasIndoor = records.some((r) => r.facilityType === "Indoor Pool");
    const hasOutdoor = records.some((r) => r.facilityType === "Outdoor Pool");
    const poolType: "Indoor" | "Outdoor" | "Both" =
      hasIndoor && hasOutdoor ? "Both" : hasIndoor ? "Indoor" : "Outdoor";

    summaries.push({
      locationId,
      assetName: records[0].assetName,
      poolType,
      tankCount: records.length,
    });
  }

  console.log(`  ${summaries.length} unique pool locations found`);
  return summaries;
}
