# my-toolkit

A personal [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces): a lean, **protection-first** alternative to everything-claude-code (ECC). One always-on **core** plugin carries the habits, rules and every protection hook; small **kit** plugins add stack-specific skills and agents per project.

> Keep code minimal, but tests, review and security checks are never optional.

## The three layers

Layers only **add**, never remove.

| Layer | Lives in | Contains | Enabled |
|-------|----------|----------|---------|
| **1. Core** | `plugins/core` (this repo) | Coding habits, `rules/common.md`, planner / reviewer / TDD / build agents, core skills, **all protection hooks** | every project |
| **2. Kits** | `plugins/<kit>` (this repo) | Stack-specific skills and agents (e.g. `typescript-react`) | per project |
| **3. Project** | the project's own repo | `CLAUDE.md` + `.claude/settings.json` (which kits to enable, local details, hook switches) | that project |

Precedence: core rules apply everywhere; kits add stack-specific guidance; projects add local details. **On conflict, core wins on safety, the project wins on style.**

**Kit rule:** a kit may ADD stack-specific checks (for example a future Python kit adding `mypy`), but must never remove, replace or weaken core hooks, rules or protections. `typescript-react` ships no hooks at all. All protection lives in core.

## Layout

```
.claude-plugin/marketplace.json     catalog of plugins
plugins/
  core/                             always on
    .claude-plugin/plugin.json
    agents/                         planner, code-reviewer, security-reviewer, tdd-guide, build-error-resolver
    skills/                         tdd-workflow, security-review, verification-loop, coding-standards, ponytail
    rules/common.md                 condensed rules, loaded into context at session start
    hooks/
      hooks.json                    SessionStart + protection hooks
      scripts/                      one Node script per hook, plus lib/ helpers
  typescript-react/                 kit: TypeScript / React / Next.js (no hooks)
    agents/                         typescript-reviewer, react-reviewer, react-build-resolver
    skills/                         react-patterns, react-testing, frontend-patterns, typescript-react-standards
CATALOG.md                          plugins, descriptions, trigger words
SOURCES.md                          origin of every file and what changed
TESTING.md                          checklist for a 2-3 week trial on a real project
tests/hooks/run.js                  automated tests for the protection hooks
THIRD_PARTY_NOTICES                 MIT notices for ECC and Ponytail
```

Components are namespaced by plugin: `core:planner`, `typescript-react:react-reviewer`. Plugins have no `version`, so every commit on the default branch is an update.

## Enable in a project

Plugins load from this repository's **default branch (`main`)**, so changes only reach projects once merged to `main` (to try an unmerged branch, see `TESTING.md`).

### On your own machine (interactive)

Add to the project's `.claude/settings.json`, commit it, and Claude Code offers to install the marketplace and plugins when you trust the folder:

```json
{
  "extraKnownMarketplaces": {
    "my-toolkit": {
      "source": { "source": "github", "repo": "jimmyl109/my-toolkit" }
    }
  },
  "enabledPlugins": {
    "core@my-toolkit": true,
    "typescript-react@my-toolkit": true
  }
}
```

Alternatives: `claude plugin marketplace add jimmyl109/my-toolkit` then `claude plugin install core@my-toolkit --scope project` (writes the same settings), or enable `core@my-toolkit` once in `~/.claude/settings.json` to get it everywhere. Run `/reload-plugins` or restart after changes. The hooks need `node` on `PATH`.

### In cloud (and other headless) sessions

**The settings file alone does not load the toolkit there.** Tested in a headless session: project-level `extraKnownMarketplaces` are ignored until the folder is trusted, and even with trust the marketplace gets registered but the plugins are not installed ("Plugin ... not cached"). A cloud session starts in a fresh container, so install the plugins in the cloud environment's **setup script** (cloud environment menu, then Edit, then Setup script), which runs when each new session starts:

```
claude plugin marketplace add jimmyl109/my-toolkit
claude plugin install core@my-toolkit
claude plugin install typescript-react@my-toolkit    # only for TS/React projects
npm ci                                               # project deps, so Stop typecheck/format can find tsc and prettier
```

This was verified from a clean state with an untrusted folder and no project settings: both plugins loaded, `rules/common.md` was injected at session start, and all `core:*` / `typescript-react:*` agents were available. It installs at user scope in that container, so core is on for every project opened there; leave out the kit line where it isn't needed.

Requirements: the environment's network policy must allow `github.com` (and your package registry for `npm ci`), `node` must be on `PATH` (the cloud image provides it), and the session needs access to `jimmyl109/my-toolkit` if it is private (not tested). Switch hooks off for all sessions in an environment by setting the `MY_TOOLKIT_*` variables as environment variables in the cloud environment's settings (see below). Plugins have no `version`, so each fresh container installs the current `main`.

## Protection hooks (core)

All hooks live in `plugins/core/hooks/` and are adapted from ECC's `scripts/hooks` (see `SOURCES.md`). A hook that **blocks** exits with code 2 and Claude sees the reason; a hook that **warns** passes a message to Claude (PreToolUse) or to you (Stop) and lets the action proceed.

