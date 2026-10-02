# Sources

Material adapted from two MIT-licensed projects (license texts in `THIRD_PARTY_NOTICES`):

- **ECC** — https://github.com/affaan-m/everything-claude-code @ `ef648e0`
- **Ponytail** — https://github.com/DietrichGebert/ponytail @ `6c97ffa`

Files were copied and then trimmed to remove content for languages/features not installed here and references to agents, skills and commands that don't exist in this repo. "original" means written for this repo.

**All eight agents:** ECC's six-bullet "Prompt Defense Baseline" block is replaced by a shorter 3-bullet "Prompt Defense" section, followed by one line: "Follow the core rules: minimal changes, never skip tests/review/security, don't touch unrelated files."

| File | Source | Changes |
|------|--------|---------|
| `plugins/core/agents/planner.md` | ECC `agents/planner.md` | Removed a duplicate bullet; replaced the Stripe/Supabase worked example with a short neutral one. |
| `plugins/core/agents/code-reviewer.md` | ECC `agents/code-reviewer.md` | Removed React/Next.js and Node-specific sections, TS code samples, JS-specific false positives and the v1.8 model-cost addendum; made language-agnostic. |
| `plugins/core/agents/security-reviewer.md` | ECC `agents/security-reviewer.md` | Replaced npm/express/bcrypt-specific commands and table entries with tool-neutral wording. |
| `plugins/core/agents/tdd-guide.md` | ECC `agents/tdd-guide.md` | Removed v1.8 eval-driven addendum; npm/Playwright/Supabase specifics made generic. |
| `plugins/core/agents/build-error-resolver.md` | ECC `agents/build-error-resolver.md` | Rewritten language-agnostic (was TypeScript-specific); kept the minimal-diff workflow and DO/DON'T; removed references to refactor-cleaner and architect. |
| `plugins/core/skills/tdd-workflow/SKILL.md` | ECC `skills/tdd-workflow/SKILL.md` | Condensed 583 -> 74 lines: dropped plan-handoff machinery, package-manager detector script, Bun/Playwright/Supabase/Redis/OpenAI patterns, evidence-report step. |
| `plugins/core/skills/security-review/SKILL.md` | ECC `skills/security-review/SKILL.md` | Condensed 511 -> 74 lines: language-neutral, dropped Supabase RLS, Solana/blockchain, Next.js sections and `cloud-infrastructure-security.md`. |
| `plugins/core/skills/verification-loop/SKILL.md` | ECC `skills/verification-loop/SKILL.md` | Made toolchain-neutral; added links to core agents; dropped `/verify` and hook references. |
| `plugins/core/skills/coding-standards/SKILL.md` | ECC `skills/coding-standards/SKILL.md` | Condensed 551 -> 77 lines: removed TypeScript/JavaScript and React sections (belong to the kit); kept principles, naming, errors, comments, smells. |
| `plugins/core/skills/ponytail/SKILL.md` | Ponytail `skills/ponytail/SKILL.md` | Kept the ladder, rules, output pattern and exceptions. Removed persistence/mode switching, intensity levels, `stop ponytail`, and examples; added tests/review/verification to the never-lazy list. Other Ponytail skills, commands, hooks, scripts, MCP and benchmarks not imported. |
| `plugins/core/rules/common.md` | ECC `rules/common/*` (coding-style, testing, security, code-review, git-workflow, development-workflow, patterns, performance) | New condensed file (66 lines). Dropped `agents.md`, `hooks.md`, model-selection/context/thinking advice, ECC-specific research tooling (Exa, Context7), other-language reviewer references. Added the two top-line principles, a layers/precedence note and a condensed untrusted-content block. |
| `plugins/core/hooks/hooks.json` | original | SessionStart (`cat rules/common.md`) plus the protection hooks below, exec form with `${CLAUDE_PLUGIN_ROOT}`. |
| `plugins/core/.claude-plugin/plugin.json, .claude-plugin/marketplace.json` | original | Plugin and marketplace manifests. |
| `plugins/typescript-react/agents/typescript-reviewer.md` (107 lines) | ECC `agents/typescript-reviewer.md` | Removed the React/Next.js fallback block (now defers to `react-reviewer`) and React-only perf bullets; replaced the references to missing skills with this kit's skill and core agents. |
| `plugins/typescript-react/agents/react-reviewer.md` (156 lines) | ECC `agents/react-reviewer.md` | Replaced Related section (rules, commands and missing skills) with this kit's skills and core agents. |
| `plugins/typescript-react/agents/react-build-resolver.md` (188 lines) | ECC `agents/react-build-resolver.md` | Limited to Next.js/Vite/webpack (dropped CRA, Parcel, esbuild, Bun, Rsbuild); points to `core:build-error-resolver` instead of a missing agent; Related section rewritten. |
| `plugins/typescript-react/skills/react-patterns/SKILL.md` (296 lines) | ECC `skills/react-patterns/SKILL.md` | Removed `metadata`, rules/accessibility/react-performance/angular cross-links, Routing and Out-of-scope sections, named-slot/render-prop recipes and the context-splitting example. |
| `plugins/typescript-react/skills/react-testing/SKILL.md` (318 lines) | ECC `skills/react-testing/SKILL.md` | Removed `metadata`, e2e-testing/accessibility/rules links and commands; Playwright/Cypress section reduced to a decision boundary; TDD section defers to core `tdd-workflow`; dropped coverage-config and runner-command blocks, one hook test and the error-boundary/Suspense examples. |
| `plugins/typescript-react/skills/frontend-patterns/SKILL.md` (283 lines) | ECC `skills/frontend-patterns/SKILL.md` | Removed `metadata` and everything duplicated by `react-patterns` (composition, compound components, render props, error boundary, forms) plus the state-toggle hook, debounce hook, Framer Motion animation and long virtualization example. |
| `plugins/typescript-react/skills/typescript-react-standards/SKILL.md` (94 lines) | ECC `rules/typescript/*`, `rules/react/*`, `rules/web/*` | NEW skill condensing those rule sets (on demand, not always-on). Dropped ECC hooks-config rules, design-quality, animation, visual-regression/E2E tooling advice and other-framework (CRA/Remix) notes. |
| `plugins/typescript-react/.claude-plugin/plugin.json` | original | Kit manifest (also the `typescript-react` entry in `.claude-plugin/marketplace.json`). |

