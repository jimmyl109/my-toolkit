---
name: verification-loop
description: Run a six-phase verification of finished work — build, type check, lint, tests with coverage, security scan, and diff review — then produce a PASS/FAIL report. Use after completing a feature or refactor, before creating a PR, or when quality gates must pass.
---

# Verification Loop

Run these phases in order after a feature or significant change, and before opening a PR. Stop and fix at the first failing blocking phase.

Use the project's own commands (check `package.json` scripts, `Makefile`, `pyproject.toml`, CI config); the examples below are illustrative.

## Phase 1: Build
Run the project's build (`npm run build`, `cargo build`, `go build ./...`, ...). If it fails, STOP and fix before continuing (the `core:build-error-resolver` agent can do this with minimal diffs).

## Phase 2: Type Check
Run the type checker if the project has one (`tsc --noEmit`, `pyright`, `mypy`, ...). Fix all errors in code you touched.

## Phase 3: Lint
Run the linter/formatter check (`eslint`, `ruff check`, `golangci-lint`, ...). Fix errors; note warnings.

## Phase 4: Tests
Run the full suite with coverage. Report total / passed / failed and coverage %. Target 80%+; a failing test is a blocker, never "flaky, ignore".

## Phase 5: Security Scan
- Grep the diff for hardcoded secrets (`sk-`, `api_key`, `password =`, tokens, private keys).
- Look for leftover debug output (`console.log`, `print`, `debugger`).
- Run the dependency audit (`npm audit`, `pip-audit`, ...) if dependencies changed.
- For auth, input handling, or API changes, run the `core:security-reviewer` agent.

## Phase 6: Diff Review
```bash
git diff --stat
git diff
```
Check each changed file for unintended changes, missing error handling, unhandled edge cases, and missing tests. For a deeper pass use the `core:code-reviewer` agent.

## Output

```
VERIFICATION REPORT
===================
Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY / NOT READY] for PR

Issues to fix:
1. ...
```

Report faithfully: if a phase was skipped (no linter, no type checker), say so rather than marking it PASS.

## Long Sessions

Re-run after each completed function/component or major change, not only at the end.
