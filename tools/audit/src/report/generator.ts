import type {
  SeedPool,
  TorontoPool,
  TorontoScheduleEntry,
  PoolMatch,
  PoolAudit,
  FieldComparison,
  FieldStatus,
  ScheduleComparison,
  SwimTypeMapping,
  AuditReport,
} from "./types.js";
import { haversineDistance } from "../matching/coordinate-matcher.js";

// ── Swim Type Mapping ──

const SWIM_TYPE_MAP: Record<string, string[]> = {
  "Lane Swim": ["Lane Swim"],
  "Leisure Swim": ["Leisure Swim"],
  "Older Adult": ["Lane Swim: Older Adult", "Leisure Swim: Older Adult"],
  "Women Only": ["Leisure Swim (Women)", "Lane Swim (Women)"],
  Aquafit: [
    "Aquatic Fitness: Walking",
    "Aquatic Fitness: Mind Body",
    "Aquatic Fitness",
  ],
  Family: ["Leisure Swim: Family"]
};

export function buildSwimTypeMappings(
  allTorontoTypes: string[]
): SwimTypeMapping[] {
  return Object.entries(SWIM_TYPE_MAP).map(([seedType, torontoTypes]) => {
    const matchedTypes = torontoTypes.filter((t) =>
      allTorontoTypes.some((at) => at.toLowerCase().includes(t.toLowerCase()))
    );

    let recommendation: string;
    if (matchedTypes.length > 0) {
      recommendation = `Map to: ${matchedTypes.join(", ")}`;
    } else if (torontoTypes.length === 0) {
      recommendation = "NO TORONTO EQUIVALENT FOUND — consider removing or flagging";
    } else {
      recommendation = `Expected types not found in data: ${torontoTypes.join(", ")}`;
    }

    return { seedType, torontoTypes, recommendation };
  });
}

// ── Field Comparison ──

function compareField(
  field: string,
  seedValue: string | number | boolean | null,
  torontoValue: string | number | boolean | null,
  note?: string
): FieldComparison {
  let status: FieldStatus;

  if (seedValue === null && torontoValue === null) {
    status = "unverifiable";
  } else if (seedValue !== null && torontoValue === null) {
    status = "seed_only";
  } else if (seedValue === null && torontoValue !== null) {
    status = "toronto_only";
  } else if (String(seedValue).toLowerCase() === String(torontoValue).toLowerCase()) {
    status = "match";
  } else {
    status = "mismatch";
  }

  return { field, seedValue, torontoValue, status, note };
}

function compareCoordinates(
  seedLat: number,
  seedLng: number,
  torontoLat: number | null,
  torontoLng: number | null
): FieldComparison {
  if (torontoLat === null || torontoLng === null) {
    return {
      field: "Coordinates",
      seedValue: `${seedLat}, ${seedLng}`,
      torontoValue: null,
      status: "seed_only",
      note: "No coordinates in Toronto data",
    };
  }

  const distKm = haversineDistance(seedLat, seedLng, torontoLat, torontoLng);
  const distMeters = Math.round(distKm * 1000);
  const status: FieldStatus = distMeters <= 200 ? "match" : "mismatch";

  return {
    field: "Coordinates",
    seedValue: `${seedLat}, ${seedLng}`,
    torontoValue: `${torontoLat}, ${torontoLng}`,
    status,
    note: `Distance: ${distMeters}m${distMeters > 200 ? " — EXCEEDS 200m THRESHOLD" : ""}`,
  };
}

function compareAccessibility(
  seedAccessible: boolean,
  torontoAccessibility: string | null
): FieldComparison {
  if (!torontoAccessibility) {
    return {
      field: "Accessibility",
      seedValue: seedAccessible,
      torontoValue: null,
      status: "seed_only",
      note: "No accessibility data in Toronto source",
    };
  }

  const torontoIsAccessible =
    torontoAccessibility.toLowerCase().includes("fully accessible");
  const torontoIsPartial =
    torontoAccessibility.toLowerCase().includes("partially");

  let status: FieldStatus;
  if (seedAccessible && torontoIsAccessible) {
    status = "match";
  } else if (!seedAccessible && !torontoIsAccessible && !torontoIsPartial) {
    status = "match";
  } else {
    status = "mismatch";
  }

  return {
    field: "Accessibility",
    seedValue: seedAccessible,
    torontoValue: torontoAccessibility,
    status,
    note:
      torontoIsPartial && seedAccessible
        ? "Toronto says 'Partially Accessible', seed says fully accessible"
        : undefined,
  };
}

// ── Pool Audit Builder ──

