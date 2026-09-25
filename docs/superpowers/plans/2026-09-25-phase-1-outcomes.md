# Phase 1 — Outcomes and Carry-Forward

**Completed:** 2026-09-25 on branch `phase-1-auth`
**Plan:** `2026-09-23-phase-1-auth-module.md`
**Spec:** `../specs/2026-09-22-learnbase-api-design.md`

## What shipped

All eleven auth endpoints, against the existing contract:

| | |
|---|---|
| Signup | `POST /auth/signup/admin`, `/auth/signup/learner` |
| Session | `POST /auth/login`, `GET /auth/check-auth`, `POST /admin/auth/logout` |
| Verification | `POST /auth/verify-email`, `/auth/resend-token` |
| Recovery | `POST /auth/forgot-password`, `/auth/reset-password/:id` |
| Account | `POST /auth/change-password`, `PUT /auth/update` |

Plus: JWT with database re-validation, bcrypt at 12 rounds, Brevo email via Nodemailer,
Cloudinary profile uploads, and per-IP rate limiting.

**113 tests in `apps/api`, 18 in `packages/types`.** Root build, test, typecheck and lint all pass.

## Vulnerabilities found and fixed during the build

These were not in the plan. Each was found by a reviewer probing beyond the happy path,
and each is the kind that passes every functional test.

- **Login timing oracle.** Response bodies were byte-identical for "unknown email" and
  "wrong password" — but bcrypt only ran when a user existed, so the two answered in
  1.7ms and 227ms. Anyone could enumerate the user list with a stopwatch. Fixed by
  comparing against a dummy hash on every failure path; the gap is now 0.21ms.
- **The same bug at forgot-password.** Found only by the whole-branch review, because
  each task-scoped review saw one endpoint. It returned instantly on a miss and awaited
  the mailer on a hit: a 309ms gap. Fixed by moving the send off the response path.
  Fixing a vulnerability class at one site does not fix it at the others.
- **Parser differential in the password-reset allowlist.** `assertAllowedResetUrl`
  validated the *parsed* URL and returned the caller's *raw* string.
  `https://learner.example.com\@evil.test/reset` passes a WHATWG origin check while
  every RFC 3986 parser reads the host as `evil.test` — so a victim would have received
  a genuine email from this domain carrying a live reset token pointing at the attacker.
  Fixed by returning `parsed.href`; re-verified across 50 payloads with zero parser
  disagreement.
- **Password changes did not invalidate existing tokens.** A stolen token survived the
  owner's own recovery reset for its full 7 days. Fixed with `passwordChangedAt`,
  checked against the token's `iat`.

## Must be addressed in Phase 2

- **`DUMMY_HASH` is computed at module load** (~229ms) in every test file that imports
  the auth service — about 5% of suite runtime today, and it scales with every new suite
  that mounts `createApp`. Move it behind a memoised lazy getter in Phase 2's first task.
- **`requireRole` has no production caller yet.** Phase 2's admin-only track and course
  routes are its first real use. Test it there as if it were new.
- **Do not copy `updateProfile`'s `Object.entries` assignment loop** into Track/Course
  services without an equally tight allowlist schema. It is safe only because
  `updateProfileSchema` drops everything it does not name.
- **A flaky test, ~7% of runs:** `auth.signup.test.ts` "rejects a weak password"
  occasionally returns 404 instead of 400. Not attributable to product code — the lead is
  a supertest ephemeral-port collision with `rateLimit.test.ts`'s bare express app, which
  has no `notFound` handler. First diagnostic step: assert on the 404's body, which
  distinguishes our envelope from express's default.

## Deferred, with reasons

- **`change-password` requires no current password.** An authenticated session can change
  the password without re-authenticating. Not fixed because the spec's contract is
  `{password, confirmPassword}` and neither frontend form has the field — adding it breaks
  both. The harm was *permanent* takeover only because tokens survived the change; that is
  now fixed, so a victim's reset evicts the attacker. Revisit alongside the httpOnly-cookie
  migration in Phase 6, which shares the same threat model.
- **A learner can set `disabled: true` on themselves** and lock themselves out with no
  self-service route back. Contract-faithful — spec §6 lists the field and both frontends
  send it — so it needs an admin unlock path rather than a schema change. Phase 6.
- **JWT `iat` skew is 1 second**, which admits a token issued up to ~2s before a password
  change; a token with no `iat` bypasses the check. Neither is exploitable (`signToken`
  always stamps `iat`), but tightening to 0 and failing closed is a two-line follow-up.
- **Signup creates the user before sending the verification email**, with no rollback. A
  mailer failure leaves an unverified account and returns 500. Recoverable — login does not
  require verification, so the user can log in and call `resend-token` — but it is a
  confusing dead end.
- **A `baseResetURL` containing a query string** would put the token in the query rather
  than the path, where it can leak via `Referer` and access logs. Unreachable today: both
  frontends send a plain path and the origin allowlist constrains the rest.

## Outstanding before Phase 5 cutover

- ~~No real email has ever been sent.~~ **DONE 2026-09-25.** The live round-trip was
  completed against real Brevo and real Atlas: `POST /auth/signup/learner` returned 201 with
  no field leaks, Brevo accepted the send, the email was **confirmed delivered to a real
  inbox**, and verification succeeded with the emailed code. The test user was deleted
  afterwards. Note the sender is a gmail.com address — that worked, but a custom verified
  domain is worth setting up before production volume, since free-provider senders are the
  usual cause of DMARC failures.
- **`TRUST_PROXY` must match the host's proxy depth.** It defaults to 0. Behind a reverse
  proxy (Vercel, Render, Railway, Fly) set it to 1, or every request shares one IP and all
  three rate limiters collapse into a single global bucket — one user could lock out
  everyone's login. Setting it to `true` is the opposite failure: any client could then
  spoof `X-Forwarded-For` and bypass limiting entirely.
- **`CLIENT_ADMIN_URL` and `CLIENT_LEARNER_URL` must exactly match the deployed
  `VITE_CLIENT_URL` values.** They are the allowlist for password-reset links, not just
  CORS. A mismatch makes every reset request 400. The server refuses to boot without them
  when `NODE_ENV=production`.
- **The learner 401 interceptor still throws.** `apps/learner/src/lib/axios.ts` reads
  `error.response.data[0]`, a bare array, while this API returns `{ success, errors }`.
  It must be made defensive during cutover, not after.
