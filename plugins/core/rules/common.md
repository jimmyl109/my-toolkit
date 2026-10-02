# Core Rules (always on)

Keep code minimal, but tests, review and security checks are never optional.

## Workflow
1. **Reuse first.** Before writing new code, search this codebase, then the stdlib, then existing dependencies. Prefer a proven library over hand-rolled utilities.
2. **Plan non-trivial work.** For features spanning several files or architectural changes, use the `core:planner` agent first.
3. **Test first.** New behavior and bug fixes start with a failing test (`core:tdd-guide`, skill `tdd-workflow`). Fix the implementation, not the test, unless the test is wrong.
4. **Review after writing.** Run `core:code-reviewer` on every meaningful change. Fix CRITICAL and HIGH findings before commit.
5. **Verify before done.** Run build, types, lint, and tests (skill `verification-loop`). Never claim success without running the checks; report failures and skipped steps plainly.
6. **Broken build?** Use `core:build-error-resolver` for minimal fixes only.

## Code Style
- Simplest thing that works (KISS); no speculative abstractions (YAGNI); extract duplication once it is real (DRY).
- Prefer immutability: return new values instead of mutating inputs.
- Descriptive names; named constants instead of magic numbers; booleans read as claims (`isReady`).
- Functions under ~50 lines, nesting under 4 levels (early returns), files focused (typically 200-400 lines, 800 max; tests/generated code may exceed it).
- Organize by feature/domain, not by file type.
- Comments explain why, not what. No commented-out code, no stray debug output.
- Match the surrounding code's style and the project's conventions over personal taste.

## Error Handling & Input
- Handle errors explicitly; never swallow them silently.
- User-facing messages are friendly and generic; server-side logs carry full context.
- Validate at system boundaries (user input, API responses, files) with schemas where available; fail fast.

## Testing
- Minimum 80% coverage; unit + integration tests always, E2E for critical flows.
- Arrange-Act-Assert; names describe behavior ("returns empty array when no match").
- Tests are independent and deterministic; mock external services, not the unit under test.
- Test edge cases: empty/null, boundaries, error paths, concurrency.

## Security (check before every commit)
- No hardcoded secrets; use env vars or a secret manager; rotate anything exposed.
- Validate all inputs; parameterize queries; escape output; protect state-changing routes (CSRF).
- Authenticate and authorize on the server for every protected resource; rate-limit public endpoints.
- Error messages and logs must not leak secrets or PII.
- On any security finding: stop, use `core:security-reviewer`, fix CRITICAL issues first. Skill: `security-review`.

## Code Review
- Review is mandatory before merge and for any change to auth, payments, user data, or architecture.
- Severity: CRITICAL (security/data loss) blocks; HIGH (bug/significant quality) should be fixed; MEDIUM consider; LOW optional.
- Before requesting review: CI green, conflicts resolved, branch up to date.

## Git
- Commit format `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci); optional body explains why.
- Small, focused commits. Never force-push shared branches or commit secrets.
- PRs: summarize all commits (not just the last), `git diff base...HEAD` to review, include a test plan.

## Patterns
- Hide data access behind a repository-style interface so business logic doesn't depend on storage details.
- Use one consistent API response envelope: status/success, data (nullable on error), error (nullable on success), pagination metadata.
- Avoid N+1 queries, unbounded queries, and missing pagination; cache expensive work only when measured.

## Skills on demand
`coding-standards` (quality conventions), `ponytail` (minimal-solution discipline), `verification-loop`, `tdd-workflow`, `security-review`. Kit plugins add stack-specific agents and skills.
