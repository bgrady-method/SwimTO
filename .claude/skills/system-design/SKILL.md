---
name: system-design
description: Design system architecture, select tech stacks, evaluate hosting/databases/auth, and produce Architecture Decision Records (ADRs)
user_invocable: true
allowedTools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - Bash
  - Skill
---

# System Design Skill

You are a system architect. Your job is to design software architecture, evaluate technology choices, and produce Architecture Decision Records (ADRs).

## Scope

This skill covers:
- Architecture pattern selection
- Technology stack decisions (databases, auth, caching, messaging, etc.)
- Component design and interaction patterns
- API design
- CI/CD pipeline design
- Observability strategy
- ADR generation

For hosting-specific decisions, use or chain to `hosting-advisor`.
For systems analysis (feedback loops, leverage points), use `systems-thinking` first.
For visual architecture diagrams, chain to `drawio-diagram`.

## Architecture Pattern Decision Matrix

| Pattern | Best For | Avoid When | Complexity |
|---------|----------|------------|------------|
| **Modular Monolith** | Hackathons, MVPs, small teams, unclear domain boundaries | You need independent deployment/scaling per module | Low |
| **Microservices** | Large teams, independent scaling needs, mature domain model | Small team, MVP, unclear boundaries | High |
| **Event-Driven** | Async workflows, decoupled services, audit trails | Simple CRUD apps, real-time request/response | Medium |
| **CQRS** | Read/write asymmetry, complex queries, event sourcing | Simple domains, few users | Medium-High |
| **Hexagonal/Clean** | Long-lived enterprise apps, testability priority | Hackathons, prototypes, speed priority | Medium |
| **Flat/Minimal API** | Hackathons, quick prototypes, learning projects | Large teams, complex domains | Very Low |

**For this project (hackathon/MVP):** Default to **Flat/Minimal API** (.NET) + **component-based SPA** (React). Upgrade to modular monolith if complexity warrants it.

## Database Decision Matrix

| Database | Best For | .NET Support | Free Tier | MVP? |
|----------|----------|-------------|-----------|------|
| **SQLite** | Zero-ops local dev, prototypes, embedded | EF Core built-in | Free (file-based) | Best for MVP |
| **PostgreSQL** | Production relational, complex queries | Npgsql + EF Core | Supabase, Neon, Railway | Good |
| **SQL Server** | .NET ecosystem, enterprise | EF Core built-in | Azure SQL Free (preview), LocalDB | OK |
| **MongoDB** | Document storage, flexible schema | MongoDB.Driver | Atlas Free (512MB) | OK |
| **CosmosDB** | Global distribution, multi-model | Azure SDK | Free tier (1000 RU/s) | Overkill for MVP |
| **Redis** | Caching, sessions, pub/sub | StackExchange.Redis | Upstash Free | Add later |

**Default for MVP:** SQLite for data storage. No separate DB server needed.

## Auth Decision Matrix

| Solution | Best For | .NET Support | Free Tier | MVP? |
|----------|----------|-------------|-----------|------|
| **None (API key)** | Hackathon demos, internal tools | Manual middleware | Free | Simplest |
| **ASP.NET Identity** | .NET-native, full control | Built-in | Free | Good if you need auth |
| **Clerk** | Quick setup, good DX, React SDK | JWT validation | Free (10K MAU) | Good |
| **Auth0** | Feature-rich, enterprise | JWT + SDK | Free (7.5K MAU) | OK |
| **Azure AD B2C** | Microsoft ecosystem | MSAL library | Free (50K MAU) | Complex setup |
| **Keycloak** | Self-hosted, full control | JWT validation | Free (self-host) | Too heavy for MVP |

**Default for MVP:** No auth or simple API key. Add Clerk if user-facing auth needed.

## Caching Strategy Reference

| Layer | Technology | Use When |
|-------|-----------|----------|
| **Browser** | Cache-Control headers, ETags | Static assets, infrequently changing API responses |
| **CDN** | Cloudflare, Vercel Edge | Static frontend assets |
| **Application** | `IMemoryCache`, `HybridCache` (.NET 9) | Computed results, DB query results, single-instance |
| **Distributed** | Redis, Azure Cache | Multi-instance, shared cache, sessions |
| **Database** | Materialized views, computed columns | Complex aggregations |

**Default for MVP:** Browser caching + `IMemoryCache` for API responses. Add Redis later if needed.

## Observability Strategy

| Layer | Tool | Priority |
|-------|------|----------|
| **Structured Logging** | Serilog + Console sink | P0 — always |
| **Exception Tracking** | Global exception handler middleware | P0 — always |
| **Request Logging** | ASP.NET request logging middleware | P1 — add early |
| **Metrics** | OpenTelemetry → Console (dev) | P2 — add when needed |
| **Distributed Tracing** | OpenTelemetry | P3 — multi-service only |
| **Dashboard** | App Insights / Grafana | P3 — production only |

**Default for MVP:** Serilog to console + global exception handler. That's it.

## CI/CD Templates

### GitHub Actions — .NET + React

```yaml
name: Build and Test
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build
      - working-directory: ./client
        run: npm ci && npm run build
```

## ADR Template

See `references/adr-template.md` for the full template.

Quick format:
```markdown
# ADR-[NNN]: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Context:** [Why is this decision needed?]
**Decision:** [What was decided]
**Consequences:** [What follows from this decision — both positive and negative]
```

## Workflow

1. **Understand requirements**
   - What does the system need to do? (functional)
   - What qualities matter? (performance, scale, security, cost)
   - What constraints exist? (team size, timeline, budget, existing infra)
   - Is this MVP/hackathon or production?

2. **Choose architecture pattern**
   - Use the decision matrix above
   - For this project: default to flat minimal API unless complexity demands more

3. **Select tech stack**
   - Use decision matrices for each layer (DB, auth, caching, etc.)
   - For MVP: minimize moving parts — SQLite, no auth, IMemoryCache, Serilog

4. **Design components**
   - Define API endpoints (REST, resource-oriented)
   - Define data models
   - Define frontend component tree
   - Define data flow (client → API → DB, and back)

5. **Generate ADR**
   - One ADR per significant decision
   - Save to `./knowledge-base/decisions/`

6. **Create architecture diagram**
   - Use `drawio-diagram` skill for visual output
   - Include component diagram and data flow diagram

7. **Define CI/CD** (if needed)
   - Use GitHub Actions template above
   - Skip for MVP until deployment is needed

## Output Format

Produce a system design document:

```markdown
# System Design: [Project Name]

**Date:** [YYYY-MM-DD]
**Scope:** MVP / Production
**Team Size:** [N]

## Requirements Summary
[Brief list of functional and non-functional requirements]

## Architecture
**Pattern:** [Chosen pattern with rationale]
**Diagram:** [Link to drawio file or ASCII diagram]

## Tech Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | .NET 9 Minimal API | [Why] |
| Frontend | React + Vite + TypeScript | [Why] |
| Database | [Choice] | [Why] |
| Auth | [Choice] | [Why] |
| Hosting | [Choice] | [Why] |

## API Design
[Endpoint list with methods, paths, and brief descriptions]

## Data Model
[Key entities and relationships]

## Decisions
[Links to ADRs generated]
```

## Integration with Other Skills

- **`systems-thinking`** → feeds causal analysis into architecture decisions
- **`hosting-advisor`** → delegates hosting/deployment decisions
- **`drawio-diagram`** → generates architecture and data flow diagrams
- **`dotnet-react-scaffold`** → implements the design
- **`web-research`** → researches specific technologies when decision matrices are insufficient
