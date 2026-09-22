# LearnBase Phase 0 — Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert two independently-deployed frontend repos into a single pnpm/Turborepo monorepo, add a shared API contract package, and stand up a tested Express API skeleton — with both frontends still building and running exactly as before.

**Architecture:** A pnpm workspace with `apps/*` and `packages/*`. Both existing repos are imported as git subtrees so their full histories survive. `packages/types` becomes the single definition of the API contract, replacing the duplicated and silently-merged type declarations in both apps. `apps/api` is an Express 5 + TypeScript application organised into feature modules; this phase builds only its shared foundation — app factory, error envelope, database connection and test harness — with no business endpoints.

**Tech Stack:** pnpm 9, Turborepo 2, TypeScript 5.8, Express 5, Mongoose 8, Vitest 2, Supertest 7, mongodb-memory-server 10, Node 20+

**Spec:** `docs/superpowers/specs/2026-09-22-learnbase-api-design.md`

## Global Constraints

- Node 20 or later. pnpm is the only package manager — no `npm install` in any workspace.
- Package names: `@learnbase/admin`, `@learnbase/learner`, `@learnbase/api`, `@learnbase/types`, `@learnbase/tsconfig`.
- TypeScript `~5.8.3` everywhere, matching what both frontends already pin.
- The API base path is `/api`. Every route in every phase is mounted beneath it.
- Error responses are always `{ success: false, errors: [{ message }] }`. Controllers never format errors themselves.
- Contract types use `Date` for timestamp fields, matching the frontends' existing declarations. This is inaccurate — JSON delivers strings — and is deliberately deferred to Phase 6 so this phase changes no frontend behavior.
- Never commit `.env`. `.env.example` is committed and must list every variable the code reads.
- No business endpoints in this phase. Only `/api/health` exists.
- Both frontends must build and run unchanged at the end of every task.

---

## File Structure

**Created by this plan:**

| Path | Responsibility |
|---|---|
| `package.json` | Workspace root: pnpm + Turborepo scripts |
| `pnpm-workspace.yaml` | Declares `apps/*` and `packages/*` |
| `turbo.json` | Task pipeline: build, dev, test, lint, typecheck |
| `packages/tsconfig/` | Shared TS bases so no app invents its own compiler settings |
| `packages/types/src/common.ts` | Error envelope + shared primitives |
| `packages/types/src/user.ts` | `User`, `Role`, auth request/response types |
| `packages/types/src/track.ts` | Track contract |
| `packages/types/src/course.ts` | Course contract |
| `packages/types/src/invoice.ts` | Invoice + enrollment contract |
| `packages/types/src/index.ts` | Public surface of the contract package |
| `apps/api/src/app.ts` | `createApp()` — builds the Express app without listening |
| `apps/api/src/server.ts` | Process entry: reads env, connects Mongo, listens |
| `apps/api/src/shared/errors/AppError.ts` | The one error type controllers throw |
| `apps/api/src/shared/middleware/errorHandler.ts` | Converts every failure into the envelope |
| `apps/api/src/shared/middleware/notFound.ts` | Unmatched routes → envelope, not Express HTML |
| `apps/api/src/shared/db.ts` | Mongoose connect/disconnect |
| `apps/api/src/test/setup.ts` | Starts in-memory Mongo, resets collections per test |

**Moved by this plan:** `learnbase-admin/` → `apps/admin/`, `learnbase-learner-portal/` → `apps/learner/`

**Modified by this plan:** both apps' `package.json` (rename + pnpm scripts) and their `src/types/*` files (re-export from `@learnbase/types` instead of declaring locally).

---

## Task 1: Import both repos as git subtrees

Preserves every existing commit under the new paths. The two GitHub repos are left untouched as a rollback path.

**Files:**
- Create: `apps/admin/**` (imported), `apps/learner/**` (imported)
- Delete: `learnbase-admin/`, `learnbase-learner-portal/` (after verification)

**Interfaces:**
- Consumes: nothing — this is the first task.
- Produces: the `apps/admin/` and `apps/learner/` paths every later task refers to.

**Context:** Both local repos are clean and exactly in sync with `origin/main` (verified: 0 ahead, 0 behind; the only dirty file is `package-lock.json`, which pnpm makes obsolete). Importing from the local directories is therefore identical to importing from GitHub, and works offline.

- [ ] **Step 1: Confirm both source repos are still clean before touching anything**

```bash
cd /Users/cindyessuman/PersonalProject/learnbase
for d in learnbase-admin learnbase-learner-portal; do
  echo "== $d =="
  git -C "$d" rev-list --left-right --count origin/main...HEAD
  git -C "$d" status --porcelain
done
```

Expected: `0	0` for both. Only `package-lock.json` may appear as modified. If anything else is dirty or the counts are non-zero, STOP — commit and push that work first, or it will not be imported.

- [ ] **Step 2: Import the admin repo**

```bash
cd /Users/cindyessuman/PersonalProject/learnbase
git remote add admin-src ./learnbase-admin
git fetch admin-src main
git merge -s ours --no-commit --allow-unrelated-histories admin-src/main
git read-tree --prefix=apps/admin/ -u admin-src/main
git commit -m "chore: import admin portal with history at apps/admin"
```

