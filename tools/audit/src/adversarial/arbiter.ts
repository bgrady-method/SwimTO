import type {
  WorkerProposal,
  ChallengerReport,
  ArbiterRuling,
  ArbiterDecision,
  AdversarialConfig,
  MatchEvidence,
} from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

/**
 * Arbiter: Weighted reconciliation of Worker and Challenger evidence.
 *
 * Only fires on disputes. For each dimension:
 *   - Worker supports + Challenger agrees = full weight
 *   - Worker supports + Challenger contradicts = zero weight
 *   - Otherwise = half weight
 *
 * Decision:
 *   - finalScore >= upholdThreshold → uphold_worker
 *   - Challenger's alternate scores higher → uphold_challenger
 *   - finalScore < humanReviewThreshold → flag_human
 */
export function arbitrate(
  proposal: WorkerProposal,
  challengerReport: ChallengerReport,
  config: AdversarialConfig = DEFAULT_CONFIG
): ArbiterRuling {
  const weights = config.weights;

  // Map contradictions by dimension for quick lookup
  const contradictedDimensions = new Set<string>();
  for (const c of challengerReport.contradictions) {
    if (c.severity === "strong") {
      // Map cross-check dimensions to their base dimension
      if (c.dimension.startsWith("cross:")) {
        const target = c.dimension.split("→")[1];
        if (target) contradictedDimensions.add(target.trim());
      }
      contradictedDimensions.add(c.dimension);
    }
  }

  // Calculate weighted score accounting for both sides
  let weightedTotal = 0;
  let totalWeight = 0;

  for (const evidence of proposal.evidence) {
    const dimKey = evidence.dimension === "pool_type" ? "poolType" : evidence.dimension;
    const w = weights[dimKey as keyof typeof weights];

    const isContradicted =
      contradictedDimensions.has(evidence.dimension) ||
      contradictedDimensions.has(`cross:${evidence.dimension}`) ||
      // Check if any cross-check targets this dimension
      Array.from(contradictedDimensions).some(
        (d) => d.startsWith("cross:") && d.includes(`→${evidence.dimension}`)
      );

    if (evidence.supports && !isContradicted) {
      // Worker supports, no contradiction → full weight
      weightedTotal += evidence.score * w;
    } else if (evidence.supports && isContradicted) {
      // Worker supports but Challenger contradicts → zero
      weightedTotal += 0;
    } else {
      // Not supporting → half weight (neutral signal)
      weightedTotal += evidence.score * w * 0.5;
    }

    totalWeight += w;
  }

  const finalScore = totalWeight > 0 ? weightedTotal / totalWeight : 0;

  // Check if Challenger found a better alternate
  const challengerHasBetter =
    challengerReport.alternateCandidate !== null &&
    challengerReport.alternateCandidate.score > finalScore;

  // Determine decision
  let decision: ArbiterDecision;
  let reasoning: string;

  if (challengerHasBetter) {
    decision = "uphold_challenger";
    reasoning = `Challenger's alternate (${challengerReport.alternateCandidate!.pool.name}, score=${(challengerReport.alternateCandidate!.score * 100).toFixed(0)}%) outscores Worker's adjusted score (${(finalScore * 100).toFixed(0)}%)`;
  } else if (finalScore >= config.arbiterUpholdThreshold) {
    decision = "uphold_worker";
    reasoning = `Adjusted score ${(finalScore * 100).toFixed(0)}% >= ${(config.arbiterUpholdThreshold * 100).toFixed(0)}% threshold despite contradictions`;
  } else if (finalScore < config.arbiterHumanReviewThreshold) {
    decision = "flag_human";
    reasoning = `Adjusted score ${(finalScore * 100).toFixed(0)}% < ${(config.arbiterHumanReviewThreshold * 100).toFixed(0)}% threshold — too uncertain for automated decision`;
  } else {
    // Between human review and uphold thresholds — lean toward human review for safety
    decision = "flag_human";
    reasoning = `Adjusted score ${(finalScore * 100).toFixed(0)}% is ambiguous (between ${(config.arbiterHumanReviewThreshold * 100).toFixed(0)}% and ${(config.arbiterUpholdThreshold * 100).toFixed(0)}%) — flagging for human review`;
  }

  // Build evidence summaries
  const workerSummary = proposal.evidence
    .map(
      (e) =>
        `${e.dimension}: ${(e.score * 100).toFixed(0)}% (${e.supports ? "supports" : "contradicts"})`
    )
    .join("; ");

  const challengerSummary = [
    `Verdict: ${challengerReport.verdict}`,
    ...challengerReport.contradictions.map(
      (c) => `[${c.severity}] ${c.dimension}: ${c.reason}`
    ),
    ...(challengerReport.alternateCandidate
      ? [
          `Alternate: ${challengerReport.alternateCandidate.pool.name} (${(challengerReport.alternateCandidate.score * 100).toFixed(0)}%)`,
        ]
      : []),
  ].join("; ");

  return {
    decision,
    finalScore,
    reasoning,
    workerEvidenceSummary: workerSummary,
    challengerEvidenceSummary: challengerSummary,
  };
}
