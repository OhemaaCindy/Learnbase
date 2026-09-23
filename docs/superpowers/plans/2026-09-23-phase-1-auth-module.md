# LearnBase Phase 1 — Auth Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 11 authentication endpoints against the existing contract — signup, login, email verification, password reset, profile update — so both portals can authenticate against our own API instead of the shared Azure one.

**Architecture:** A single `modules/auth` feature folder owning its routes, controller, service, model and zod schemas. Three external services (email, image storage, and later payments) are reached only through thin adapters in `shared/adapters/`, injected into `createApp()` so tests substitute fakes at one seam and never touch the network. JWT is stateless; the token is returned in the response body because the frontends store it themselves.

**Tech Stack:** Express 5, Mongoose 8, TypeScript 5.8, zod 4, bcrypt, jsonwebtoken, Nodemailer (Brevo SMTP relay), Cloudinary, multer, express-rate-limit, Vitest 2, Supertest 7, mongodb-memory-server 10

**Spec:** `docs/superpowers/specs/2026-09-22-learnbase-api-design.md`
**Prior phase:** `docs/superpowers/plans/2026-09-22-phase-0-outcomes.md`

## Global Constraints

- Node 20+. pnpm only — never `npm install`.
- Every route is mounted beneath `/api`. Every error response is exactly `{ success: false, errors: [{ message }] }`, produced only by `errorHandler`. Controllers never format errors.
- `apps/api` is ESM with NodeNext resolution: every relative import carries a `.js` extension.
- `apps/api` build is `tsc -p tsconfig.build.json`; `typecheck` is `tsc -p tsconfig.json --noEmit` and **does** include test files. Never silence an error with `@ts-ignore`, `@ts-expect-error`, `as any` or `: any`.
- Response shapes come from `@learnbase/types`. If a response does not type-check against the contract, the response is wrong — not the contract.
- Passwords: bcrypt, 12 rounds, `select: false`. Never returned, never logged.
- `User` responses never include `password`, `verificationToken`, `verificationTokenExpiresAt`, `resetPasswordToken` or `resetPasswordExpiresAt`. A type test in `packages/types` already enforces the contract side; the model must enforce the runtime side.
- Email is normalised to lowercase, trimmed, at every entry point — not just in the schema.
- No secret may reach a log. No real `.env` may be committed; `apps/api/.env.example` lists every variable the code reads.
- `pnpm run build`, `pnpm run test` and `pnpm run typecheck` must all pass from the repo root at the end of every task.
- Commit messages carry no attribution trailers of any kind.
- The user may have unrelated uncommitted work in `apps/admin`. Stage only your own files by explicit path — never `git add -A` or `git add .`.

## Review Focus

Five things the spec implies but that no endpoint's happy-path test would catch. Each has a test assigned to the task that owns the code.

1. **`baseResetURL` is attacker-controlled** (Task 11). The client dictates the URL embedded in a password-reset email. Unvalidated, an attacker requests a reset for a victim's address with `baseResetURL=https://evil.example`, and the victim receives a genuine email from our domain carrying a live reset token pointing at the attacker. Expected: reject any value whose origin is not an allow-listed client origin, before sending anything.
2. **Reset tokens must be single-use and expiring** (Task 11). The spec names `resetPasswordExpiresAt` but never says what happens when a token is expired or replayed. Expected: both rejected with 400, and a successful reset invalidates the token immediately.
3. **OTP brute force** (Task 10). `verify-email` accepts a 6-digit code — about 10⁶ possibilities, trivially exhausted. The spec rate-limits login, forgot-password and resend-token, but not verify-email. Expected: verification attempts are limited per user.
4. **Email case and whitespace** (Task 7). `  Test@Example.COM ` must resolve to the same account as `test@example.com` at signup, login and forgot-password alike. Normalising only in the schema is not enough — lookups bypass it. Expected: one account, and login succeeds whatever casing was typed.
5. **Duplicate signup** (Task 7). The spec does not say what a second signup with an existing email does. Unhandled, Mongo's E11000 surfaces as a 500. Expected: 409 with the standard envelope.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `apps/api/src/modules/auth/user.model.ts` | Mongoose schema, password hashing, safe serialisation |
| `apps/api/src/modules/auth/auth.schema.ts` | zod validators for every auth payload |
| `apps/api/src/modules/auth/auth.service.ts` | All auth business logic; no Express types |
| `apps/api/src/modules/auth/auth.controller.ts` | Request → service → response; throws `AppError` |
| `apps/api/src/modules/auth/auth.routes.ts` | Route table, middleware wiring |
| `apps/api/src/shared/adapters/mailer.ts` | `Mailer` interface + Brevo SMTP implementation |
| `apps/api/src/shared/adapters/imageStore.ts` | `ImageStore` interface + Cloudinary implementation |
| `apps/api/src/shared/adapters/index.ts` | `AppDeps`, real-adapter factory |
| `apps/api/src/shared/auth/jwt.ts` | `signToken` / `verifyToken` |
| `apps/api/src/shared/middleware/authenticate.ts` | Bearer → `req.user` |
| `apps/api/src/shared/middleware/requireRole.ts` | Role gate |
| `apps/api/src/shared/middleware/requireCompleteProfile.ts` | The "complete your profile" 401 |
| `apps/api/src/shared/middleware/upload.ts` | multer memory storage, 1MB, image types only |
| `apps/api/src/shared/rateLimit.ts` | Named limiters for auth routes |
| `apps/api/src/types/express.d.ts` | `Request.user` augmentation |
| `packages/types/src/json.ts` | `JsonOf<T>` — Date→string mapping for contract assertions |

**Modified:** `apps/api/src/app.ts` (accept `AppDeps`, mount auth router), `apps/api/src/server.ts` (build real deps), `apps/api/src/shared/middleware/errorHandler.ts` (redact), `apps/api/vitest.config.ts` (globalSetup), `apps/api/package.json`, `apps/api/.env.example`, `apps/learner/src/components/forgot-password-form.tsx` (one line).

---

## Task 1: Phase 0 carry-forward — log redaction, API lint, faster harness

Three debts recorded at the end of Phase 0. Clearing them first keeps them from compounding across eleven new routes.

**Files:**
- Modify: `apps/api/src/shared/middleware/errorHandler.ts`, `apps/api/vitest.config.ts`, `apps/api/package.json`
- Create: `apps/api/eslint.config.js`, `apps/api/src/test/globalSetup.ts`
- Test: `apps/api/src/shared/middleware/errorHandler.test.ts` (extend)

**Interfaces:**
- Consumes: Phase 0's `errorHandler`, `src/test/setup.ts`.
- Produces: `redactSecrets(text: string): string` exported from `errorHandler.ts`, reused by any future logging.

- [ ] **Step 1: Write the failing redaction test**

Append to `apps/api/src/shared/middleware/errorHandler.test.ts`:

```ts
import { redactSecrets } from "./errorHandler.js";

describe("redactSecrets", () => {
  it("masks a mongodb connection string", () => {
    const text = "failed to connect to mongodb+srv://admin:hunter2@cluster0.mongodb.net/db";
    const out = redactSecrets(text);
    expect(out).not.toContain("hunter2");
    expect(out).toContain("[REDACTED]");
  });

  it("masks an smtp url and a bearer token", () => {
    const out = redactSecrets(
      "smtp://user:s3cr3t@smtp-relay.brevo.com:587 Authorization: Bearer abc.def.ghi",
    );
    expect(out).not.toContain("s3cr3t");
    expect(out).not.toContain("abc.def.ghi");
  });

  it("leaves ordinary text untouched", () => {
    expect(redactSecrets("Track not found")).toBe("Track not found");
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — `redactSecrets` is not exported.

- [ ] **Step 3: Implement redaction in `errorHandler.ts`**

Add above `errorHandler`:

```ts
const SECRET_PATTERNS: RegExp[] = [
  /\/\/[^/\s:@]+:[^/\s:@]+@/g,        // credentials inside any URL
  /\bBearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, // JWTs
  /\b[\w.-]+:[^\s@]{6,}@[\w.-]+\b/g,  // user:pass@host outside a URL
];

/** Masks credentials that routinely appear inside driver and SMTP error text. */
export function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce(
    (acc, pattern) => acc.replace(pattern, (match) =>
      match.includes("//") ? "//[REDACTED]@" : "[REDACTED]",
    ),
    text,
  );
}
```

Then change the unexpected-error branch's logging line from `console.error("Unhandled error:", err)` to:

```ts
  console.error(
    "Unhandled error:",
    redactSecrets(err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err)),
  );
```

- [ ] **Step 4: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 12 tests for apps/api.

- [ ] **Step 5: Move the in-memory Mongo to a global setup**

Create `apps/api/src/test/globalSetup.ts`:

```ts
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

export async function setup(): Promise<void> {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
}

export async function teardown(): Promise<void> {
  await mongo.stop();
}
```

Replace `apps/api/src/test/setup.ts` with the per-file half only:

```ts
import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../shared/db.js";

beforeAll(async () => {
  await connectDB(process.env.MONGODB_URI!);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await disconnectDB();
});
```

Update `apps/api/vitest.config.ts` to add `globalSetup: ["src/test/globalSetup.ts"]` alongside the existing `setupFiles`. Keep `fileParallelism: false`, `testTimeout: 30_000` and `hookTimeout: 180_000`.

One MongoDB binary now starts per run instead of per file.

- [ ] **Step 6: Add an eslint config so lint covers apps/api**

Create `apps/api/eslint.config.js`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },
);
```

Add to `apps/api/package.json` scripts: `"lint": "eslint ."`, and to devDependencies: `"@eslint/js": "^9.30.1"`, `"eslint": "^9.30.1"`, `"typescript-eslint": "^8.35.1"`, `"globals": "^16.3.0"`.

- [ ] **Step 7: Verify the whole workspace**

```bash
pnpm install
pnpm run test
pnpm run lint
pnpm run build
pnpm run typecheck
```

Expected: all pass, and `lint` now reports 3 packages rather than 2. Fix any lint errors the new config surfaces in existing API code.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/shared/middleware/errorHandler.ts apps/api/src/shared/middleware/errorHandler.test.ts \
        apps/api/src/test/globalSetup.ts apps/api/src/test/setup.ts apps/api/vitest.config.ts \
        apps/api/eslint.config.js apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): redact secrets from logs, add lint, share one mongo per run"
