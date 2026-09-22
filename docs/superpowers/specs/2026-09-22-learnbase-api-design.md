# LearnBase API — Design Spec

**Date:** 2026-09-22
**Status:** Approved, ready for implementation planning

## Summary

LearnBase is an e-learning platform with two React frontends — an admin dashboard
and a learner portal — that currently share a third-party API at
`https://tmp-se-projectapi.azurewebsites.net/api`. This spec designs a replacement
backend, owned by us, that implements the existing contract exactly, plus the
monorepo that will hold all three applications.

The guiding constraint: **the frontends already define the contract.** Every path,
payload and response shape is pinned down by `src/constants/api-endpoints.ts`, the
`src/services/` layer and the `src/types/` files in both apps. The API is built to
satisfy that contract so the cutover is a configuration change, not a rewrite.

## Goals

- Replace the shared Azure API entirely with a backend we own and can evolve.
- Consolidate the two separately-deployed repos into one monorepo.
- Make the API contract a shared, compile-checked artifact rather than duplicated
  and drifting type definitions.
- Cut over without a flag day: every phase leaves both frontends working.

## Non-goals

- Redesigning the frontends. UI changes are limited to what the cutover requires.
- A separate enrollment subsystem. Invoices carry enrollment state (see Data model).
- Refactoring unrelated frontend code.

---

## 1. Current state

### Applications

| | `learnbase-admin` | `learnbase-learner-portal` |
|---|---|---|
| Role | Admin dashboard | Learner-facing site |
| Stack | React 19, Vite 7, TS 5.8, Tailwind 4, TanStack Query, react-hook-form + zod | same |
| Git remote | `OhemaaCindy/LearnBase-Admin-Portal` | `OhemaaCindy/learnBase-learner-portal` |
| Deploy | Vercel | Vercel |

Each app is an independent git repository with its own Vercel project. Neither is
a subdirectory of a parent repo today.

### How the backend is currently wired in

Two places, both of which must change at cutover:

1. `VITE_SERVER_URL` in each app's `.env`.
2. The `rewrites` block in each app's `vercel.json`, which proxies `/api/*` to the
   Azure host.

### Contract conventions in force

- MongoDB document shapes: `_id`, `__v`, `createdAt`, `updatedAt`.
- JWT bearer token in the `Authorization` header; the client stores it in a
  `token` cookie via `js-cookie`.
- `multipart/form-data` for all image uploads (tracks, courses, profile images).
- Paystack for payments: `paystackReference`, `paystackCallbackUrl`,
  `transactionUrl`, `paystackTransactionId`.
- Email-based OTP verification and password reset.
- Uniform error envelope: `{ success: false, errors: [{ message }] }`.

### Defects found in the existing code

These were discovered while deriving the contract and are addressed explicitly
later in this spec rather than carried forward silently.

1. **Duplicate interface declarations.** `types/track.type.ts` declares
   `export interface Track` four times in one file; `courses.types.ts` does the
   same for `Course`, `Admin` and `Track`; `types.ts` does it for `User`.
   TypeScript silently merges all declarations, so the effective type is the union
   of every field. It compiles, but no one can tell what shape a `Track` has.
2. **Token fields leaked to the client.** `CheckAuthResponse` returns
   `verificationToken`, `resetPasswordToken` and both expiry timestamps on the user
   object. Any valid session can therefore read the means to reset that account's
   password. Neither frontend reads these fields.
3. **Learner 401 interceptor expects the wrong shape.**
   `learnbase-learner-portal/src/lib/axios.ts` calls
   `error.response.data[0].toLowerCase()` — a bare array of strings — while every
   other path expects `{ success, errors }`. Against the standard envelope this
   throws a `TypeError` inside the interceptor and swallows the real error.
4. **Learner portal logs out via the admin path.** Its `AUTH.logout` is
   `/admin/auth/logout`.
5. **`checkAuth` is missing its leading slash** (`"auth/check-auth"`) in both apps.
6. **Contract gaps.** Admin's `INVOICES.updateInvoice` is an empty string, and
   `Track.ratings` exists on the type with no endpoint behind it.
7. **Type drift between apps.** The admin `User` has `contact`; the learner `User`
   does not.

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Full replacement of the Azure API | Own the data and the roadmap |
| Stack | Express + Mongoose + MongoDB | Matches `_id`/`__v` shapes; zero frontend type changes |
| Monorepo tooling | pnpm workspaces + Turborepo | Strict dependency isolation, cached task pipelines |
| Repo consolidation | New repo, both histories preserved via subtree merge | Old repos stay untouched as a fallback |
| Contract fidelity | Match exactly, then fix quirks in a later phase | Lets the swap be verified before anything else changes |
| API structure | Feature modules | Six clear feature areas; each module is small and self-contained |
| Testing | Vitest + Supertest + `mongodb-memory-server` | Proves each endpoint's contract without external accounts |
| External services | Cloudinary, Paystack, SMTP mailer, MongoDB Atlas | All accounts already available |

