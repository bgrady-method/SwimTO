import type { TorontoPool } from "../report/types.js";
import type {
  WorkerProposal,
  ChallengerReport,
  ChallengerVerdict,
  Contradiction,
  MatchEvidence,
  AdversarialConfig,
} from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";
import { evaluateCandidate } from "./worker.js";
import { extractStreetNumber } from "../utils/text.js";
import { matchAddresses } from "../matching/address-matcher.js";

// ── Contradiction detection ──

function detectContradictions(
  proposal: WorkerProposal,
  config: AdversarialConfig
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  if (!proposal.bestCandidate) return contradictions;

  const nameEvidence = proposal.evidence.find((e) => e.dimension === "name");
  const addressEvidence = proposal.evidence.find((e) => e.dimension === "address");
  const coordEvidence = proposal.evidence.find((e) => e.dimension === "coordinates");
  const poolTypeEvidence = proposal.evidence.find((e) => e.dimension === "pool_type");

  // Strong contradiction: both name AND address are very weak
  if (
    nameEvidence && addressEvidence &&
    nameEvidence.score < 0.3 && addressEvidence.score < 0.3
  ) {
    contradictions.push({
      dimension: "name+address",
      reason: `Both name (${(nameEvidence.score * 100).toFixed(0)}%) and address (${(addressEvidence.score * 100).toFixed(0)}%) are very weak`,
      severity: "strong",
    });
  }

  // Strong contradiction: different street number
  if (addressEvidence && proposal.bestCandidate) {
    const seedNum = extractStreetNumber(proposal.seedPool.address);
    const torontoNum = extractStreetNumber(proposal.bestCandidate.address);
    if (seedNum && torontoNum && seedNum !== torontoNum) {
      contradictions.push({
        dimension: "address",
        reason: `Different street numbers: ${seedNum} vs ${torontoNum}`,
        severity: "strong",
      });
    }
  }

  // Strong contradiction: coordinates > 2km apart (but not when simply missing)
  if (coordEvidence && coordEvidence.score < 0.01 && coordEvidence.method !== "missing") {
    contradictions.push({
      dimension: "coordinates",
      reason: `Coordinates are far apart: ${coordEvidence.detail}`,
      severity: "strong",
    });
  }

  // Weak contradiction: pool type differs
  if (poolTypeEvidence && poolTypeEvidence.score < 0.5) {
    contradictions.push({
      dimension: "pool_type",
      reason: `Pool type mismatch: ${poolTypeEvidence.detail}`,
      severity: "weak",
    });
  }

  // Cross-dimension check: if Worker matched primarily on name, check address independently
  if (nameEvidence && nameEvidence.supports && addressEvidence && !addressEvidence.supports) {
    // The name matched but address doesn't agree
    const addrResult = matchAddresses(proposal.seedPool.address, proposal.bestCandidate!.address);
    if (!addrResult.matches) {
      contradictions.push({
        dimension: "cross:name→address",
        reason: `Worker matched on name but address does not agree: "${addrResult.seedNormalized}" vs "${addrResult.torontoNormalized}"`,
        severity: "strong",
      });
    }
  }

  // Cross-dimension check: if Worker matched primarily on address, check name
  if (addressEvidence && addressEvidence.supports && nameEvidence && nameEvidence.score < 0.3) {
    contradictions.push({
      dimension: "cross:address→name",
      reason: `Worker matched on address but name is very weak (${(nameEvidence.score * 100).toFixed(0)}%)`,
      severity: "weak", // weak because renames are possible
    });
  }

  return contradictions;
}

// ── Alternate candidate search ──
// Uses inverted weights: if Worker weighted name, Challenger weights address+coordinates