```

---

## Task 2: `JsonOf<T>` — make contract assertions honest

Contract types use `Date`; JSON delivers strings. Without this mapping the contract check asserts something false.

**Files:**
- Create: `packages/types/src/json.ts`, `packages/types/src/json.test-d.ts`
- Modify: `packages/types/src/index.ts`

**Interfaces:**
- Produces: `JsonOf<T>` — recursively replaces `Date` with `string`, preserving optionality, arrays, nulls and unions. Every later task's response assertions use it.

- [ ] **Step 1: Write the failing type test**

Create `packages/types/src/json.test-d.ts`:

```ts
import { describe, it, expectTypeOf } from "vitest";
import type { JsonOf, User, Invoice } from "./index.js";

describe("JsonOf", () => {
  it("turns Date fields into strings", () => {
    expectTypeOf<JsonOf<User>["createdAt"]>().toEqualTypeOf<string>();
  });

  it("preserves non-Date fields unchanged", () => {
    expectTypeOf<JsonOf<User>["email"]>().toEqualTypeOf<string>();
    expectTypeOf<JsonOf<User>["__v"]>().toEqualTypeOf<number>();
  });

  it("keeps optional fields optional", () => {
    expectTypeOf<JsonOf<User>>().toHaveProperty("contact");
    expectTypeOf<JsonOf<User>["contact"]>().toEqualTypeOf<string | undefined>();
  });

  it("maps Dates inside nested objects", () => {
    expectTypeOf<JsonOf<Invoice>["dueDate"]>().toEqualTypeOf<string>();
  });

  it("preserves a nullable object field's null branch", () => {
    expectTypeOf<JsonOf<Invoice>["learner"]>().not.toEqualTypeOf<never>();
  });

  it("maps Dates inside arrays", () => {
    type WithList = { items: { at: Date }[] };
    expectTypeOf<JsonOf<WithList>["items"][number]["at"]>().toEqualTypeOf<string>();
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/types test
```

Expected: FAIL — no exported member `JsonOf`.

- [ ] **Step 3: Implement `packages/types/src/json.ts`**

```ts
/**
 * The over-the-wire shape of `T`: every `Date` becomes the ISO string that
 * JSON.stringify actually produces. Use it whenever asserting that an API
 * response matches a contract type — asserting against the raw type would
 * claim the response contains Date objects, which it never does.
 */
export type JsonOf<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? JsonOf<U>[]
    : T extends object
      ? { [K in keyof T]: JsonOf<T[K]> }
      : T;
```

`Date` is checked first so it is not swallowed by the `object` branch. Primitives, `null` and `undefined` fall through unchanged, which is what keeps optional fields optional.

- [ ] **Step 4: Export it**

Append to `packages/types/src/index.ts`:

```ts
export type { JsonOf } from "./json.js";
```

- [ ] **Step 5: Run and verify it passes**

```bash
pnpm --filter @learnbase/types test
```

Expected: PASS — 18 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/json.ts packages/types/src/json.test-d.ts packages/types/src/index.ts
git commit -m "feat(types): add JsonOf<T> for honest contract assertions"
```

---

## Task 3: User model

**Files:**
- Create: `apps/api/src/modules/auth/user.model.ts`, `apps/api/src/modules/auth/user.model.test.ts`
- Modify: `apps/api/package.json`

**Interfaces:**
- Produces:
  - `UserDocument` — Mongoose document with `comparePassword(plain: string): Promise<boolean>`
  - `UserModel` — the compiled model, exported as `User`
  - `toPublicUser(doc: UserDocument): PublicUser` where `PublicUser` is the contract `User`

- [ ] **Step 1: Add dependencies**

Add to `apps/api/package.json` dependencies: `"bcrypt": "^5.1.1"`. DevDependencies: `"@types/bcrypt": "^5.0.2"`. Then `pnpm install`.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/modules/auth/user.model.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { User, toPublicUser } from "./user.model.js";

const base = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "Password123",
  role: "Learner" as const,
};

describe("User model", () => {
  it("hashes the password on save and never stores it in plain text", async () => {
    const user = await User.create(base);
    const stored = await User.findById(user._id).select("+password");
    expect(stored?.password).toBeDefined();
    expect(stored?.password).not.toBe("Password123");
    expect(stored?.password.startsWith("$2")).toBe(true);
  });

  it("does not return the password by default", async () => {
    await User.create(base);
    const found = await User.findOne({ email: base.email });
    expect(found).not.toBeNull();
    expect((found as unknown as { password?: string }).password).toBeUndefined();
  });

  it("compares a correct and an incorrect password", async () => {
    await User.create(base);
    const stored = await User.findOne({ email: base.email }).select("+password");
    expect(await stored!.comparePassword("Password123")).toBe(true);
    expect(await stored!.comparePassword("wrong")).toBe(false);
  });

  it("lowercases and trims the email", async () => {
    const user = await User.create({ ...base, email: "  ADA@Example.COM " });
    expect(user.email).toBe("ada@example.com");
  });

  it("rejects a duplicate email", async () => {
    await User.create(base);
    await expect(User.create(base)).rejects.toMatchObject({ code: 11000 });
  });

  it("only re-hashes the password when it actually changed", async () => {
    const user = await User.create(base);
    const first = (await User.findById(user._id).select("+password"))!.password;
    user.firstName = "Augusta";
    await user.save();
    const second = (await User.findById(user._id).select("+password"))!.password;
    expect(second).toBe(first);
  });

  it("toPublicUser strips every credential and token field", async () => {
    const user = await User.create({
      ...base,
      verificationToken: "123456",
      resetPasswordToken: "abc",
    });
    const publicUser = toPublicUser(user) as unknown as Record<string, unknown>;
    expect(publicUser.password).toBeUndefined();
    expect(publicUser.verificationToken).toBeUndefined();
    expect(publicUser.verificationTokenExpiresAt).toBeUndefined();
    expect(publicUser.resetPasswordToken).toBeUndefined();
    expect(publicUser.resetPasswordExpiresAt).toBeUndefined();
    expect(publicUser.email).toBe("ada@example.com");
  });
});
```

- [ ] **Step 3: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./user.model.js`.

- [ ] **Step 4: Implement `apps/api/src/modules/auth/user.model.ts`**

```ts
import mongoose, { Schema, model, type Document, type Model } from "mongoose";
import bcrypt from "bcrypt";
import type { Role, User as PublicUser } from "@learnbase/types";

const BCRYPT_ROUNDS = 12;

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  contact?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
  verificationAttempts: number;
  lastLogin?: Date;
  profileImage?: string;
  description?: string;
  location?: string;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  comparePassword(plain: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["Admin", "Learner"], required: true },
    contact: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpiresAt: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
    verificationAttempts: { type: Number, default: 0, select: false },
    lastLogin: { type: Date },
    profileImage: { type: String },
    description: { type: String },
    location: { type: String },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function comparePassword(
  plain: string,
): Promise<boolean> {
  return bcrypt.compare(plain, this.password);
};

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  model<UserDocument>("User", userSchema);

const HIDDEN = [
  "password",
  "verificationToken",
  "verificationTokenExpiresAt",
  "resetPasswordToken",
  "resetPasswordExpiresAt",
  "verificationAttempts",
] as const;

/**
 * The only way a user reaches a response body. Deletes every credential and
 * token field rather than listing what to keep, so a field added to the schema
 * is never leaked by omission.
 */
export function toPublicUser(doc: UserDocument): PublicUser {
  const plain = doc.toObject({ virtuals: false }) as Record<string, unknown>;
  for (const key of HIDDEN) delete plain[key];
  return plain as unknown as PublicUser;
}
```

`mongoose.models.User ?? model(...)` guards against re-registration when several test files import the module.

- [ ] **Step 5: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 19 tests for apps/api.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/auth/user.model.ts apps/api/src/modules/auth/user.model.test.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add user model with bcrypt hashing and safe serialisation"
```

---

## Task 4: JWT and auth middleware

**Files:**
- Create: `apps/api/src/shared/auth/jwt.ts`, `apps/api/src/shared/auth/jwt.test.ts`, `apps/api/src/shared/middleware/authenticate.ts`, `apps/api/src/shared/middleware/authenticate.test.ts`, `apps/api/src/shared/middleware/requireRole.ts`, `apps/api/src/types/express.d.ts`
- Modify: `apps/api/package.json`, `apps/api/.env.example`

**Interfaces:**
- Consumes: `User`, `UserDocument` from Task 3.
- Produces:
  - `signToken(payload: { sub: string; role: Role }): string`
  - `verifyToken(token: string): { sub: string; role: Role }` — throws `AppError(401)` on any failure
  - `authenticate: RequestHandler` — sets `req.user: UserDocument`
  - `requireRole(...roles: Role[]): RequestHandler`

- [ ] **Step 1: Add dependencies and env**

Add to `apps/api/package.json` dependencies: `"jsonwebtoken": "^9.0.2"`. DevDependencies: `"@types/jsonwebtoken": "^9.0.7"`. Add to `apps/api/.env.example`:

```
JWT_SECRET=replace-me-with-a-long-random-string
JWT_EXPIRES_IN=7d
```

Then `pnpm install`.

- [ ] **Step 2: Write the failing JWT test**

Create `apps/api/src/shared/auth/jwt.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { signToken, verifyToken } from "./jwt.js";
import { AppError } from "../errors/AppError.js";

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
  process.env.JWT_EXPIRES_IN = "7d";
});

describe("jwt", () => {
  it("round-trips a payload", () => {
    const token = signToken({ sub: "507f1f77bcf86cd799439011", role: "Admin" });
    expect(verifyToken(token)).toMatchObject({
      sub: "507f1f77bcf86cd799439011",
      role: "Admin",
    });
  });

  it("rejects a tampered token with a 401 AppError", () => {
    const token = signToken({ sub: "abc", role: "Learner" });
    const tampered = `${token.slice(0, -2)}xx`;
    try {
      verifyToken(tampered);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(401);
    }
  });

  it("rejects a token signed with a different secret", () => {
    const token = signToken({ sub: "abc", role: "Learner" });
    process.env.JWT_SECRET = "a-completely-different-secret";
    expect(() => verifyToken(token)).toThrow(AppError);
  });

  it("rejects an expired token", () => {
    process.env.JWT_EXPIRES_IN = "-1s";
    const token = signToken({ sub: "abc", role: "Learner" });
    expect(() => verifyToken(token)).toThrow(AppError);
  });

  it("refuses to sign when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => signToken({ sub: "abc", role: "Learner" })).toThrow();
  });
});
```

- [ ] **Step 3: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./jwt.js`.

