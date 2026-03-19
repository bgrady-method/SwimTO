import type { SeedPool, TorontoPool, MatchConfidence } from "../report/types.js";
import type {
  AdversarialResult,
  AdversarialConfig,
  ReviewPath,
} from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";
import { workerPropose } from "./worker.js";
import { triageProposal } from "./triage.js";
import { challengeProposal } from "./challenger.js";
import { arbitrate } from "./arbiter.js";

/**
 * Adversarial match pipeline — drop-in replacement for findBestMatch().
 *
 * Flow:
 *   Seed Pool → Worker (proposes match + evidence)
 *            → Triage (fast-path obvious matches)
 *            → Challenger (independently tries to disprove)
 *            → Reconciler (agree? done. dispute?)
 *            → Arbiter (resolves with both perspectives)
 *            → Result: confirmed | disputed | human_review
 */
export function adversarialMatch(
  seedPool: SeedPool,
  torontoPools: TorontoPool[],
  alreadyMatched: Set<number>,
  config: AdversarialConfig = DEFAULT_CONFIG
): AdversarialResult {
  // ── Step 1: Worker proposes a match ──
  const proposal = workerPropose(seedPool, torontoPools, alreadyMatched);

  // No candidate found
  if (!proposal.bestCandidate) {
    return {
      seedPool,
      torontoPool: null,
      confidence: "no_match",
      matchMethod: "none",
      matchScore: 0,
      reviewPath: "no_match",
      workerProposal: proposal,
      challengerReport: null,
      arbiterRuling: null,
      disputeReasons: [],
    };
  }

  // ── Step 2: Triage — fast-path for obvious matches ──
  const triageResult = triageProposal(proposal, config);

  if (triageResult.fastPath) {
    return {
      seedPool,
      torontoPool: proposal.bestCandidate,
      confidence: "confirmed",
      matchMethod: buildMatchMethod(proposal),
      matchScore: proposal.bestScore,
      reviewPath: "fast_path",
      workerProposal: proposal,
      challengerReport: null,
      arbiterRuling: null,
      disputeReasons: [],
    };
  }

  // ── Step 3: Challenger cross-verifies ──
  const challengerReport = challengeProposal(
    proposal,
    torontoPools,
    alreadyMatched,
    config
  );

  // ── Step 4: Reconcile ──

  // Challenger agrees → accept Worker's proposal
  if (challengerReport.verdict === "agree") {
    const confidence = scoreToConfidence(proposal.bestScore);
    return {
      seedPool,
      torontoPool: proposal.bestCandidate,
      confidence,
      matchMethod: buildMatchMethod(proposal),
      matchScore: proposal.bestScore,
      reviewPath: "agreed",
      workerProposal: proposal,
      challengerReport,
      arbiterRuling: null,
      disputeReasons: [],
    };
  }

  // ── Step 5: Arbiter resolves dispute ──
  const arbiterRuling = arbitrate(proposal, challengerReport, config);

  if (arbiterRuling.decision === "uphold_worker") {
    const confidence = scoreToConfidence(arbiterRuling.finalScore);
    return {
      seedPool,
      torontoPool: proposal.bestCandidate,
      confidence,
      matchMethod: buildMatchMethod(proposal),
      matchScore: arbiterRuling.finalScore,
      reviewPath: "arbiter",
      workerProposal: proposal,
      challengerReport,
      arbiterRuling,
      disputeReasons: challengerReport.contradictions.map((c) => c.reason),
    };
  }

  if (arbiterRuling.decision === "uphold_challenger" && challengerReport.alternateCandidate) {
    const alt = challengerReport.alternateCandidate;
    const confidence = scoreToConfidence(alt.score);
    return {
      seedPool,
      torontoPool: alt.pool,
      confidence,
      matchMethod: "challenger_alternate",
      matchScore: alt.score,
      reviewPath: "arbiter",
      workerProposal: proposal,
      challengerReport,
      arbiterRuling,
      disputeReasons: challengerReport.contradictions.map((c) => c.reason),
    };
  }

  // flag_human — return with human_review confidence
  return {
    seedPool,
    torontoPool: proposal.bestCandidate,
    confidence: "human_review",
    matchMethod: buildMatchMethod(proposal),
    matchScore: arbiterRuling.finalScore,
    reviewPath: "human_review",
    workerProposal: proposal,
    challengerReport,
    arbiterRuling,
    disputeReasons: challengerReport.contradictions.map((c) => c.reason),
  };
}

// ── Helpers ──

function scoreToConfidence(score: number): MatchConfidence {
  if (score >= 0.8) return "confirmed";
  if (score >= 0.5) return "probable";
  return "ambiguous";
}

function buildMatchMethod(proposal: import("./types.js").WorkerProposal): string {
  // Return the highest-scoring dimension as the primary method
  const best = proposal.evidence.reduce((a, b) => (a.score > b.score ? a : b));
  return `${best.dimension}_${best.method}`;
}
