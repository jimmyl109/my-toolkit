---
name: coding-standards
description: Language-neutral coding conventions for naming, readability, immutability, error handling, function and file size, comments, and code-smell detection. Use when writing or reviewing code quality and no stack-specific standards skill applies.
---

# Coding Standards

Cross-project baseline. Stack-specific idioms belong in a kit's own skills; match the project's existing conventions first.

## Principles

1. **Readability first** — code is read far more than written. Clear names beat comments; self-documenting code beats clever code.
2. **KISS** — the simplest solution that works. No premature optimization.
3. **DRY, but not too early** — extract on the third repetition, and only when the copies change together.
4. **YAGNI** — don't build for hypothetical needs; no speculative abstractions or config.

## Naming

- Variables: descriptive nouns (`marketSearchQuery`, `isUserAuthenticated`), not `q`, `tmp`, `data`.
- Functions: verb-noun (`fetchMarketData`, `calculateSimilarity`); predicates read as questions (`isValid`, `hasAccess`).
- Booleans: `is/has/can/should` prefix. Constants: named, not magic numbers (`MAX_RETRIES = 3`).
- Follow the language's casing convention and keep a single term per concept.

## Immutability (default)

Prefer creating new values over mutating inputs: copy-and-update, `map/filter`, persistent structures, `const`/`final`/`readonly`. Mutate only locally and deliberately, for measured performance reasons.

## Functions and Files

- Functions under ~50 lines, one responsibility, at most ~3 parameters (use an options object beyond that).
- Nesting at most 3-4 levels: use early returns/guard clauses and extract helpers.
- Files typically 200-400 lines, 800 max; organize by feature/domain, not by type alone.
- Pure functions where possible; isolate I/O at the edges.

## Error Handling

- Handle errors at the level that can do something about them; otherwise let them propagate.
- Never swallow errors (empty `catch`); log with context or rethrow.
- Fail fast on invalid input; use specific error types/codes, not bare strings.
- Don't leak internals to users; do keep enough context for debugging.
- Async: await everything you start, run independent work in parallel, handle rejections, set timeouts on external calls.

## Types and Validation

Use the language's type system fully (no untyped escape hatches without a reason). Validate untrusted data at boundaries; trust it inside.

## Comments

- Explain **why**, not what. Document public APIs (params, returns, errors) in the language's doc-comment style.
- Delete commented-out code. TODOs reference an issue.

## API Design (when writing services)

- Resource-oriented REST, plural nouns, correct verbs and status codes; consistent response envelope; paginate list endpoints; validate input with schemas; version breaking changes.

## Performance (measure first)

Avoid obvious waste (N+1 queries, unbounded queries, repeated expensive computation, O(n²) over large data); select only needed columns; cache with clear invalidation. Don't optimize without evidence.

## Tests

Arrange / Act / Assert; descriptive names ("returns empty list when no matches"); see `tdd-workflow`.

## Code Smells

| Smell | Fix |
|-------|-----|
| Long function (>50 lines) | Split into focused functions |
| Deep nesting (>4) | Early returns, extract helpers |
| Magic numbers/strings | Named constants |
| Duplicated logic | Extract shared function (rule of three) |
| Dead / commented-out code | Delete it (git remembers) |
| God object / large file | Split by responsibility |
| Flag arguments, boolean traps | Separate functions or named options |
| Leaky abstractions | Hide implementation details behind a clear interface |

**Consistency with the codebase beats personal preference.**