- [ ] **Step 4: Implement `apps/api/src/shared/auth/jwt.ts`**

```ts
import jwt from "jsonwebtoken";
import type { Role } from "@learnbase/types";
import { AppError } from "../errors/AppError.js";

export interface TokenPayload {
  sub: string;
  role: Role;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env.");
  }
  return value;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
}

/** Throws AppError(401) for every failure mode — expired, tampered, wrong secret. */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret());
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as TokenPayload).sub !== "string"
    ) {
      throw new AppError("Not authorised", 401);
    }
    return decoded as TokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Not authorised", 401);
  }
}
```

- [ ] **Step 5: Add the Request augmentation**

Create `apps/api/src/types/express.d.ts`:

```ts
import type { UserDocument } from "../modules/auth/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
```

- [ ] **Step 6: Write the failing middleware test**

Create `apps/api/src/shared/middleware/authenticate.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { authenticate } from "./authenticate.js";
import { requireRole } from "./requireRole.js";
import { errorHandler } from "./errorHandler.js";
import { signToken } from "../auth/jwt.js";
import { User } from "../../modules/auth/user.model.js";

function appWith(...handlers: express.RequestHandler[]) {
  const app = express();
  app.get("/protected", ...handlers, (req, res) => {
    res.json({ success: true, email: req.user?.email });
  });
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("authenticate", () => {
  it("attaches the user for a valid token", async () => {
    const user = await User.create({
      firstName: "Ada", lastName: "L", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const token = signToken({ sub: user._id.toString(), role: "Learner" });

    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ada@example.com");
  });

  it("rejects a missing Authorization header with the envelope", async () => {
    const res = await request(appWith(authenticate)).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      errors: [{ message: "Not authorised" }],
    });
  });

  it("rejects a malformed Authorization header", async () => {
    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", "Token abc");
    expect(res.status).toBe(401);
  });

  it("rejects a token whose user no longer exists", async () => {
    const token = signToken({ sub: "507f1f77bcf86cd799439011", role: "Admin" });
    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("rejects a disabled account", async () => {
    const user = await User.create({
      firstName: "Ada", lastName: "L", email: "ada@example.com",
      password: "Password123", role: "Learner", disabled: true,
    });
    const token = signToken({ sub: user._id.toString(), role: "Learner" });
    const res = await request(appWith(authenticate))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("requireRole", () => {
  it("allows a matching role", async () => {
    const user = await User.create({
      firstName: "Admin", lastName: "One", email: "admin@example.com",
      password: "Password123", role: "Admin",
    });
    const token = signToken({ sub: user._id.toString(), role: "Admin" });
    const res = await request(appWith(authenticate, requireRole("Admin")))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("rejects a non-matching role with 403", async () => {
    const user = await User.create({
      firstName: "Ada", lastName: "L", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const token = signToken({ sub: user._id.toString(), role: "Learner" });
    const res = await request(appWith(authenticate, requireRole("Admin")))
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
```

- [ ] **Step 7: Implement both middlewares**

`apps/api/src/shared/middleware/authenticate.ts`:

```ts
import type { RequestHandler } from "express";
import { verifyToken } from "../auth/jwt.js";
import { AppError } from "../errors/AppError.js";
import { User } from "../../modules/auth/user.model.js";

/**
 * Re-loads the user on every request rather than trusting the token's claims,
 * so a disabled or deleted account stops working immediately instead of at
 * token expiry.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Not authorised", 401));
  }

  const payload = verifyToken(header.slice("Bearer ".length).trim());
  const user = await User.findById(payload.sub);

  if (!user || user.disabled) {
    return next(new AppError("Not authorised", 401));
  }

  req.user = user;
  next();
};
```

`apps/api/src/shared/middleware/requireRole.ts`:

```ts
import type { RequestHandler } from "express";
import type { Role } from "@learnbase/types";
import { AppError } from "../errors/AppError.js";

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError("Not authorised", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have access to this resource", 403));
    }
    next();
  };
}
```

- [ ] **Step 8: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 31 tests for apps/api.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/shared/auth apps/api/src/shared/middleware/authenticate.ts \
        apps/api/src/shared/middleware/authenticate.test.ts apps/api/src/shared/middleware/requireRole.ts \
        apps/api/src/types/express.d.ts apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "feat(api): add jwt signing and authenticate/requireRole middleware"
```

---

## Task 5: Mailer adapter and dependency injection

Introduces the seam every external service uses from here on.

**Files:**
- Create: `apps/api/src/shared/adapters/mailer.ts`, `apps/api/src/shared/adapters/mailer.test.ts`, `apps/api/src/shared/adapters/index.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/package.json`, `apps/api/.env.example`

**Interfaces:**
- Produces:
  - `interface Mailer { send(message: MailMessage): Promise<void> }` where `MailMessage = { to: string; subject: string; html: string; text: string }`
  - `createBrevoMailer(): Mailer`
  - `interface AppDeps { mailer: Mailer }` (extended in Task 6)
  - `createApp(deps?: Partial<AppDeps>): Express` — real adapters by default, fakes in tests
  - `verificationEmail(code: string): { subject; html; text }`, `resetPasswordEmail(link: string): { subject; html; text }`

- [ ] **Step 1: Add dependencies and env**

`apps/api/package.json` dependencies: `"nodemailer": "^6.9.16"`. DevDependencies: `"@types/nodemailer": "^6.4.17"`. Add to `apps/api/.env.example`:

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-login
SMTP_PASSWORD=your-brevo-smtp-key
MAIL_FROM="LearnBase <no-reply@yourdomain.com>"
```

Then `pnpm install`.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/shared/adapters/mailer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { verificationEmail, resetPasswordEmail } from "./mailer.js";

describe("email templates", () => {
  it("puts the code in both the html and the text of a verification email", () => {
    const mail = verificationEmail("482913");
    expect(mail.html).toContain("482913");
    expect(mail.text).toContain("482913");
    expect(mail.subject.length).toBeGreaterThan(0);
  });

  it("puts the link in both parts of a reset email", () => {
    const link = "https://admin.example.com/reset-password/abc123";
    const mail = resetPasswordEmail(link);
    expect(mail.html).toContain(link);
    expect(mail.text).toContain(link);
  });

  it("escapes html-significant characters in the link", () => {
    const mail = resetPasswordEmail("https://x.example/a?b=1&c=2");
    expect(mail.html).toContain("&amp;");
    expect(mail.html).not.toContain("b=1&c=2");
  });
});
```

- [ ] **Step 3: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./mailer.js`.

- [ ] **Step 4: Implement `apps/api/src/shared/adapters/mailer.ts`**

```ts
import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function verificationEmail(code: string): Omit<MailMessage, "to"> {
  const safe = escapeHtml(code);
  return {
    subject: "Verify your LearnBase email",
    text: `Your LearnBase verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your LearnBase verification code is <strong>${safe}</strong>.</p>
<p>It expires in 15 minutes.</p>`,
  };
}

export function resetPasswordEmail(link: string): Omit<MailMessage, "to"> {
  const safe = escapeHtml(link);
  return {
    subject: "Reset your LearnBase password",
    text: `Reset your LearnBase password: ${link}\nThis link expires in 1 hour. If you did not request it, ignore this email.`,
    html: `<p><a href="${safe}">Reset your LearnBase password</a></p>
<p>This link expires in 1 hour. If you did not request it, ignore this email.</p>`,
  };
}

/** Brevo's SMTP relay. Kept behind the Mailer interface so tests never send mail. */
export function createBrevoMailer(): Mailer {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASSWORD ?? "",
    },
  });

  return {
    async send(message: MailMessage): Promise<void> {
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? "LearnBase <no-reply@learnbase.local>",
        ...message,
      });
    },
  };
}
```

- [ ] **Step 5: Create the deps module**

`apps/api/src/shared/adapters/index.ts`:

```ts
import { createBrevoMailer, type Mailer } from "./mailer.js";

export interface AppDeps {
  mailer: Mailer;
}

export function createRealDeps(): AppDeps {
  return { mailer: createBrevoMailer() };
}

export type { Mailer, MailMessage } from "./mailer.js";
```

- [ ] **Step 6: Thread deps through `createApp`**

In `apps/api/src/app.ts`, change the signature to `export function createApp(deps: AppDeps = createRealDeps()): Express` and store it for routers to use. Import `AppDeps` and `createRealDeps` from `./shared/adapters/index.js`. The existing `/api/health` route, helmet, cors, parsers, `notFound` and `errorHandler` all stay exactly where they are and in the same order.

In `apps/api/src/server.ts`, pass the real deps explicitly: `createApp(createRealDeps()).listen(...)`.

The default parameter keeps Phase 0's `createApp()` calls in `app.test.ts` working unchanged.

- [ ] **Step 7: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
pnpm run typecheck
```

Expected: PASS — 34 tests for apps/api.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/shared/adapters apps/api/src/app.ts apps/api/src/server.ts \
        apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "feat(api): add mailer adapter and inject deps into createApp"
```

---

## Task 6: Cloudinary image store and upload middleware

**Files:**
- Create: `apps/api/src/shared/adapters/imageStore.ts`, `apps/api/src/shared/middleware/upload.ts`, `apps/api/src/shared/middleware/upload.test.ts`
- Modify: `apps/api/src/shared/adapters/index.ts`, `apps/api/package.json`, `apps/api/.env.example`

**Interfaces:**
- Produces:
  - `interface ImageStore { upload(file: Buffer, folder: string): Promise<string> }` — resolves to the hosted URL
  - `createCloudinaryImageStore(): ImageStore`
  - `AppDeps` gains `imageStore: ImageStore`
  - `uploadSingle(field: string): RequestHandler` — multer memory storage, 1MB, jpeg/png/gif/webp only

- [ ] **Step 1: Add dependencies and env**

