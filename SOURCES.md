# Sources

Material adapted from two MIT-licensed projects (license texts in `THIRD_PARTY_NOTICES`):

- **ECC** — https://github.com/affaan-m/everything-claude-code @ `ef648e0`
- **Ponytail** — https://github.com/DietrichGebert/ponytail @ `6c97ffa`

Files were copied and then trimmed to remove content for languages/features not installed here and references to agents, skills and commands that don't exist in this repo. "original" means written for this repo.

| File | Source | Changes |
|------|--------|---------|
| `plugins/core/agents/planner.md` | ECC `agents/planner.md` | Removed Prompt Defense Baseline block and duplicate bullet; replaced the Stripe/Supabase worked example with a short neutral one. |
| `plugins/core/agents/code-reviewer.md` | ECC `agents/code-reviewer.md` | Removed Prompt Defense Baseline, React/Next.js and Node-specific sections, TS code samples, JS-specific false positives and the v1.8 model-cost addendum; made language-agnostic. |
| `plugins/core/agents/security-reviewer.md` | ECC `agents/security-reviewer.md` | Removed Prompt Defense Baseline; replaced npm/express/bcrypt-specific commands and table entries with tool-neutral wording. |
| `plugins/core/agents/tdd-guide.md` | ECC `agents/tdd-guide.md` | Removed Prompt Defense Baseline and v1.8 eval-driven addendum; npm/Playwright/Supabase specifics made generic. |
| `plugins/core/agents/build-error-resolver.md` | ECC `agents/build-error-resolver.md` | Rewritten language-agnostic (was TypeScript-specific); kept the minimal-diff workflow and DO/DON'T; removed references to refactor-cleaner and architect. |
| `plugins/core/skills/tdd-workflow/SKILL.md` | ECC `skills/tdd-workflow/SKILL.md` | Condensed 583 -> 74 lines: dropped plan-handoff machinery, package-manager detector script, Bun/Playwright/Supabase/Redis/OpenAI patterns, evidence-report step. |
| `plugins/core/skills/security-review/SKILL.md` | ECC `skills/security-review/SKILL.md` | Condensed 511 -> 74 lines: language-neutral, dropped Supabase RLS, Solana/blockchain, Next.js sections and `cloud-infrastructure-security.md`. |
| `plugins/core/skills/verification-loop/SKILL.md` | ECC `skills/verification-loop/SKILL.md` | Made toolchain-neutral; added links to core agents; dropped `/verify` and hook references. |
| `plugins/core/skills/coding-standards/SKILL.md` | ECC `skills/coding-standards/SKILL.md` | Condensed 551 -> 77 lines: removed TypeScript/JavaScript and React sections (belong to the kit); kept principles, naming, errors, comments, smells. |
| `plugins/core/skills/ponytail/SKILL.md` | Ponytail `skills/ponytail/SKILL.md` | Kept the ladder, rules, output pattern and exceptions. Removed persistence/mode switching, intensity levels, `stop ponytail`, and examples; added tests/review/verification to the never-lazy list. Other Ponytail skills, commands, hooks, scripts, MCP and benchmarks not imported. |
| `plugins/core/rules/common.md` | ECC `rules/common/*` (coding-style, testing, security, code-review, git-workflow, development-workflow, patterns, performance) | New condensed file (~56 lines). Dropped `agents.md`, `hooks.md`, model-selection/context/thinking advice, ECC-specific research tooling (Exa, Context7), other-language reviewer references. Added the top-line principle. |
| `plugins/core/hooks/hooks.json` | original | One SessionStart hook: `cat ${CLAUDE_PLUGIN_ROOT}/rules/common.md`. |
| `plugins/core/.claude-plugin/plugin.json, .claude-plugin/marketplace.json` | original | Plugin and marketplace manifests. |
