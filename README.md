# my-toolkit

A personal [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces): a lean alternative to everything-claude-code (ECC). One always-on **core** plugin plus small **kit** plugins that each project enables individually. Nothing is installed globally except what a project asks for.

> Keep code minimal, but tests, review and security checks are never optional.

## Layout

```
.claude-plugin/marketplace.json     marketplace catalog (lists every plugin)
plugins/
  core/                             always on
    .claude-plugin/plugin.json
    agents/                         planner, code-reviewer, security-reviewer, tdd-guide, build-error-resolver
    skills/                         tdd-workflow, security-review, verification-loop, coding-standards, ponytail
    rules/common.md                 condensed common rules (the only always-on text)
    hooks/hooks.json                one SessionStart hook that prints rules/common.md into context
  typescript-react/                 kit: TypeScript / React / Next.js
    agents/  skills/
CATALOG.md                          kits, descriptions, trigger words
SOURCES.md                          where every file came from and what changed
THIRD_PARTY_NOTICES                 MIT notices for ECC and Ponytail
```

## How it works

- **core** is enabled in every project. Its only always-on cost is the `SessionStart` hook, which injects `rules/common.md`; agents and skills cost just their short descriptions until used.
- **Kits** add stack-specific agents and skills only. They never duplicate core and may call core's agents (e.g. `core:code-reviewer`). Core never references a kit.
- Components are namespaced by plugin: `core:planner`, `typescript-react:react-reviewer`.
- Plugins have no `version`, so every pushed commit is an update.

## Enable in a project

Add to the project's `.claude/settings.json`, commit it, and Claude Code will offer to install the marketplace and plugins when the folder is trusted:

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

Alternatives: `claude plugin marketplace add jimmyl109/my-toolkit` then `claude plugin install core@my-toolkit --scope project` (writes the same settings), or enable `core@my-toolkit` once in `~/.claude/settings.json` to have it everywhere. Run `/reload-plugins` or restart after changes.

## Adding a kit

1. Create `plugins/<kit>/.claude-plugin/plugin.json` with `agents/` and `skills/` (no hooks or always-on rules).
2. Add an entry to `.claude-plugin/marketplace.json` (entry `name` must equal the manifest `name`).
3. Add a row to `CATALOG.md` and the files to `SOURCES.md`.
4. Run `claude plugin validate .` and `claude plugin validate plugins/<kit>`.

## License

MIT (see `LICENSE`). Adapted third-party material is covered by `THIRD_PARTY_NOTICES`.