`apps/api/package.json` dependencies: `"cloudinary": "^2.5.1"`, `"multer": "^2.0.0"`. DevDependencies: `"@types/multer": "^1.4.12"`. Add to `apps/api/.env.example`:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Then `pnpm install`.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/shared/middleware/upload.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { uploadSingle } from "./upload.js";
import { errorHandler } from "./errorHandler.js";

function app() {
  const instance = express();
  instance.post("/upload", uploadSingle("profileImage"), (req, res) => {
    res.json({ success: true, size: req.file?.size ?? 0 });
  });
  instance.use(errorHandler);
  return instance;
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("uploadSingle", () => {
  it("accepts a png within the size limit", async () => {
    const res = await request(app())
      .post("/upload")
      .attach("profileImage", PNG, { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.size).toBeGreaterThan(0);
  });

  it("rejects a non-image mime type with the error envelope", async () => {
    const res = await request(app())
      .post("/upload")
      .attach("profileImage", Buffer.from("not an image"), {
        filename: "a.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toMatch(/JPEG|PNG|image/i);
  });

  it("rejects a file over 1MB with the error envelope", async () => {
    const big = Buffer.alloc(1_100_000, 1);
    const res = await request(app())
      .post("/upload")
      .attach("profileImage", big, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toMatch(/1MB|large/i);
  });

  it("allows a request with no file at all", async () => {
    const res = await request(app()).post("/upload");
    expect(res.status).toBe(200);
    expect(res.body.size).toBe(0);
  });
});
```

- [ ] **Step 3: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./upload.js`.

- [ ] **Step 4: Implement `apps/api/src/shared/middleware/upload.ts`**

```ts
import multer from "multer";
import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

const MAX_BYTES = 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      cb(new AppError("Only JPEG, PNG, GIF and WebP images are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

/**
 * Wraps multer so its own errors become AppErrors in the standard envelope
 * rather than multer's bespoke error shape reaching the client as a 500.
 */
export function uploadSingle(field: string): RequestHandler {
  const handler = multerInstance.single(field);
  return (req, res, next) => {
    handler(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return next(
          err.code === "LIMIT_FILE_SIZE"
            ? new AppError("Image must be smaller than 1MB", 400)
            : new AppError(err.message, 400),
        );
      }
      next(err);
    });
  };
}
```

- [ ] **Step 5: Implement `apps/api/src/shared/adapters/imageStore.ts`**

```ts
import { v2 as cloudinary } from "cloudinary";

export interface ImageStore {
  /** Uploads bytes and resolves to the hosted URL. */
  upload(file: Buffer, folder: string): Promise<string>;
}

export function createCloudinaryImageStore(): ImageStore {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return {
    upload(file: Buffer, folder: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Cloudinary upload failed"));
              return;
            }
            resolve(result.secure_url);
          },
        );
        stream.end(file);
      });
    },
  };
}
```

- [ ] **Step 6: Extend `AppDeps`**

In `apps/api/src/shared/adapters/index.ts`, add `imageStore: ImageStore` to `AppDeps`, return `createCloudinaryImageStore()` from `createRealDeps()`, and re-export `ImageStore`.

- [ ] **Step 7: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
pnpm run typecheck
```

Expected: PASS — 38 tests for apps/api.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/shared/adapters apps/api/src/shared/middleware/upload.ts \
        apps/api/src/shared/middleware/upload.test.ts apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "feat(api): add cloudinary image store and upload middleware"
```

---

## Task 7: Signup — both roles

Covers Review Focus items 4 (email normalisation) and 5 (duplicate signup).

**Files:**
- Create: `apps/api/src/modules/auth/auth.schema.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/modules/auth/auth.signup.test.ts`
- Create: `apps/api/src/test/factories.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `User`, `toPublicUser` (Task 3); `signToken` (Task 4); `Mailer`, `AppDeps` (Task 5).
- Produces:
  - `createAuthRouter(deps: AppDeps): Router`
  - `registerUser(input: RegisterInput, role: Role, mailer: Mailer): Promise<{ token: string; user: PublicUser }>`
  - `generateOtp(): string` — six digits
  - Test helper `fakeMailer()` returning `{ mailer: Mailer; sent: MailMessage[] }`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/test/factories.ts`:

```ts
import type { Mailer, MailMessage } from "../shared/adapters/index.js";

export function fakeMailer(): { mailer: Mailer; sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return {
    sent,
    mailer: {
      async send(message: MailMessage): Promise<void> {
        sent.push(message);
      },
    },
  };
}

export function fakeImageStore(url = "https://images.example/test.png") {
  const uploads: { folder: string; bytes: number }[] = [];
  return {
    uploads,
    imageStore: {
      async upload(file: Buffer, folder: string): Promise<string> {
        uploads.push({ folder, bytes: file.length });
        return url;
      },
    },
  };
}
```

Create `apps/api/src/modules/auth/auth.signup.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  const app = createApp({ mailer: mail.mailer, imageStore: images.imageStore });
  return { app, sent: mail.sent };
}

const payload = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "Password123",
  confirmPassword: "Password123",
  contact: "+233201234567",
};

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("POST /api/auth/signup/admin", () => {
  it("creates an unverified admin, returns a token, and emails a code", async () => {
    const { app, sent } = appWith();
    const res = await request(app).post("/api/auth/signup/admin").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.role).toBe("Admin");
    expect(res.body.user.isVerified).toBe(false);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("ada@example.com");
  });

  it("never returns credential or token fields", async () => {
    const { app } = appWith();
    const res = await request(app).post("/api/auth/signup/admin").send(payload);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.verificationToken).toBeUndefined();
    expect(res.body.user.resetPasswordToken).toBeUndefined();
  });

  it("rejects mismatched passwords with 400", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/signup/admin")
      .send({ ...payload, confirmPassword: "Different123" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("rejects a weak password with 400", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/signup/admin")
      .send({ ...payload, password: "short", confirmPassword: "short" });
    expect(res.status).toBe(400);
  });

  // Review Focus 5
  it("rejects a duplicate email with 409, not a 500", async () => {
    const { app } = appWith();
    await request(app).post("/api/auth/signup/admin").send(payload);
    const res = await request(app).post("/api/auth/signup/admin").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Review Focus 4
  it("treats differently-cased and padded emails as one account", async () => {
    const { app } = appWith();
    await request(app).post("/api/auth/signup/admin").send(payload);
    const res = await request(app)
      .post("/api/auth/signup/admin")
      .send({ ...payload, email: "  ADA@Example.COM " });
    expect(res.status).toBe(409);
    expect(await User.countDocuments()).toBe(1);
  });

  it("does not send a verification email when signup fails", async () => {
    const { app, sent } = appWith();
    await request(app).post("/api/auth/signup/admin").send(payload);
    sent.length = 0;
    await request(app).post("/api/auth/signup/admin").send(payload);
    expect(sent).toHaveLength(0);
  });
});

describe("POST /api/auth/signup/learner", () => {
  it("creates a learner without requiring contact", async () => {
    const { app } = appWith();
    const { contact: _contact, ...withoutContact } = payload;
    const res = await request(app)
      .post("/api/auth/signup/learner")
      .send(withoutContact);

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("Learner");
  });

  it("stores a six digit verification code that expires", async () => {
    const { app } = appWith();
    const { contact: _contact, ...withoutContact } = payload;
    await request(app).post("/api/auth/signup/learner").send(withoutContact);

    const user = await User.findOne({ email: "ada@example.com" }).select(
      "+verificationToken +verificationTokenExpiresAt",
    );
    expect(user?.verificationToken).toMatch(/^\d{6}$/);
    expect(user?.verificationTokenExpiresAt?.getTime()).toBeGreaterThan(Date.now());
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./auth.schema.js` / routes not mounted.

- [ ] **Step 3: Implement `apps/api/src/modules/auth/auth.schema.ts`**

```ts
import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain an uppercase letter, a lowercase letter and a number",
  );

const withConfirmation = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .refine(
      (data) =>
        (data as { password: string; confirmPassword: string }).password ===
        (data as { confirmPassword: string }).confirmPassword,
      { message: "Passwords do not match", path: ["confirmPassword"] },
    );

export const adminSignupSchema = withConfirmation({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email,
  password,
  confirmPassword: z.string(),
  contact: z.string().trim().min(1, "Contact is required"),
});

export const learnerSignupSchema = withConfirmation({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email,
  password,
  confirmPassword: z.string(),
  contact: z.string().trim().optional(),
});

export type AdminSignupInput = z.infer<typeof adminSignupSchema>;
export type LearnerSignupInput = z.infer<typeof learnerSignupSchema>;
```

`z.string().trim().toLowerCase()` normalises at the boundary, so every lookup downstream sees the same value — schema-level `lowercase: true` alone would not protect `findOne` calls.

- [ ] **Step 4: Implement `apps/api/src/modules/auth/auth.service.ts`**

```ts
import crypto from "node:crypto";
import type { Role, User as PublicUser } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { signToken } from "../../shared/auth/jwt.js";
import type { Mailer } from "../../shared/adapters/index.js";
import { verificationEmail } from "../../shared/adapters/mailer.js";
import { User, toPublicUser } from "./user.model.js";

const OTP_TTL_MS = 15 * 60 * 1000;

/** Six digits, uniformly distributed, from a CSPRNG. */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contact?: string;
}

export async function registerUser(
  input: RegisterInput,
  role: Role,
  mailer: Mailer,
): Promise<{ token: string; user: PublicUser }> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError("An account with that email already exists", 409);
  }

  const code = generateOtp();
  const user = await User.create({
    ...input,
    role,
    verificationToken: code,
    verificationTokenExpiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await mailer.send({ to: user.email, ...verificationEmail(code) });

  return {
    token: signToken({ sub: user._id.toString(), role }),
    user: toPublicUser(user),
  };
}
```

The duplicate check runs before the email is sent, so a failed signup never sends mail — and the unique index still backstops a race, surfacing as 409 via the error handler's duplicate-key branch.

- [ ] **Step 5: Implement controller and routes**

`apps/api/src/modules/auth/auth.controller.ts`:

```ts
import type { RequestHandler } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { adminSignupSchema, learnerSignupSchema } from "./auth.schema.js";
import { registerUser } from "./auth.service.js";

export function signupAdmin(deps: AppDeps): RequestHandler {
  return async (req, res) => {
    const input = adminSignupSchema.parse(req.body);
    const result = await registerUser(input, "Admin", deps.mailer);
    res.status(201).json({
      success: true,
      message: "Account created. Check your email for a verification code.",
      ...result,
    });
  };
}

export function signupLearner(deps: AppDeps): RequestHandler {
  return async (req, res) => {
    const input = learnerSignupSchema.parse(req.body);
    const result = await registerUser(input, "Learner", deps.mailer);
    res.status(201).json({
      success: true,
      message: "Account created. Check your email for a verification code.",
      ...result,
    });
  };
}
```

`apps/api/src/modules/auth/auth.routes.ts`:

```ts
import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { signupAdmin, signupLearner } from "./auth.controller.js";

export function createAuthRouter(deps: AppDeps): Router {
  const router = Router();
  router.post("/signup/admin", signupAdmin(deps));
  router.post("/signup/learner", signupLearner(deps));
  return router;
}
```

- [ ] **Step 6: Mount the router in `app.ts`**

After the `/api/health` route and **before** `notFound`, add:

```ts
  app.use("/api/auth", createAuthRouter(deps));
```

Mount order still matters: routes first, then `notFound`, then `errorHandler`.

- [ ] **Step 7: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 48 tests for apps/api.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/auth apps/api/src/test/factories.ts apps/api/src/app.ts
git commit -m "feat(api): add admin and learner signup with email verification codes"
```

---

## Task 8: Login, check-auth, logout

**Files:**
- Create: `apps/api/src/modules/auth/auth.session.test.ts`
- Modify: `apps/api/src/modules/auth/auth.schema.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`, `apps/api/src/app.ts`

**Interfaces:**
- Produces: `loginUser(input: LoginInput): Promise<{ token: string; user: PublicUser }>`; routes `POST /api/auth/login`, `GET /api/auth/check-auth`, `POST /api/admin/auth/logout`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/auth/auth.session.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return createApp({ mailer: mail.mailer, imageStore: images.imageStore });
}

async function seedLearner(overrides: Record<string, unknown> = {}) {
  return User.create({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    password: "Password123",
    role: "Learner",
    ...overrides,
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("POST /api/auth/login", () => {
  it("returns a token and the user for correct credentials", async () => {
    await seedLearner();
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  // Review Focus 4
  it("accepts a differently-cased, padded email", async () => {
    await seedLearner();
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "  ADA@Example.COM ", password: "Password123" });
    expect(res.status).toBe(200);
  });

  it("records lastLogin", async () => {
    await seedLearner();
    await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    const user = await User.findOne({ email: "ada@example.com" });
    expect(user?.lastLogin).toBeInstanceOf(Date);
  });

  it("rejects a wrong password with 401", async () => {
    await seedLearner();
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "WrongPassword1" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("gives the same message for an unknown email as for a wrong password", async () => {
    await seedLearner();
    const unknown = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password123" });
    const wrong = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "WrongPassword1" });

    expect(unknown.status).toBe(401);
    expect(unknown.body.errors[0].message).toBe(wrong.body.errors[0].message);
  });

  it("rejects a disabled account", async () => {
    await seedLearner({ disabled: true });
    const res = await request(appWith())
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/check-auth", () => {
  it("returns the current user for a valid token", async () => {
    await seedLearner();
    const app = appWith();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("ada@example.com");
  });

  it("never leaks token fields", async () => {
    await seedLearner({ verificationToken: "123456", resetPasswordToken: "abc" });
    const app = appWith();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.body.user.verificationToken).toBeUndefined();
    expect(res.body.user.resetPasswordToken).toBeUndefined();
    expect(res.body.user.resetPasswordExpiresAt).toBeUndefined();
  });

  it("rejects an anonymous request with 401", async () => {
    const res = await request(appWith()).get("/api/auth/check-auth");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/auth/logout", () => {
  it("acknowledges logout for an authenticated user", async () => {
    await seedLearner();
    const app = appWith();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    const res = await request(app)
      .post("/api/admin/auth/logout")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects an anonymous logout with 401", async () => {
    const res = await request(appWith()).post("/api/admin/auth/logout");
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 for `/api/auth/login`.

- [ ] **Step 3: Add the login schema**

Append to `auth.schema.ts`:

```ts
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

Login deliberately does **not** reuse the strong-password validator — an existing account with a legacy password must still be able to log in and be told its credentials are wrong, not that its password is badly formed.

- [ ] **Step 4: Add the login service**

Append to `auth.service.ts`:

```ts
import type { LoginInput } from "./auth.schema.js";

export async function loginUser(
  input: LoginInput,
): Promise<{ token: string; user: PublicUser }> {
  const user = await User.findOne({ email: input.email }).select("+password");

  // One message for both branches so the endpoint cannot be used to discover
  // which email addresses have accounts.
  const invalid = new AppError("Invalid email or password", 401);
  if (!user || user.disabled) throw invalid;
  if (!(await user.comparePassword(input.password))) throw invalid;

  user.lastLogin = new Date();
  await user.save();

  return {
    token: signToken({ sub: user._id.toString(), role: user.role }),
    user: toPublicUser(user),
  };
}
```

- [ ] **Step 5: Add controllers and routes**

Append to `auth.controller.ts`:

```ts
import { loginSchema } from "./auth.schema.js";
import { loginUser } from "./auth.service.js";
import { toPublicUser } from "./user.model.js";
import { AppError } from "../../shared/errors/AppError.js";

export const login: RequestHandler = async (req, res) => {
  const result = await loginUser(loginSchema.parse(req.body));
  res.status(200).json({ success: true, message: "Logged in", ...result });
};

export const checkAuth: RequestHandler = (req, res) => {
  if (!req.user) throw new AppError("Not authorised", 401);
  res.status(200).json({ success: true, user: toPublicUser(req.user) });
};

export const logout: RequestHandler = (_req, res) => {
  // The token is stateless and held by the client; logout is the client
  // discarding it. The endpoint exists so both portals have something to call.
  res.status(200).json({ success: true, message: "Logged out" });
};
```

In `auth.routes.ts` add:

```ts
  router.post("/login", login);
  router.get("/check-auth", authenticate, checkAuth);
```

The logout path lives outside `/api/auth`, so mount it separately in `app.ts`, after the auth router and before `notFound`:

```ts
  app.post("/api/admin/auth/logout", authenticate, logout);
```

This reproduces the existing contract exactly — both portals call `/admin/auth/logout`. Phase 6 adds `/api/auth/logout` alongside it.

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 59 tests for apps/api.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/auth apps/api/src/app.ts
git commit -m "feat(api): add login, check-auth and logout"
```

---

## Task 9: Rate limiting

Applied before the endpoints that need it exist in Task 10, so their tests are written against the limiter already in place.

**Files:**
- Create: `apps/api/src/shared/rateLimit.ts`, `apps/api/src/shared/rateLimit.test.ts`
- Modify: `apps/api/src/modules/auth/auth.routes.ts`

**Interfaces:**
- Produces: `loginLimiter`, `emailLimiter`, `otpLimiter` — all `RequestHandler`s, all disabled when `NODE_ENV === "test"` unless `RATE_LIMIT_IN_TESTS` is set.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/shared/rateLimit.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { makeLimiter } from "./rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";

afterEach(() => {
  delete process.env.RATE_LIMIT_IN_TESTS;
});

function app(limiter: express.RequestHandler) {
  const instance = express();
  instance.post("/thing", limiter, (_req, res) => res.json({ success: true }));
  instance.use(errorHandler);
  return instance;
}

describe("rate limiting", () => {
  it("blocks past the limit with the error envelope and a 429", async () => {
    process.env.RATE_LIMIT_IN_TESTS = "1";
    const limiter = makeLimiter({ windowMs: 60_000, max: 2 });
    const instance = app(limiter);

    await request(instance).post("/thing").expect(200);
    await request(instance).post("/thing").expect(200);
    const res = await request(instance).post("/thing");

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toMatch(/too many/i);
  });

  it("is inert in tests unless explicitly enabled", async () => {
    const limiter = makeLimiter({ windowMs: 60_000, max: 1 });
    const instance = app(limiter);
    await request(instance).post("/thing").expect(200);
    await request(instance).post("/thing").expect(200);
    await request(instance).post("/thing").expect(200);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./rateLimit.js`.

- [ ] **Step 3: Add the dependency and implement**

`express-rate-limit` is already declared in `apps/api/package.json` from Phase 0. Create `apps/api/src/shared/rateLimit.ts`:

```ts
import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import type { ApiErrorResponse } from "@learnbase/types";

const PASS_THROUGH: RequestHandler = (_req, _res, next) => next();

export interface LimiterOptions {
  windowMs: number;
  max: number;
}

/**
 * Limiters are inert under NODE_ENV=test so suites do not trip each other,
 * except when RATE_LIMIT_IN_TESTS is set — which is how the limiter's own
 * behaviour is tested.
 */
export function makeLimiter(options: LimiterOptions): RequestHandler {
  if (process.env.NODE_ENV === "test" && !process.env.RATE_LIMIT_IN_TESTS) {
    return PASS_THROUGH;
  }

  const body: ApiErrorResponse = {
    success: false,
    errors: [{ message: "Too many requests. Please try again later." }],
  };

  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(body);
    },
  });
}

export const loginLimiter = makeLimiter({ windowMs: 15 * 60_000, max: 10 });
export const emailLimiter = makeLimiter({ windowMs: 60 * 60_000, max: 5 });
export const otpLimiter = makeLimiter({ windowMs: 15 * 60_000, max: 10 });
```

Vitest sets `NODE_ENV=test` automatically.

- [ ] **Step 4: Apply the limiters**

In `auth.routes.ts`, wrap the existing login route: `router.post("/login", loginLimiter, login);`

- [ ] **Step 5: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 61 tests for apps/api.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/shared/rateLimit.ts apps/api/src/shared/rateLimit.test.ts apps/api/src/modules/auth/auth.routes.ts
git commit -m "feat(api): add rate limiters for auth endpoints"
```

---

## Task 10: Email verification and resend

Covers Review Focus item 3 (OTP brute force).

**Files:**
- Create: `apps/api/src/modules/auth/auth.verify.test.ts`
- Modify: `auth.schema.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`

**Interfaces:**
- Produces: `verifyEmail(user, token)`, `resendVerification(user, mailer)`; routes `POST /api/auth/verify-email`, `POST /api/auth/resend-token`. Both require a bearer token — `resend-token` takes no body, so the user can only come from the session.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/auth/auth.verify.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return { app: createApp({ mailer: mail.mailer, imageStore: images.imageStore }), sent: mail.sent };
}

const signup = {
  firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
  password: "Password123", confirmPassword: "Password123",
};

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function signUp() {
  const { app, sent } = appWith();
  const res = await request(app).post("/api/auth/signup/learner").send(signup);
  return { app, sent, token: res.body.token as string };
}

async function codeFor(email: string): Promise<string> {
  const user = await User.findOne({ email }).select("+verificationToken");
  return user!.verificationToken!;
}

describe("POST /api/auth/verify-email", () => {
  it("verifies with the correct code and clears it", async () => {
    const { app, token } = await signUp();
    const code = await codeFor("ada@example.com");

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(200);
    expect(res.body.user.isVerified).toBe(true);

    const user = await User.findOne({ email: "ada@example.com" }).select(
      "+verificationToken +verificationTokenExpiresAt",
    );
    expect(user?.verificationToken).toBeUndefined();
    expect(user?.verificationTokenExpiresAt).toBeUndefined();
  });

  it("rejects a wrong code with 400 and leaves the account unverified", async () => {
    const { app, token } = await signUp();
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: "000000" });

    expect(res.status).toBe(400);
    const user = await User.findOne({ email: "ada@example.com" });
    expect(user?.isVerified).toBe(false);
  });

  it("rejects an expired code", async () => {
    const { app, token } = await signUp();
    const code = await codeFor("ada@example.com");
    await User.updateOne(
      { email: "ada@example.com" },
      { verificationTokenExpiresAt: new Date(Date.now() - 1000) },
    );

    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch(/expired/i);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app).post("/api/auth/verify-email").send({ token: "123456" });
    expect(res.status).toBe(401);
  });

  // Review Focus 3
  it("locks verification after repeated wrong codes", async () => {
    const { app, token } = await signUp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: "000000" });
    }

    // Even the CORRECT code must now be refused — the window is burnt.
    const code = await codeFor("ada@example.com");
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(429);
    const user = await User.findOne({ email: "ada@example.com" });
    expect(user?.isVerified).toBe(false);
  });
});

describe("POST /api/auth/resend-token", () => {
  it("issues a new code and emails it, with no request body", async () => {
    const { app, sent, token } = await signUp();
    const first = await codeFor("ada@example.com");
    sent.length = 0;

    const res = await request(app)
      .post("/api/auth/resend-token")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    const second = await codeFor("ada@example.com");
    expect(second).not.toBe(first);
    expect(sent[0].html).toContain(second);
  });

  it("resets the failed-attempt counter", async () => {
    const { app, token } = await signUp();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post("/api/auth/verify-email")
        .set("Authorization", `Bearer ${token}`)
        .send({ token: "000000" });
    }

    await request(app).post("/api/auth/resend-token").set("Authorization", `Bearer ${token}`);

    const code = await codeFor("ada@example.com");
    const res = await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });

    expect(res.status).toBe(200);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app).post("/api/auth/resend-token");
    expect(res.status).toBe(401);
  });

  it("does nothing for an already-verified account", async () => {
    const { app, sent, token } = await signUp();
    const code = await codeFor("ada@example.com");
    await request(app)
      .post("/api/auth/verify-email")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: code });
    sent.length = 0;

    const res = await request(app)
      .post("/api/auth/resend-token")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(sent).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 for `/api/auth/verify-email`.

- [ ] **Step 3: Add the schema**

Append to `auth.schema.ts`:

```ts
export const verifyEmailSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});
```

- [ ] **Step 4: Add the services**

Append to `auth.service.ts`:

```ts
import type { UserDocument } from "./user.model.js";

const MAX_VERIFICATION_ATTEMPTS = 5;

export async function verifyEmail(
  userId: string,
  submitted: string,
): Promise<PublicUser> {
  const user = await User.findById(userId).select(
    "+verificationToken +verificationTokenExpiresAt +verificationAttempts",
  );
  if (!user) throw new AppError("Not authorised", 401);
  if (user.isVerified) return toPublicUser(user);

  if ((user.verificationAttempts ?? 0) >= MAX_VERIFICATION_ATTEMPTS) {
    throw new AppError(
      "Too many incorrect codes. Request a new one to try again.",
      429,
    );
  }

  const expired =
    !user.verificationTokenExpiresAt ||
    user.verificationTokenExpiresAt.getTime() < Date.now();

  if (!user.verificationToken || expired) {
    throw new AppError("That code has expired. Request a new one.", 400);
  }

  if (user.verificationToken !== submitted) {
    user.verificationAttempts = (user.verificationAttempts ?? 0) + 1;
    await user.save();
    throw new AppError("That code is not correct", 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  user.verificationAttempts = 0;
  await user.save();

  return toPublicUser(user);
}

export async function resendVerification(
  user: UserDocument,
  mailer: Mailer,
): Promise<void> {
  if (user.isVerified) return;

  const code = generateOtp();
  await User.updateOne(
    { _id: user._id },
    {
      verificationToken: code,
      verificationTokenExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      verificationAttempts: 0,
    },
  );

  await mailer.send({ to: user.email, ...verificationEmail(code) });
}
```

The attempt counter lives on the user rather than in the rate limiter because the limit must follow the account, not the IP — otherwise an attacker rotates IPs.

- [ ] **Step 5: Add controllers and routes**

Append to `auth.controller.ts`:

```ts
import { verifyEmailSchema } from "./auth.schema.js";
import { verifyEmail, resendVerification } from "./auth.service.js";

export const verifyEmailHandler: RequestHandler = async (req, res) => {
  if (!req.user) throw new AppError("Not authorised", 401);
  const { token } = verifyEmailSchema.parse(req.body);
  const user = await verifyEmail(req.user._id.toString(), token);
  res.status(200).json({ success: true, message: "Email verified", user });
};

export function resendToken(deps: AppDeps): RequestHandler {
  return async (req, res) => {
    if (!req.user) throw new AppError("Not authorised", 401);
    await resendVerification(req.user, deps.mailer);
    res.status(200).json({
      success: true,
      message: "If your account needs verifying, a new code is on its way.",
    });
  };
}
```

In `auth.routes.ts`:

```ts
  router.post("/verify-email", authenticate, otpLimiter, verifyEmailHandler);
  router.post("/resend-token", authenticate, emailLimiter, resendToken(deps));
```

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 70 tests for apps/api.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/auth
git commit -m "feat(api): add email verification with attempt limiting and resend"
```

---

## Task 11: Password reset

Covers Review Focus items 1 (`baseResetURL` allowlist) and 2 (single-use, expiring tokens).

**Files:**
- Create: `apps/api/src/modules/auth/auth.reset.test.ts`, `apps/api/src/shared/auth/clientOrigins.ts`
- Modify: `auth.schema.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`, `apps/api/.env.example`

**Interfaces:**
- Produces:
  - `assertAllowedResetUrl(candidate: string): string` — returns the URL or throws `AppError(400)`
  - `requestPasswordReset(email, baseResetURL, mailer)`, `resetPassword(rawToken, newPassword)`
  - Routes `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/:id`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/auth/auth.reset.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return { app: createApp({ mailer: mail.mailer, imageStore: images.imageStore }), sent: mail.sent };
}

const ADMIN_ORIGIN = "https://admin.example.com";
const LEARNER_ORIGIN = "https://learner.example.com";

beforeEach(async () => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
  process.env.CLIENT_ADMIN_URL = ADMIN_ORIGIN;
  process.env.CLIENT_LEARNER_URL = LEARNER_ORIGIN;
  await User.create({
    firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
    password: "Password123", role: "Learner",
  });
});

function linkFrom(text: string): string {
  const match = text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`no link in: ${text}`);
  return match[0];
}

describe("POST /api/auth/forgot-password", () => {
  it("emails a reset link built from an allowed origin", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${LEARNER_ORIGIN}/reset-password` });

    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(linkFrom(sent[0].text)).toContain(`${LEARNER_ORIGIN}/reset-password/`);
  });

  // Review Focus 1 — the important one
  it("refuses a baseResetURL on an origin we do not control, and sends nothing", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: "https://evil.example/reset-password" });

    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
    const user = await User.findOne({ email: "ada@example.com" }).select("+resetPasswordToken");
    expect(user?.resetPasswordToken).toBeUndefined();
  });

  it("refuses an origin that merely starts with an allowed one", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({
        email: "ada@example.com",
        baseResetURL: `${LEARNER_ORIGIN}.evil.example/reset-password`,
      });
    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("refuses a non-absolute baseResetURL", async () => {
    const { app, sent } = appWith();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: "//reset-password" });
    expect(res.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it("answers identically for an unknown email and sends nothing", async () => {
    const { app, sent } = appWith();
    const known = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${LEARNER_ORIGIN}/reset-password` });
    sent.length = 0;
    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com", baseResetURL: `${LEARNER_ORIGIN}/reset-password` });

    expect(unknown.status).toBe(known.status);
    expect(unknown.body.message).toBe(known.body.message);
    expect(sent).toHaveLength(0);
  });

  it("stores the token hashed, never in plain text", async () => {
    const { app, sent } = appWith();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${ADMIN_ORIGIN}/reset-password` });

    const raw = linkFrom(sent[0].text).split("/").pop()!;
    const user = await User.findOne({ email: "ada@example.com" }).select("+resetPasswordToken");
    expect(user?.resetPasswordToken).toBeDefined();
    expect(user?.resetPasswordToken).not.toBe(raw);
    expect(user?.resetPasswordToken).toBe(
      crypto.createHash("sha256").update(raw).digest("hex"),
    );
  });
});

describe("POST /api/auth/reset-password/:id", () => {
  async function startReset() {
    const { app, sent } = appWith();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "ada@example.com", baseResetURL: `${ADMIN_ORIGIN}/reset-password` });
    return { app, raw: linkFrom(sent[0].text).split("/").pop()! };
  }

  it("changes the password and lets the user log in with it", async () => {
    const { app, raw } = await startReset();
    const res = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });

    expect(res.status).toBe(200);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "NewPassword123" });
    expect(login.status).toBe(200);
  });

  // Review Focus 2
  it("refuses to reuse a token that already worked", async () => {
    const { app, raw } = await startReset();
    await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });

    const again = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "ThirdPassword123", confirmPassword: "ThirdPassword123" });

    expect(again.status).toBe(400);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "ThirdPassword123" });
    expect(login.status).toBe(401);
  });

  it("refuses an expired token", async () => {
    const { app, raw } = await startReset();
    await User.updateOne(
      { email: "ada@example.com" },
      { resetPasswordExpiresAt: new Date(Date.now() - 1000) },
    );

    const res = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });

    expect(res.status).toBe(400);
  });

  it("refuses an unknown token", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/reset-password/not-a-real-token")
      .send({ password: "NewPassword123", confirmPassword: "NewPassword123" });
    expect(res.status).toBe(400);
  });

  it("rejects mismatched passwords", async () => {
    const { app, raw } = await startReset();
    const res = await request(app)
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: "NewPassword123", confirmPassword: "Different123" });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 for `/api/auth/forgot-password`.

- [ ] **Step 3: Implement the origin allowlist**

Create `apps/api/src/shared/auth/clientOrigins.ts`:

```ts
import { AppError } from "../errors/AppError.js";

export function allowedOrigins(): string[] {
  return [
    process.env.CLIENT_ADMIN_URL,
    process.env.CLIENT_LEARNER_URL,
  ].filter((value): value is string => Boolean(value));
}

/**
 * The client tells us which URL to put in a password-reset email. Unchecked,
 * an attacker can request a reset for someone else's address with their own
 * URL and receive an email from our domain carrying a live reset token.
 * Compares parsed origins — never string prefixes, which `https://good.com.evil.com`
 * would satisfy.
 */
export function assertAllowedResetUrl(candidate: string): string {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new AppError("That reset URL is not valid", 400);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AppError("That reset URL is not valid", 400);
  }

  const permitted = new Set(
    allowedOrigins().map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin;
      }
    }),
  );

  if (!permitted.has(parsed.origin)) {
    throw new AppError("That reset URL is not allowed", 400);
  }

  return candidate;
}
```

- [ ] **Step 4: Add schemas**

Append to `auth.schema.ts`:

```ts
export const forgotPasswordSchema = z.object({
  email,
  baseResetURL: z.string().trim().min(1, "baseResetURL is required"),
});