- [ ] **Step 3: Import the learner repo**

```bash
git remote add learner-src ./learnbase-learner-portal
git fetch learner-src main
git merge -s ours --no-commit --allow-unrelated-histories learner-src/main
git read-tree --prefix=apps/learner/ -u learner-src/main
git commit -m "chore: import learner portal with history at apps/learner"
```

- [ ] **Step 4: Verify the histories actually came across**

```bash
git log --oneline -- apps/admin | wc -l
git log --oneline -- apps/learner | wc -l
test -f apps/admin/src/App.tsx && test -f apps/learner/src/App.tsx && echo "files present"
```

Expected: both counts well above 1 (these are the imported commits, not a single squashed one), and `files present`. If a count is 1, the `read-tree` imported a snapshot without history — reset and redo Steps 2–3.

- [ ] **Step 5: Remove the now-redundant source directories and remotes**

```bash
rm -rf learnbase-admin learnbase-learner-portal
git remote remove admin-src
git remote remove learner-src
git status --short
```

The originals remain on GitHub at `OhemaaCindy/LearnBase-Admin-Portal` and `OhemaaCindy/learnBase-learner-portal`. Nothing is lost.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove source directories after subtree import"
```

---

## Task 2: Root workspace and Turborepo pipeline

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`
- Modify: `apps/admin/package.json`, `apps/learner/package.json`
- Delete: `apps/admin/package-lock.json`, `apps/learner/package-lock.json`

**Interfaces:**
- Consumes: `apps/admin/`, `apps/learner/` from Task 1.
- Produces: the workspace root. Every later task's `pnpm --filter <name>` command depends on the package names set here: `@learnbase/admin`, `@learnbase/learner`.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Create `.npmrc`**

```
auto-install-peers=true
strict-peer-dependencies=false
```

Vite plugins and Radix declare wide peer ranges; without this, pnpm's strict resolution fails the install on dependencies the apps already use successfully.

- [ ] **Step 3: Create the root `package.json`**

```json
{
  "name": "learnbase",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.3.3"
  }
}
```

- [ ] **Step 4: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

`dependsOn: ["^build"]` is what makes `@learnbase/types` compile before anything that imports it.

- [ ] **Step 5: Rename the admin package**

In `apps/admin/package.json`, change the `name` field only:

```json
  "name": "@learnbase/admin",
```

- [ ] **Step 6: Rename the learner package**

In `apps/learner/package.json`, change the `name` field only:

```json
  "name": "@learnbase/learner",
```

- [ ] **Step 7: Remove the npm lockfiles and any npm-installed dependencies**

```bash
rm -f apps/admin/package-lock.json apps/learner/package-lock.json
rm -rf apps/admin/node_modules apps/learner/node_modules
```

The existing `node_modules` were installed by npm with a flat layout. Leaving them in place lets imports resolve against packages that pnpm never linked, so a build can pass locally and fail in CI.

- [ ] **Step 8: Install and verify both apps still build**

```bash
pnpm install
pnpm run build
```

Expected: `pnpm-lock.yaml` is created at the root, and Turborepo reports **2 successful** builds. If a build fails, fix it before continuing — a green build here is what proves the migration did not break the apps.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: add pnpm workspace and turborepo pipeline"
```

---

## Task 3: Shared TypeScript configuration

**Files:**
- Create: `packages/tsconfig/package.json`, `packages/tsconfig/base.json`, `packages/tsconfig/node.json`

**Interfaces:**
- Consumes: the workspace from Task 2.
- Produces: `@learnbase/tsconfig/base.json` and `@learnbase/tsconfig/node.json`, extended by Tasks 4 and 6.

- [ ] **Step 1: Create `packages/tsconfig/package.json`**

```json
{
  "name": "@learnbase/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "node.json"]
}
```

- [ ] **Step 2: Create `packages/tsconfig/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create `packages/tsconfig/node.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"]
  }
}
```

The API runs on Node with ESM, so it needs `NodeNext` resolution — which is why relative imports in `apps/api` carry a `.js` extension even though the source is `.ts`.

- [ ] **Step 4: Verify both configs are valid JSON and the workspace sees the package**

```bash
node -e "['base','node'].forEach(f => { JSON.parse(require('fs').readFileSync('packages/tsconfig/'+f+'.json','utf8')); console.log(f+'.json valid'); })"
pnpm install
pnpm ls --depth -1 --filter @learnbase/tsconfig
```

Expected: both files report valid, and pnpm lists `@learnbase/tsconfig`. JSON with comments would parse-fail here — these files must stay comment-free.

- [ ] **Step 5: Commit**

```bash
git add packages/tsconfig pnpm-lock.yaml
git commit -m "chore: add shared typescript configs"
```

---

## Task 4: Contract package — scaffold, common and user types

Replaces the duplicate `interface User` declarations that TypeScript was silently merging, and drops the leaked token fields (spec §1.2, §7).

**Files:**
- Create: `packages/types/package.json`, `packages/types/tsconfig.json`, `packages/types/vitest.config.ts`
- Create: `packages/types/src/common.ts`, `packages/types/src/user.ts`, `packages/types/src/index.ts`
- Test: `packages/types/src/user.test-d.ts`

