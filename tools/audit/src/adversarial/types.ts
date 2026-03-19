import type { SeedPool, TorontoPool, MatchConfidence } from "../report/types.js";

// ── Evidence from evaluating a single dimension ──

export interface MatchEvidence {
  dimension: "name" | "address" | "coordinates" | "pool_type";
  score: number; // 0-1
  method: string; // "exact", "fuzzy", "haversine", etc.
  detail: string; // human-readable explanation
  supports: boolean; // does this evidence support or contradict the match?
}

// ── Worker output ──

export interface WorkerProposal {
  seedPool: SeedPool;
  bestCandidate: TorontoPool | null;
  bestScore: number;
  evidence: MatchEvidence[];
  runnerUp: { pool: TorontoPool; score: number; evidence: MatchEvidence[] } | null;
}

// ── Challenger output ──

export type ChallengerVerdict = "agree" | "dispute" | "uncertain";

export interface Contradiction {
  dimension: string;
  reason: string;
  severity: "strong" | "weak";
}

export interface ChallengerReport {
  verdict: ChallengerVerdict;
  contradictions: Contradiction[];
  crossCheckEvidence: MatchEvidence[];
  alternateCandidate: { pool: TorontoPool; score: number; evidence: MatchEvidence[] } | null;
  reasoning: string;
}

// ── Arbiter output ──

export type ArbiterDecision = "uphold_worker" | "uphold_challenger" | "flag_human";

export interface ArbiterRuling {
  decision: ArbiterDecision;
  finalScore: number;
  reasoning: string;
  workerEvidenceSummary: string;
  challengerEvidenceSummary: string;
}

// ── Pipeline result ──

export type ReviewPath = "fast_path" | "agreed" | "arbiter" | "human_review" | "no_match";

export interface AdversarialResult {
  seedPool: SeedPool;
  torontoPool: TorontoPool | null;
  confidence: MatchConfidence;
  matchMethod: string;
  matchScore: number;
  reviewPath: ReviewPath;
  workerProposal: WorkerProposal;
  challengerReport: ChallengerReport | null;
  arbiterRuling: ArbiterRuling | null;
  disputeReasons: string[];
}

// ── Configuration ──

export interface DimensionWeights {
  name: number;
  address: number;
  coordinates: number;
  poolType: number;
}

export interface AdversarialConfig {
  fastPathMinScore: number;
  fastPathMinNameScore: number;
  fastPathRequireAddressMatch: boolean;
  challengerMinDimensions: number;
  arbiterHumanReviewThreshold: number;
  arbiterUpholdThreshold: number;
  weights: DimensionWeights;
}

export const DEFAULT_CONFIG: AdversarialConfig = {
  fastPathMinScore: 0.95,
  fastPathMinNameScore: 0.9,
  fastPathRequireAddressMatch: true,
  challengerMinDimensions: 2,
  arbiterHumanReviewThreshold: 0.4,
  arbiterUpholdThreshold: 0.6,
  weights: { name: 0.4, address: 0.3, coordinates: 0.2, poolType: 0.1 },
};