export const resetPasswordSchema = withConfirmation({
  password,
  confirmPassword: z.string(),
});
```

- [ ] **Step 5: Add the services**

Append to `auth.service.ts`:

```ts
import { resetPasswordEmail } from "../../shared/adapters/mailer.js";
import { assertAllowedResetUrl } from "../../shared/auth/clientOrigins.js";

const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function requestPasswordReset(
  rawEmail: string,
  baseResetURL: string,
  mailer: Mailer,
): Promise<void> {
  // Validate the URL before any lookup, so a bad URL is rejected the same way
  // whether or not the account exists.
  const base = assertAllowedResetUrl(baseResetURL);

  const user = await User.findOne({ email: rawEmail });
  if (!user) return; // Same response either way — no account enumeration.

  const raw = crypto.randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: user._id },
    {
      resetPasswordToken: hashToken(raw),
      resetPasswordExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  );

  const link = `${base.replace(/\/+$/, "")}/${raw}`;
  await mailer.send({ to: user.email, ...resetPasswordEmail(link) });
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findOne({
    resetPasswordToken: hashToken(rawToken),
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpiresAt");

  if (!user) {
    throw new AppError("That reset link is invalid or has expired", 400);
  }

  user.password = newPassword; // pre-save hook hashes it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
}
```

Clearing the token in the same save that changes the password is what makes it single-use.

- [ ] **Step 6: Add controllers and routes**

Append to `auth.controller.ts`:

```ts
import { forgotPasswordSchema, resetPasswordSchema } from "./auth.schema.js";
import { requestPasswordReset, resetPassword } from "./auth.service.js";

export function forgotPassword(deps: AppDeps): RequestHandler {
  return async (req, res) => {
    const input = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(input.email, input.baseResetURL, deps.mailer);
    res.status(200).json({
      success: true,
      message: "If that email has an account, a reset link is on its way.",
    });
  };
}

export const resetPasswordHandler: RequestHandler = async (req, res) => {
  const { password } = resetPasswordSchema.parse(req.body);
  await resetPassword(req.params.id, password);
  res.status(200).json({ success: true, message: "Password updated" });
};
```

In `auth.routes.ts`:

```ts
  router.post("/forgot-password", emailLimiter, forgotPassword(deps));
  router.post("/reset-password/:id", resetPasswordHandler);
```

- [ ] **Step 7: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 82 tests for apps/api.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/auth apps/api/src/shared/auth/clientOrigins.ts apps/api/.env.example
git commit -m "feat(api): add password reset with origin allowlist and single-use tokens"
```

---

## Task 12: Change password and profile update

**Files:**
- Create: `apps/api/src/modules/auth/auth.profile.test.ts`
- Modify: `auth.schema.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`

**Interfaces:**
- Produces: `changePassword(user, newPassword)`, `updateProfile(user, fields, file, imageStore)`; routes `POST /api/auth/change-password`, `PUT /api/auth/update`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/auth/auth.profile.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore("https://images.example/uploaded.png");
  return {
    app: createApp({ mailer: mail.mailer, imageStore: images.imageStore }),
    uploads: images.uploads,
  };
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function authed(app: ReturnType<typeof createApp>) {
  await User.create({
    firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
    password: "Password123", role: "Learner",
  });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "ada@example.com", password: "Password123" });
  return login.body.token as string;
}

