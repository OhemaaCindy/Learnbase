# LearnBase API

Express 5 + Mongoose backend for the LearnBase admin and learner portals.

## Running locally

1. `cp .env.example .env` and fill in the values.
2. From the repo root: `pnpm install`
3. `pnpm --filter @learnbase/api dev` — serves on http://localhost:5050

`GET /api/health` should return `{"success":true,"message":"LearnBase API is running"}`.

The server validates its required environment variables before connecting to
MongoDB and exits with a non-zero status and a message naming the missing
variable(s) if any are absent — see [Environment](#environment) for which
ones are required and when.

## Environment

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development`, `production`, or `test`. Controls the required-variable check below, rate-limiter bypass in tests, and other environment-sensitive behavior. |
| `PORT` | Defaults to 5050. Port 5000 is taken by AirPlay on macOS. |
| `MONGODB_URI` | Connection string. **Required always.** |
| `JWT_SECRET` | Signing secret. **Required always.** Use a long random string. |
| `JWT_EXPIRES_IN` | Token lifetime. Defaults to `7d`. |
| `CLIENT_ADMIN_URL`, `CLIENT_LEARNER_URL` | CORS allowlist **and** the allowlist for password-reset links. **Required when `NODE_ENV=production`** (optional in development, where they fall back to `http://localhost:5173` / `http://localhost:5174`). |
| `TRUST_PROXY` | Express `trust proxy` setting. See [Trust proxy](#trust-proxy) below. Defaults to `0`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Brevo SMTP relay credentials, used to send verification and password-reset email. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image hosting, used for profile picture uploads. |
| `RATE_LIMIT_IN_TESTS` | Test-only escape hatch used by `src/shared/rateLimit.test.ts` to exercise the limiters under `NODE_ENV=test`. Never set this in a real `.env`. |

### Why `CLIENT_ADMIN_URL` / `CLIENT_LEARNER_URL` are security-relevant

`POST /auth/forgot-password` accepts a `baseResetURL` from the client and
refuses any origin that isn't `CLIENT_ADMIN_URL` or `CLIENT_LEARNER_URL`.
Without that check, anyone could have our server email a victim a reset
link pointing at an attacker-controlled site, which could be used to
harvest the reset token. Because this is a production-grade security
control and not just a development convenience, the server refuses to boot
under `NODE_ENV=production` unless both variables are explicitly set — it
will not silently fall back to the localhost defaults it uses in
development.

### Trust proxy

`app.set("trust proxy", ...)` is read from `TRUST_PROXY` and controls how
Express derives the client's IP address (`req.ip`), which the login,
email and OTP rate limiters key on. Set it to the number of reverse
proxies between the internet and this process:

- `0` — the API is reached directly (no proxy in front of it). This is the
  default and is correct for most local development.
- `1` — the API sits behind exactly one reverse proxy (e.g. Vercel, Render,
  Railway, Fly).

Getting this wrong is a real security failure in both directions:

- Leaving it at `0` behind a real proxy makes every request appear to come
  from the proxy's own IP, so all clients share a single rate-limit bucket
  — one aggressive or malicious client can lock every other user out of
  login.
- Setting it to `true` (unconditional trust) lets any client spoof the
  `X-Forwarded-For` header and pick whatever IP the rate limiter sees,
  bypassing the limiter entirely.

Always set `TRUST_PROXY` to match the actual number of proxy hops in front
of the deployed instance — never leave it at a value that under- or
over-trusts the network path.

## Tests

`pnpm --filter @learnbase/api test` — runs against an in-memory MongoDB. Email,
image upload and (later) payments are reached only through adapters in
`src/shared/adapters/`, which tests replace with fakes. No test touches the network.

## Layout

    src/modules/auth/    routes, controller, service, model, schemas, tests
    src/shared/          middleware, adapters, errors, db, rate limiting