---

## 3. Monorepo structure

```
learnbase/
├── package.json                  # private root, packageManager: pnpm
├── pnpm-workspace.yaml           # apps/*, packages/*
├── turbo.json                    # dev · build · test · lint · typecheck
├── .env.example
├── docs/superpowers/specs/
├── apps/
│   ├── admin/                    # subtree of LearnBase-Admin-Portal
│   ├── learner/                  # subtree of learnBase-learner-portal
│   └── api/                      # new Express backend
└── packages/
    ├── types/                    # @learnbase/types — the API contract
    └── tsconfig/                 # @learnbase/tsconfig — shared bases
```

### History-preserving import

For each existing repo:

```
git remote add <name> <url>
git fetch <name>
git merge -s ours --no-commit --allow-unrelated-histories <name>/<branch>
git read-tree --prefix=apps/<dir>/ -u <name>/<branch>
git commit
```

Every past commit survives under the new path. The nested `.git` directories are
removed afterwards. The original repos are left untouched as a rollback path.

### `packages/types`

The contract is currently duplicated across both apps and already drifting. The
shared package defines each type **once**, and `apps/api` imports the same types
it serves — so a response that does not match what a frontend expects becomes a
compile error rather than a runtime surprise.

This package carries **response types only**. Request validation stays separate:
the frontend zod schemas validate `File` instances, which do not exist in Node, so
the API keeps its own zod schemas. That is the clean boundary between the two.

The duplicate-declaration defect (§1.1) and the drift between the two apps' copies
(§1.7) are both fixed here by construction.

### Deployment

Two Vercel projects pointed at the new repo with Root Directory `apps/admin` and
`apps/learner`, using `turbo-ignore` as the Ignored Build Step so a backend-only
commit does not rebuild both frontends. The API deploys separately.

---

## 4. Data model

Four collections. Mongoose supplies `_id`, `__v` and, with `timestamps: true`,
`createdAt`/`updatedAt` — exactly the shape the frontend types expect.

### `users`

One collection for both roles, discriminated by `role: "Admin" | "Learner"`. Both
portals authenticate through the same `POST /auth/login`, so they must share it.

```
firstName, lastName, email (unique, lowercased),
password (bcrypt, select: false),
role, contact, isVerified,
verificationToken, verificationTokenExpiresAt,
resetPasswordToken, resetPasswordExpiresAt,
lastLogin, profileImage, description, location, disabled
```

Admin signup includes `contact`; learner signup does not.

### `tracks`

```
admin (ref User), name, price (Number), instructor,
duration (String), image (Cloudinary URL), description,
ratings (subdocument array)
```

`courses` is a **virtual populate** over `courses.track`, not a stored array, so
the two stay in sync automatically. `ratings` is modelled as a real subdocument
array — empty in the current contract — so the phase 6 ratings endpoints have
somewhere to land.

**`toJSON: { virtuals: true }` applies to this schema only.** The frontend `Track`
has both `_id` and `id`; `Course` and `Admin` have only `_id`. That asymmetry is
Mongoose's `id` virtual, and reproducing it faithfully means enabling virtuals
per-schema rather than globally.

### `courses`

```
admin (ref User), track (ref Track), title, image, description
```

### `invoices`

```
learner (ref User, nullable), track (ref Track),
amount (Number), status: "pending" | "paid" | "unpaid",
dueDate, paystackReference (unique, sparse),
paystackTransactionId, paidAt
```

`learner` is nullable by design — the admin invoice type declares
`learner: Learner | null`, which occurs when an admin raises an invoice directly
rather than a learner self-enrolling.

### No `enrollments` collection

`POST /enrollments` creates an invoice and a Paystack transaction and returns
`{ transactionUrl, invoice }`. There is no `GET /enrollments` anywhere in either
frontend, and `EnrolledCourseCard` is purely presentational with hardcoded
illustrations. Enrollment state is read back from `GET /invoices`: an invoice with
`status: "paid"` **is** the enrollment record.

Split this out when enrollment state must exist independently of payment —
progress tracking, completion, certificates. Building it now would create a
collection nothing queries.

---

## 5. API structure

Feature modules under `apps/api/src/`:

