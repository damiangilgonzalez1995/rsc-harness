# Before publishing — the 10 holes

A project built fast with AI ships the same ten holes again and again. This is a starting
point, **not an audit** (the audit is [`hardening`](../../hardening/SKILL.md)). Run it before
publishing and again before every important launch, about once a month.

For each point: what goes wrong, how to **prove** it is closed (a command, a request, a query —
never "looks fine"), and where the long version lives.

| # | Hole | Prove it is closed |
|---|---|---|
| 1 | **Rate limiting** | Fire 20–50 requests in a few seconds at login, OTP, signup, search and any endpoint that costs money (LLM, email, SMS). Expect `429` well before the end. |
| 2 | **Keys out of the code** | `gitleaks dir . --redact`; `git log -p -S"sk-" --all` for the history; `grep -rn "process.env" src` only reads names, never literals. `.env` is in `.gitignore` and not in `git ls-files`. |
| 3 | **Production secrets in the platform** | The values live in Vercel / Supabase / GitHub Actions secrets, not in the repo or in a chat. Only `NEXT_PUBLIC_*` (or the framework's public prefix) reaches the browser: check that no secret carries it. |
| 4 | **Limits per IP (and per identity)** | The limiter keys on IP **and** on user/session. Behind a proxy, it reads the real client IP (trusted `X-Forwarded-For` hop), not the proxy's. In-memory counters break with more than one replica: use Redis/KV. |
| 5 | **Validated inputs, parameterized queries** | Every body, query and param passes a schema (Zod `.strict()`, Pydantic, validator) at the boundary. No string-built SQL: `grep -rnE "(query|execute)\(.*(\+|\\$\{)"`. Send `'; --` and `<script>` and see a `400`, not a `500`. |
| 6 | **Validation on the server** | The browser validating is UX. Re-send the request by hand (`curl`, DevTools "Copy as cURL") with the field the form would have blocked. The server must refuse it. Server Actions and API routes are public. |
| 7 | **RLS: each user sees only their data** | Every table exposed to the client has RLS **on** and a policy per operation. Log in as user A, request user B's row id: expect empty/`403`. `service_role` never ships to the browser. |
| 8 | **Passwords hashed, data encrypted** | Argon2id (or bcrypt cost ≥ 12), never SHA-256/MD5, never plain. HTTPS only (HSTS). Sensitive columns (tokens, ids, health/payment data) encrypted at rest, and never written to logs. |
| 9 | **Sessions that expire** | Short-lived access token, refresh rotation, `HttpOnly` + `Secure` + `SameSite` cookie, logout invalidates server-side. Check: a token from yesterday is rejected. |
| 10 | **CORS only with your domain** | `Access-Control-Allow-Origin` is an explicit allowlist, never `*` with credentials. Check: `curl -H "Origin: https://evil.example" -I <api>` must not echo that origin back. |

## The connection map (what each side may be trusted with)

```
Browser ──request──▶ Server ──query──▶ Database
  │  validated here      │  validate AGAIN here     │  RLS decides here
  └─ UX only             └─ the real gate           └─ last line of defence
```

An attacker never uses your browser: they replay or forge the request. Every check that lives
only in the left box is decoration. Trust nothing that crossed the network; re-check identity,
ownership and shape at the server, and let the database refuse what the server forgot.

## How to use it in a task

- **Writing code** that touches auth, an endpoint, a table or a secret: name which of the ten the
  change affects and close it in the same change, with the proof above.
- **Reviewing a diff** (`code-review`): any new route, table, env var or form must show its
  matching rows. A route with no rate limit and no server validation is a finding, not a nit.
- **Specifying a feature** (`to-spec`): the "Security" decisions section lists the rows that apply
  and the ones that explicitly do not.
- **Found a hole:** rotate the credential first, then fix the code, then add the test that fails
  without the fix.

Detail per topic: [`owasp-by-stack.md`](owasp-by-stack.md), [`authn-authz.md`](authn-authz.md),
[`secrets-and-supply-chain.md`](secrets-and-supply-chain.md).