describe("POST /api/auth/change-password", () => {
  it("changes the password and the old one stops working", async () => {
    const { app } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "BrandNew123", confirmPassword: "BrandNew123" });

    expect(res.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "BrandNew123" });
    expect(newLogin.status).toBe(200);
  });

  it("rejects mismatched confirmation", async () => {
    const { app } = appWith();
    const token = await authed(app);
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "BrandNew123", confirmPassword: "Different123" });
    expect(res.status).toBe(400);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ password: "BrandNew123", confirmPassword: "BrandNew123" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/auth/update", () => {
  it("updates text fields and returns the updated user", async () => {
    const { app } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("firstName", "Augusta")
      .field("location", "London")
      .field("disabled", "false");

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe("Augusta");
    expect(res.body.user.location).toBe("London");
    expect(res.body.user.lastName).toBe("Lovelace");
  });

  it("uploads a profile image and stores the returned url", async () => {
    const { app, uploads } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("firstName", "Augusta")
      .attach("profileImage", PNG, { filename: "me.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.user.profileImage).toBe("https://images.example/uploaded.png");
    expect(uploads).toHaveLength(1);
  });

  it("leaves the existing image alone when no file is sent", async () => {
    const { app, uploads } = appWith();
    const token = await authed(app);
    await User.updateOne(
      { email: "ada@example.com" },
      { profileImage: "https://images.example/original.png" },
    );

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("firstName", "Augusta");

    expect(res.body.user.profileImage).toBe("https://images.example/original.png");
    expect(uploads).toHaveLength(0);
  });

  it("ignores attempts to change email, role or password", async () => {
    const { app } = appWith();
    const token = await authed(app);

    const res = await request(app)
      .put("/api/auth/update")
      .set("Authorization", `Bearer ${token}`)
      .field("email", "attacker@example.com")
      .field("role", "Admin")
      .field("password", "Hijacked123");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.role).toBe("Learner");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });
    expect(login.status).toBe(200);
  });

  it("rejects an anonymous request", async () => {
    const { app } = appWith();
    const res = await request(app).put("/api/auth/update").field("firstName", "X");
    expect(res.status).toBe(401);
  });
});
```

The privilege-escalation test is the one that matters: a mass-assignment bug here would let any learner make themselves an admin.

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 for `/api/auth/change-password`.

- [ ] **Step 3: Add schemas**

Append to `auth.schema.ts`:

```ts
export const changePasswordSchema = withConfirmation({
  password,
  confirmPassword: z.string(),
});