## Protection hooks (`plugins/core/hooks/scripts/`)

All adapted from ECC `scripts/hooks` @ `ef648e0`. ECC's wrapper stack (`run-with-flags`, plugin/lifecycle bootstraps, `ECC_*` environment switches, stdin echo-back, `utils.js`) is not imported; two small helpers replace it.

| File | Source | Changes |
|------|--------|---------|
| `config-protection.js` | ECC `config-protection.js` | Kept the protected-file list and pattern logic (existing files only, case-insensitive, fail-closed stat); dropped Ruff/Python and shellcheck entries; ported onto `lib/hook-io`. |
| `block-no-verify.js` + `lib/shell-scan.js` | ECC `block-no-verify.js`, `lib/shell-scan.js` | Parsing logic ported unchanged (security-critical); removed ECC-specific header text and the stdin/`run()` plumbing. |
| `pre-bash-dev-server-block.js` + `lib/shell-split.js`, `lib/shell-substitution.js` | ECC `pre-bash-dev-server-block.js`, `lib/shell-split.js`, `lib/shell-substitution.js` | Helpers ported with one change (`lib/shell-split.js` also splits on newlines outside quotes). Behavior changed: instead of requiring tmux it blocks only FOREGROUND runs and allows `run_in_background`, trailing `&` and tmux launchers (cloud sessions may lack tmux); heredoc bodies are ignored, so a command that merely writes "npm run dev" into a doc is not blocked (found in a live bootstrap run). |
| `pre-bash-commit-quality.js` | ECC `pre-bash-commit-quality.js` | Rewritten around ECC's checks: secrets (+ private keys, staged `.env`) now BLOCK, everything else warns via `additionalContext` (ECC used stderr, discarded on exit 0). Dropped pylint/golint; staged files of any type scanned for secrets; message check on first line only and HEREDOC-aware; handles `commit -a`, chained `git add` and secrets in the command text. |
| `check-console-log.js` | ECC `check-console-log.js` | Also covers untracked new files, skips commented lines, reports line numbers, warns via `systemMessage`; own git helpers instead of `lib/utils.js`. |
| `post-edit-accumulator.js` + `lib/edited-files.js` | ECC `post-edit-accumulator.js`, parts of `stop-format-typecheck.js` | Separate edited-file list per consumer (typecheck / format) so one cannot drain the other; session id from hook input. |
| `stop-typecheck.js` | ECC `stop-format-typecheck.js` (typecheck half) | One `tsc --noEmit` per tsconfig via `npx --no-install`; only errors in edited files; reports through exit code 2 (blocks the stop once, guarded by `stop_hook_active`) instead of stderr; JS files included. |
| `stop-format.js` | ECC `stop-format-typecheck.js` (format half), `lib/resolve-formatter.js` | Separate hook, OFF by default; Prettier/Biome from the project's `node_modules/.bin` only (no package-manager fallbacks, no Windows shims). |
| `lib/hook-flags.js`, `lib/hook-io.js` | original (modelled on ECC `lib/hook-flags.js`) | `MY_TOOLKIT_DISABLED_HOOKS`, `MY_TOOLKIT_ENABLE_HOOKS`, `MY_TOOLKIT_HOOKS=off`; bounded stdin, `block()` / `context()` / `message()` helpers. |

## Tests

| File | Source | Changes |
|------|--------|---------|
| `tests/hooks/run.js` | original | Node port of the Phase 3 verification harness: builds a throwaway TS/React git project, drives every hook with synthetic payloads (65 cases), prints a markdown pass/fail table. Fake secrets are assembled at runtime. |
| `plugins/project-starter/skills/new-project/SKILL.md`, `templates/*.tmpl`, `.claude-plugin/plugin.json` | original | Opt-in plugin with a stack-agnostic skill that bootstraps a new project in the session's empty repo (interview, kit selection from `CATALOG.md`, install list, official scaffolder, project layer, verification, push to a branch). Started as a repo-level skill; moved into a plugin once the repo became public so it works from a single-repo session. |
| `tests/skills/check.js` | original | Static checks for that skill: frontmatter, templates, placeholders, JSON validity, catalog/marketplace sync, referenced agents. |

## Executable scripts

- **Skills (core and kit): none.** No script was copied from any ECC skill. ECC's `tdd-workflow` references `scripts/setup-package-manager.js`; it was not imported and the skill now says to find the project's own commands.
- **Hooks:** the 14 `.js` files under `plugins/core/hooks/scripts/` (listed above) are the only executable code run by the plugins; `tests/hooks/run.js` and `tests/skills/check.js` are developer-only test scripts and are not part of any plugin. They exist because ECC's protections are implemented as Node scripts; each is run by `hooks.json` with `node` and nothing else is executed.
- **Not imported:** ECC's other hooks (gateguard, learning/observation, telemetry, cost tracking, Plan Canvas, MCP health, governance capture, notifications, session-context loading) and `git-push-reminder`.
