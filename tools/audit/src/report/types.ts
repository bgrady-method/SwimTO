// ── Seed Data Types ──

export interface SeedPool {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  poolType: string;
  lengthMeters: number | null;
  laneCount: number | null;
  isAccessible: boolean;
  phone: string | null;
  website: string | null;
}

// ── Toronto Data Types ──

export interface TorontoPool {
  locationId: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  poolType: string; // "Indoor" | "Outdoor" | "Both"
  tankCount: number;
  accessibility: string | null; // "Fully Accessible", "Partially Accessible", etc.
  description: string | null;
  phone: string | null;
  website: string | null;
  district: string | null;
}

export interface TorontoScheduleEntry {
  locationId: number;
  courseTitle: string;
  dayOfWeek: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  firstDate: string;
  lastDate: string;
  ageMin: number | null;
  ageMax: number | null;
}

// ── Matching Types ──

export type MatchConfidence = "confirmed" | "probable" | "no_match" | "ambiguous" | "human_review";

export interface AdversarialMetadata {
  reviewPath: string; // "fast_path" | "agreed" | "arbiter" | "human_review" | "no_match"
  disputeReasons: string[];
  arbiterDecision: string | null; // "uphold_worker" | "uphold_challenger" | "flag_human" | null
  arbiterReasoning: string | null;
}

export interface PoolMatch {
  seedPool: SeedPool;
  torontoPool: TorontoPool | null;
  confidence: MatchConfidence;
  matchMethod: string; // e.g. "name_exact", "name_fuzzy", "address", "coordinate"
  matchScore: number;
  adversarial?: AdversarialMetadata;
}

// ── Audit Report Types ──

export type FieldStatus = "match" | "mismatch" | "seed_only" | "toronto_only" | "unverifiable";

export interface FieldComparison {
  field: string;
  seedValue: string | number | boolean | null;
  torontoValue: string | number | boolean | null;
  status: FieldStatus;
  note?: string;
}

export interface PoolAudit {
  seedId: number;
  seedName: string;
  matchConfidence: MatchConfidence;
  matchMethod: string;
  torontoLocationId: number | null;
  torontoName: string | null;
  fields: FieldComparison[];
  scheduleComparison: ScheduleComparison | null;
  adversarial?: AdversarialMetadata;
}

export interface ScheduleComparison {
  seedSessionCount: number;
  torontoSessionCount: number;
  seedSwimTypes: string[];
  torontoSwimTypes: string[];
  note: string;
}

export interface SwimTypeMapping {
  seedType: string;
  torontoTypes: string[];
  recommendation: string;
}

export interface AuditReport {
  generatedAt: string;
  summary: {
    totalSeedPools: number;
    totalTorontoPools: number;
    matchedPools: number;
    unmatchedSeedPools: number;
    missingFromSeed: number;
    fieldsWithDiscrepancies: number;
    scheduleNote: string;
  };
  poolAudits: PoolAudit[];
  missingPools: TorontoPool[];
  phantomPools: SeedPool[];
  swimTypeMappings: SwimTypeMapping[];
  allTorontoSwimTypes: string[];
}
