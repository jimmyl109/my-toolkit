---
name: security-review
description: Security checklist and patterns. Use when adding authentication or authorization, handling user input or file uploads, working with secrets, creating API endpoints, storing sensitive data, integrating third-party APIs, or implementing payment features.
---

# Security Review

Security checks are never optional. Apply this checklist to any code that crosses a trust boundary. For an independent review of a diff, use the `core:security-reviewer` agent.

## 1. Secrets
- Never hardcode API keys, passwords, tokens, or connection strings; load from environment variables or a secrets manager.
- `.env*` files are gitignored; commit a `.env.example` with placeholders only.
- Fail fast at startup if a required secret is missing.
- A secret that reached git history is compromised: rotate it, don't just delete it.

## 2. Input Validation
- Validate all external input (body, query, headers, files, webhooks, env) at the boundary with a schema; reject by default, allowlist what's valid.
- Validate type, length, range, and format; normalize before comparing.
- File uploads: enforce size limit, extension *and* MIME/content type, store outside the web root with generated names.

## 3. Injection
- SQL/NoSQL: parameterized queries or a safe ORM API only; never string-concatenate user input into queries.
- Shell: avoid shells; pass argument arrays; never interpolate user input into commands.
- Paths: resolve and confirm the result stays inside the intended directory (path traversal).
- Templates/deserialization: never evaluate or deserialize untrusted data with unsafe loaders.

## 4. Authentication & Authorization
- Hash passwords with bcrypt/argon2; compare in constant time; never log or return them.
- Validate tokens fully (signature, expiry, audience/issuer); prefer short-lived tokens; store session tokens in HttpOnly, Secure, SameSite cookies rather than script-readable storage.
- Check authorization on every request, server-side, for the specific resource (not just "is logged in"). Deny by default.
- Where the datastore supports row-level policies, use them as defense in depth.

## 5. XSS & Output Encoding
- Escape output by default; never insert untrusted input as raw HTML. If HTML must be rendered, sanitize with a maintained sanitizer.
- Set a Content-Security-Policy; avoid inline scripts and `eval`.

## 6. CSRF
- State-changing endpoints need CSRF tokens or SameSite cookies (Lax/Strict) plus origin checks.

## 7. Rate Limiting & Abuse
- Rate-limit public endpoints, with stricter limits on login, password reset, search, and other expensive operations.
- Put timeouts and size limits on outbound calls and request bodies.

## 8. Sensitive Data Exposure
- Don't log passwords, tokens, PII, or full request bodies; redact.
- Return generic error messages to clients; keep stack traces and internals in server logs.
- HTTPS everywhere; encrypt sensitive data at rest; collect and retain the minimum.

## 9. SSRF & Outbound Requests
- When fetching a user-supplied URL, allowlist hosts, block private/link-local ranges, and don't follow redirects blindly.

## 10. Dependencies
- Run the ecosystem's audit (`npm audit`, `pip-audit`, `cargo audit`, ...) and fix high/critical findings.
- Commit lockfiles and use them in CI (`npm ci`, etc.); review new dependencies before adding.

## 11. Security Tests
Add tests for the controls above: unauthenticated and wrong-user requests are rejected, invalid input is rejected, rate limits trigger, error responses don't leak internals.

## Pre-Merge / Pre-Deploy Checklist

- [ ] No hardcoded secrets; `.env` ignored
- [ ] All external input validated
- [ ] Queries parameterized; no shell/path injection
- [ ] AuthN and per-resource AuthZ on every protected route
- [ ] Output escaped / sanitized; CSP configured
- [ ] CSRF protection on state-changing routes
- [ ] Rate limiting enabled
- [ ] No sensitive data in logs or error responses
- [ ] HTTPS enforced; CORS restricted to known origins
- [ ] File uploads validated (size, type)
- [ ] Dependencies audited, lockfile committed
- [ ] Security-relevant tests written

When in doubt, treat the input as hostile and the data as sensitive. Reference: OWASP Top 10.