```
src/
├── modules/
│   ├── auth/         auth.routes.ts · auth.controller.ts · auth.service.ts
│   │                 user.model.ts · auth.schema.ts · auth.test.ts
│   ├── tracks/
│   ├── courses/
│   ├── learners/
│   ├── invoices/
│   ├── enrollments/
│   └── payments/
├── shared/
│   ├── middleware/   authenticate · requireRole · upload · errorHandler
│   ├── adapters/     cloudinary.ts · paystack.ts · mailer.ts
│   ├── errors/       AppError
│   └── db.ts
├── app.ts
└── server.ts
```

Everything about one feature lives in one folder, tests included. A module owns
its routes and its model, and talks to other modules only through their exported
service functions. Cross-cutting concerns live in `shared/` because they are
genuinely shared, not as a catch-all.

---

## 6. Endpoint inventory

### `modules/auth` — 11 routes

| Method | Path | Access | Body → Response |
|---|---|---|---|
| POST | `/auth/signup/admin` | public | `{firstName,lastName,email,password,confirmPassword,contact}` → `{success,message,token,user}` |
| POST | `/auth/signup/learner` | public | same minus `contact` → same |
| POST | `/auth/login` | public | `{email,password}` → `{success,message,token,user}` |
| POST | `/auth/verify-email` | bearer | `{token}` (6-digit OTP) → `{success,message,user}` |
| POST | `/auth/resend-token` | bearer | *no body* → `{success,message}` |
| POST | `/auth/forgot-password` | public | `{email,baseResetURL}` → `{success,message}` |
| POST | `/auth/reset-password/:id` | public | `{password,confirmPassword}` → `{success,message}` |
| POST | `/auth/change-password` | bearer | `{password,confirmPassword}` → `{success,message}` |
| GET | `/auth/check-auth` | bearer | → `{success,user}` |
| PUT | `/auth/update` | bearer | multipart profile fields → `{success,message,user}` |
| POST | `/admin/auth/logout` | bearer | → `{success,message}` |

Three consequences of the payloads:

- `resend-token` takes **no body**, so it identifies the user from the bearer
  token. Signup therefore logs the user in *unverified*, and the OTP gates access
  afterwards.
- `:id` on `reset-password` is the **reset token**, not a user id.
- `baseResetURL` is the frontend origin the API uses to build the emailed reset
  link, which is how one endpoint serves both portals.

`PUT /auth/update` accepts `firstName, lastName, contact, location, disabled,
description, profileImage`. Contacts are normalised to `+233` by the frontends.

### `modules/tracks` — 5 routes

`GET /tracks` and `GET /tracks/:id` are **public** — the learner homepage lists
tracks while logged out. `POST /tracks`, `PUT /tracks/:id` and `DELETE /tracks/:id`
are admin-only and multipart.

Create requires `name, price, instructor, duration, description, image`. Update
treats every field as optional and only replaces the image when a new file is sent.

### `modules/courses` — 5 routes

Identical shape on `/courses`. Create requires `title, track, description, image`.

### `modules/learners` — 2 routes

`GET /learners` → `{success,count,learners}` and `GET /learners/:id` →
`{success,learner}`, both admin-only. A filtered view over `users` where
`role: "Learner"`, never exposing password or token fields.

### `modules/invoices` — 3 routes

`GET /invoices` is **role-aware on a single path**: an admin receives every invoice
with `learner` and `track` populated; a learner receives only their own.

`POST /invoices` (admin) takes `{learner, amount, dueDate, paymentDetails, status,
paystackCallbackUrl}` and returns
`{success, message, data: {id, amount, dueDate, status, paymentDetails, paystackPaymentUrl}}`.

`PUT /invoices/:id` fills the gap the frontend left as `updateInvoice: ""`.

### `modules/enrollments` — 1 route

`POST /enrollments`, learner-only, `{track, amount, paystackCallbackUrl}` →
`{success, message, transactionUrl, invoice}`.

### `modules/payments` — 2 routes

Not present in the frontend contract, but payments do not work without them.

- `POST /payments/webhook` — receives Paystack's `charge.success`, verified against
  the raw request body with the Paystack signature, and flips the matching invoice
  to `paid` with `paidAt` and `paystackTransactionId`.
- `GET /payments/verify/:reference` — lets the callback page confirm status on
  return.

Paystack redirects the browser to `paystackCallbackUrl` after payment, but the
browser failing to return is a routine case. The webhook is what makes payment
state reliable; the callback is a convenience.

### Deliberately reproduced inconsistency