function searchAlternate(
  proposal: WorkerProposal,
  torontoPools: TorontoPool[],
  alreadyMatched: Set<number>,
  config: AdversarialConfig
): { pool: TorontoPool; score: number; evidence: MatchEvidence[] } | null {
  // Consider the runner-up from the Worker first
  const candidatesToCheck: TorontoPool[] = [];

  if (proposal.runnerUp) {
    candidatesToCheck.push(proposal.runnerUp.pool);
  }

  // Also search nearby pools by inverted criteria
  // If the worker relied on name, search by address/coordinates instead
  const primaryDimension = proposal.evidence.reduce((best, e) =>
    e.score > (best?.score ?? 0) ? e : best
  );

  for (const tp of torontoPools) {
    if (alreadyMatched.has(tp.locationId)) continue;
    if (proposal.bestCandidate && tp.locationId === proposal.bestCandidate.locationId) continue;
    if (candidatesToCheck.some((c) => c.locationId === tp.locationId)) continue;

    // Only evaluate a limited set using inverted criteria
    const { score } = evaluateCandidate(proposal.seedPool, tp);
    if (score > proposal.bestScore * 0.7) {
      candidatesToCheck.push(tp);
    }

    // Limit search to avoid excessive computation
    if (candidatesToCheck.length >= 5) break;
  }

  let bestAlternate: { pool: TorontoPool; score: number; evidence: MatchEvidence[] } | null = null;

  for (const tp of candidatesToCheck) {
    const { score, evidence } = evaluateCandidate(proposal.seedPool, tp);
    if (!bestAlternate || score > bestAlternate.score) {
      bestAlternate = { pool: tp, score, evidence };
    }
  }

  // Only return alternate if it scores reasonably well
  if (bestAlternate && bestAlternate.score > 0.3) {
    return bestAlternate;
  }

  return null;
}

// ── Challenger: cross-dimension verification ──

export function challengeProposal(
  proposal: WorkerProposal,
  torontoPools: TorontoPool[],
  alreadyMatched: Set<number>,
  config: AdversarialConfig = DEFAULT_CONFIG
): ChallengerReport {
  if (!proposal.bestCandidate) {
    return {
      verdict: "agree",
      contradictions: [],
      crossCheckEvidence: [],
      alternateCandidate: null,
      reasoning: "No candidate to challenge",
    };
  }

  // Step 1: Detect contradictions
  const contradictions = detectContradictions(proposal, config);

  // Step 2: Search for alternate candidates
  const alternateCandidate = searchAlternate(proposal, torontoPools, alreadyMatched, config);

  // Step 3: Determine verdict
  const strongContradictions = contradictions.filter((c) => c.severity === "strong");
  const hasStrongContradiction = strongContradictions.length > 0;
  const hasBetterAlternate =
    alternateCandidate !== null && alternateCandidate.score > proposal.bestScore;

  let verdict: ChallengerVerdict;
  let reasoning: string;

  if (hasStrongContradiction || hasBetterAlternate) {
    verdict = "dispute";
    const reasons: string[] = [];
    if (hasStrongContradiction) {
      reasons.push(`${strongContradictions.length} strong contradiction(s): ${strongContradictions.map((c) => c.reason).join("; ")}`);
    }
    if (hasBetterAlternate) {
      reasons.push(
        `Found better alternate: ${alternateCandidate!.pool.name} (${(alternateCandidate!.score * 100).toFixed(0)}% vs ${(proposal.bestScore * 100).toFixed(0)}%)`
      );
    }
    reasoning = reasons.join(". ");
  } else if (contradictions.length > 0) {
    verdict = "uncertain";
    reasoning = `${contradictions.length} weak contradiction(s): ${contradictions.map((c) => c.reason).join("; ")}`;
  } else {
    verdict = "agree";
    reasoning = "No contradictions found across all dimensions";
  }

  // Collect cross-check evidence (all evidence the Challenger independently evaluated)
  const crossCheckEvidence = proposal.evidence.filter((e) => !e.supports);

  return {
    verdict,
    contradictions,
    crossCheckEvidence,
    alternateCandidate,
    reasoning,
  };
}
