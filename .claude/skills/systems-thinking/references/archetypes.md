# System Archetypes (Detailed Reference)

Eight recurring patterns in complex systems. Recognizing an archetype tells you what interventions are likely to work (and which will backfire).

---

## 1. Fixes That Fail

**Pattern:** A quick fix addresses a symptom but creates unintended side effects that eventually worsen the original problem.

**Structure:**
```
Problem → Quick Fix → Problem Symptom Reduced (short term)
Quick Fix → Side Effect → Problem Worsened (long term, with delay)
```

**Software Examples:**
- Adding caching everywhere to fix slow performance → cache invalidation bugs, stale data, debugging complexity → performance harder to reason about
- Hotfixing production without tests → temporarily works → more regressions → more hotfixes needed
- Adding try/catch that swallows exceptions → errors stop surfacing → root causes never addressed → system silently degrades

**Intervention:** Resist the quick fix. Address root cause even if it takes longer. If you must apply a quick fix, commit to a root-cause fix with a deadline.

---

## 2. Shifting the Burden

**Pattern:** A symptomatic solution reduces pressure to implement a fundamental solution. Over time, the fundamental solution atrophies (becomes harder) while the system becomes dependent on the symptomatic one.

**Structure:**
```
Problem → Symptomatic Solution → Problem Reduced (short term)
Problem → Fundamental Solution → Problem Solved (long term)
Symptomatic Solution → Side Effect → Fundamental Solution becomes harder
```

**Software Examples:**
- Using a shared spreadsheet instead of building a proper data pipeline → team becomes dependent on manual process → pipeline never gets built
- Caching every slow query instead of optimizing the database → DB optimization skills atrophy → DB gets worse → more caching needed
- Manual deployments instead of CI/CD → nobody learns automation → manual process becomes "the way we do things"

**Intervention:** Strengthen the fundamental solution. Set a sunset date for the symptomatic solution. Recognize when "temporary workarounds" become permanent.

---

## 3. Limits to Growth

**Pattern:** A reinforcing (growth) process encounters a balancing (limiting) constraint that slows and eventually stops growth.

**Structure:**
```
Growth Action → Performance → More Growth Action  [R: Growth Engine]
Performance → Resource Strain → Constraint → Slowed Growth  [B: Limit]
```

**Software Examples:**
- App user growth → database becomes bottleneck → response times degrade → growth stalls
- Team velocity → code complexity grows → onboarding takes longer → velocity plateaus
- Feature count → testing burden grows → release cycle slows → feature delivery stalls

**Intervention:** Don't push harder on the growth engine — that makes it worse. Identify and remove the constraint. Plan for limits before hitting them.

---

## 4. Eroding Goals

**Pattern:** When performance falls short of goals, instead of improving performance, the goals are lowered to match current performance.

**Structure:**
```
Gap (Goal vs. Actual) → Corrective Action → Performance Improves  [B: Desired]
Gap (Goal vs. Actual) → Pressure → Goal Lowered → Gap Reduced  [B: Erosion]
```

**Software Examples:**
- Test coverage target was 80% → hard to maintain → "70% is fine" → "60% is fine" → barely tested
- Uptime SLA was 99.9% → incidents keep happening → "99.5% is more realistic" → standards slip
- Sprint commitment was 30 points → never met → "let's commit to 20" → still not met → 15

**Intervention:** Hold the goal firm. If the gap exists, fix the performance (invest in capability), don't erode the standard. Anchor goals to external benchmarks.

---

## 5. Escalation

**Pattern:** Two parties each respond to the other's actions with more of the same, leading to an arms race.

**Structure:**
```
A's Action → A's Position Relative to B Improves → B Feels Threatened
B's Response → B's Position Relative to A Improves → A Feels Threatened
```

**Software Examples:**
- Feature war with a competitor → both ship half-baked features to "keep up" → quality degrades
- Team A adds abstraction layers to isolate from Team B's changes → Team B adds their own → both codebases become over-abstracted
- Security vs. developer experience → more security controls → more workarounds → more controls

**Intervention:** Negotiate a "cease-fire." Agree on shared goals. Often both parties lose from escalation. Refuse to match the other party's escalation.

---

## 6. Success to the Successful

**Pattern:** Two activities compete for shared resources. The one that gets initial advantage gets more resources, widening the gap.

**Structure:**
```
Resources to A → A Succeeds → More Resources to A  [R: A's Virtuous Cycle]
Fewer Resources to B → B Struggles → Even Fewer Resources to B  [R: B's Vicious Cycle]
```

**Software Examples:**
- Product A gets more developer attention → ships faster → gets more users → gets even more attention. Product B is neglected → falls behind → gets ignored
- Popular microservice has 5 maintainers → always up-to-date, well-documented. Unpopular service has 1 part-time maintainer → becomes legacy → avoided → more neglected
- Senior developer gets complex tasks → grows skills → gets more complex tasks. Junior developer gets simple tasks → skills stagnate

**Intervention:** Ensure equitable resource allocation mechanisms. Periodically rebalance. Create rotation policies. Define minimum investment thresholds.

---

## 7. Tragedy of the Commons

**Pattern:** Multiple parties each act in their own interest by drawing from a shared resource, eventually depleting it.

**Structure:**
```
Individual Gain → More Usage → Individual Benefit (short term)
Total Usage → Resource Strain → Resource Depletion → Everyone Loses  [B, with delay]
```

**Software Examples:**
- Every team uses the shared database connection pool liberally → connection pool exhausted → all services degrade
- All services log verbosely to shared ELK stack → log storage fills up → search becomes slow → logs become useless
- Every team runs large CI/CD jobs → shared build queue backed up → everyone waits longer

**Intervention:** Create usage governance — quotas, rate limits, cost allocation. Make individual costs visible. Or partition the resource so teams own their share.

---

## 8. Growth and Underinvestment

**Pattern:** Growth approaches a limit that can be raised by investment in capacity. But because performance is adequate now, investment is delayed. When growth finally hits the limit, it's too late — investment takes time, and performance crashes in the gap.

**Structure:**
```
Demand Growth → Performance Adequate → No Investment Pressure
Demand Growth → Capacity Limit Hit → Performance Crashes  [delay]
Investment → New Capacity → Capacity Limit Raised  [delay]
```

**Software Examples:**
- User growth requires database migration → "it's fine for now" → sudden traffic spike → database overwhelmed → emergency migration under pressure
- Team knows auth system needs rewrite → "works for now" → security audit reveals critical vulnerabilities → panic rewrite
- Monitoring is basic → "we'll improve it when we need to" → production incident with no observability → blind debugging

**Intervention:** Invest in capacity before you need it. Use leading indicators (growth rate, trend lines) to trigger investment decisions. "If current trends continue, when do we hit the limit?"

---

## Using Archetypes

1. **Describe the problem** in terms of behavior over time (what's increasing? decreasing? oscillating?)
2. **Match the pattern** to an archetype — most problems fit 1-2 archetypes
3. **Apply the archetype's intervention** — each archetype has known effective responses
4. **Watch for archetype combinations** — systems often exhibit multiple archetypes simultaneously (e.g., Limits to Growth + Growth and Underinvestment)
