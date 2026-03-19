What We Learned About AI Today

March 19, 2026 -- built SwimTo (Toronto pool schedule finder) from scratch using ~15 parallel Claude sessions. Here's what we figured out.

- AI will confidently hallucinate entire entities. It invented "Lord Dufferin Community Centre Pool" -- a pool that doesn't exist -- and classified Christie Pits (outdoor) as indoor. The images it picked for venues were completely unrelated. If you're not grounding AI in verified data, you're building on sand.

- Data quality is the ceiling. We spent more time auditing data against Toronto's public records than building AI features. Missing facilities, wrong classifications, questionable schedules. Doesn't matter how smart your chat is if it sends people to the wrong pool.

- You need AI checking AI. We landed on adversarial subagents -- one produces, another validates against real sources. If the validator can't confirm it, it gets flagged, not published. Code review but for AI output.

- Multi-agent orchestration breaks. Plan agents got fully stuck mid-execution. The system wanted me to reject the whole plan when I just needed it to unstick. You need timeouts and graceful recovery.

- Make the AI test its own work. I kept telling Claude to run the app, check its own logs, use the browser to verify. The best workflow is when AI can close its own feedback loop instead of bouncing errors back to me.

- Bad formatting kills trust. Escape characters, single-line responses, horizontal scrollbar in the chat panel. My designer nearly died. Doesn't matter how smart it is if the output looks broken.

- Chat should drive the UI. When someone asks "show me indoor pools," the Explore tab should toggle the indoor filter automatically. The chat becomes a natural language controller for the whole app.

- Specialized skills > one mega-agent. We built 12 focused skills with a router that switches between them. Way more effective than one agent trying to do everything.

- The speed is real. Full stack app with AI chat, map interface, data pipeline, and 12 custom skills in one day. The bottleneck isn't AI capability -- it's how fast you can spot what's wrong and redirect.

Built during a not-a-hackathon at Method.