**Interfaces:**
- Consumes: `@learnbase/tsconfig` from Task 3.
- Produces:
  - `ApiError { message: string }`, `ApiErrorResponse { success: false; errors: ApiError[] }`
  - `Role = "Admin" | "Learner"`
  - `User` — the canonical user shape
  - `AdminRegisterPayload`, `LearnerRegisterPayload`, `LoginPayload`, `AuthSuccessResponse`, `CheckAuthResponse`, `MessageResponse`, `ForgotPasswordPayload`, `ResetPasswordPayload`, `VerifyEmailPayload`, `VerifyEmailResponse`, `UpdateUserResponse`

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@learnbase/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run --typecheck"
  },
  "devDependencies": {
    "@learnbase/tsconfig": "workspace:*",
    "typescript": "~5.8.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

This one includes the type tests, because `vitest --typecheck` derives its
program from it. Excluding them here would make the tests silently never run.

```json
{
  "extends": "@learnbase/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 2b: Create `packages/types/tsconfig.build.json`**

The build excludes the type tests so they are never emitted into `dist`.

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.test-d.ts"]
}
```

- [ ] **Step 3: Create `packages/types/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      include: ["src/**/*.test-d.ts"],
    },
  },
});
```

This package has no runtime behavior, so its tests are compile-time assertions. `vitest --typecheck` runs them as a real, failing-or-passing test suite.

- [ ] **Step 4: Write the failing type test**

Create `packages/types/src/user.test-d.ts`:

```ts
import { describe, it, expectTypeOf } from "vitest";
import type { User, Role, AuthSuccessResponse, ApiErrorResponse } from "./index.js";

describe("User contract", () => {
  it("allows exactly the two roles", () => {
    expectTypeOf<Role>().toEqualTypeOf<"Admin" | "Learner">();
  });

  it("exposes the identity fields the frontends read", () => {
    expectTypeOf<User>().toHaveProperty("_id").toEqualTypeOf<string>();
    expectTypeOf<User>().toHaveProperty("email").toEqualTypeOf<string>();
    expectTypeOf<User>().toHaveProperty("isVerified").toEqualTypeOf<boolean>();
  });

  it("never exposes credential or token fields", () => {
    expectTypeOf<User>().not.toHaveProperty("password");
    expectTypeOf<User>().not.toHaveProperty("verificationToken");
    expectTypeOf<User>().not.toHaveProperty("resetPasswordToken");
  });

  it("returns a token alongside the user on login", () => {
    expectTypeOf<AuthSuccessResponse>().toHaveProperty("token").toEqualTypeOf<string>();
    expectTypeOf<AuthSuccessResponse>().toHaveProperty("user").toEqualTypeOf<User>();
  });

  it("models the error envelope as an unsuccessful response", () => {
    expectTypeOf<ApiErrorResponse>().toHaveProperty("success").toEqualTypeOf<false>();
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
pnpm --filter @learnbase/types test
```

Expected: FAIL — `Cannot find module './index.js'`, because no source files exist yet.

- [ ] **Step 6: Create `packages/types/src/common.ts`**

```ts
export interface ApiError {
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  errors: ApiError[];
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
```

- [ ] **Step 7: Create `packages/types/src/user.ts`**

```ts
export type Role = "Admin" | "Learner";

/**
 * The canonical user shape returned by the API.
 *
 * Deliberately omits `password`, `verificationToken`,
 * `verificationTokenExpiresAt`, `resetPasswordToken` and
 * `resetPasswordExpiresAt`. The previous API returned those from
 * /auth/check-auth, which handed any valid session the means to reset
 * that account's password. Neither frontend reads them. See spec §7.
 */
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  contact?: string;
  profileImage?: string;
  description?: string;
  location?: string;
  disabled?: boolean;
}

export interface AdminRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contact: string;
}

export type LearnerRegisterPayload = Omit<AdminRegisterPayload, "contact">;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface CheckAuthResponse {
  success: boolean;
  user: User;
}

export interface ForgotPasswordPayload {
  email: string;
  /** Frontend origin the API uses to build the emailed reset link. */
  baseResetURL: string;
}

export interface ResetPasswordPayload {
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailPayload {
  /** The 6-digit OTP from the verification email. */
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user: User;
}
```

- [ ] **Step 8: Create `packages/types/src/index.ts`**

```ts
export type {
  ApiError,
  ApiErrorResponse,
  MessageResponse,
} from "./common.js";

export type {
  Role,
  User,
  AdminRegisterPayload,
  LearnerRegisterPayload,
  LoginPayload,
  AuthSuccessResponse,
  CheckAuthResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  VerifyEmailResponse,
  UpdateUserResponse,
} from "./user.js";
```

- [ ] **Step 9: Run the test to verify it passes**

```bash
pnpm install
pnpm --filter @learnbase/types test
```

Expected: PASS — 5 tests.

- [ ] **Step 10: Commit**

```bash
git add packages/types pnpm-lock.yaml
git commit -m "feat(types): add shared contract package with user and auth types"
```

---

## Task 5: Contract package — track, course and invoice types

**Files:**
- Create: `packages/types/src/track.ts`, `packages/types/src/course.ts`, `packages/types/src/invoice.ts`
- Modify: `packages/types/src/index.ts`
- Test: `packages/types/src/resources.test-d.ts`

**Interfaces:**
- Consumes: `User`, `Role`, `MessageResponse` from Task 4.
- Produces: `Track`, `TrackRating`, `TracksResponse`, `TrackResponse`, `TrackMutationResponse`, `Course`, `CoursesResponse`, `CourseResponse`, `CourseMutationResponse`, `Invoice`, `InvoiceStatus`, `InvoicesResponse`, `CreateInvoiceResponse`, `EnrollmentPayload`, `EnrollmentResponse`.

- [ ] **Step 1: Write the failing type test**

Create `packages/types/src/resources.test-d.ts`:

```ts
import { describe, it, expectTypeOf } from "vitest";
import type {
  Track,
  Course,
  Invoice,
  InvoiceStatus,
  TracksResponse,
  EnrollmentResponse,
} from "./index.js";

describe("Track contract", () => {
  it("carries both _id and the Mongoose id virtual", () => {
    expectTypeOf<Track>().toHaveProperty("_id").toEqualTypeOf<string>();
    expectTypeOf<Track>().toHaveProperty("id").toEqualTypeOf<string>();
  });

  it("prices tracks as a number", () => {
    expectTypeOf<Track>().toHaveProperty("price").toEqualTypeOf<number>();
  });

  it("returns a count alongside the list", () => {
    expectTypeOf<TracksResponse>().toHaveProperty("count").toEqualTypeOf<number>();
  });
});

describe("Course contract", () => {
  it("has only _id, unlike Track", () => {
    expectTypeOf<Course>().toHaveProperty("_id").toEqualTypeOf<string>();
    expectTypeOf<Course>().not.toHaveProperty("id");
  });
});

describe("Invoice contract", () => {
  it("allows a null learner for admin-raised invoices", () => {
    expectTypeOf<Invoice["learner"]>().toBeNullable();
  });

  it("constrains status to the three known states", () => {
    expectTypeOf<InvoiceStatus>().toEqualTypeOf<"pending" | "paid" | "unpaid">();
  });

  it("returns the payment URL as transactionUrl on enrollment", () => {
    expectTypeOf<EnrollmentResponse>()
      .toHaveProperty("transactionUrl")
      .toEqualTypeOf<string>();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @learnbase/types test
```

Expected: FAIL — `Module './index.js' has no exported member 'Track'`.

- [ ] **Step 3: Create `packages/types/src/track.ts`**

```ts
import type { User } from "./user.js";

export interface TrackRating {
  _id: string;
  learner: string;
  value: number;
  comment?: string;
  createdAt: Date;
}

/**
 * Track carries both `_id` and `id`. The `id` is Mongoose's virtual,
 * enabled via `toJSON: { virtuals: true }` on the track schema only —
 * Course and User do not have it. See spec §4.
 */
export interface Track {
  _id: string;
  id: string;
  admin: User;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  courses: TrackCourseRef[];
  ratings: TrackRating[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

/** A course as embedded in a track response: refs are ids, not objects. */
export interface TrackCourseRef {
  _id: string;
  admin: string;
  track: string;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface TracksResponse {
  success: boolean;
  count: number;
  tracks: Track[];
}

export interface TrackResponse {
  success: boolean;
  track: Track;
}

export interface TrackMutationResponse {
  success: boolean;
  message: string;
  track: Track;
}
```

- [ ] **Step 4: Create `packages/types/src/course.ts`**

```ts
import type { User } from "./user.js";

/** The track as embedded in a course response — admin is an id here. */
export interface CourseTrackRef {
  _id: string;
  id: string;
  admin: string;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Course {
  _id: string;
  admin: User;
  track: CourseTrackRef;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface CoursesResponse {
  success: boolean;
  count: number;
  courses: Course[];
}

export interface CourseResponse {
  success: boolean;
  course: Course;
}

export interface CourseMutationResponse {
  success: boolean;
  message: string;
  course: Course;
}
```

- [ ] **Step 5: Create `packages/types/src/invoice.ts`**

```ts
import type { User } from "./user.js";
import type { CourseTrackRef } from "./course.js";

export type InvoiceStatus = "pending" | "paid" | "unpaid";

/**
 * `learner` is nullable: an admin can raise an invoice directly rather
 * than a learner self-enrolling. See spec §4.
 */
export interface Invoice {
  _id: string;
  learner: User | null;
  track: CourseTrackRef;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paystackReference: string;
  paystackTransactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface InvoicesResponse {
  success: boolean;
  count: number;
  invoices: Invoice[];
}

/**
 * Admin invoice creation returns the payment URL nested under `data` as
 * `paystackPaymentUrl`, while enrollment returns it flat as
 * `transactionUrl`. Inconsistent, but it is what both apps read today.
 * See spec §6.
 */
export interface CreateInvoiceResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    amount: number;
    dueDate: string;
    status?: InvoiceStatus;
    paymentDetails?: string;
    paystackPaymentUrl: string;
  };
}

export interface EnrollmentPayload {
  track: string;
  amount: number;
  paystackCallbackUrl: string;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  transactionUrl: string;
  invoice: Invoice;
}
```

- [ ] **Step 6: Extend `packages/types/src/index.ts`**

Append to the existing file:

```ts
export type {
  Track,
  TrackRating,
  TrackCourseRef,
  TracksResponse,
  TrackResponse,
  TrackMutationResponse,
} from "./track.js";

export type {
  Course,
  CourseTrackRef,
  CoursesResponse,
  CourseResponse,
  CourseMutationResponse,
} from "./course.js";

export type {
  Invoice,
  InvoiceStatus,
  InvoicesResponse,
  CreateInvoiceResponse,
  EnrollmentPayload,
  EnrollmentResponse,
} from "./invoice.js";
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
pnpm --filter @learnbase/types test
```

Expected: PASS — 11 tests total.

- [ ] **Step 8: Commit**

```bash
git add packages/types
git commit -m "feat(types): add track, course and invoice contract types"
```

---

## Task 6: API skeleton with a health endpoint

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`, `apps/api/.env.example`
- Create: `apps/api/src/app.ts`, `apps/api/src/server.ts`
- Test: `apps/api/src/app.test.ts`

**Interfaces:**
- Consumes: `@learnbase/tsconfig` (Task 3), `@learnbase/types` (Tasks 4–5).
- Produces: `createApp(): Express` — the app factory every later test mounts. It does **not** listen; `server.ts` owns the port.

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@learnbase/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@learnbase/types": "workspace:*",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.1.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "mongoose": "^8.9.5",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "@learnbase/tsconfig": "workspace:*",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^24.0.15",
    "@types/supertest": "^6.0.2",
    "mongodb-memory-server": "^10.1.3",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "~5.8.3",
    "vitest": "^2.1.8"
  }
}
```

Express 5 forwards rejected promises from handlers to error middleware automatically, so no `express-async-handler` wrapper is needed anywhere in this codebase.

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "@learnbase/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/test/**"]
}
```

- [ ] **Step 3: Create `apps/api/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
```

The 30s timeout exists because `mongodb-memory-server` downloads a MongoDB binary on first run.

- [ ] **Step 4: Create `apps/api/.env.example`**

```
NODE_ENV=development
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/learnbase
CLIENT_ADMIN_URL=http://localhost:5173
CLIENT_LEARNER_URL=http://localhost:5174
```

Only the variables this phase's code reads. Later phases add their own.

- [ ] **Step 5: Write the failing test**

Create `apps/api/src/app.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("reports the API is running", async () => {
    const res = await request(createApp()).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "LearnBase API is running",
    });
  });
});

