import type { WorkerProposal } from "./types.js";
import type { AdversarialConfig } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

export interface TriageResult {
  fastPath: boolean;
  reason: string;
}

/**
 * Fast-path gate: determines whether a Worker proposal is obvious enough
 * to skip the Challenger entirely.
 *
 * Criteria:
 *   - Composite score >= fastPathMinScore (default 0.95)
 *   - Name dimension score >= fastPathMinNameScore (default 0.9)
 *   - Address is not contradictory (if fastPathRequireAddressMatch is true)
 */
export function triageProposal(
  proposal: WorkerProposal,
  config: AdversarialConfig = DEFAULT_CONFIG
): TriageResult {
  if (!proposal.bestCandidate) {
    return { fastPath: false, reason: "no candidate" };
  }

  if (proposal.bestScore < config.fastPathMinScore) {
    return {
      fastPath: false,
      reason: `composite score ${(proposal.bestScore * 100).toFixed(0)}% < ${(config.fastPathMinScore * 100).toFixed(0)}% threshold`,
    };
  }

  const nameEvidence = proposal.evidence.find((e) => e.dimension === "name");
  if (!nameEvidence || nameEvidence.score < config.fastPathMinNameScore) {
    return {
      fastPath: false,
      reason: `name score ${((nameEvidence?.score ?? 0) * 100).toFixed(0)}% < ${(config.fastPathMinNameScore * 100).toFixed(0)}% threshold`,
    };
  }

  if (config.fastPathRequireAddressMatch) {
    const addressEvidence = proposal.evidence.find((e) => e.dimension === "address");
    if (addressEvidence && !addressEvidence.supports) {
      return {
        fastPath: false,
        reason: `address does not support match: ${addressEvidence.detail}`,
      };
    }
  }

  return {
    fastPath: true,
    reason: `high confidence: composite=${(proposal.bestScore * 100).toFixed(0)}%, name=${(nameEvidence.score * 100).toFixed(0)}%`,
  };
}