/**
 * Deliberately an allowlist. Anything not named here — email, role, password,
 * isVerified — is dropped, so a client cannot escalate its own privileges by
 * adding fields to the form.
 */
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  contact: z.string().trim().optional(),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  disabled: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => value === true || value === "true")
    .optional(),
});
```

`disabled` accepts a string because multipart form fields always arrive as strings.

- [ ] **Step 4: Add the services**

Append to `auth.service.ts`:

```ts
import type { ImageStore } from "../../shared/adapters/index.js";
import type { UpdateProfileInput } from "./auth.schema.js";

export async function changePassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("Not authorised", 401);
  user.password = newPassword;
  await user.save();
}

export async function updateProfile(
  userId: string,
  fields: UpdateProfileInput,
  file: Buffer | undefined,
  imageStore: ImageStore,
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Not authorised", 401);

  if (file) {
    user.profileImage = await imageStore.upload(file, "learnbase/profiles");
  }

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      (user as unknown as Record<string, unknown>)[key] = value;
    }
  }

  await user.save();
  return toPublicUser(user);
}
```

Add `export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;` to `auth.schema.ts`.

- [ ] **Step 5: Add controllers and routes**

Append to `auth.controller.ts`:

```ts
import { changePasswordSchema, updateProfileSchema } from "./auth.schema.js";
import { changePassword, updateProfile } from "./auth.service.js";

export const changePasswordHandler: RequestHandler = async (req, res) => {
  if (!req.user) throw new AppError("Not authorised", 401);
  const { password } = changePasswordSchema.parse(req.body);
  await changePassword(req.user._id.toString(), password);
  res.status(200).json({ success: true, message: "Password updated" });
};

export function updateProfileHandler(deps: AppDeps): RequestHandler {
  return async (req, res) => {
    if (!req.user) throw new AppError("Not authorised", 401);
    const fields = updateProfileSchema.parse(req.body);
    const user = await updateProfile(
      req.user._id.toString(),
      fields,
      req.file?.buffer,
      deps.imageStore,
    );
    res.status(200).json({ success: true, message: "Profile updated", user });
  };
}
```

In `auth.routes.ts`:

```ts
  router.post("/change-password", authenticate, changePasswordHandler);
  router.put(
    "/update",
    authenticate,
    uploadSingle("profileImage"),
    updateProfileHandler(deps),
  );
