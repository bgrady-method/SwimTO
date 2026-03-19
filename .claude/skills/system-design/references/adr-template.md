# Architecture Decision Record Template

Use this template when documenting significant architecture decisions. Save ADRs to `./knowledge-base/decisions/adr-NNN-[slug].md`.

---

```markdown
# ADR-[NNN]: [Short Title]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-[NNN]
**Date:** YYYY-MM-DD
**Deciders:** [Who was involved in this decision]

## Context

[What is the issue? Why is this decision needed now? What forces are at play?]

## Decision

[What was decided. State it clearly and directly.]

We will [do X] because [primary reason].

## Alternatives Considered

### [Alternative 1]
- **Pros:** [...]
- **Cons:** [...]
- **Why not:** [...]

### [Alternative 2]
- **Pros:** [...]
- **Cons:** [...]
- **Why not:** [...]

## Consequences

### Positive
- [Good thing that follows]
- [Another good thing]

### Negative
- [Trade-off or cost]
- [Risk introduced]

### Neutral
- [Neither good nor bad, but worth noting]

## References

- [Link to relevant docs, discussions, or research]
```

---

## Guidelines

- **One decision per ADR.** Don't combine multiple decisions.
- **Short titles.** "Use SQLite for MVP data storage" not "Database Decision for the Application"
- **Context should explain the forces**, not just restate the problem. Why now? What constraints?
- **Decision should be actionable.** "We will use X" not "X seems good."
- **Always list alternatives.** Even if the choice was obvious, documenting why you didn't choose alternatives is valuable.
- **Be honest about consequences.** Every decision has trade-offs. List them.
- **Number sequentially.** ADR-001, ADR-002, etc.
- **Immutable once accepted.** Don't edit old ADRs — supersede them with new ones.
