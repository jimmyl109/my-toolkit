---
name: typescript-react-standards
description: Condensed TypeScript, React, Next.js and web standards (types, hooks, components, server/client boundaries, testing, security, performance, accessibility). Use when writing or reviewing TypeScript, React, Next.js, tsx or jsx code, components, or hooks, or when asked about project conventions for the web stack.
---

# TypeScript + React + Web Standards

On-demand reference; extends core's `coding-standards`. The project's own lint/format config and existing conventions win over this file.

## TypeScript

**Types**
- Explicit parameter and return types on exported functions, shared utilities, and public class methods; let inference handle obvious locals.
- `interface` for object shapes that may be extended/implemented; `type` for unions, intersections, tuples, mapped types. Prefer string-literal unions over `enum`.
- Avoid `any`. Use `unknown` for external/untrusted input and narrow it; use generics when the type depends on the caller.
- No `!` non-null assertion or `as` cast to silence errors; fix the type or add a runtime check.
- Keep `strict` on; never weaken `tsconfig` strictness to get green.
- In plain JS files, use JSDoc types where a TS migration isn't practical.

**Immutability and errors**
- Update by copy (`{ ...user, name }`, `map`/`filter`); use `Readonly<T>`/`readonly` on inputs.
- `async/await` with `try/catch`; catch as `unknown` and narrow (`error instanceof Error`); never swallow errors; throw `Error` objects only.
- `JSON.parse` of external data goes in try/catch; validate external data with a schema (zod/valibot) at boundaries.
- Await or `.catch` every promise; independent work in `Promise.all`; no `async` callbacks in `forEach`.
- `const` by default, `===` always, no `var`; no `console.log` in committed code (use a logger).

## React

**Files and naming**
- `.tsx` for any file with JSX, `.ts` for logic/hooks/types; tests mirror source (`Foo.test.tsx`).
- Components `PascalCase` (file too); hooks `useCamelCase`; contexts `<Domain>Context` / `<Domain>Provider` / `use<Domain>`; handlers `handleX` inside, `onX` as props; booleans `isX`/`hasX`/`canX`.
- Function components only; no class components in new code; avoid `React.FC`.

**Components**
- Type props with a named `type Props`/`interface`; destructure in the parameter list; type callbacks explicitly.
- Fragments over wrapper `div`s; self-close empty tags; extract multi-line logic out of JSX; early returns for guards.
- Container/presentational split: containers own data and side effects; presentational components are pure.
- Compose with `children`/slots instead of prop drilling past ~3 levels; components over ~200 lines get split.
- Stable keys (ids, never array index for reorderable lists).

**State**
- Local `useState` first; lift only when shared; Context for low-frequency cross-cutting state (theme, auth, locale); external store (Zustand/Jotai/Redux Toolkit) for high-frequency or cross-route state; server data lives in a server-state tool (TanStack Query/SWR/RSC fetch), never copied into client state.
- Never store derived state; compute during render. Put filters, sort, pagination, tabs in the URL.

**Hooks**
- Rules of hooks (top level, same order, only in components/custom hooks); enforce `eslint-plugin-react-hooks` (`rules-of-hooks`, `exhaustive-deps` as errors; never silence without a comment).
- `useEffect` only to sync with external systems. Not for derived state, data transforms, resetting state on prop change (use `key`), or notifying parents (call in the handler).
- Clean up every subscription, interval, listener, and fetch (`AbortController`).
- Don't memoize by default; add `useMemo`/`useCallback`/`React.memo` only for a measured cost, a memoized child's props, or another hook's deps.
- Extract a custom hook when a hook sequence repeats in 2+ components or has a clear name; not for a single caller.
- Functional updaters when new state depends on old (`setX(prev => prev + 1)`).

**Server / Client (Next.js App Router, RSC)**
- Components are Server Components by default; add `"use client"` (line 1) only for state, effects, refs, browser APIs, or handlers. Push the directive down the tree.
- Server → Client: serializable props or `children`. A Client Component can't import a Server Component; pass it as `children`.
- Mark server-only modules with `import "server-only"`; never ship DB clients or secrets to client files.
- Suspense boundaries close to the data, each paired with an error boundary above it.
- Forms: prefer `<form action>` / `useActionState` for submit-driven forms; controlled inputs only when the value drives other UI; use React Hook Form/TanStack Form for complex forms.

## Testing (details in `react-testing`)

- React Testing Library + Vitest (or Jest) + MSW for the network. Query by role, then label, then text; `data-testid` last.
- Assert behavior, not internals: no render counts, no mocking React, no `container.querySelector`. `await` every `userEvent`; use `findBy*`/`waitFor`, never timeouts.
- Coverage targets: utilities ≥90%, hooks ≥85%, presentational ≥80%, containers ≥70%, pages smoke-tested; E2E for critical flows. Avoid DOM snapshots.
- Add `axe` accessibility assertions to component tests.

## Security (checklist; deeper audit via `core:security-reviewer`)

- `dangerouslySetInnerHTML`/`innerHTML`: only with sanitized (allowlist) input, sanitized at the same call site; document the source.
- Validate URL schemes for user-supplied `href`/`src` (block `javascript:`, `data:`); `target="_blank"` needs `rel="noopener noreferrer"`.
- Server Actions and Route Handlers are public endpoints: authenticate and authorize inside them, validate input with a schema, rate-limit sensitive ones.
- Anything with a public env prefix (`NEXT_PUBLIC_*`, `VITE_*`) ships to the browser; never put secrets there.
- Sessions in httpOnly + Secure + SameSite cookies, never `localStorage`; CSRF protection for cookie auth. Hiding UI is not access control; enforce in the API.
- CSP without `unsafe-inline`/`unsafe-eval` for scripts (use nonces); HTTPS and security headers; load third-party scripts async with SRI; audit dependencies before adding UI libraries.
- Don't merge untrusted objects without validation (prototype pollution); don't expose full records or secrets through props to Client Components.

## Performance

- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Bundle budgets (gzipped JS): app page < 300kb, landing page < 150kb. Dynamically import heavy libraries; prefer named/tree-shakeable imports.
- Fetch independent data in parallel; avoid request waterfalls; prefetch likely next routes.
- Images: explicit `width`/`height`, lazy-load below the fold, AVIF/WebP, hero image only as eager/high priority. Fonts: ≤2 families, `font-display: swap`, subset.
- Animate `transform`/`opacity` only; no scroll-handler churn (use `IntersectionObserver`); virtualize lists past ~50 non-trivial rows.
- Avoid inline object/function props to memoized children; split contexts per concern.

## Accessibility and HTML

- Semantic HTML first (`button`, `a`, `nav`, `main`, headings in order); every interactive element keyboard-reachable; `div onClick` is a bug.
- Every input has a label; images have `alt` (`""` if decorative); don't signal state by color alone; manage focus on route change and dialogs; honor `prefers-reduced-motion`.
- CSS: custom properties for design tokens; kebab-case classes or utility classes; mobile-first responsive, test 320/768/1024/1440 with no overflow.

## Review Pointers

For a TS/React change run `typescript-reviewer` and `react-reviewer`, plus core's `code-reviewer` and `security-reviewer` when security-sensitive. Build failures: `react-build-resolver` (React/bundler) or `core:build-error-resolver` (generic).
