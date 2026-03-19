import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseSeedData } from "./utils/seed-parser.js";
import { fetchFacilities } from "./sources/facilities.js";
import { fetchLocations } from "./sources/locations.js";
import { fetchGeoData } from "./sources/parks-geojson.js";
import { fetchDropInSchedules, getUniqueSwimTypes } from "./sources/drop-in.js";
import { geocodeAddress } from "./sources/nominatim.js";
import { haversineDistance } from "./matching/coordinate-matcher.js";
import {
  buildPoolAudit,
  buildAuditReport,
} from "./report/generator.js";
import {
  printConsoleSummary,
  writeJsonReport,
  writeMarkdownReport,
} from "./report/formatter.js";
import type {
  TorontoPool,
  PoolMatch,
} from "./report/types.js";
import { adversarialMatch } from "./adversarial/pipeline.js";
import type { AdversarialResult } from "./adversarial/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DATA_PATH = resolve(__dirname, "../../../src/Api/Data/SeedData.cs");
const REPORT_DIR = resolve(__dirname, "..");

async function main() {
  console.log("SwimTO Data Audit Tool");
  console.log("=".repeat(50));

  // ── Phase 1: Parse seed data ──
  console.log("\n[Phase 1] Parsing SeedData.cs...");
  const seedPools = await parseSeedData(SEED_DATA_PATH);
  console.log(`  Parsed ${seedPools.length} seed pools`);

  // ── Phase 2: Fetch Toronto pool inventory ──
  console.log("\n[Phase 2] Fetching Toronto pool inventory...");

  console.log("\n  Step 1: Facilities dataset...");
  const facilitySummaries = await fetchFacilities();

  const locationIds = facilitySummaries.map((f) => f.locationId);

  console.log("\n  Step 2: Locations dataset...");
  const locationDetails = await fetchLocations(locationIds);

  console.log("\n  Step 3: Parks GeoJSON dataset...");
  const geoData = await fetchGeoData(locationIds);

  // Build canonical Toronto pool records
  const torontoPools: TorontoPool[] = facilitySummaries.map((f) => {
    const loc = locationDetails.get(f.locationId);
    const geo = geoData.get(f.locationId);

    return {
      locationId: f.locationId,
      name: loc?.locationName ?? geo?.assetName ?? f.assetName,
      address: geo?.address ?? loc?.address ?? "UNKNOWN",
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      poolType: f.poolType,
      tankCount: f.tankCount,
      accessibility: loc?.accessibility ?? null,
      description: loc?.description ?? null,
      phone: geo?.phone ?? null,
      website: geo?.url ?? null,
      district: loc?.district ?? null,
    };
  });

  console.log(`\n  Built ${torontoPools.length} canonical Toronto pool records`);

  // ── Phase 3: Fetch real schedules ──
  console.log("\n[Phase 3] Fetching real swim schedules...");
  const scheduleMap = await fetchDropInSchedules();
  const allTorontoSwimTypes = getUniqueSwimTypes(scheduleMap);
  console.log(`  Found ${allTorontoSwimTypes.length} unique swim course titles`);

  // ── Phase 4: Adversarial matching — seed pools to Toronto data ──
  console.log("\n[Phase 4] Adversarial matching seed pools to Toronto data...");
  const matches: PoolMatch[] = [];
  const adversarialResults: AdversarialResult[] = [];
  const matchedTorontoIds = new Set<number>();

  for (const seedPool of seedPools) {
    const result = adversarialMatch(seedPool, torontoPools, matchedTorontoIds);
    adversarialResults.push(result);

    const match: PoolMatch = {
      seedPool: result.seedPool,
      torontoPool: result.torontoPool,
      confidence: result.confidence,
      matchMethod: result.matchMethod,
      matchScore: result.matchScore,
      adversarial: {
        reviewPath: result.reviewPath,
        disputeReasons: result.disputeReasons,
        arbiterDecision: result.arbiterRuling?.decision ?? null,
        arbiterReasoning: result.arbiterRuling?.reasoning ?? null,
      },
    };

    matches.push(match);
    if (match.torontoPool) {
      matchedTorontoIds.add(match.torontoPool.locationId);
    }

    // Enhanced console logging with review path
    const pathTag = `[${result.reviewPath}]`;
    const status =
      match.confidence === "no_match"
        ? "NO MATCH"
        : match.confidence === "human_review"
          ? `HUMAN_REVIEW → ${match.torontoPool?.name} (${match.matchMethod})`
          : `${match.confidence} → ${match.torontoPool?.name} (${match.matchMethod})`;
    const disputeInfo = result.disputeReasons.length > 0
      ? ` | disputes: ${result.disputeReasons.join("; ")}`
      : "";
    console.log(`  #${seedPool.id} ${seedPool.name}: ${pathTag} ${status}${disputeInfo}`);
  }

  // ── Phase 5: Coordinate verification via Nominatim for unmatched pools ──
  const unmatched = matches.filter((m) => m.confidence === "no_match");
  if (unmatched.length > 0) {
    console.log(
      `\n[Phase 5] Nominatim verification for ${unmatched.length} unmatched pools...`
    );
    for (const match of unmatched) {
      const geo = await geocodeAddress(match.seedPool.address);
      if (geo) {
        console.log(
          `  ${match.seedPool.name}: Nominatim → ${geo.lat}, ${geo.lng} (${geo.displayName})`
        );
        // Try matching again with Nominatim coordinates
        const nominatimMatch = findMatchByCoordinates(
          geo.lat,
          geo.lng,
          torontoPools,
          matchedTorontoIds,
          1.0 // wider radius for Nominatim fallback
        );
        if (nominatimMatch) {
          match.torontoPool = nominatimMatch;
          match.confidence = "probable";
          match.matchMethod = "nominatim_geocode";
          match.adversarial = {
            reviewPath: "agreed",
            disputeReasons: [],
            arbiterDecision: null,
            arbiterReasoning: null,
          };
          matchedTorontoIds.add(nominatimMatch.locationId);
          console.log(
            `    Matched via Nominatim → ${nominatimMatch.name} (Location ID: ${nominatimMatch.locationId})`
          );
        }
      }
    }
  }

  // ── Phase 6: Build audit reports ──
  console.log("\n[Phase 6] Building audit report...");

  const poolAudits = matches.map((m) => buildPoolAudit(m, scheduleMap));

  // Missing pools: Toronto pools not matched to any seed pool
  const missingPools = torontoPools.filter(
    (tp) => !matchedTorontoIds.has(tp.locationId)
  );

  // Phantom pools: Seed pools with no Toronto match
  const phantomPools = matches
    .filter((m) => m.confidence === "no_match")
    .map((m) => m.seedPool);

  const report = buildAuditReport(
    poolAudits,
    seedPools,
    torontoPools,
    missingPools,
    phantomPools,
    allTorontoSwimTypes
  );

  // ── Phase 7: Write output ──
  console.log("\n[Phase 7] Writing reports...");

  await writeJsonReport(report, resolve(REPORT_DIR, "audit-report.json"));
  await writeMarkdownReport(report, resolve(REPORT_DIR, "audit-report.md"));
  printConsoleSummary(report);
}

// ── Coordinate-only fallback (used by Nominatim Phase 5) ──

function findMatchByCoordinates(
  lat: number,
  lng: number,
  torontoPools: TorontoPool[],
  alreadyMatched: Set<number>,
  radiusKm: number
): TorontoPool | null {
  let bestPool: TorontoPool | null = null;
  let bestDist = radiusKm;

  for (const tp of torontoPools) {
    if (alreadyMatched.has(tp.locationId)) continue;
    if (tp.latitude === null || tp.longitude === null) continue;

    const dist = haversineDistance(lat, lng, tp.latitude, tp.longitude);
    if (dist < bestDist) {
      bestDist = dist;
      bestPool = tp;
    }
  }

  return bestPool;
}

// ── Run ──
main().catch((err) => {
  console.error("\nFATAL ERROR:", err);
  process.exit(1);
});
