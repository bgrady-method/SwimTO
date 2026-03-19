---
name: agent-orchestrator
description: Orchestrate multiple Claude Code agents for complex, multi-domain tasks — coordinates parallel work, manages dependencies, and merges results
user_invocable: true
allowedTools:
  - Agent
  - TaskCreate
  - TaskGet
  - TaskList
  - TaskUpdate
  - TaskOutput
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Skill
---

# Agent Orchestrator Skill

You coordinate complex, multi-step tasks by decomposing them into subtasks, dispatching them to specialized agents, and merging results. Use this when a task spans multiple domains, requires parallel execution, or is too large for a single pass.

## When to Use Orchestration

**Use orchestration when:**
- Task spans 3+ domains (e.g., research + design + implementation)
- Work can be parallelized (e.g., research two topics simultaneously)
- Task requires different skill specializations
- User says "build the whole thing" or describes a multi-phase effort
- You estimate the task will touch 10+ files

**Don't use orchestration when:**
- Task is single-domain and straightforward
- A single skill can handle it
- The task is small enough to do directly

## Agent Types

| Agent Type | Use For | Tools Available | Context Cost |
|------------|---------|----------------|--------------|
| **Explore** | Finding files, searching code, answering questions about the codebase | Read-only tools (Glob, Grep, Read, WebSearch, WebFetch) | Low |
| **Plan** | Designing implementation strategies, identifying critical files | Read-only tools + planning | Medium |
| **General Purpose** | Implementation, research, complex multi-step work | All tools including Agent | High |

## Coordination Patterns

### 1. Fan-Out / Fan-In

**Use when:** Multiple independent subtasks can run in parallel.

```
          ┌─→ Agent A (research topic 1) ─→┐
Orchestrator─→ Agent B (research topic 2) ─→ Merge Results
          └─→ Agent C (research topic 3) ─→┘
```

**Implementation:**
```
1. Create tasks for each subtask (TaskCreate)
2. Launch agents in parallel (multiple Agent calls in one message)
3. Collect results
4. Merge and synthesize
```

### 2. Pipeline

**Use when:** Each step depends on the previous step's output.

```
Agent A (research) → Agent B (design) → Agent C (implement) → Agent D (test)
```

**Implementation:**
```
1. Run Agent A, wait for result
2. Feed A's result into Agent B's prompt
3. Feed B's result into Agent C's prompt
4. ...
```

### 3. Explore → Plan → Execute

**Use when:** You need to understand the codebase before making changes.

```
Explore Agent → Plan Agent → Implementation Agent(s)
```

**Implementation:**
```
1. Launch Explore agent to understand current state
2. Launch Plan agent with exploration results
3. Launch implementation agents based on the plan
```

### 4. Saga (with rollback)

**Use when:** Multi-step changes that should be atomic — if step 3 fails, undo steps 1-2.

```
Agent A (step 1) → Agent B (step 2) → Agent C (step 3)
                                        ↓ (failure)
                                    Rollback Agent
```

**Implementation:**
```
1. Run each step sequentially
2. Track what was changed at each step
3. If any step fails, run compensating actions
```

## Task Decomposition Heuristic

```
Input: User's request

1. IDENTIFY domains involved:
   - Frontend (React, UI, components)
   - Backend (API, .NET, endpoints)
   - Data (database, models, migrations)
   - Research (web search, API discovery)
   - Design (architecture, decisions)
   - Infrastructure (hosting, CI/CD)
   - Analysis (systems thinking, trade-offs)

2. COUNT domains:
   - 1 domain → Single skill, no orchestration needed
   - 2 domains → Consider skill chain (sequential)
   - 3+ domains → Orchestrate with agents

3. ASSESS parallelism:
   - Independent tasks → Fan-Out/Fan-In
   - Sequential dependencies → Pipeline
   - Unknown codebase → Explore-Plan-Execute

4. ESTIMATE file impact:
   - < 5 files → Direct execution
   - 5-15 files → Consider splitting into agents
   - 15+ files → Definitely orchestrate

5. CREATE task plan with subtasks
```

## Context Management Across Agents

Agents don't share context. You must explicitly pass information between them.

### Passing Context to Agents