```

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 91 tests for apps/api.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/auth
git commit -m "feat(api): add change-password and profile update with image upload"
```

---

## Task 13: Contract conformance and the learner reset-URL fix

Proves every response matches `@learnbase/types`, and repairs the broken `baseResetURL` in the learner portal.

**Files:**
- Create: `apps/api/src/modules/auth/auth.contract.test.ts`
- Modify: `apps/learner/src/components/forgot-password-form.tsx`

**Interfaces:**
- Consumes: `JsonOf<T>` (Task 2) and every route built so far.

- [ ] **Step 1: Write the contract test**

Create `apps/api/src/modules/auth/auth.contract.test.ts`:

```ts
import { describe, it, expect, expectTypeOf, beforeEach } from "vitest";
import request from "supertest";
import type { AuthSuccessResponse, CheckAuthResponse, JsonOf } from "@learnbase/types";
import { createApp } from "../../app.js";
import { User } from "./user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function appWith() {
  const mail = fakeMailer();
  const images = fakeImageStore();
  return createApp({ mailer: mail.mailer, imageStore: images.imageStore });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

describe("auth responses match the shared contract", () => {
  it("signup returns the AuthSuccessResponse shape", async () => {
    const res = await request(appWith()).post("/api/auth/signup/learner").send({
      firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
      password: "Password123", confirmPassword: "Password123",
    });

    const body = res.body as JsonOf<AuthSuccessResponse>;
    expectTypeOf(body).toHaveProperty("token").toEqualTypeOf<string>();
    expectTypeOf(body).toHaveProperty("user");

    // The type says these exist; assert they really do at runtime.
    expect(typeof body.token).toBe("string");
    expect(typeof body.user._id).toBe("string");
    expect(typeof body.user.createdAt).toBe("string");
    expect(["Admin", "Learner"]).toContain(body.user.role);
    expect(typeof body.user.isVerified).toBe("boolean");
    expect(typeof body.user.__v).toBe("number");
  });

  it("check-auth returns the CheckAuthResponse shape", async () => {
    const app = appWith();
    await User.create({
      firstName: "Ada", lastName: "Lovelace", email: "ada@example.com",
      password: "Password123", role: "Learner",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Authorization", `Bearer ${login.body.token}`);

    const body = res.body as JsonOf<CheckAuthResponse>;
    expectTypeOf(body).toHaveProperty("user");
    expect(body.success).toBe(true);
    expect(typeof body.user.email).toBe("string");
    expect(Object.keys(body.user)).not.toContain("password");
  });

  it("every error response uses the envelope", async () => {
    const app = appWith();
    const cases = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "x@y.com", password: "nope" }),
      request(app).post("/api/auth/signup/admin").send({}),
      request(app).get("/api/auth/check-auth"),
      request(app).get("/api/nope"),
    ]);

    for (const res of cases) {
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(typeof res.body.errors[0].message).toBe("string");
    }
  });
});
```

Because `apps/api` now type-checks its tests (Task 1 of Phase 0's carry-forward, verified in this plan's Task 1), `JsonOf<AuthSuccessResponse>` is enforced at compile time — a response shape that drifts from the contract fails `pnpm run typecheck`.

- [ ] **Step 2: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
pnpm run typecheck
```

Expected: PASS — 94 tests for apps/api.

- [ ] **Step 3: Prove the contract test has teeth**

Temporarily change `toPublicUser` in `user.model.ts` to also delete `email`. Run `pnpm --filter @learnbase/api test` and confirm the contract test fails. Restore the file and confirm `git diff apps/api` is empty. Record both outcomes.

- [ ] **Step 4: Fix the learner portal's reset URL**

In `apps/learner/src/components/forgot-password-form.tsx`, change:

```ts
baseResetURL: `${import.meta.env.BASE_URL}/reset-password`,
```

to:

```ts
baseResetURL: `${import.meta.env.VITE_CLIENT_URL}/reset-password`,
```

`import.meta.env.BASE_URL` is Vite's **base path**, `/` by default — it produced `//reset-password`, which is not an absolute URL and cannot work in an email. The admin app already uses `VITE_CLIENT_URL`; this makes the two match. The new API's origin allowlist would reject the old value outright, so this is required for learner password reset to work at all.

- [ ] **Step 5: Verify both apps still build**

```bash
pnpm run build
pnpm run typecheck
pnpm run test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/auth/auth.contract.test.ts apps/learner/src/components/forgot-password-form.tsx
git commit -m "test(api): assert auth responses match the contract; fix learner reset url"
```

---

## Task 14: Wire it up end to end

**Files:**
- Modify: `apps/api/.env.example`, `apps/api/src/server.ts`
- Create: `apps/api/README.md`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Confirm `.env.example` is complete**

Check that every `process.env.X` read anywhere under `apps/api/src` appears in `apps/api/.env.example`:

```bash
grep -rho "process\.env\.[A-Z_]*" apps/api/src | sort -u | sed 's/process\.env\.//' > /tmp/used.txt
grep -o "^[A-Z_]*" apps/api/.env.example | sort -u > /tmp/declared.txt
comm -23 /tmp/used.txt /tmp/declared.txt
```

Expected: no output. Anything listed is read by code but undocumented — add it.

- [ ] **Step 2: Fail fast on missing secrets at boot**

In `apps/api/src/server.ts`, before connecting, validate the variables the API cannot run without:

```ts
const REQUIRED = ["MONGODB_URI", "JWT_SECRET"] as const;

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env.`,
  );
  process.exit(1);
}
```

Replace the existing `MONGODB_URI`-only check with this. A server that starts without `JWT_SECRET` fails on the first login instead of at boot, which is far harder to diagnose.

- [ ] **Step 3: Write `apps/api/README.md`**

```markdown
# LearnBase API

Express 5 + Mongoose backend for the LearnBase admin and learner portals.

## Running locally

1. `cp .env.example .env` and fill in the values.
2. From the repo root: `pnpm install`
3. `pnpm --filter @learnbase/api dev` — serves on http://localhost:5050

`GET /api/health` should return `{"success":true,"message":"LearnBase API is running"}`.

## Environment

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Connection string. Required. |
| `JWT_SECRET` | Signing secret. Required. Use a long random string. |
| `JWT_EXPIRES_IN` | Token lifetime. Defaults to `7d`. |
| `PORT` | Defaults to 5050. Port 5000 is taken by AirPlay on macOS. |
| `CLIENT_ADMIN_URL`, `CLIENT_LEARNER_URL` | CORS allowlist **and** the allowlist for password-reset links. |
| `SMTP_*`, `MAIL_FROM` | Brevo SMTP relay credentials. |
| `CLOUDINARY_*` | Image hosting. |

`CLIENT_ADMIN_URL` and `CLIENT_LEARNER_URL` are security-relevant: `POST /auth/forgot-password`
accepts a `baseResetURL` from the client and refuses any origin not listed there. Without
that check, anyone could have our server email a victim a reset link pointing at their own site.

## Tests

`pnpm --filter @learnbase/api test` — runs against an in-memory MongoDB. Email,
image upload and (later) payments are reached only through adapters in
`src/shared/adapters/`, which tests replace with fakes. No test touches the network.

## Layout

    src/modules/auth/    routes, controller, service, model, schemas, tests
    src/shared/          middleware, adapters, errors, db, rate limiting
```

- [ ] **Step 4: Manual end-to-end check against a real database**

With a real `.env` (Atlas or local mongod) and real Brevo credentials:

```bash
pnpm --filter @learnbase/api dev
```

Then in another shell:

```bash
curl -s -X POST http://localhost:5050/api/auth/signup/learner \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Test","lastName":"User","email":"you@yourdomain.com","password":"Password123","confirmPassword":"Password123"}'
```

Confirm: HTTP 201, a token in the response, no `password` field on the user, and a verification email actually arrives. Then verify it:

```bash
curl -s -X POST http://localhost:5050/api/auth/verify-email \
  -H 'Content-Type: application/json' -H "Authorization: Bearer <token>" \
  -d '{"token":"<the 6 digits from the email>"}'
```

Record the real output of both in your report. This is the only step that exercises Brevo — everything else runs against fakes.

- [ ] **Step 5: Final verification**

```bash
pnpm run build
pnpm run test
pnpm run typecheck
pnpm run lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/README.md apps/api/src/server.ts apps/api/.env.example
git commit -m "docs(api): add readme and fail fast on missing secrets"
```

---

## Definition of Done

- [ ] All 11 contract endpoints respond, mounted under `/api`.
- [ ] `pnpm run build`, `test`, `typecheck` and `lint` all pass from the root.
- [ ] ~94 tests in `apps/api`, plus 18 type tests in `packages/types`.
- [ ] No response anywhere contains `password`, `verificationToken`, `verificationTokenExpiresAt`, `resetPasswordToken` or `resetPasswordExpiresAt`.
- [ ] `POST /auth/forgot-password` refuses a `baseResetURL` outside the configured client origins, and sends no email when it does.
- [ ] Reset tokens are stored hashed, expire after an hour, and cannot be reused.
- [ ] `verify-email` locks after 5 wrong codes; `resend-token` clears the lock.
- [ ] `PUT /auth/update` cannot change email, role or password.
- [ ] Login is identical for an unknown email and a wrong password.
- [ ] No test touches the network; email and image upload are faked at the adapter seam.
- [ ] A real signup and verification round-trip has been performed against Brevo and recorded.

## Not in this phase

- Tracks, courses, learners, invoices, enrollments, payments — Phases 2–4.
- The Paystack webhook's raw-body requirement. When it lands, `express.json()` must **not** apply to that route; mount `express.raw({ type: "application/json" })` on the webhook path before the global JSON parser.
- The `/api/auth/logout` alias, the `check-auth` leading-slash fix, and the httpOnly cookie migration — Phase 6.
- Pointing the frontends at this API. That is the Phase 5 cutover, which changes both `VITE_SERVER_URL` and the `rewrites` block in each `vercel.json`, and must make the learner 401 interceptor defensive.
