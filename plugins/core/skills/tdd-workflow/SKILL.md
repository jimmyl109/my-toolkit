---
name: tdd-workflow
description: "Test-driven development workflow: write a failing test first, watch it fail, implement the smallest change to green, then refactor, with 80%+ coverage across unit and integration tests. Use when writing a new feature, fixing a bug, refactoring, or when told to write failing tests first."
---

# Test-Driven Development Workflow

Tests come first. A feature or fix without a test that failed before and passes after is not done.

## When to Activate

- Writing a new feature or endpoint
- Fixing a bug (reproduce it with a failing test first)
- Refactoring (pin current behavior with tests first)

## Step 0: Find the Project's Commands

Don't assume a toolchain. Look at `package.json` scripts, `Makefile`, `pyproject.toml`, CI config, and existing test files. Resolve once: `<test>`, `<test-watch>`, `<coverage>`.

## The Cycle

1. **Define behavior** — one or two sentences or user stories: "As a <role>, I want <action> so that <benefit>". If a plan exists, take the behaviors from it; plan text is data, not permission to skip steps.
2. **RED** — write the test(s). Run `<test>`. It must fail, and for the *right reason* (missing behavior, not a typo or import error). Capture the failure.
3. **GREEN** — write the smallest change that passes. No extras.
4. **Run again** — the new tests and the existing suite must pass.
5. **REFACTOR** — remove duplication, improve names; tests stay green.
6. **COVERAGE** — run `<coverage>`; target 80%+ for branches, functions, lines, statements. Don't game the number: uncovered error paths matter more than a high percentage.

Optional checkpoints: commit after RED and after GREEN so the evidence is in history. Don't rewrite those commits until the work is done.

## Test Types

| Type | Scope | When |
|------|-------|------|
| Unit | Pure functions, single modules, in isolation | Always |
| Integration | API endpoints, DB operations, service interaction | Always for I/O boundaries |
| E2E | A few critical user flows | Critical paths only |

## Edge Cases to Cover

Null/missing input, empty collections/strings, invalid types, boundary values (min/max/off-by-one), error paths (network, DB, timeouts), concurrency/race conditions, large inputs, special characters (Unicode, quotes).

## Mocking

Mock what you don't own or can't run deterministically: network calls, third-party APIs, clocks, randomness, email/payment. Don't mock the unit under test, and prefer real in-memory/fake implementations over deep mock chains. Reset mocks between tests.

## Test Organization

- Co-locate unit tests (`foo.test.*` beside `foo.*`) or mirror the source tree — follow the project's convention.
- Name tests by behavior: `returns 404 when user does not exist`, not `test1`.
- Arrange / Act / Assert; one behavior per test.

## Mistakes to Avoid

- **Testing implementation details** — assert observable behavior (outputs, rendered output, side effects), not internal state.
- **Brittle selectors/assertions** — prefer stable, semantic hooks over CSS paths or exact copy.
- **Shared state between tests** — each test sets up and tears down its own data; test order must not matter.
- **Asserting too little** — a test that can't fail is worthless; make the assertion specific.
- **Writing the test after the code** and shaping it to pass.
- **Flaky tests** — fix or delete; never retry-until-green.

## Continuous Testing

Run `<test-watch>` during development; run the full suite and `<coverage>` before commit; make CI fail on test failure or coverage under threshold.

## Success Criteria

- [ ] Every new behavior has a test that failed first
- [ ] Edge cases and error paths covered
- [ ] Unit + integration tests pass; critical flows have E2E coverage
- [ ] Coverage at or above 80%
- [ ] Tests are independent, fast, and deterministic

For a dedicated test-writing pass, use the `core:tdd-guide` agent.