**In the prompt:**
```
"You are implementing a REST API endpoint.

Requirements:
- The data model has fields: id, name, location (lat/lng), type
- The frontend expects GeoJSON format
- Use the existing AppDbContext in src/Api/Data/

Specific files to modify:
- src/Api/Endpoints/FacilitiesEndpoints.cs (create)
- src/Api/Models/Facility.cs (create)
- src/Api/Program.cs (register endpoints)
"
```

**Key principles:**
- Give each agent a complete, self-contained prompt
- Reference specific file paths
- Define the expected output format
- Include constraints and requirements
- Don't assume agents know what other agents are doing

### Collecting Results from Agents

Agent results come back as text. Extract:
- Files created/modified
- Decisions made
- Errors encountered
- Remaining work

## Orchestration Workflow

### Phase 1: Analyze
1. Parse the user's request
2. Run task decomposition heuristic
3. Identify required skills/agents
4. Determine coordination pattern

### Phase 2: Plan
1. Create a task list (TaskCreate for each subtask)
2. Define execution order (parallel vs. sequential)
3. Define contracts between agents (what each produces/consumes)
4. Identify risks and rollback strategies

### Phase 3: Execute
1. Launch agents according to the plan
2. **Parallel tasks:** Launch in a single message with multiple Agent calls
3. **Sequential tasks:** Wait for each to complete before launching the next
4. Track progress (TaskUpdate as agents complete)

### Phase 4: Merge
1. Collect all agent results
2. Check for conflicts (two agents modified the same file)
3. Resolve conflicts manually if needed
4. Verify the combined result (run build, run tests)

### Phase 5: Report
1. Summarize what was accomplished
2. List files created/modified
3. Note any remaining work or issues
4. Update tasks as completed

## Error Handling

| Error | Response |
|-------|----------|
| Agent fails | Read its output, diagnose, retry with more specific prompt |
| Two agents conflict | Manually merge, preferring the more recent/correct version |
| Build breaks after merge | Launch a fix agent targeting the specific error |
| Agent runs too long | Set reasonable scope — split into smaller subtasks |
| Agent goes off-track | More specific prompts with explicit constraints |

## Example Orchestrations

### "Build a map page showing Toronto community centers"

```
1. [Parallel - Fan-Out]
   Agent A (Explore): "Find the existing project structure and identify where to add a new page"
   Agent B (Research): "Fetch community center data from Toronto Open Data CKAN API"

2. [Sequential - Pipeline]
   Agent C (Backend): "Create a /api/geo/community-centres endpoint that proxies Toronto Open Data"
     → Uses: result from Agent B (data format/schema)
     → Uses: result from Agent A (project structure)

3. [Sequential - Pipeline]
   Agent D (Frontend): "Create a React page with a Leaflet map showing community centers"
     → Uses: result from Agent A (project structure)
     → Uses: result from Agent C (API endpoint path)

4. [Verify]
   Run: dotnet build && cd client && npm run build
```

### "Research and design the architecture for our Toronto services app"

```
1. [Parallel - Fan-Out]
   Agent A: /web-research "Toronto open data available datasets for community services"
   Agent B: /web-research "Best practices for .NET 9 + React SPA architecture 2025"

2. [Sequential]
   Agent C: /systems-thinking on the requirements (using research from A and B)

3. [Sequential]
   Agent D: /system-design using systems analysis from C and research from A and B

4. [Sequential]
   Agent E: /drawio-diagram to create architecture diagram from D's design
```

## Guidelines

- **Start small.** If unsure whether orchestration is needed, try a single agent first.
- **Explicit prompts.** Each agent should be fully self-contained — don't rely on implied context.
- **Verify after merge.** Always run builds/tests after combining agent outputs.
- **Report progress.** Keep the user informed at each phase boundary.
- **Don't over-orchestrate.** If 2 agents can do it, don't use 5.
- **Use background agents** for long research tasks that don't block other work.
- **Use worktree isolation** when agents might create conflicting file changes.

## Integration with Other Skills

This skill can invoke ANY other skill as a subtask:
- **`web-research`** → parallel research streams
- **`toronto-web-navigator`** → data discovery and extraction
- **`system-design`** → architecture phase
- **`dotnet-react-scaffold`** → project setup
- **`llm-integration`** → AI feature implementation
- **`map-integration`** → map feature implementation
- **`systems-thinking`** → analysis phase
- **`hosting-advisor`** → deployment planning
- **`skill-router`** → when unsure which skill a subtask needs
- **`drawio-diagram`** → diagram generation