export function buildPoolAudit(
  match: PoolMatch,
  scheduleMap: Map<number, TorontoScheduleEntry[]>
): PoolAudit {
  const { seedPool, torontoPool, confidence, matchMethod } = match;

  const fields: FieldComparison[] = [];

  if (torontoPool) {
    fields.push(compareField("Name", seedPool.name, torontoPool.name));
    fields.push(compareField("Address", seedPool.address, torontoPool.address));
    fields.push(
      compareCoordinates(
        seedPool.latitude,
        seedPool.longitude,
        torontoPool.latitude,
        torontoPool.longitude
      )
    );
    fields.push(compareField("Pool Type", seedPool.poolType, torontoPool.poolType));

    // Length — check Toronto description for pool dimensions
    let torontoLength: string | null = null;
    let lengthNote: string | undefined;
    if (torontoPool.description) {
      const lengthMatch = torontoPool.description.match(
        /(\d+)\s*(m|metre|meter|yard)/i
      );
      if (lengthMatch) {
        const val = parseInt(lengthMatch[1]);
        const unit = lengthMatch[2].toLowerCase();
        if (unit.startsWith("yard")) {
          torontoLength = `${val} yards (~${Math.round(val * 0.9144)}m)`;
          lengthNote = "Converted from yards";
        } else {
          torontoLength = `${val}m`;
        }
      }
    }
    fields.push({
      field: "Length (meters)",
      seedValue: seedPool.lengthMeters,
      torontoValue: torontoLength,
      status: torontoLength ? "mismatch" : "unverifiable",
      note:
        torontoLength == null
          ? "No length data in Toronto description"
          : lengthNote,
    });

    // Lane count — unverifiable from Toronto open data
    fields.push({
      field: "Lane Count",
      seedValue: seedPool.laneCount,
      torontoValue: torontoPool.tankCount > 0 ? `${torontoPool.tankCount} tank(s)` : null,
      status: "unverifiable",
      note: "Toronto provides tank count, not lane count",
    });

    fields.push(
      compareAccessibility(seedPool.isAccessible, torontoPool.accessibility)
    );
    fields.push(compareField("Phone", seedPool.phone, torontoPool.phone));
    fields.push(compareField("Website", seedPool.website, torontoPool.website));

    // Schedule comparison
    const torontoSchedules = torontoPool
      ? scheduleMap.get(torontoPool.locationId) ?? []
      : [];

    const torontoSwimTypes = [
      ...new Set(torontoSchedules.map((s) => s.courseTitle)),
    ].sort();

    // Seed schedule is algorithmic — estimate session count
    // Every pool: Mon-Fri × 4 sessions + Sat-Sun × 3 sessions = 26 base sessions
    let seedSessionCount = 26;
    if (seedPool.id % 3 === 0) seedSessionCount += 3; // Aquafit
    if (seedPool.id % 4 === 0) seedSessionCount += 2; // Women Only
    if (seedPool.id % 5 === 0) seedSessionCount += 3; // Older Adult

    const seedSwimTypes = ["Lane Swim", "Leisure Swim", "Family"];
    if (seedPool.id % 3 === 0) seedSwimTypes.push("Aquafit");
    if (seedPool.id % 4 === 0) seedSwimTypes.push("Women Only");
    if (seedPool.id % 5 === 0) seedSwimTypes.push("Older Adult");

    const scheduleComparison: ScheduleComparison = {
      seedSessionCount,
      torontoSessionCount: torontoSchedules.length,
      seedSwimTypes: seedSwimTypes.sort(),
      torontoSwimTypes,
      note:
        torontoSchedules.length === 0
          ? "NO SCHEDULE DATA from Toronto for this location"
          : "Seed schedules are algorithmically generated — replace with Toronto data",
    };

    return {
      seedId: seedPool.id,
      seedName: seedPool.name,
      matchConfidence: confidence,
      matchMethod,
      torontoLocationId: torontoPool.locationId,
      torontoName: torontoPool.name,
      fields,
      scheduleComparison,
      adversarial: match.adversarial,
    };
  }

  // No match — all fields are seed-only
  for (const field of [
    "Name",
    "Address",
    "Coordinates",
    "Pool Type",
    "Length (meters)",
    "Lane Count",
    "Accessibility",
    "Phone",
    "Website",
  ]) {
    fields.push({
      field,
      seedValue: "present",
      torontoValue: null,
      status: "seed_only",
      note: "No matching Toronto pool found — CANNOT VERIFY",
    });
  }

  return {
    seedId: seedPool.id,
    seedName: seedPool.name,
    matchConfidence: confidence,
    matchMethod,
    torontoLocationId: null,
    torontoName: null,
    fields,
    scheduleComparison: null,
    adversarial: match.adversarial,
  };
}

// ── Full Report ──

export function buildAuditReport(
  poolAudits: PoolAudit[],
  seedPools: SeedPool[],
  torontoPools: TorontoPool[],
  missingPools: TorontoPool[],
  phantomPools: SeedPool[],
  allTorontoSwimTypes: string[]
): AuditReport {
  const matchedPools = poolAudits.filter(
    (a) => a.matchConfidence === "confirmed" || a.matchConfidence === "probable" || a.matchConfidence === "human_review"
  ).length;

  const totalDiscrepancies = poolAudits.reduce(
    (sum, a) => sum + a.fields.filter((f) => f.status === "mismatch").length,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSeedPools: seedPools.length,
      totalTorontoPools: torontoPools.length,
      matchedPools,
      unmatchedSeedPools: poolAudits.filter(
        (a) => a.matchConfidence === "no_match"
      ).length,
      missingFromSeed: missingPools.length,
      fieldsWithDiscrepancies: totalDiscrepancies,
      scheduleNote:
        "ALL schedules in SeedData are algorithmically generated and do NOT reflect real Toronto schedules. Real drop-in schedule data is available via the Toronto Open Data API.",
    },
    poolAudits,
    missingPools,
    phantomPools,
    swimTypeMappings: buildSwimTypeMappings(allTorontoSwimTypes),
    allTorontoSwimTypes,
  };
}
