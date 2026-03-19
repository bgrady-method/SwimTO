---
name: adversarial-review
description: Multi-agent adversarial review pattern for data quality — Worker proposes, Challenger disproves, Arbiter reconciles. Prevents single-agent bias in matching decisions.
user_invocable: false
---

# Adversarial Multi-Agent Review Pattern

A data quality pattern where no single agent both generates and validates a match. Separates generation from verification using a Worker → Challenger → Arbiter pipeline.

## When to Use

- Matching records between two datasets where false positives are costly
- Any data quality task where a single fuzzy matcher produces overconfident results
- When the same signal (e.g., partial name overlap) can be both evidence for AND against a match

## Architecture

```
Seed Record → Worker (proposes match + multi-dimension evidence)
           → Triage (fast-path obvious matches, skip Challenger)
           → Challenger (cross-dimension verification, contradiction detection)
           → Reconciler (agree? done. dispute?)
           → Arbiter (weighted evidence reconciliation)
           → Result: confirmed | disputed | human_review
```

## Key Principles

1. **Never let the same agent generate and validate.** The Worker proposes; the Challenger tries to disprove.
2. **Evaluate all dimensions.** No short-circuiting — a name match doesn't skip address checking.
3. **Cross-dimension verification.** If Worker matched on name, Challenger checks address + coordinates.
4. **Proportional cost.** Triage gate skips Challenger for obvious matches (exact name + address).
5. **Explicit contradiction detection.** Different street numbers, >2km apart, pool type mismatch.
6. **Runner-up tracking.** Worker always returns #2 candidate for Challenger to consider.
7. **Human review escape hatch.** When score is ambiguous, flag for human rather than guess.

## Implementation Reference

See `tools/audit/src/adversarial/` for the reference implementation:

| File | Role |
|------|------|
| `types.ts` | `MatchEvidence`, `WorkerProposal`, `ChallengerReport`, `ArbiterRuling`, config |
| `worker.ts` | Multi-dimension evidence collection (name, address, coordinates, pool_type) |
| `triage.ts` | Fast-path gate: score >= 0.95 AND name >= 0.9 AND address not contradictory |
| `challenger.ts` | Cross-dimension verification, contradiction detection, alternate search |
| `arbiter.ts` | Weighted reconciliation: upholds Worker, upholds Challenger, or flags human |
| `pipeline.ts` | Orchestrates full flow, exports `adversarialMatch()` |

## Adapting to Other Domains

To use this pattern for a different data matching problem:

1. **Define your dimensions.** Replace name/address/coordinates/pool_type with your domain's dimensions.
2. **Define your weights.** Which dimensions matter most? (e.g., for people: name=0.4, DOB=0.3, address=0.2, phone=0.1)
3. **Define contradictions.** What signals are strong enough to override a match? (e.g., different DOB is a strong contradiction)
4. **Tune thresholds.** Fast-path threshold, human review threshold, arbiter uphold threshold.
5. **Wire into pipeline.** Replace `evaluateCandidate()` in worker.ts with your dimension evaluators.

## Configuration

```typescript
{
  fastPathMinScore: 0.95,       // Skip Challenger for near-perfect matches
  fastPathMinNameScore: 0.9,    // Name must be strong for fast-path
  fastPathRequireAddressMatch: true,
  challengerMinDimensions: 2,   // Check at least 2 cross-dimensions
  arbiterHumanReviewThreshold: 0.4,
  arbiterUpholdThreshold: 0.6,
  weights: { name: 0.4, address: 0.3, coordinates: 0.2, poolType: 0.1 }
}
```