describe("CORS", () => {
  it("allows the configured admin origin", async () => {
    const res = await request(createApp())
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

```bash
pnpm install
pnpm --filter @learnbase/api test
```

Expected: FAIL — `Cannot find module './app.js'`.

- [ ] **Step 7: Create `apps/api/src/app.ts`**

```ts
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";

/**
 * Builds the Express application without binding a port, so tests can
 * mount it with supertest and the process entry point stays separate.
 */
export function createApp(): Express {
  const app = express();

  const allowedOrigins = [
    process.env.CLIENT_ADMIN_URL ?? "http://localhost:5173",
    process.env.CLIENT_LEARNER_URL ?? "http://localhost:5174",
  ];

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "LearnBase API is running",
    });
  });

  return app;
}
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 2 tests.

- [ ] **Step 9: Create `apps/api/src/server.ts`**

```ts
import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 5050);

const app = createApp();

app.listen(port, () => {
  console.log(`LearnBase API listening on http://localhost:${port}`);
});
```

Mongo connection is wired into this file in Task 8.

- [ ] **Step 10: Verify the server actually starts**

```bash
pnpm --filter @learnbase/api dev &
sleep 3
curl -s http://localhost:5050/api/health
kill %1
```

Expected: `{"success":true,"message":"LearnBase API is running"}`

- [ ] **Step 11: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): add express skeleton with health endpoint"
```

---

## Task 7: Error envelope

Every failure in every later phase flows through this. Getting it right once means no controller ever formats an error again.

**Files:**
- Create: `apps/api/src/shared/errors/AppError.ts`
- Create: `apps/api/src/shared/middleware/errorHandler.ts`, `apps/api/src/shared/middleware/notFound.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/src/shared/middleware/errorHandler.test.ts`

**Interfaces:**
- Consumes: `createApp()` from Task 6, `ApiErrorResponse` from Task 4.
- Produces:
  - `class AppError extends Error` with `constructor(message: string, statusCode: number)` and a `statusCode` property
  - `errorHandler` — an Express error middleware, mounted last
  - `notFound` — mounted after all routes, before `errorHandler`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/shared/middleware/errorHandler.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { ZodError, z } from "zod";
import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { errorHandler } from "./errorHandler.js";
import { createApp } from "../../app.js";

function appThatThrows(error: unknown) {
  const app = express();
  app.get("/boom", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  it("renders an AppError with its own status code", async () => {
    const res = await request(appThatThrows(new AppError("Track not found", 404)))
      .get("/boom");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      errors: [{ message: "Track not found" }],
    });
  });

  it("renders every zod issue as its own error entry", async () => {
    const schema = z.object({ email: z.string(), age: z.number() });
    let zodError: ZodError;
    try {
      schema.parse({});
      throw new Error("schema should have rejected");
    } catch (err) {
      zodError = err as ZodError;
    }

    const res = await request(appThatThrows(zodError)).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors[0]).toHaveProperty("message");
  });

  it("turns a malformed object id into a 400", async () => {
    const castError = new mongoose.Error.CastError("ObjectId", "nope", "_id");

    const res = await request(appThatThrows(castError)).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toContain("Invalid");
  });

  it("turns a duplicate key violation into a 409", async () => {
    const duplicate = Object.assign(new Error("E11000 duplicate key"), {
      code: 11000,
      keyValue: { email: "taken@example.com" },
    });

    const res = await request(appThatThrows(duplicate)).get("/boom");

    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toContain("email");
  });

  it("hides the details of an unexpected failure", async () => {
    const res = await request(appThatThrows(new Error("connection string leaked")))
      .get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      errors: [{ message: "Something went wrong" }],
    });
  });
});