Enrollment returns the payment URL as `transactionUrl`, while invoice creation
returns it as `data.paystackPaymentUrl`. This is inconsistent, but it is what both
apps read today, and phase 1 fidelity is what makes the cutover verifiable.

---

## 7. Auth, errors and security

### Tokens

Stateless JWT, payload `{sub, role}`, signed with `JWT_SECRET`, 7-day expiry,
returned as `token` in the login and signup bodies. The frontends store it via
`js-cookie` and send `Authorization: Bearer`, so `logout` is a client-side cookie
removal that the endpoint acknowledges.

A JS-readable cookie is exposed to XSS; an httpOnly cookie would be safer. That
requires a frontend change, so it belongs in phase 6, not the cutover.

### Security fix: stop leaking token fields

The new API omits `verificationToken`, `verificationTokenExpiresAt`,
`resetPasswordToken` and `resetPasswordExpiresAt` from every user response,
including `check-auth`. `packages/types` drops them. Neither frontend reads them.
This is a fix, not a quirk to preserve (§1.2).

### Required fix during cutover: the learner interceptor

The learner 401 interceptor (§1.3) throws a `TypeError` against the standard error
envelope. It cannot wait for phase 6 — that single line is made defensive during
phase 5, or every learner 401 fails confusingly.

That interceptor also documents a behavior the API must implement: a **401 whose
message contains "complete your profile"**, raised when a learner with an
incomplete profile attempts a gated action. The client deliberately preserves the
session in that one case instead of logging out.

### Error envelope

A single error handler at the bottom of the middleware stack converts zod failures,
Mongoose `CastError` and duplicate-key errors, thrown `AppError`s and unexpected
throws into `{ success: false, errors: [{ message }] }` with the appropriate status
code. Controllers never format errors themselves.

### Validation

zod in the API, mirroring the frontend schemas: passwords at least 8 characters
with upper, lower and a digit; uploads capped at 1MB and restricted to JPEG, PNG,
GIF and WebP — the same limits the frontends enforce, so rejections are consistent
on both sides.

### Baseline

bcrypt at 12 rounds; `password` as `select: false`; helmet; CORS allowlisting the
two Vercel origins plus localhost; rate limiting on `login`, `forgot-password` and
`resend-token`, which are the brute-force and email-abuse targets. All secrets via
environment variables, with a committed `.env.example`.

---

## 8. Testing

Vitest + Supertest against `mongodb-memory-server`, with tests colocated in each
module.

The three external services are reached only through thin adapters in
`shared/adapters/`, so tests substitute fakes at that single seam — no network
calls and no credentials in CI.

Every endpoint is covered by four cases:

1. Happy path
2. Missing or invalid auth
3. Wrong role
4. Validation failure

Plus a contract check asserting the response type-checks against
`@learnbase/types`. That check is what actually guarantees the frontends keep
working.

Implementation follows the TDD workflow: a failing test for each endpoint before
its implementation.

---

## 9. Build phases

Each phase is independently verifiable, and every phase after phase 0 is additive.

| Phase | Delivers | Verified by |
|---|---|---|
| **0 — Foundation** | pnpm/Turborepo, both repos subtree-imported, `packages/types`, `apps/api` skeleton, error handler, health check, test harness | Both frontends still build and run unchanged |
| **1 — Auth** | All 11 auth routes, JWT, bcrypt, OTP email, reset flow | Log in on both portals against the local API |
| **2 — Content** | Tracks and Courses CRUD, Cloudinary uploads | Admin creates a track with an image; learner sees it |
| **3 — People and billing reads** | `/learners`, role-aware `GET /invoices` | Admin tables populate |
| **4 — Payments** | `POST /enrollments`, `POST /invoices`, Paystack init and webhook | A test-mode payment flips an invoice to `paid` |
| **5 — Cutover** | `.env` and `vercel.json` rewrites re-pointed, seed script, interceptor fix | Both deployed apps run on the new API |
| **6 — Quirks** | `/auth/logout` for learners, leading-slash fix, `PUT /invoices/:id`, ratings endpoints, httpOnly cookie | — |

The Azure API stays live as a fallback until phase 5, and reverting the cutover is
a one-line `.env` change.

---

## 10. Environment variables

```
NODE_ENV
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_ADMIN_URL          # CORS allowlist
CLIENT_LEARNER_URL        # CORS allowlist
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
MAIL_FROM
```

---

## 11. Open questions

None blocking. Two to settle during implementation:

- Where the API is hosted (Render, Railway, Fly, Azure). It affects only the
  deploy configuration and the CORS allowlist, not the design.
- Whether the seed script should import existing data from the Azure API before
  cutover, or start empty. Depends on whether the current data is worth keeping.
