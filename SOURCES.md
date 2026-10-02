# Sources

Material adapted from two MIT-licensed projects (license texts in `THIRD_PARTY_NOTICES`):

- **ECC** — https://github.com/affaan-m/everything-claude-code @ `ef648e0`
- **Ponytail** — https://github.com/DietrichGebert/ponytail @ `6c97ffa`

Files were copied and then trimmed to remove content for languages/features not installed here and references to agents, skills and commands that don't exist in this repo. "original" means written for this repo.

| File | Source | Changes |
|------|--------|---------|
| `plugins/core/agents/planner.md` | ECC `agents/planner.md` | Replaced the Prompt Defense Baseline block with a shorter 3-bullet Prompt Defense section and duplicate bullet; replaced the Stripe/Supabase worked example with a short neutral one. |
| `plugins/core/agents/code-reviewer.md` | ECC `agents/code-reviewer.md` | Replaced Prompt Defense Baseline with a shorter Prompt Defense section; React/Next.js and Node-specific sections, TS code samples, JS-specific false positives and the v1.8 model-cost addendum; made language-agnostic. |
| `plugins/core/agents/security-reviewer.md` | ECC `agents/security-reviewer.md` | Replaced Prompt Defense Baseline with a shorter Prompt Defense section; replaced npm/express/bcrypt-specific commands and table entries with tool-neutral wording. |
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
| `plugins/typescript-react/agents/typescript-reviewer.md` (107 lines) | ECC `agents/typescript-reviewer.md` | Replaced Prompt Defense Baseline with a shorter Prompt Defense section; the React/Next.js fallback block (now defers to `react-reviewer`) and React-only perf bullets; replaced the references to missing skills with this kit's skill and core agents. |
| `plugins/typescript-react/agents/react-reviewer.md` (156 lines) | ECC `agents/react-reviewer.md` | Replaced Prompt Defense Baseline with a shorter Prompt Defense section; replaced Related section (rules, commands and missing skills) with this kit's skills and core agents. |
| `plugins/typescript-react/agents/react-build-resolver.md` (188 lines) | ECC `agents/react-build-resolver.md` | Replaced Prompt Defense Baseline with a shorter Prompt Defense section; limited to Next.js/Vite/webpack (dropped CRA, Parcel, esbuild, Bun, Rsbuild); points to `core:build-error-resolver` instead of a missing agent; Related section rewritten. |
| `plugins/typescript-react/skills/react-patterns/SKILL.md` (296 lines) | ECC `skills/react-patterns/SKILL.md` | Removed `metadata`, rules/accessibility/react-performance/angular cross-links, Routing and Out-of-scope sections, named-slot/render-prop recipes and the context-splitting example. |
| `plugins/typescript-react/skills/react-testing/SKILL.md` (318 lines) | ECC `skills/react-testing/SKILL.md` | Removed `metadata`, e2e-testing/accessibility/rules links and commands; Playwright/Cypress section reduced to a decision boundary; TDD section defers to core `tdd-workflow`; dropped coverage-config and runner-command blocks, one hook test and the error-boundary/Suspense examples. |
| `plugins/typescript-react/skills/frontend-patterns/SKILL.md` (283 lines) | ECC `skills/frontend-patterns/SKILL.md` | Removed `metadata` and everything duplicated by `react-patterns` (composition, compound components, render props, error boundary, forms) plus the state-toggle hook, debounce hook, Framer Motion animation and long virtualization example. |
| `plugins/typescript-react/skills/typescript-react-standards/SKILL.md` (94 lines) | ECC `rules/typescript/*`, `rules/react/*`, `rules/web/*` | NEW skill condensing those rule sets (on demand, not always-on). Dropped ECC hooks-config rules, design-quality, animation, visual-regression/E2E tooling advice and other-framework (CRA/Remix) notes. |
| `plugins/typescript-react/.claude-plugin/plugin.json` | original | Kit manifest (also the `typescript-react` entry in `.claude-plugin/marketplace.json`). |
