import type { SeedPool, TorontoPool } from "../report/types.js";
import type { MatchEvidence, WorkerProposal, DimensionWeights } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";
import { matchNames } from "../matching/name-matcher.js";
import { matchAddresses } from "../matching/address-matcher.js";
import { haversineDistance } from "../matching/coordinate-matcher.js";
import { normalizeText } from "../utils/text.js";

// ── Dimension evaluators ──

function evaluateName(seedPool: SeedPool, tp: TorontoPool): MatchEvidence {
  const result = matchNames(seedPool.name, tp.name);
  return {
    dimension: "name",
    score: result.score,
    method: result.method,
    detail: `"${seedPool.name}" vs "${tp.name}" → ${result.method} (${(result.score * 100).toFixed(0)}%)`,
    supports: result.score >= 0.5,
  };
}

function evaluateAddress(seedPool: SeedPool, tp: TorontoPool): MatchEvidence {
  const result = matchAddresses(seedPool.address, tp.address);
  // Compute a numeric score for address matching
  let score: number;
  if (result.matches) {
    // Check how closely they match
    if (result.seedNormalized === result.torontoNormalized) {
      score = 1.0;
    } else if (
      result.seedNormalized.includes(result.torontoNormalized) ||
      result.torontoNormalized.includes(result.seedNormalized)
    ) {
      score = 0.85;
    } else {
      score = 0.6; // token overlap match
    }
  } else {
    // Even when not matching, compute a rough similarity
    const seedTokens = new Set(result.seedNormalized.split(/\s+/));
    const torontoTokens = new Set(result.torontoNormalized.split(/\s+/));
    let overlap = 0;
    for (const t of seedTokens) {
      if (torontoTokens.has(t)) overlap++;
    }
    const union = new Set([...seedTokens, ...torontoTokens]).size;
    score = union > 0 ? overlap / union * 0.4 : 0; // cap non-matching at 0.4
  }

  return {
    dimension: "address",
    score,
    method: result.matches ? "address_match" : "address_no_match",
    detail: `"${result.seedNormalized}" vs "${result.torontoNormalized}" → ${result.matches ? "match" : "no match"}`,
    supports: result.matches,
  };
}

function evaluateCoordinates(seedPool: SeedPool, tp: TorontoPool): MatchEvidence {
  if (tp.latitude === null || tp.longitude === null) {
    return {
      dimension: "coordinates",
      score: 0,
      method: "missing",
      detail: "Toronto pool has no coordinates",
      supports: false,
    };
  }

  const distKm = haversineDistance(
    seedPool.latitude,
    seedPool.longitude,
    tp.latitude,
    tp.longitude
  );
  const distMeters = Math.round(distKm * 1000);

  // Score: 1.0 at 0m, 0.0 at 2km+
  const score = Math.max(0, 1 - distKm / 2.0);

  return {
    dimension: "coordinates",
    score,
    method: "haversine",
    detail: `${distMeters}m apart${distKm < 0.5 ? " (within 500m)" : ""}`,
    supports: distKm < 0.5,
  };
}

function evaluatePoolType(seedPool: SeedPool, tp: TorontoPool): MatchEvidence {
  const seedType = normalizeText(seedPool.poolType);
  const torontoType = normalizeText(tp.poolType);

  let score: number;
  let method: string;
  if (seedType === torontoType) {
    score = 1.0;
    method = "exact";
  } else if (seedType.includes(torontoType) || torontoType.includes(seedType)) {
    score = 0.7;
    method = "partial";
  } else if (
    (seedType.includes("indoor") && torontoType.includes("outdoor")) ||
    (seedType.includes("outdoor") && torontoType.includes("indoor"))
  ) {
    score = 0.2;
    method = "type_mismatch";
  } else if (torontoType === "both" || seedType === "both") {
    score = 0.8;
    method = "both_includes";
  } else {
    score = 0.3;
    method = "different";
  }

  return {
    dimension: "pool_type",
    score,
    method,
    detail: `"${seedPool.poolType}" vs "${tp.poolType}" → ${method}`,
    supports: score >= 0.5,
  };
}

// ── Composite scoring ──

function compositeScore(evidence: MatchEvidence[], weights: DimensionWeights): number {
  let total = 0;
  let weightSum = 0;

  for (const e of evidence) {
    const w = weights[e.dimension === "pool_type" ? "poolType" : e.dimension];
    total += e.score * w;
    weightSum += w;
  }

  return weightSum > 0 ? total / weightSum : 0;
}

// ── Worker: evaluate all candidates across all dimensions ──

export function evaluateCandidate(
  seedPool: SeedPool,
  tp: TorontoPool
): { score: number; evidence: MatchEvidence[] } {
  const evidence: MatchEvidence[] = [
    evaluateName(seedPool, tp),
    evaluateAddress(seedPool, tp),
    evaluateCoordinates(seedPool, tp),
    evaluatePoolType(seedPool, tp),
  ];

  const score = compositeScore(evidence, DEFAULT_CONFIG.weights);
  return { score, evidence };
}

export function workerPropose(
  seedPool: SeedPool,
  torontoPools: TorontoPool[],
  alreadyMatched: Set<number>
): WorkerProposal {
  const candidates: { pool: TorontoPool; score: number; evidence: MatchEvidence[] }[] = [];

  for (const tp of torontoPools) {
    if (alreadyMatched.has(tp.locationId)) continue;

    const { score, evidence } = evaluateCandidate(seedPool, tp);

    // Only consider candidates with at least some signal
    if (score > 0.15) {
      candidates.push({ pool: tp, score, evidence });
    }
  }

  if (candidates.length === 0) {
    return {
      seedPool,
      bestCandidate: null,
      bestScore: 0,
      evidence: [],
      runnerUp: null,
    };
  }

  // Sort by composite score descending
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const runnerUp = candidates.length > 1
    ? { pool: candidates[1].pool, score: candidates[1].score, evidence: candidates[1].evidence }
    : null;

  return {
    seedPool,
    bestCandidate: best.pool,
    bestScore: best.score,
    evidence: best.evidence,
    runnerUp,
  };
}
