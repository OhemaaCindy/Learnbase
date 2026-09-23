# Phase 0 — Outcomes and Carry-Forward

**Completed:** 2026-09-23 on branch `phase-0-monorepo`
**Plan:** `2026-09-22-phase-0-monorepo-foundation.md`
**Spec:** `../specs/2026-09-22-learnbase-api-design.md`

## What shipped

| | |
|---|---|
| Monorepo | pnpm workspaces + Turborepo; `apps/{admin,learner,api}`, `packages/{tsconfig,types}` |
| History | 73 admin + 66 learner commits preserved via subtree import; trees verified byte-identical to source |
| Contract | `@learnbase/types` — single canonical definition, replacing declarations TypeScript was silently merging |
| API | Express 5 skeleton: `createApp()`, error envelope, Mongo connection, in-memory test harness. `GET /api/health` only |
| Tests | 23 (12 contract type-tests, 11 API) — every assertion mutation-verified |

Verified at completion: root `build` 4/4, `test` 3/3, `typecheck` 5/5.

## Fixed along the way (pre-existing defects pnpm exposed)

- `apps/admin/src/main.tsx` imported react-query-devtools through a relative path into
  `node_modules`, reaching its raw TypeScript source. Resolved only under npm's flat
  hoisting; broke the build under pnpm. Same pattern fixed in three learner components
  that imported `zodResolver` the same way.
- Duplicate interface declarations across both apps' type files (e.g. `export interface
  Track` four times in one file) were being silently merged by TypeScript, so no type
  meant what it appeared to mean.
- `check-auth` previously returned `verificationToken` and `resetPasswordToken` to the
  client. The shared contract omits them; a type test enforces the omission.

## Must be addressed in Phase 1

- **`express.json()` will break the Paystack webhook.** It is mounted globally at
  `apps/api/src/app.ts` and consumes the raw body that signature verification requires
  (spec §6). The webhook route needs `express.raw()` mounted before the JSON parser.
  This bites in Phase 4 but the seam must be designed in Phase 1.
- **Error logging leaks secrets.** `errorHandler.ts` logs the full error including stack.
  Harmless today; in Phase 1, mongoose and SMTP errors carry `MONGODB_URI` and
  `SMTP_PASSWORD` inside `err.message`. The response body is correctly scrubbed — this is
  a log leak only. Must not survive Phase 1.
- **The contract check needs a `JsonOf<T>` mapped type.** Contract types use `Date` for
  timestamps; JSON delivers strings. Deliberate for Phase 0 (it kept frontend behavior
  unchanged), and audited safe — no consumption site calls `.toISOString()` or
  `.getTime()`. But spec §8's check would assert something false without the mapping.
- **`apps/api` has no eslint config or lint script**, so `pnpm run lint` silently covers
  2 of 4 packages.
- **Test harness scaling.** Each test file starts its own `MongoMemoryServer`; already
  ~9.6s for 3 files and linear. Move to `globalSetup` before Phase 1's 44 tests land.

## Deferred, with reasons

- `apps/admin/src/types/learners.type.ts` keeps `amount`/`gender`/`course` as app-local
  optional fields. They are deliberately outside the shared contract because the new API
  will not return them — but the admin app still reads them from the Azure API until the
  Phase 5 cutover. **Remove them at cutover.**
- Both frontends' `.env` files stay tracked. They hold only `VITE_*` values, which Vite
  compiles into the client bundle and are public by construction. `apps/api/.env` is
  ignored and must stay that way — it will hold JWT, Cloudinary, Paystack and SMTP secrets.
- `fileParallelism: false` in `apps/api/vitest.config.ts` could not be empirically
  falsified even under an adversarial stress run; Vitest's per-file thread isolation may
  already provide what it guards. Harmless and defensive — but anyone changing pool config
  should know its stated rationale is unproven.

## Cutover reminder (Phase 5)

The old API is wired in **two** places per app, not one: `VITE_SERVER_URL` in `.env`, and
the `rewrites` block in `vercel.json` that proxies `/api/*` to the Azure host. Both must
change. Also note `apps/learner/src/lib/axios.ts` reads `error.response.data[0]` on 401 —
a bare array — while everything else uses `{ success, errors }`. Against the new envelope
that throws a `TypeError` inside the interceptor. It must be made defensive during
cutover, not after.