describe("notFound", () => {
  it("returns the error envelope for an unknown route", async () => {
    const res = await request(createApp()).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toContain("not found");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — `Cannot find module '../errors/AppError.js'`.

- [ ] **Step 3: Create `apps/api/src/shared/errors/AppError.ts`**

```ts
/**
 * The only error type controllers and services throw deliberately.
 * Anything else reaching the error handler is treated as unexpected
 * and its message is hidden from the client.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

- [ ] **Step 4: Create `apps/api/src/shared/middleware/errorHandler.ts`**

```ts
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import type { ApiErrorResponse } from "@learnbase/types";
import { AppError } from "../errors/AppError.js";

interface DuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is DuplicateKeyError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  );
}

/**
 * Converts every failure into `{ success: false, errors: [{ message }] }`.
 * Mounted last, so no controller ever formats an error itself.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, messages: string[]) => {
    const body: ApiErrorResponse = {
      success: false,
      errors: messages.map((message) => ({ message })),
    };
    res.status(status).json(body);
  };

  if (err instanceof AppError) {
    return send(err.statusCode, [err.message]);
  }

  if (err instanceof ZodError) {
    return send(
      400,
      err.issues.map((issue) =>
        issue.path.length > 0
          ? `${issue.path.join(".")}: ${issue.message}`
          : issue.message,
      ),
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return send(400, [`Invalid ${err.path}: ${String(err.value)}`]);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return send(
      400,
      Object.values(err.errors).map((issue) => issue.message),
    );
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    return send(409, [`A record with that ${field} already exists`]);
  }

  console.error("Unhandled error:", err);
  return send(500, ["Something went wrong"]);
};
```

- [ ] **Step 5: Create `apps/api/src/shared/middleware/notFound.ts`**

```ts
import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

/** Mounted after all routes so unmatched paths get the envelope, not Express HTML. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
```

- [ ] **Step 6: Mount both in `apps/api/src/app.ts`**

Add the imports below the existing ones:

```ts
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { notFound } from "./shared/middleware/notFound.js";
```

Then, immediately before `return app;`, add:

```ts
  app.use(notFound);
  app.use(errorHandler);
```

Order matters: `notFound` converts an unmatched route into an `AppError`, and `errorHandler` renders it. Both must come after every route.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 8 tests total.

- [ ] **Step 8: Commit**

```bash
git add apps/api
git commit -m "feat(api): add error envelope, AppError and not-found handling"
```

---

## Task 8: Database connection and in-memory test harness

**Files:**
- Create: `apps/api/src/shared/db.ts`, `apps/api/src/test/setup.ts`
- Modify: `apps/api/vitest.config.ts`, `apps/api/src/server.ts`
- Test: `apps/api/src/shared/db.test.ts`

**Interfaces:**
- Consumes: `apps/api` from Tasks 6–7.
- Produces:
  - `connectDB(uri: string): Promise<void>`
  - `disconnectDB(): Promise<void>`
  - A global setup that starts an in-memory MongoDB once per run and clears every collection between tests, so each test in every later phase starts from an empty database.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/shared/db.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./db.js";

describe("connectDB", () => {
  it("is already connected via the test harness", () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("rejects an unreachable database rather than hanging", async () => {
    await disconnectDB();

    await expect(
      connectDB("mongodb://127.0.0.1:1/learnbase-nope"),
    ).rejects.toThrow();

    await connectDB(process.env.MONGODB_URI!);
    expect(mongoose.connection.readyState).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — `Cannot find module './db.js'`.

- [ ] **Step 3: Create `apps/api/src/shared/db.ts`**

```ts
import mongoose from "mongoose";

export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5_000,
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
```

`serverSelectionTimeoutMS` keeps a bad URI from hanging for the driver's 30-second default — which is what makes the second test finish.

- [ ] **Step 4: Create `apps/api/src/test/setup.ts`**

```ts
import { beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../shared/db.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectDB(process.env.MONGODB_URI);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await disconnectDB();
  await mongo.stop();
});
```

Clearing collections after each test is what lets later phases assert on counts without tests interfering with each other.

- [ ] **Step 5: Register the harness in `apps/api/vitest.config.ts`**

Replace the file with:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
```

`fileParallelism: false` keeps test files from sharing one in-memory database concurrently and clearing each other's data mid-test.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 10 tests total. The first run downloads a MongoDB binary and may take a minute.

- [ ] **Step 7: Connect the database in `apps/api/src/server.ts`**

Replace the file with:

```ts
import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./shared/db.js";

const port = Number(process.env.PORT ?? 5050);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env.");
  process.exit(1);
}

async function start(): Promise<void> {
  await connectDB(mongoUri!);
  console.log("Connected to MongoDB");

  createApp().listen(port, () => {
    console.log(`LearnBase API listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start the API:", error);
  process.exit(1);
});
```

Failing loudly on a missing `MONGODB_URI` beats starting an API whose every request fails.

- [ ] **Step 8: Verify the whole workspace is green**

```bash
pnpm run build
pnpm run test
pnpm run typecheck
```

Expected: all three succeed across every package.

- [ ] **Step 9: Commit**

```bash
git add apps/api
git commit -m "feat(api): add mongo connection and in-memory test harness"
```

---

## Task 9: Point both frontends at the shared contract

Kills the duplicate-declaration merging (spec §1.1) and the drift between the two apps' copies (spec §1.7). Existing import sites keep working, because each file becomes a re-export at the same path under the same names.

**Files:**
- Modify: `apps/admin/package.json`, `apps/learner/package.json`
- Modify: `apps/admin/src/types/types.ts`, `apps/admin/src/types/track.type.ts`, `apps/admin/src/types/courses.types.ts`, `apps/admin/src/types/invoices.types.ts`, `apps/admin/src/types/learners.type.ts`
- Modify: `apps/learner/src/types/auth.type.tsx`, `apps/learner/src/types/track.type.ts`, `apps/learner/src/types/learner.type.ts`

**Interfaces:**
- Consumes: every type exported from `@learnbase/types` (Tasks 4–5).
- Produces: no new names. Each app's existing type module names are preserved as aliases, so no component or service file changes.

- [ ] **Step 1: Add the dependency to both apps**

In `apps/admin/package.json` and `apps/learner/package.json`, add to `dependencies`:

```json
    "@learnbase/types": "workspace:*",
```

Then:

```bash
pnpm install
```

- [ ] **Step 2: Capture the current typecheck state as a baseline**

```bash
pnpm run typecheck
```

Expected: PASS. If it already fails, note the failures — they are pre-existing and not caused by this task.

- [ ] **Step 3: Replace `apps/admin/src/types/types.ts` with re-exports**

```ts
/**
 * Re-exports the shared contract. Previously this file declared `User`
 * four separate times, which TypeScript silently merged into one
 * interface. Names are aliased so existing imports keep working.
 */
export type {
  User,
  ApiErrorResponse as AuthErrorRes,
  ApiError as AuthError,
  AdminRegisterPayload as RegisterType,
  AuthSuccessResponse as RegisterResponse,
  LoginPayload as LoginPayloadType,
  AuthSuccessResponse as LoginResponseType,
  ForgotPasswordPayload as ForgotPasswordPayloadType,
  MessageResponse as ForgotPasswordResponseType,
  ResetPasswordPayload as ResetPasswordPayloadType,
  ApiErrorResponse as ResetPasswordResponseype,
  ApiError as Error,
  VerifyEmailPayload as VerifyEmailPayloadType,
  VerifyEmailResponse as VerifyEmailResponseType,
  MessageResponse as ResendOtpType,
  MessageResponse as LogoutResponse,
  CheckAuthResponse,
  UpdateUserResponse as UpdateLearnerResponse,
} from "@learnbase/types";
```

The `ResetPasswordResponseype` misspelling is preserved as an alias so no call site changes; the canonical name is spelled correctly.

- [ ] **Step 4: Replace `apps/admin/src/types/track.type.ts` with re-exports**

```ts
export type {
  Track,
  TracksResponse as TrackResponse,
  TrackResponse as SingleTrackResponse,
  TrackMutationResponse as AddTrackResponse,
  TrackMutationResponse as UpdateTrackResponse,
  MessageResponse as DeleteTrackResponse,
} from "@learnbase/types";
```

- [ ] **Step 5: Replace `apps/admin/src/types/courses.types.ts` with re-exports**

```ts
export type {
  Course,
  User as Admin,
  CourseTrackRef as Track,
  CoursesResponse,
  CourseResponse as SingleCourseResponse,
  CourseMutationResponse as AddCoursesResponse,
  CourseMutationResponse as UpdateCourseResponse,
  MessageResponse as DeleteCourseResponse,
} from "@learnbase/types";
```

- [ ] **Step 6: Replace `apps/admin/src/types/invoices.types.ts` with re-exports**

```ts
export type {
  Invoice,
  User as Learner,
  InvoicesResponse as AllTrackResponse,
  CreateInvoiceResponse as InvoiceResponse,
} from "@learnbase/types";
```

`AllTrackResponse` is the existing — misleading — name for the invoice list response. Preserved as an alias so no call site changes.

- [ ] **Step 7: Replace `apps/admin/src/types/learners.type.ts` with re-exports**

```ts
import type { User } from "@learnbase/types";

export type { Role } from "@learnbase/types";

/** A learner is a User whose role is "Learner". */
export type Learner = User;

export interface LearnersResponse {
  success: boolean;
  count: number;
  learners: Learner[];
}

export interface LearnerResponse {
  success: boolean;
  learner: Learner;
}
```

`Role` was a TS `enum` here. It is never used as a value anywhere in either app (verified), so exporting it as a union type is safe and keeps the package types-only.

- [ ] **Step 8: Replace `apps/learner/src/types/auth.type.tsx` with re-exports**

```ts
export type {
  User,
  ApiErrorResponse as AuthErrorRes,
  ApiError as AuthError,
  LearnerRegisterPayload as RegisterType,
  AuthSuccessResponse as RegisterResponse,
  LoginPayload as LoginPayloadType,
  AuthSuccessResponse as LoginResponseType,
  ForgotPasswordPayload as ForgotPasswordPayloadType,
  MessageResponse as ForgotPasswordResponseType,
  ResetPasswordPayload as ResetPasswordPayloadType,
  ApiErrorResponse as ResetPasswordResponseype,
  ApiError as Error,
  VerifyEmailPayload as VerifyEmailPayloadType,
  VerifyEmailResponse as VerifyEmailResponseType,
  MessageResponse as ResendOtpType,
  MessageResponse as LogoutResponse,
  CheckAuthResponse,
} from "@learnbase/types";
```

Note this app uses `LearnerRegisterPayload` (no `contact`) where admin uses `AdminRegisterPayload`. That difference was the type drift between the two copies.

- [ ] **Step 9: Replace `apps/learner/src/types/track.type.ts` with re-exports**

```ts
export type {
  Track,
  TracksResponse as TrackResponse,
  TrackResponse as SingleTrackResponse,
  TrackMutationResponse as AddTrackResponse,
  TrackMutationResponse as UpdateTrackResponse,
  MessageResponse as DeleteTrackResponse,
} from "@learnbase/types";
```

- [ ] **Step 10: Replace `apps/learner/src/types/learner.type.ts` with re-exports**

```ts
export type {
  User,
  Invoice,
  User as Learner,
  CourseTrackRef as Track,
  UpdateUserResponse as UpdateLearnerResponse,
  EnrollmentPayload as EnollmentType,
  EnrollmentResponse as EnollmentResponse,
  InvoicesResponse as InvoiceResponse,
} from "@learnbase/types";
```

The `Enollment` misspellings are preserved as aliases so no call site changes.

- [ ] **Step 11: Typecheck and build the whole workspace**

```bash
pnpm run typecheck
pnpm run build
```

Expected: both PASS.

If a frontend file fails because a type is now narrower than the merged version it used to get, fix that **call site** — do not widen the shared type. The merged types were an accident; the narrow ones are the contract. The one exception: if a call site genuinely needs a field the API really returns, the field is missing from `packages/types` and belongs there.

- [ ] **Step 12: Run both apps and click through them**

```bash
pnpm run dev
```

Open both apps. Confirm the tracks list, login form and dashboard still render against the existing Azure API. This phase changes no runtime behavior, so anything broken is a type migration error, not an API issue.

- [ ] **Step 13: Commit**

```bash
git add apps/admin apps/learner pnpm-lock.yaml
git commit -m "refactor: re-export shared contract types in both frontends"
```

---

## Definition of Done

- [ ] `pnpm run build`, `pnpm run test` and `pnpm run typecheck` all pass from the root.
- [ ] `git log --oneline -- apps/admin` and `-- apps/learner` each show the full imported history, not one squashed commit.
- [ ] Both frontends run via `pnpm run dev` and behave exactly as before, still against the Azure API.
- [ ] `curl http://localhost:5050/api/health` returns the success envelope.
- [ ] `curl http://localhost:5050/api/nope` returns `{"success":false,"errors":[{"message":"Route GET /api/nope not found"}]}`.
- [ ] `apps/api/.env` is **not** tracked by git, and `apps/api/.env.example` lists every variable the code reads.
- [ ] The two frontend `.env` files are still tracked, exactly as they were before the import. They hold only `VITE_*` values, which Vite compiles into the client bundle and are public by design — there is no secret in them. The API's `.env` is different: it will hold `JWT_SECRET`, Cloudinary, Paystack and SMTP credentials, and must never be committed.
- [ ] Neither app declares its own contract types — every `src/types/*` file re-exports from `@learnbase/types`.

## What this phase deliberately does not do

- No authentication, no business endpoints. `/api/health` is the only route.
- No Cloudinary, Paystack or mailer adapters — they arrive with the phases that need them.
- No Vercel reconfiguration. Both apps still deploy from their existing projects and still talk to the Azure API. The cutover is Phase 5.
- No fix for the `Date`-versus-string inaccuracy in the contract types, the learner 401 interceptor, or the learner logout path. Those are Phases 5 and 6.

## Next

Phase 1 — Auth: all 11 routes, JWT, bcrypt, OTP email and the reset flow. It builds directly on `createApp()`, `AppError`, `errorHandler` and the test harness from this phase.