| Hook id | When | Does | Default |
|---------|------|------|---------|
| *(SessionStart)* | session start / clear / compact | loads `rules/common.md` into context | on |
| `config-protection` | before Write/Edit/MultiEdit | **blocks** edits to existing linter/formatter configs (eslint, prettier, biome, stylelint, markdownlint, oxlint, commitlint and their ignore files). Creating a new config is allowed | on |
| `block-no-verify` | before Bash | **blocks** `--no-verify`, `git commit -n`, `-c core.hooksPath=...` | on |
| `dev-server-block` | before Bash | **blocks** foreground `npm/pnpm/yarn/bun run dev` that would hang the session. Allowed: `run_in_background`, trailing `&`, `nohup ... &`, tmux launchers, and scripts like `dev-docs` | on |
| `commit-quality` | before `git commit` | **blocks** likely secrets (API keys/tokens, private keys) and staged `.env` files; **warns** about `console.log`, `debugger`, TODO without issue, ESLint errors, poor commit messages. Also scans what a chained `git add` will stage and the command text | on |
| `check-console-log` | at Stop | **warns** (message to you) about `console.log` in modified or new JS/TS files | on |
| `stop-typecheck` | at Stop | runs the project's `tsc --noEmit` for TS/JS files edited this turn; on errors **blocks the stop once** so Claude fixes them | on |
| `stop-format` | at Stop | runs the project's Prettier/Biome on files edited this turn | **off** |

Helper (not switchable on its own): `post-edit-accumulator` records the files edited with Write/Edit/MultiEdit for the two Stop hooks and does nothing if both are off. Files created through `Bash` (e.g. `echo > file`) are not tracked.

Not included from ECC: gateguard, continuous learning/observation, telemetry, cost tracking, Plan Canvas, MCP health checks, governance capture, notifications, session-context loading.

### Switching hooks off (or on)

Every hook reads three environment variables. Set them in a project's `.claude/settings.json` (shared) or `.claude/settings.local.json` (just you), or export them in the shell that starts Claude Code:

| Variable | Effect |
|----------|--------|
| `MY_TOOLKIT_DISABLED_HOOKS` | comma-separated hook ids to turn off |
| `MY_TOOLKIT_ENABLE_HOOKS` | hook ids to turn on that ship disabled (`stop-format`) |
| `MY_TOOLKIT_HOOKS=off` | turn off every hook in this plugin (SessionStart rules still load) |

```json
{
  "env": {
    "MY_TOOLKIT_DISABLED_HOOKS": "dev-server-block,check-console-log",
    "MY_TOOLKIT_ENABLE_HOOKS": "stop-format"
  }
}
```

One-off from a shell: `MY_TOOLKIT_DISABLED_HOOKS=commit-quality claude`. Claude Code's own `disableAllHooks` setting also works but turns off *every* hook, including other plugins'. `commit-quality` is one id: switching it off disables both its secret block and its warnings.

### I want to change a lint/formatter config on purpose

`config-protection` stops agents weakening a config to make a check pass, so a deliberate change needs a temporary switch-off:

1. Add `"MY_TOOLKIT_DISABLED_HOOKS": "config-protection"` to the `env` block of the project's `.claude/settings.local.json` (or start Claude with `MY_TOOLKIT_DISABLED_HOOKS=config-protection claude`).
2. Make the change, then remove the setting again. Creating a *brand-new* config file never needs the switch.

### Limits worth knowing

- A PreToolUse hook runs **before** the command. For `git add X && git commit` it scans the files being added and the command text; a secret generated by the same command (`echo $KEY > f && git add f && git commit`) cannot be seen.
- The hooks guard against accidents and agent shortcuts, not a determined bypass: they inspect literal commands, not what generated programs do.
- Stop hooks use the project's own `tsc`/`prettier` (never downloaded). With none installed they stay silent.

## Testing the hooks

```
node tests/hooks/run.js            # builds a throwaway TS project in a temp dir, prints a pass/fail table
node tests/hooks/run.js --offline  # skip `npm install` (typecheck/format cases are skipped)
node tests/hooks/run.js --keep     # keep the temp project for inspection
```

Needs only Node and git (the typecheck/format cases also install `typescript` and `prettier` into the temp project). It exits 1 on any failure, so run it after changing anything under `plugins/core/hooks/`. It feeds each hook realistic hook payloads; for end-to-end checks in a real session use `TESTING.md`.

## Adding a kit

1. Create `plugins/<kit>/.claude-plugin/plugin.json` with `agents/` and `skills/`. Hooks are optional and may only add checks (see the kit rule above).
2. Add an entry to `.claude-plugin/marketplace.json` (entry `name` must equal the manifest `name`).
3. Add a row to `CATALOG.md` and the files to `SOURCES.md`.
4. Run `claude plugin validate .` and `claude plugin validate plugins/<kit>`.

## Always-on context cost

Estimated (characters / 4): core alone **about 1,900 tokens** (rules file about 1,200 + agent/skill descriptions about 700); core + `typescript-react` **about 2,400 tokens**. Agent and skill bodies load only when used, and hooks add tokens only when they emit a message.

## License

MIT (see `LICENSE`). Adapted third-party material is covered by `THIRD_PARTY_NOTICES`.
