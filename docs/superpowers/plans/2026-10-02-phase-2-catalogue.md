# LearnBase Phase 2 — Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the thirteen catalogue endpoints — tracks, courses, learners and the invoice list — so the four frontend feature areas currently returning 404 work again.

**Architecture:** Three new feature modules under `apps/api/src/modules/`, each owning its routes, controller, service, model and zod schemas, following the shape `modules/auth` already established. Public reads, admin-gated writes. Responses are built by explicit mappers rather than casts, so a drifted shape is a compile error.

**Tech Stack:** Express 5, Mongoose 8, TypeScript 5.8, zod 4, multer, Cloudinary, Vitest 2, Supertest 7, mongodb-memory-server 10

**Spec:** `docs/superpowers/specs/2026-09-22-learnbase-api-design.md`
**Prior phase:** `docs/superpowers/plans/2026-09-25-phase-1-outcomes.md`

## Global Constraints

- Node 20+. pnpm only — never `npm install`.
- Every route is mounted beneath `/api`. Errors are always `{ success: false, errors: [{ message }] }`, produced only by `errorHandler`.
- `apps/api` is ESM with NodeNext resolution: every relative import carries a `.js` extension.
- `typecheck` includes test files. Never use `@ts-ignore`, `@ts-expect-error`, `as any`, or `as unknown as`. Phase 1's final review flagged the one cast in the codebase; do not add another.
- Handlers declare `Response<T>` with the contract type from `@learnbase/types`.
- Responses are built by explicit mappers (`toPublicTrack`, `toPublicCourse`), the way `toPublicUser` already works — assigned to the contract type, never cast to it.
- **Population depth is exact.** `Track.admin` is a full `User`; `Track.courses[].admin` and `Track.courses[].track` are string ids. `Course.admin` is a full `User`; `Course.track.admin` is a string id. Populating one level too deep is a contract mismatch.
- Admin-only routes use `authenticate` then `requireRole("Admin")`. Public reads use neither.
- Uploads go through `uploadSingle("image")` and `deps.imageStore.upload(buffer, folder)`.
- No test may touch the network. Email and image upload are faked at the adapter seam via `apps/api/src/test/factories.ts`.
- `pnpm run build`, `test`, `typecheck` and `lint` must all pass from the repo root at the end of every task.
- Commit messages carry no attribution trailers of any kind.

## Review Focus

Five failure modes the spec implies but that no endpoint's happy path would catch. Each has a test assigned to the task that owns it.

1. **Deleting a track that still has courses** (Task 5). The spec defines both entities and the `track` reference but never says what deletion does. Unhandled, the courses survive pointing at a track that no longer exists, `Course.track` populates to `null`, and the admin's course table crashes on `course.track.name`. Expected: the API refuses to delete a track that still has courses, naming the count.
2. **A learner reaching admin-only mutations** (Task 5, Task 7). It is easy to gate the list route and forget one of create/update/delete. Expected: every mutation returns 403 for a Learner, verified route by route, not just on one representative.
3. **A malformed id in a path parameter** (Task 4). `/api/tracks/not-an-id` must return 400 through the CastError branch, never a 500. Every `:id` route shares this exposure.
4. **`price` arrives as a string from multipart** (Task 5). `formData.append("price", price)` always sends text. `"0"` must be accepted, `"abc"` must 400, and nothing may reach the database as `NaN`.
5. **`GET /invoices` as a learner must not leak other learners' invoices** (Task 8). One role-aware handler serves both audiences, which is exactly where a missing filter silently returns everything. Expected: a learner sees only their own, proven with two learners' data present.

---

## File Structure

| Path | Responsibility |
|---|---|
| `apps/api/src/modules/tracks/track.model.ts` | Track schema, `courses` virtual, `toPublicTrack` |
| `apps/api/src/modules/tracks/track.schema.ts` | zod validators for create/update |
| `apps/api/src/modules/tracks/track.service.ts` | Track business logic |
| `apps/api/src/modules/tracks/track.controller.ts` | Request → service → typed response |
| `apps/api/src/modules/tracks/track.routes.ts` | Route table and guards |
| `apps/api/src/modules/courses/` | Same five files for Course |
| `apps/api/src/modules/learners/learner.routes.ts` | Admin-only learner reads |
| `apps/api/src/modules/invoices/invoice.model.ts` | Invoice schema (read-only this phase) |
| `apps/api/src/modules/invoices/invoice.routes.ts` | Role-aware invoice list |

**Modified:** `apps/api/src/app.ts` (mount four routers).

---

## Task 1: Track model

**Files:**
- Create: `apps/api/src/modules/tracks/track.model.ts`, `apps/api/src/modules/tracks/track.model.test.ts`

**Interfaces:**
- Consumes: `User` model from `modules/auth/user.model.js`.
- Produces:
  - `Track` (the model), `TrackDocument`
  - `toPublicTrack(doc: TrackDocument): PublicTrack` where `PublicTrack` is the contract `Track`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/tracks/track.model.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { User } from "../auth/user.model.js";
import { Track, toPublicTrack } from "./track.model.js";

async function anAdmin() {
  return User.create({
    firstName: "Ada", lastName: "Admin", email: "admin@example.com",
    password: "Password123", role: "Admin",
  });
}

const base = {
  name: "Software Development",
  price: 350,
  instructor: "Kwame Mensah",
  duration: "12 weeks",
  image: "https://images.example/track.png",
  description: "Full stack engineering.",
};

describe("Track model", () => {
  it("stores a track with its admin", async () => {
    const admin = await anAdmin();
    const track = await Track.create({ ...base, admin: admin._id });
    expect(track.name).toBe("Software Development");
    expect(track.price).toBe(350);
    expect(track.ratings).toEqual([]);
  });

  it("requires every field the contract marks required", async () => {
    const admin = await anAdmin();
    await expect(Track.create({ admin: admin._id, name: "Only a name" })).rejects.toThrow();
  });

  it("rejects a negative price", async () => {
    const admin = await anAdmin();
    await expect(Track.create({ ...base, price: -1, admin: admin._id })).rejects.toThrow();
  });

  it("exposes id alongside _id, because the contract has both", async () => {
    const admin = await anAdmin();
    const track = await Track.create({ ...base, admin: admin._id });
    const json = track.toJSON() as Record<string, unknown>;
    expect(typeof json.id).toBe("string");
    expect(typeof json._id).toBeDefined();
  });

  it("toPublicTrack returns the populated admin without credential fields", async () => {
    const admin = await anAdmin();
    const created = await Track.create({ ...base, admin: admin._id });
    const loaded = await Track.findById(created._id).populate("admin");
    const publicTrack = toPublicTrack(loaded!);

    expect(publicTrack.admin.email).toBe("admin@example.com");
    const adminRecord = publicTrack.admin as unknown as Record<string, unknown>;
    expect(adminRecord.password).toBeUndefined();
    expect(adminRecord.verificationToken).toBeUndefined();
    expect(adminRecord.resetPasswordToken).toBeUndefined();
  });

  it("toPublicTrack returns an empty courses array when none are attached", async () => {
    const admin = await anAdmin();
    const created = await Track.create({ ...base, admin: admin._id });
    const loaded = await Track.findById(created._id).populate("admin").populate("courses");
    expect(toPublicTrack(loaded!).courses).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./track.model.js`.

- [ ] **Step 3: Implement `apps/api/src/modules/tracks/track.model.ts`**

```ts
import mongoose, { Schema, model, type Document, type Model } from "mongoose";
import type {
  Track as PublicTrack,
  TrackCourseRef,
  TrackRating,
} from "@learnbase/types";
import { toPublicUser, type UserDocument } from "../auth/user.model.js";

export interface TrackDocument extends Document {
  _id: mongoose.Types.ObjectId;
  admin: mongoose.Types.ObjectId | UserDocument;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  ratings: mongoose.Types.DocumentArray<mongoose.Document>;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const ratingSchema = new Schema(
  {
    learner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const trackSchema = new Schema<TrackDocument>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    instructor: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    ratings: { type: [ratingSchema], default: [] },
  },
  {
    timestamps: true,
    // The contract's Track carries BOTH _id and id; Course carries only _id.
    // That asymmetry is Mongoose's id virtual, enabled here and nowhere else.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Courses point at tracks, so the relationship is derived rather than stored.
// A stored array would drift the moment a course was deleted.
trackSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "track",
});

export const Track: Model<TrackDocument> =
  (mongoose.models.Track as Model<TrackDocument>) ??
  model<TrackDocument>("Track", trackSchema);

function isPopulatedAdmin(
  value: mongoose.Types.ObjectId | UserDocument,
): value is UserDocument {
  return value instanceof mongoose.Document;
}

/**
 * Builds the contract shape explicitly. Assigned to PublicTrack rather than
 * cast, so a field that drifts from the contract fails to compile.
 */
export function toPublicTrack(doc: TrackDocument): PublicTrack {
  const json = doc.toObject({ virtuals: true }) as Record<string, unknown>;
  const populatedCourses = (json.courses as Record<string, unknown>[]) ?? [];

  return {
    _id: doc._id.toString(),
    id: doc._id.toString(),
    admin: isPopulatedAdmin(doc.admin)
      ? toPublicUser(doc.admin)
      : (doc.admin.toString() as unknown as PublicTrack["admin"]),
    name: doc.name,
    price: doc.price,
    instructor: doc.instructor,
    duration: doc.duration,
    image: doc.image,
    description: doc.description,
    courses: populatedCourses.map((course): TrackCourseRef => ({
      _id: String(course._id),
      admin: String(course.admin),
      track: String(course.track),
      title: String(course.title),
      image: String(course.image),
      description: String(course.description),
      createdAt: course.createdAt as Date,
      updatedAt: course.updatedAt as Date,
      __v: Number(course.__v ?? 0),
    })),
    ratings: (json.ratings as TrackRating[]) ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    __v: doc.__v,
  };
}
```

Note the `admin` branch: when unpopulated it falls back to the id string. Services in later tasks always populate, so that branch exists only to keep the function total.

- [ ] **Step 4: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 6 new tests.

- [ ] **Step 5: Verify the tests have teeth**

Mutate three behaviours, confirming the suite fails each time and restoring after each: remove `toJSON: { virtuals: true }` (the `id` test must fail); remove `min: 0` from price (the negative-price test must fail); return `doc.admin` raw instead of `toPublicUser(doc.admin)` in the populated branch (the credential test must fail — if it does NOT, say so plainly). Confirm `git diff apps/api` is empty.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/tracks/track.model.ts apps/api/src/modules/tracks/track.model.test.ts
git commit -m "feat(api): add track model with courses virtual"
```

---

## Task 2: Course model

**Files:**
- Create: `apps/api/src/modules/courses/course.model.ts`, `apps/api/src/modules/courses/course.model.test.ts`

**Interfaces:**
- Consumes: `Track` (Task 1), `User`, `toPublicUser`.
- Produces: `Course` (model), `CourseDocument`, `toPublicCourse(doc: CourseDocument): PublicCourse`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/courses/course.model.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { User } from "../auth/user.model.js";
import { Track } from "../tracks/track.model.js";
import { Course, toPublicCourse } from "./course.model.js";

async function seed() {
  const admin = await User.create({
    firstName: "Ada", lastName: "Admin", email: "admin@example.com",
    password: "Password123", role: "Admin",
  });
  const track = await Track.create({
    admin: admin._id, name: "Software Development", price: 350,
    instructor: "Kwame Mensah", duration: "12 weeks",
    image: "https://images.example/track.png", description: "Full stack.",
  });
  return { admin, track };
}

describe("Course model", () => {
  it("stores a course against its track and admin", async () => {
    const { admin, track } = await seed();
    const course = await Course.create({
      admin: admin._id, track: track._id, title: "Intro to React",
      image: "https://images.example/course.png", description: "Components.",
    });
    expect(course.title).toBe("Intro to React");
  });

  it("requires a track", async () => {
    const { admin } = await seed();
    await expect(
      Course.create({
        admin: admin._id, title: "Orphan",
        image: "https://images.example/c.png", description: "No track.",
      }),
    ).rejects.toThrow();
  });

  it("does NOT expose an id virtual, unlike Track", async () => {
    const { admin, track } = await seed();
    const course = await Course.create({
      admin: admin._id, track: track._id, title: "Intro to React",
      image: "https://images.example/course.png", description: "Components.",
    });
    const json = course.toJSON() as Record<string, unknown>;
    expect(json.id).toBeUndefined();
  });

  it("appears in its track's courses virtual", async () => {
    const { admin, track } = await seed();
    await Course.create({
      admin: admin._id, track: track._id, title: "Intro to React",
      image: "https://images.example/course.png", description: "Components.",
    });
    const loaded = await Track.findById(track._id).populate("courses");
    const courses = (loaded!.toObject({ virtuals: true }) as { courses: unknown[] }).courses;
    expect(courses).toHaveLength(1);
  });

  it("toPublicCourse populates admin fully but leaves track.admin as an id", async () => {
    const { admin, track } = await seed();
    const created = await Course.create({
      admin: admin._id, track: track._id, title: "Intro to React",
      image: "https://images.example/course.png", description: "Components.",
    });
    const loaded = await Course.findById(created._id)
      .populate("admin")
      .populate("track");
    const publicCourse = toPublicCourse(loaded!);

    expect(publicCourse.admin.email).toBe("admin@example.com");
    expect(publicCourse.track.name).toBe("Software Development");
    // The contract types track.admin as a string id, not a nested object.
    expect(typeof publicCourse.track.admin).toBe("string");
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./course.model.js`.

- [ ] **Step 3: Implement `apps/api/src/modules/courses/course.model.ts`**

```ts
import mongoose, { Schema, model, type Document, type Model } from "mongoose";
import type { Course as PublicCourse, CourseTrackRef } from "@learnbase/types";
import { toPublicUser, type UserDocument } from "../auth/user.model.js";
import type { TrackDocument } from "../tracks/track.model.js";

export interface CourseDocument extends Document {
  _id: mongoose.Types.ObjectId;
  admin: mongoose.Types.ObjectId | UserDocument;
  track: mongoose.Types.ObjectId | TrackDocument;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const courseSchema = new Schema<CourseDocument>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    track: { type: Schema.Types.ObjectId, ref: "Track", required: true, index: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
  },
  // No virtuals: the contract's Course has _id but no id, unlike Track.
  { timestamps: true },
);

export const Course: Model<CourseDocument> =
  (mongoose.models.Course as Model<CourseDocument>) ??
  model<CourseDocument>("Course", courseSchema);

function isDoc<T extends mongoose.Document>(
  value: mongoose.Types.ObjectId | T,
): value is T {
  return value instanceof mongoose.Document;
}

/** Builds the contract shape explicitly rather than casting. */
export function toPublicCourse(doc: CourseDocument): PublicCourse {
  const track = doc.track;

  const trackRef: CourseTrackRef = isDoc<TrackDocument>(track)
    ? {
        _id: track._id.toString(),
        id: track._id.toString(),
        // The contract wants an id here, not a nested admin object.
        admin: track.admin.toString(),
        name: track.name,
        price: track.price,
        instructor: track.instructor,
        duration: track.duration,
        image: track.image,
        description: track.description,
        createdAt: track.createdAt,
        updatedAt: track.updatedAt,
        __v: track.__v,
      }
    : ({ _id: track.toString() } as unknown as CourseTrackRef);

  return {
    _id: doc._id.toString(),
    admin: isDoc<UserDocument>(doc.admin)
      ? toPublicUser(doc.admin)
      : (doc.admin.toString() as unknown as PublicCourse["admin"]),
    track: trackRef,
    title: doc.title,
    image: doc.image,
    description: doc.description,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    __v: doc.__v,
  };
}
```

- [ ] **Step 4: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 5 new tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/courses/course.model.ts apps/api/src/modules/courses/course.model.test.ts
git commit -m "feat(api): add course model"
```

---

## Task 3: Track reads

Public, because the learner homepage lists tracks while logged out.

**Files:**
- Create: `apps/api/src/modules/tracks/track.service.ts`, `track.controller.ts`, `track.routes.ts`, `track.read.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `Track`, `toPublicTrack` (Task 1).
- Produces: `createTrackRouter(deps: AppDeps): Router`; `listTracks()`, `getTrack(id)`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/tracks/track.read.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "../auth/user.model.js";
import { Track } from "./track.model.js";
import { Course } from "../courses/course.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function app() {
  return createApp({
    mailer: fakeMailer().mailer,
    imageStore: fakeImageStore().imageStore,
  });
}

async function seedTrack(name = "Software Development") {
  const admin = await User.create({
    firstName: "Ada", lastName: "Admin", email: `${name.replace(/\s/g, "")}@example.com`,
    password: "Password123", role: "Admin",
  });
  return Track.create({
    admin: admin._id, name, price: 350, instructor: "Kwame Mensah",
    duration: "12 weeks", image: "https://images.example/t.png", description: "Full stack.",
  });
}

describe("GET /api/tracks", () => {
  it("lists tracks with a count, without authentication", async () => {
    await seedTrack("Software Development");
    await seedTrack("Data Science");

    const res = await request(app()).get("/api/tracks");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.tracks).toHaveLength(2);
  });

  it("returns an empty list rather than 404 when there are none", async () => {
    const res = await request(app()).get("/api/tracks");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.tracks).toEqual([]);
  });

  it("populates admin but never its credential fields", async () => {
    await seedTrack();
    const res = await request(app()).get("/api/tracks");
    const track = res.body.tracks[0];
    expect(track.admin.email).toBeDefined();
    expect(track.admin.password).toBeUndefined();
    expect(track.admin.verificationToken).toBeUndefined();
  });

  it("carries both _id and id", async () => {
    await seedTrack();
    const res = await request(app()).get("/api/tracks");
    expect(typeof res.body.tracks[0]._id).toBe("string");
    expect(typeof res.body.tracks[0].id).toBe("string");
  });
});

describe("GET /api/tracks/:id", () => {
  it("returns one track with its courses", async () => {
    const track = await seedTrack();
    await Course.create({
      admin: track.admin, track: track._id, title: "Intro to React",
      image: "https://images.example/c.png", description: "Components.",
    });

    const res = await request(app()).get(`/api/tracks/${track._id.toString()}`);

    expect(res.status).toBe(200);
    expect(res.body.track.name).toBe("Software Development");
    expect(res.body.track.courses).toHaveLength(1);
    expect(res.body.track.courses[0].title).toBe("Intro to React");
    // courses[].admin is an id in the contract, not an object
    expect(typeof res.body.track.courses[0].admin).toBe("string");
  });

  it("404s for an id that does not exist", async () => {
    const res = await request(app()).get("/api/tracks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // Review Focus 3
  it("400s for a malformed id rather than 500", async () => {
    const res = await request(app()).get("/api/tracks/not-a-valid-id");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toContain("Invalid");
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 for `/api/tracks`.

- [ ] **Step 3: Implement the service**

`apps/api/src/modules/tracks/track.service.ts`:

```ts
import type { Track as PublicTrack } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { Track, toPublicTrack } from "./track.model.js";

export async function listTracks(): Promise<PublicTrack[]> {
  const tracks = await Track.find()
    .populate("admin")
    .populate("courses")
    .sort({ createdAt: -1 });
  return tracks.map(toPublicTrack);
}

export async function getTrack(id: string): Promise<PublicTrack> {
  // A malformed id throws a Mongoose CastError, which errorHandler renders
  // as a 400 — so no explicit ObjectId validation is needed here.
  const track = await Track.findById(id).populate("admin").populate("courses");
  if (!track) throw new AppError("Track not found", 404);
  return toPublicTrack(track);
}
```

- [ ] **Step 4: Implement the controller and router**

`apps/api/src/modules/tracks/track.controller.ts`:

```ts
import type { Request, RequestHandler, Response } from "express";
import type { TracksResponse, TrackResponse } from "@learnbase/types";
import { listTracks, getTrack } from "./track.service.js";

export const list: RequestHandler = async (
  _req: Request,
  res: Response<TracksResponse>,
) => {
  const tracks = await listTracks();
  res.status(200).json({ success: true, count: tracks.length, tracks });
};

export const detail: RequestHandler = async (
  req: Request,
  res: Response<TrackResponse>,
) => {
  const track = await getTrack(req.params.id as string);
  res.status(200).json({ success: true, track });
};
```

`apps/api/src/modules/tracks/track.routes.ts`:

```ts
import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { list, detail } from "./track.controller.js";

export function createTrackRouter(_deps: AppDeps): Router {
  const router = Router();
  // Public: the learner homepage lists tracks while logged out.
  router.get("/", list);
  router.get("/:id", detail);
  return router;
}
```

- [ ] **Step 5: Mount it in `app.ts`**

Import `createTrackRouter` and add, after the auth router and before `notFound`:

```ts
  app.use("/api/tracks", createTrackRouter(deps));
```

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 7 new tests.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/tracks apps/api/src/app.ts
git commit -m "feat(api): add public track reads"
```

---

## Task 4: Track writes

Covers Review Focus 2 (role gating) and 4 (price as a string).

**Files:**
- Create: `apps/api/src/modules/tracks/track.schema.ts`, `track.write.test.ts`
- Modify: `track.service.ts`, `track.controller.ts`, `track.routes.ts`

**Interfaces:**
- Produces: `createTrackSchema`, `updateTrackSchema`; `createTrack(input, adminId, imageUrl)`, `updateTrack(id, input, imageUrl?)`, `deleteTrack(id)`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/tracks/track.write.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "../auth/user.model.js";
import { Track } from "./track.model.js";
import { Course } from "../courses/course.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function appWith() {
  const images = fakeImageStore("https://images.example/uploaded.png");
  return {
    app: createApp({ mailer: fakeMailer().mailer, imageStore: images.imageStore }),
    uploads: images.uploads,
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function tokenFor(app: ReturnType<typeof createApp>, role: "Admin" | "Learner") {
  const email = `${role.toLowerCase()}@example.com`;
  await User.create({
    firstName: "Ada", lastName: "User", email,
    password: "Password123", role,
  });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password123" });
  return res.body.token as string;
}

describe("POST /api/tracks", () => {
  it("creates a track, uploading the image and recording the admin", async () => {
    const { app, uploads } = appWith();
    const token = await tokenFor(app, "Admin");

    const res = await request(app)
      .post("/api/tracks")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Software Development")
      .field("price", "350")
      .field("instructor", "Kwame Mensah")
      .field("duration", "12 weeks")
      .field("description", "Full stack engineering.")
      .attach("image", PNG, { filename: "t.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.track.name).toBe("Software Development");
    expect(res.body.track.price).toBe(350);
    expect(res.body.track.image).toBe("https://images.example/uploaded.png");
    expect(res.body.track.admin.email).toBe("admin@example.com");
    expect(uploads).toHaveLength(1);
  });

  // Review Focus 4
  it("accepts a price of \"0\" and rejects a non-numeric price", async () => {
    const { app } = appWith();
    const token = await tokenFor(app, "Admin");

    const free = await request(app)
      .post("/api/tracks")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Free Track").field("price", "0")
      .field("instructor", "K").field("duration", "1 week")
      .field("description", "Free.")
      .attach("image", PNG, { filename: "t.png", contentType: "image/png" });
    expect(free.status).toBe(201);
    expect(free.body.track.price).toBe(0);

    const bad = await request(app)
      .post("/api/tracks")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Bad Price").field("price", "abc")
      .field("instructor", "K").field("duration", "1 week")
      .field("description", "Nope.")
      .attach("image", PNG, { filename: "t.png", contentType: "image/png" });
    expect(bad.status).toBe(400);
    expect(await Track.countDocuments({ name: "Bad Price" })).toBe(0);
  });

  it("requires an image", async () => {
    const { app } = appWith();
    const token = await tokenFor(app, "Admin");
    const res = await request(app)
      .post("/api/tracks")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "No Image").field("price", "10")
      .field("instructor", "K").field("duration", "1 week")
      .field("description", "Missing image.");
    expect(res.status).toBe(400);
  });

  // Review Focus 2
  it("rejects a Learner with 403 and an anonymous caller with 401", async () => {
    const { app } = appWith();
    const learnerToken = await tokenFor(app, "Learner");

    const asLearner = await request(app)
      .post("/api/tracks")
      .set("Authorization", `Bearer ${learnerToken}`)
      .field("name", "Hijack").field("price", "1")
      .field("instructor", "K").field("duration", "1 week")
      .field("description", "No.")
      .attach("image", PNG, { filename: "t.png", contentType: "image/png" });
    expect(asLearner.status).toBe(403);

    const anonymous = await request(app).post("/api/tracks").field("name", "Hijack");
    expect(anonymous.status).toBe(401);

    expect(await Track.countDocuments()).toBe(0);
  });
});

describe("PUT /api/tracks/:id", () => {
  it("updates only the fields supplied, leaving the image untouched", async () => {
    const { app, uploads } = appWith();
    const token = await tokenFor(app, "Admin");
    const admin = await User.findOne({ email: "admin@example.com" });
    const track = await Track.create({
      admin: admin!._id, name: "Old Name", price: 100, instructor: "K",
      duration: "1 week", image: "https://images.example/original.png", description: "Old.",
    });

    const res = await request(app)
      .put(`/api/tracks/${track._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .field("name", "New Name");

    expect(res.status).toBe(200);
    expect(res.body.track.name).toBe("New Name");
    expect(res.body.track.price).toBe(100);
    expect(res.body.track.image).toBe("https://images.example/original.png");
    expect(uploads).toHaveLength(0);
  });

  it("replaces the image when a new file is sent", async () => {
    const { app, uploads } = appWith();
    const token = await tokenFor(app, "Admin");
    const admin = await User.findOne({ email: "admin@example.com" });
    const track = await Track.create({
      admin: admin!._id, name: "Name", price: 100, instructor: "K",
      duration: "1 week", image: "https://images.example/original.png", description: "D.",
    });

    const res = await request(app)
      .put(`/api/tracks/${track._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .attach("image", PNG, { filename: "new.png", contentType: "image/png" });

    expect(res.body.track.image).toBe("https://images.example/uploaded.png");
    expect(uploads).toHaveLength(1);
  });

  it("rejects a Learner with 403", async () => {
    const { app } = appWith();
    const learnerToken = await tokenFor(app, "Learner");
    const admin = await User.create({
      firstName: "A", lastName: "B", email: "other-admin@example.com",
      password: "Password123", role: "Admin",
    });
    const track = await Track.create({
      admin: admin._id, name: "Name", price: 100, instructor: "K",
      duration: "1 week", image: "https://images.example/o.png", description: "D.",
    });

    const res = await request(app)
      .put(`/api/tracks/${track._id.toString()}`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .field("name", "Hijacked");
    expect(res.status).toBe(403);
    expect((await Track.findById(track._id))!.name).toBe("Name");
  });
});

describe("DELETE /api/tracks/:id", () => {
  it("deletes a track with no courses", async () => {
    const { app } = appWith();
    const token = await tokenFor(app, "Admin");
    const admin = await User.findOne({ email: "admin@example.com" });
    const track = await Track.create({
      admin: admin!._id, name: "Doomed", price: 1, instructor: "K",
      duration: "1 week", image: "https://images.example/o.png", description: "D.",
    });

    const res = await request(app)
      .delete(`/api/tracks/${track._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Track.countDocuments()).toBe(0);
  });

  // Review Focus 1
  it("refuses to delete a track that still has courses, naming the count", async () => {
    const { app } = appWith();
    const token = await tokenFor(app, "Admin");
    const admin = await User.findOne({ email: "admin@example.com" });
    const track = await Track.create({
      admin: admin!._id, name: "Has Courses", price: 1, instructor: "K",
      duration: "1 week", image: "https://images.example/o.png", description: "D.",
    });
    await Course.create({
      admin: admin!._id, track: track._id, title: "A course",
      image: "https://images.example/c.png", description: "C.",
    });

    const res = await request(app)
      .delete(`/api/tracks/${track._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toContain("1");
    expect(await Track.countDocuments()).toBe(1);
    expect(await Course.countDocuments()).toBe(1);
  });

  it("rejects a Learner with 403", async () => {
    const { app } = appWith();
    const learnerToken = await tokenFor(app, "Learner");
    const admin = await User.create({
      firstName: "A", lastName: "B", email: "other-admin@example.com",
      password: "Password123", role: "Admin",
    });
    const track = await Track.create({
      admin: admin._id, name: "Safe", price: 1, instructor: "K",
      duration: "1 week", image: "https://images.example/o.png", description: "D.",
    });

    const res = await request(app)
      .delete(`/api/tracks/${track._id.toString()}`)
      .set("Authorization", `Bearer ${learnerToken}`);
    expect(res.status).toBe(403);
    expect(await Track.countDocuments()).toBe(1);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 on POST `/api/tracks`.

- [ ] **Step 3: Implement the schema**

`apps/api/src/modules/tracks/track.schema.ts`:

```ts
import { z } from "zod";

// Multipart fields always arrive as strings, so price is coerced and then
// checked — an unparseable value must 400 rather than reach Mongoose as NaN.
const price = z
  .string()
  .trim()
  .min(1, "Price is required")
  .refine((value) => Number.isFinite(Number(value)), "Price must be a number")
  .transform(Number)
  .refine((value) => value >= 0, "Price cannot be negative");

export const createTrackSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price,
  instructor: z.string().trim().min(1, "Instructor is required"),
  duration: z.string().trim().min(1, "Duration is required"),
  description: z.string().trim().min(1, "Description is required"),
});

export const updateTrackSchema = z.object({
  name: z.string().trim().min(1).optional(),
  price: price.optional(),
  instructor: z.string().trim().min(1).optional(),
  duration: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
```

- [ ] **Step 4: Extend the service**

Append to `track.service.ts`:

```ts
import mongoose from "mongoose";
import { Course } from "../courses/course.model.js";
import type { CreateTrackInput, UpdateTrackInput } from "./track.schema.js";

export async function createTrack(
  input: CreateTrackInput,
  adminId: mongoose.Types.ObjectId,
  imageUrl: string,
): Promise<PublicTrack> {
  const created = await Track.create({ ...input, admin: adminId, image: imageUrl });
  const loaded = await Track.findById(created._id).populate("admin").populate("courses");
  return toPublicTrack(loaded!);
}

export async function updateTrack(
  id: string,
  input: UpdateTrackInput,
  imageUrl?: string,
): Promise<PublicTrack> {
  const track = await Track.findById(id);
  if (!track) throw new AppError("Track not found", 404);

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      (track as unknown as Record<string, unknown>)[key] = value;
    }
  }
  if (imageUrl) track.image = imageUrl;
  await track.save();

  const loaded = await Track.findById(track._id).populate("admin").populate("courses");
  return toPublicTrack(loaded!);
}

export async function deleteTrack(id: string): Promise<void> {
  const track = await Track.findById(id);
  if (!track) throw new AppError("Track not found", 404);

  // Deleting a track whose courses remain would leave them pointing at nothing,
  // and Course.track would populate to null in the admin's course table.
  const courseCount = await Course.countDocuments({ track: track._id });
  if (courseCount > 0) {
    throw new AppError(
      `This track still has ${courseCount} course(s). Delete them first.`,
      409,
    );
  }

  await track.deleteOne();
}
```

- [ ] **Step 5: Extend the controller and router**

Append to `track.controller.ts`:

```ts
import type { TrackMutationResponse, MessageResponse } from "@learnbase/types";
import type { AppDeps } from "../../shared/adapters/index.js";
import { AppError } from "../../shared/errors/AppError.js";
import { createTrackSchema, updateTrackSchema } from "./track.schema.js";
import { createTrack, updateTrack, deleteTrack } from "./track.service.js";

const TRACK_FOLDER = "learnbase/tracks";

export function create(deps: AppDeps): RequestHandler {
  return async (req: Request, res: Response<TrackMutationResponse>) => {
    if (!req.user) throw new AppError("Not authorised", 401);
    const input = createTrackSchema.parse(req.body);
    if (!req.file) throw new AppError("An image is required", 400);

    const imageUrl = await deps.imageStore.upload(req.file.buffer, TRACK_FOLDER);
    const track = await createTrack(input, req.user._id, imageUrl);
    res.status(201).json({ success: true, message: "Track created", track });
  };
}

export function update(deps: AppDeps): RequestHandler {
  return async (req: Request, res: Response<TrackMutationResponse>) => {
    const input = updateTrackSchema.parse(req.body);
    const imageUrl = req.file
      ? await deps.imageStore.upload(req.file.buffer, TRACK_FOLDER)
      : undefined;
    const track = await updateTrack(req.params.id as string, input, imageUrl);
    res.status(200).json({ success: true, message: "Track updated", track });
  };
}

export const remove: RequestHandler = async (
  req: Request,
  res: Response<MessageResponse>,
) => {
  await deleteTrack(req.params.id as string);
  res.status(200).json({ success: true, message: "Track deleted" });
};
```

Replace `track.routes.ts` with:

```ts
import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { uploadSingle } from "../../shared/middleware/upload.js";
import { list, detail, create, update, remove } from "./track.controller.js";

export function createTrackRouter(deps: AppDeps): Router {
  const router = Router();

  // Public: the learner homepage lists tracks while logged out.
  router.get("/", list);
  router.get("/:id", detail);

  const adminOnly = [authenticate, requireRole("Admin")];
  router.post("/", ...adminOnly, uploadSingle("image"), create(deps));
  router.put("/:id", ...adminOnly, uploadSingle("image"), update(deps));
  router.delete("/:id", ...adminOnly, remove);

  return router;
}
```

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 9 new tests.

- [ ] **Step 7: Verify the role gate has teeth**

Remove `requireRole("Admin")` from the DELETE route only, confirm the Learner test for DELETE fails, restore. Then do the same for POST. Report both. Confirm `git diff apps/api` is empty.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/tracks
git commit -m "feat(api): add admin track writes with image upload"
```

---

## Task 5: Course reads and writes

**Files:**
- Create: `apps/api/src/modules/courses/course.schema.ts`, `course.service.ts`, `course.controller.ts`, `course.routes.ts`, `course.api.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `Course`, `toPublicCourse` (Task 2); `Track` (Task 1).
- Produces: `createCourseRouter(deps: AppDeps): Router`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/courses/course.api.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "../auth/user.model.js";
import { Track } from "../tracks/track.model.js";
import { Course } from "./course.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function appWith() {
  const images = fakeImageStore("https://images.example/uploaded.png");
  return {
    app: createApp({ mailer: fakeMailer().mailer, imageStore: images.imageStore }),
    uploads: images.uploads,
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function setup(app: ReturnType<typeof createApp>, role: "Admin" | "Learner" = "Admin") {
  const email = `${role.toLowerCase()}@example.com`;
  const user = await User.create({
    firstName: "Ada", lastName: "User", email, password: "Password123", role,
  });
  const admin = role === "Admin" ? user : await User.create({
    firstName: "Real", lastName: "Admin", email: "real-admin@example.com",
    password: "Password123", role: "Admin",
  });
  const track = await Track.create({
    admin: admin._id, name: "Software Development", price: 350, instructor: "K",
    duration: "12 weeks", image: "https://images.example/t.png", description: "D.",
  });
  const login = await request(app).post("/api/auth/login").send({ email, password: "Password123" });
  return { token: login.body.token as string, track, user };
}

describe("GET /api/courses", () => {
  it("lists courses with a count and populated refs", async () => {
    const { app } = appWith();
    const { track } = await setup(app);
    await Course.create({
      admin: track.admin, track: track._id, title: "Intro to React",
      image: "https://images.example/c.png", description: "Components.",
    });

    const res = await request(app).get("/api/courses");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.courses[0].admin.email).toBeDefined();
    expect(res.body.courses[0].admin.password).toBeUndefined();
    expect(res.body.courses[0].track.name).toBe("Software Development");
    expect(typeof res.body.courses[0].track.admin).toBe("string");
  });

  it("returns an empty list when there are none", async () => {
    const { app } = appWith();
    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe("GET /api/courses/:id", () => {
  it("returns one course", async () => {
    const { app } = appWith();
    const { track } = await setup(app);
    const course = await Course.create({
      admin: track.admin, track: track._id, title: "Intro to React",
      image: "https://images.example/c.png", description: "Components.",
    });

    const res = await request(app).get(`/api/courses/${course._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.course.title).toBe("Intro to React");
  });

  it("404s for a missing id and 400s for a malformed one", async () => {
    const { app } = appWith();
    expect((await request(app).get("/api/courses/507f1f77bcf86cd799439011")).status).toBe(404);
    expect((await request(app).get("/api/courses/not-an-id")).status).toBe(400);
  });
});

describe("POST /api/courses", () => {
  it("creates a course against an existing track", async () => {
    const { app, uploads } = appWith();
    const { token, track } = await setup(app);

    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Intro to React")
      .field("track", track._id.toString())
      .field("description", "Components.")
      .attach("image", PNG, { filename: "c.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.course.title).toBe("Intro to React");
    expect(res.body.course.track.name).toBe("Software Development");
    expect(uploads).toHaveLength(1);
  });

  it("404s when the track does not exist", async () => {
    const { app } = appWith();
    const { token } = await setup(app);

    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Orphan")
      .field("track", "507f1f77bcf86cd799439011")
      .field("description", "No track.")
      .attach("image", PNG, { filename: "c.png", contentType: "image/png" });

    expect(res.status).toBe(404);
    expect(await Course.countDocuments()).toBe(0);
  });

  it("rejects a Learner with 403", async () => {
    const { app } = appWith();
    const { token, track } = await setup(app, "Learner");

    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Hijack")
      .field("track", track._id.toString())
      .field("description", "No.")
      .attach("image", PNG, { filename: "c.png", contentType: "image/png" });

    expect(res.status).toBe(403);
    expect(await Course.countDocuments()).toBe(0);
  });
});

describe("PUT and DELETE /api/courses/:id", () => {
  it("updates fields and leaves the image alone when no file is sent", async () => {
    const { app, uploads } = appWith();
    const { token, track } = await setup(app);
    const course = await Course.create({
      admin: track.admin, track: track._id, title: "Old",
      image: "https://images.example/original.png", description: "Old.",
    });

    const res = await request(app)
      .put(`/api/courses/${course._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .field("title", "New");

    expect(res.status).toBe(200);
    expect(res.body.course.title).toBe("New");
    expect(res.body.course.image).toBe("https://images.example/original.png");
    expect(uploads).toHaveLength(0);
  });

  it("deletes a course", async () => {
    const { app } = appWith();
    const { token, track } = await setup(app);
    const course = await Course.create({
      admin: track.admin, track: track._id, title: "Doomed",
      image: "https://images.example/c.png", description: "D.",
    });

    const res = await request(app)
      .delete(`/api/courses/${course._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Course.countDocuments()).toBe(0);
  });

  it("rejects a Learner on both update and delete", async () => {
    const { app } = appWith();
    const { token, track } = await setup(app, "Learner");
    const course = await Course.create({
      admin: track.admin, track: track._id, title: "Safe",
      image: "https://images.example/c.png", description: "D.",
    });

    expect(
      (await request(app)
        .put(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${token}`)
        .field("title", "Hijacked")).status,
    ).toBe(403);

    expect(
      (await request(app)
        .delete(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${token}`)).status,
    ).toBe(403);

    expect((await Course.findById(course._id))!.title).toBe("Safe");
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 on `/api/courses`.

- [ ] **Step 3: Implement the schema**

`apps/api/src/modules/courses/course.schema.ts`:

```ts
import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  track: z.string().trim().min(1, "Please select a track"),
  description: z.string().trim().min(1, "Description is required"),
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(1).optional(),
  track: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
```

- [ ] **Step 4: Implement the service**

`apps/api/src/modules/courses/course.service.ts`:

```ts
import mongoose from "mongoose";
import type { Course as PublicCourse } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { Track } from "../tracks/track.model.js";
import { Course, toPublicCourse } from "./course.model.js";
import type { CreateCourseInput, UpdateCourseInput } from "./course.schema.js";

function populated(id: mongoose.Types.ObjectId) {
  return Course.findById(id).populate("admin").populate("track");
}

export async function listCourses(): Promise<PublicCourse[]> {
  const courses = await Course.find()
    .populate("admin")
    .populate("track")
    .sort({ createdAt: -1 });
  return courses.map(toPublicCourse);
}

export async function getCourse(id: string): Promise<PublicCourse> {
  const course = await Course.findById(id).populate("admin").populate("track");
  if (!course) throw new AppError("Course not found", 404);
  return toPublicCourse(course);
}

export async function createCourse(
  input: CreateCourseInput,
  adminId: mongoose.Types.ObjectId,
  imageUrl: string,
): Promise<PublicCourse> {
  // Fail before writing rather than storing a course that points at nothing.
  const track = await Track.findById(input.track);
  if (!track) throw new AppError("Track not found", 404);

  const created = await Course.create({
    title: input.title,
    description: input.description,
    track: track._id,
    admin: adminId,
    image: imageUrl,
  });
  return toPublicCourse((await populated(created._id))!);
}

export async function updateCourse(
  id: string,
  input: UpdateCourseInput,
  imageUrl?: string,
): Promise<PublicCourse> {
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404);

  if (input.track) {
    const track = await Track.findById(input.track);
    if (!track) throw new AppError("Track not found", 404);
    course.track = track._id;
  }
  if (input.title) course.title = input.title;
  if (input.description) course.description = input.description;
  if (imageUrl) course.image = imageUrl;
  await course.save();

  return toPublicCourse((await populated(course._id))!);
}

export async function deleteCourse(id: string): Promise<void> {
  const course = await Course.findById(id);
  if (!course) throw new AppError("Course not found", 404);
  await course.deleteOne();
}
```

- [ ] **Step 5: Implement the controller and router**

`apps/api/src/modules/courses/course.controller.ts`:

```ts
import type { Request, RequestHandler, Response } from "express";
import type {
  CoursesResponse,
  CourseResponse,
  CourseMutationResponse,
  MessageResponse,
} from "@learnbase/types";
import type { AppDeps } from "../../shared/adapters/index.js";
import { AppError } from "../../shared/errors/AppError.js";
import { createCourseSchema, updateCourseSchema } from "./course.schema.js";
import {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
} from "./course.service.js";

const COURSE_FOLDER = "learnbase/courses";

export const list: RequestHandler = async (
  _req: Request,
  res: Response<CoursesResponse>,
) => {
  const courses = await listCourses();
  res.status(200).json({ success: true, count: courses.length, courses });
};

export const detail: RequestHandler = async (
  req: Request,
  res: Response<CourseResponse>,
) => {
  const course = await getCourse(req.params.id as string);
  res.status(200).json({ success: true, course });
};

export function create(deps: AppDeps): RequestHandler {
  return async (req: Request, res: Response<CourseMutationResponse>) => {
    if (!req.user) throw new AppError("Not authorised", 401);
    const input = createCourseSchema.parse(req.body);
    if (!req.file) throw new AppError("An image is required", 400);

    const imageUrl = await deps.imageStore.upload(req.file.buffer, COURSE_FOLDER);
    const course = await createCourse(input, req.user._id, imageUrl);
    res.status(201).json({ success: true, message: "Course created", course });
  };
}

export function update(deps: AppDeps): RequestHandler {
  return async (req: Request, res: Response<CourseMutationResponse>) => {
    const input = updateCourseSchema.parse(req.body);
    const imageUrl = req.file
      ? await deps.imageStore.upload(req.file.buffer, COURSE_FOLDER)
      : undefined;
    const course = await updateCourse(req.params.id as string, input, imageUrl);
    res.status(200).json({ success: true, message: "Course updated", course });
  };
}

export const remove: RequestHandler = async (
  req: Request,
  res: Response<MessageResponse>,
) => {
  await deleteCourse(req.params.id as string);
  res.status(200).json({ success: true, message: "Course deleted" });
};
```

`apps/api/src/modules/courses/course.routes.ts`:

```ts
import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { uploadSingle } from "../../shared/middleware/upload.js";
import { list, detail, create, update, remove } from "./course.controller.js";

export function createCourseRouter(deps: AppDeps): Router {
  const router = Router();

  router.get("/", list);
  router.get("/:id", detail);

  const adminOnly = [authenticate, requireRole("Admin")];
  router.post("/", ...adminOnly, uploadSingle("image"), create(deps));
  router.put("/:id", ...adminOnly, uploadSingle("image"), update(deps));
  router.delete("/:id", ...adminOnly, remove);

  return router;
}
```

- [ ] **Step 6: Mount it in `app.ts`**

```ts
  app.use("/api/courses", createCourseRouter(deps));
```

- [ ] **Step 7: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 9 new tests.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/courses apps/api/src/app.ts
git commit -m "feat(api): add course reads and admin writes"
```

---

## Task 6: Learner reads

**Files:**
- Create: `apps/api/src/modules/learners/learner.service.ts`, `learner.controller.ts`, `learner.routes.ts`, `learner.api.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Consumes: `User`, `toPublicUser`.
- Produces: `createLearnerRouter(deps: AppDeps): Router`.

Note the contract's `LearnersResponse` / `LearnerResponse` live in each frontend's own types, not `@learnbase/types`. Build the bodies as `{ success, count, learners }` and `{ success, learner }`, typing `learners` as `User[]`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/learners/learner.api.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "../auth/user.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function app() {
  return createApp({
    mailer: fakeMailer().mailer,
    imageStore: fakeImageStore().imageStore,
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function tokenFor(instance: ReturnType<typeof createApp>, role: "Admin" | "Learner") {
  const email = `${role.toLowerCase()}@example.com`;
  await User.create({
    firstName: "Ada", lastName: "User", email, password: "Password123", role,
  });
  const res = await request(instance)
    .post("/api/auth/login")
    .send({ email, password: "Password123" });
  return res.body.token as string;
}

describe("GET /api/learners", () => {
  it("lists only learners, never admins", async () => {
    const instance = app();
    const token = await tokenFor(instance, "Admin");
    await User.create({
      firstName: "L", lastName: "One", email: "l1@example.com",
      password: "Password123", role: "Learner",
    });
    await User.create({
      firstName: "L", lastName: "Two", email: "l2@example.com",
      password: "Password123", role: "Learner",
    });

    const res = await request(instance)
      .get("/api/learners")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.learners.every((l: { role: string }) => l.role === "Learner")).toBe(true);
  });

  it("never exposes credential or token fields", async () => {
    const instance = app();
    const token = await tokenFor(instance, "Admin");
    await User.create({
      firstName: "L", lastName: "One", email: "l1@example.com",
      password: "Password123", role: "Learner",
      verificationToken: "123456", resetPasswordToken: "abc",
    });

    const res = await request(instance)
      .get("/api/learners")
      .set("Authorization", `Bearer ${token}`);

    const learner = res.body.learners[0];
    expect(learner.password).toBeUndefined();
    expect(learner.verificationToken).toBeUndefined();
    expect(learner.resetPasswordToken).toBeUndefined();
  });

  it("rejects a Learner with 403 and an anonymous caller with 401", async () => {
    const instance = app();
    const learnerToken = await tokenFor(instance, "Learner");

    expect(
      (await request(instance).get("/api/learners").set("Authorization", `Bearer ${learnerToken}`)).status,
    ).toBe(403);
    expect((await request(instance).get("/api/learners")).status).toBe(401);
  });
});

describe("GET /api/learners/:id", () => {
  it("returns one learner", async () => {
    const instance = app();
    const token = await tokenFor(instance, "Admin");
    const learner = await User.create({
      firstName: "Solo", lastName: "Learner", email: "solo@example.com",
      password: "Password123", role: "Learner",
    });

    const res = await request(instance)
      .get(`/api/learners/${learner._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.learner.email).toBe("solo@example.com");
  });

  it("404s for an admin's id, since this collection is learners only", async () => {
    const instance = app();
    const token = await tokenFor(instance, "Admin");
    const admin = await User.findOne({ email: "admin@example.com" });

    const res = await request(instance)
      .get(`/api/learners/${admin!._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("400s for a malformed id", async () => {
    const instance = app();
    const token = await tokenFor(instance, "Admin");
    const res = await request(instance)
      .get("/api/learners/not-an-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — 404 on `/api/learners`.

- [ ] **Step 3: Implement the service**

`apps/api/src/modules/learners/learner.service.ts`:

```ts
import type { User as PublicUser } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { User, toPublicUser } from "../auth/user.model.js";

export async function listLearners(): Promise<PublicUser[]> {
  const learners = await User.find({ role: "Learner" }).sort({ createdAt: -1 });
  return learners.map(toPublicUser);
}

export async function getLearner(id: string): Promise<PublicUser> {
  // Scoped to role so an admin's id cannot be read through this route.
  const learner = await User.findOne({ _id: id, role: "Learner" });
  if (!learner) throw new AppError("Learner not found", 404);
  return toPublicUser(learner);
}
```

- [ ] **Step 4: Implement the controller and router**

`apps/api/src/modules/learners/learner.controller.ts`:

```ts
import type { Request, RequestHandler, Response } from "express";
import type { User as PublicUser } from "@learnbase/types";
import { listLearners, getLearner } from "./learner.service.js";

interface LearnersBody {
  success: boolean;
  count: number;
  learners: PublicUser[];
}

interface LearnerBody {
  success: boolean;
  learner: PublicUser;
}

export const list: RequestHandler = async (
  _req: Request,
  res: Response<LearnersBody>,
) => {
  const learners = await listLearners();
  res.status(200).json({ success: true, count: learners.length, learners });
};

export const detail: RequestHandler = async (
  req: Request,
  res: Response<LearnerBody>,
) => {
  const learner = await getLearner(req.params.id as string);
  res.status(200).json({ success: true, learner });
};
```

`apps/api/src/modules/learners/learner.routes.ts`:

```ts
import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { requireRole } from "../../shared/middleware/requireRole.js";
import { list, detail } from "./learner.controller.js";

export function createLearnerRouter(_deps: AppDeps): Router {
  const router = Router();
  router.use(authenticate, requireRole("Admin"));
  router.get("/", list);
  router.get("/:id", detail);
  return router;
}
```

- [ ] **Step 5: Mount it in `app.ts`**

```ts
  app.use("/api/learners", createLearnerRouter(deps));
```

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 6 new tests.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/learners apps/api/src/app.ts
git commit -m "feat(api): add admin-only learner reads"
```

---

## Task 7: Invoice model and role-aware list

Covers Review Focus 5. Only the list endpoint exists this phase; creation and payment are Phase 3.

**Files:**
- Create: `apps/api/src/modules/invoices/invoice.model.ts`, `invoice.service.ts`, `invoice.controller.ts`, `invoice.routes.ts`, `invoice.api.test.ts`
- Modify: `apps/api/src/app.ts`

**Interfaces:**
- Produces: `Invoice` (model), `InvoiceDocument`, `toPublicInvoice`, `createInvoiceRouter(deps: AppDeps): Router`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/modules/invoices/invoice.api.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { User } from "../auth/user.model.js";
import { Track } from "../tracks/track.model.js";
import { Invoice } from "./invoice.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function app() {
  return createApp({
    mailer: fakeMailer().mailer,
    imageStore: fakeImageStore().imageStore,
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function login(instance: ReturnType<typeof createApp>, email: string) {
  const res = await request(instance)
    .post("/api/auth/login")
    .send({ email, password: "Password123" });
  return res.body.token as string;
}

async function seed() {
  const admin = await User.create({
    firstName: "Ada", lastName: "Admin", email: "admin@example.com",
    password: "Password123", role: "Admin",
  });
  const alice = await User.create({
    firstName: "Alice", lastName: "L", email: "alice@example.com",
    password: "Password123", role: "Learner",
  });
  const bob = await User.create({
    firstName: "Bob", lastName: "L", email: "bob@example.com",
    password: "Password123", role: "Learner",
  });
  const track = await Track.create({
    admin: admin._id, name: "Software Development", price: 350, instructor: "K",
    duration: "12 weeks", image: "https://images.example/t.png", description: "D.",
  });
  await Invoice.create({
    learner: alice._id, track: track._id, amount: 350, status: "paid",
    dueDate: new Date(), paystackReference: "ref-alice",
  });
  await Invoice.create({
    learner: bob._id, track: track._id, amount: 350, status: "pending",
    dueDate: new Date(), paystackReference: "ref-bob",
  });
  return { admin, alice, bob, track };
}

describe("GET /api/invoices", () => {
  it("returns every invoice to an admin, with learner and track populated", async () => {
    const instance = app();
    await seed();
    const token = await login(instance, "admin@example.com");

    const res = await request(instance)
      .get("/api/invoices")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.invoices[0].learner.email).toBeDefined();
    expect(res.body.invoices[0].track.name).toBe("Software Development");
  });

  // Review Focus 5
  it("returns ONLY their own invoices to a learner", async () => {
    const instance = app();
    await seed();
    const token = await login(instance, "alice@example.com");

    const res = await request(instance)
      .get("/api/invoices")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.invoices[0].paystackReference).toBe("ref-alice");
    const references = res.body.invoices.map((i: { paystackReference: string }) => i.paystackReference);
    expect(references).not.toContain("ref-bob");
  });

  it("never exposes a learner's credential fields through the populated invoice", async () => {
    const instance = app();
    await seed();
    const token = await login(instance, "admin@example.com");

    const res = await request(instance)
      .get("/api/invoices")
      .set("Authorization", `Bearer ${token}`);

    const learner = res.body.invoices[0].learner;
    expect(learner.password).toBeUndefined();
    expect(learner.resetPasswordToken).toBeUndefined();
  });

  it("tolerates an invoice with no learner, which the contract allows", async () => {
    const instance = app();
    const { track } = await seed();
    await Invoice.create({
      learner: null, track: track._id, amount: 100, status: "unpaid",
      dueDate: new Date(), paystackReference: "ref-admin-raised",
    });
    const token = await login(instance, "admin@example.com");

    const res = await request(instance)
      .get("/api/invoices")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    const orphan = res.body.invoices.find(
      (i: { paystackReference: string }) => i.paystackReference === "ref-admin-raised",
    );
    expect(orphan.learner).toBeNull();
  });

  it("rejects an anonymous request", async () => {
    const instance = app();
    expect((await request(instance).get("/api/invoices")).status).toBe(401);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

```bash
pnpm --filter @learnbase/api test
```

Expected: FAIL — cannot find module `./invoice.model.js`.

- [ ] **Step 3: Implement the model**

`apps/api/src/modules/invoices/invoice.model.ts`:

```ts
import mongoose, { Schema, model, type Document, type Model } from "mongoose";
import type {
  Invoice as PublicInvoice,
  InvoiceStatus,
  CourseTrackRef,
} from "@learnbase/types";
import { toPublicUser, type UserDocument } from "../auth/user.model.js";
import type { TrackDocument } from "../tracks/track.model.js";

export interface InvoiceDocument extends Document {
  _id: mongoose.Types.ObjectId;
  learner: mongoose.Types.ObjectId | UserDocument | null;
  track: mongoose.Types.ObjectId | TrackDocument;
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

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    // Nullable by design: an admin can raise an invoice directly rather than a
    // learner self-enrolling, which the contract models as learner: User | null.
    learner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    track: { type: Schema.Types.ObjectId, ref: "Track", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "unpaid"],
      default: "pending",
    },
    dueDate: { type: Date, required: true },
    paystackReference: { type: String, required: true, unique: true, sparse: true },
    paystackTransactionId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export const Invoice: Model<InvoiceDocument> =
  (mongoose.models.Invoice as Model<InvoiceDocument>) ??
  model<InvoiceDocument>("Invoice", invoiceSchema);

function isDoc<T extends mongoose.Document>(
  value: mongoose.Types.ObjectId | T | null,
): value is T {
  return value instanceof mongoose.Document;
}

export function toPublicInvoice(doc: InvoiceDocument): PublicInvoice {
  const track = doc.track;

  const trackRef: CourseTrackRef = isDoc<TrackDocument>(track)
    ? {
        _id: track._id.toString(),
        id: track._id.toString(),
        admin: track.admin.toString(),
        name: track.name,
        price: track.price,
        instructor: track.instructor,
        duration: track.duration,
        image: track.image,
        description: track.description,
        createdAt: track.createdAt,
        updatedAt: track.updatedAt,
        __v: track.__v,
      }
    : ({ _id: track.toString() } as unknown as CourseTrackRef);

  return {
    _id: doc._id.toString(),
    learner: isDoc<UserDocument>(doc.learner) ? toPublicUser(doc.learner) : null,
    track: trackRef,
    amount: doc.amount,
    status: doc.status,
    dueDate: doc.dueDate,
    paystackReference: doc.paystackReference,
    paystackTransactionId: doc.paystackTransactionId,
    paidAt: doc.paidAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    __v: doc.__v,
  };
}
```

- [ ] **Step 4: Implement the service, controller and router**

`apps/api/src/modules/invoices/invoice.service.ts`:

```ts
import mongoose from "mongoose";
import type { Invoice as PublicInvoice, Role } from "@learnbase/types";
import { Invoice, toPublicInvoice } from "./invoice.model.js";

/**
 * One path serves both audiences: an admin sees every invoice, a learner sees
 * only their own. The filter is derived from the authenticated user, never
 * from a request parameter.
 */
export async function listInvoicesFor(
  userId: mongoose.Types.ObjectId,
  role: Role,
): Promise<PublicInvoice[]> {
  const filter = role === "Admin" ? {} : { learner: userId };
  const invoices = await Invoice.find(filter)
    .populate("learner")
    .populate("track")
    .sort({ createdAt: -1 });
  return invoices.map(toPublicInvoice);
}
```

`apps/api/src/modules/invoices/invoice.controller.ts`:

```ts
import type { Request, RequestHandler, Response } from "express";
import type { InvoicesResponse } from "@learnbase/types";
import { AppError } from "../../shared/errors/AppError.js";
import { listInvoicesFor } from "./invoice.service.js";

export const list: RequestHandler = async (
  req: Request,
  res: Response<InvoicesResponse>,
) => {
  if (!req.user) throw new AppError("Not authorised", 401);
  const invoices = await listInvoicesFor(req.user._id, req.user.role);
  res.status(200).json({ success: true, count: invoices.length, invoices });
};
```

`apps/api/src/modules/invoices/invoice.routes.ts`:

```ts
import { Router } from "express";
import type { AppDeps } from "../../shared/adapters/index.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { list } from "./invoice.controller.js";

export function createInvoiceRouter(_deps: AppDeps): Router {
  const router = Router();
  // Both roles may call this; the service decides what each one sees.
  router.get("/", authenticate, list);
  return router;
}
```

- [ ] **Step 5: Mount it in `app.ts`**

```ts
  app.use("/api/invoices", createInvoiceRouter(deps));
```

- [ ] **Step 6: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
```

Expected: PASS — 5 new tests.

- [ ] **Step 7: Verify the role filter has teeth**

Change the filter to `{}` for every role, confirm the learner-scoping test fails, restore. Report the result. Confirm `git diff apps/api` is empty.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/invoices apps/api/src/app.ts
git commit -m "feat(api): add role-aware invoice list"
```

---

## Task 8: Contract conformance and live verification

**Files:**
- Create: `apps/api/src/modules/tracks/catalogue.contract.test.ts`
- Modify: `apps/api/README.md`

**Interfaces:**
- Consumes: `JsonOf<T>` from `@learnbase/types` and every route built in this phase.

- [ ] **Step 1: Write the contract test**

Create `apps/api/src/modules/tracks/catalogue.contract.test.ts`:

```ts
import { describe, it, expect, expectTypeOf, beforeEach } from "vitest";
import request from "supertest";
import type {
  TracksResponse, TrackResponse, CoursesResponse,
  InvoicesResponse, JsonOf,
} from "@learnbase/types";
import { createApp } from "../../app.js";
import { User } from "../auth/user.model.js";
import { Track } from "./track.model.js";
import { Course } from "../courses/course.model.js";
import { fakeMailer, fakeImageStore } from "../../test/factories.js";

function app() {
  return createApp({
    mailer: fakeMailer().mailer,
    imageStore: fakeImageStore().imageStore,
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-value-long-enough";
});

async function seed() {
  const admin = await User.create({
    firstName: "Ada", lastName: "Admin", email: "admin@example.com",
    password: "Password123", role: "Admin",
  });
  const track = await Track.create({
    admin: admin._id, name: "Software Development", price: 350, instructor: "K",
    duration: "12 weeks", image: "https://images.example/t.png", description: "D.",
  });
  await Course.create({
    admin: admin._id, track: track._id, title: "Intro to React",
    image: "https://images.example/c.png", description: "C.",
  });
  return { admin, track };
}

describe("catalogue responses match the shared contract", () => {
  it("GET /api/tracks matches TracksResponse", async () => {
    await seed();
    const res = await request(app()).get("/api/tracks");
    const body = res.body as JsonOf<TracksResponse>;

    expectTypeOf(body).toHaveProperty("count").toEqualTypeOf<number>();
    expect(typeof body.count).toBe("number");
    expect(typeof body.tracks[0]!._id).toBe("string");
    expect(typeof body.tracks[0]!.id).toBe("string");
    expect(typeof body.tracks[0]!.price).toBe("number");
    expect(typeof body.tracks[0]!.createdAt).toBe("string");
    expect(Array.isArray(body.tracks[0]!.courses)).toBe(true);
    expect(Array.isArray(body.tracks[0]!.ratings)).toBe(true);
  });

  it("GET /api/tracks/:id matches TrackResponse", async () => {
    const { track } = await seed();
    const res = await request(app()).get(`/api/tracks/${track._id.toString()}`);
    const body = res.body as JsonOf<TrackResponse>;

    expectTypeOf(body).toHaveProperty("track");
    expect(body.success).toBe(true);
    expect(Object.keys(body.track.admin)).not.toContain("password");
  });

  it("GET /api/courses matches CoursesResponse", async () => {
    await seed();
    const res = await request(app()).get("/api/courses");
    const body = res.body as JsonOf<CoursesResponse>;

    expectTypeOf(body).toHaveProperty("courses");
    expect(body.courses[0]!.id).toBeUndefined();
    expect(typeof body.courses[0]!.track.id).toBe("string");
  });

  it("GET /api/invoices matches InvoicesResponse", async () => {
    await seed();
    const instance = app();
    const login = await request(instance)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "Password123" });

    const res = await request(instance)
      .get("/api/invoices")
      .set("Authorization", `Bearer ${login.body.token}`);
    const body = res.body as JsonOf<InvoicesResponse>;

    expectTypeOf(body).toHaveProperty("invoices");
    expect(body.success).toBe(true);
    expect(Array.isArray(body.invoices)).toBe(true);
  });

  it("every catalogue error uses the envelope", async () => {
    const instance = app();
    const cases = await Promise.all([
      request(instance).get("/api/tracks/not-an-id"),
      request(instance).get("/api/tracks/507f1f77bcf86cd799439011"),
      request(instance).post("/api/tracks"),
      request(instance).get("/api/learners"),
    ]);

    for (const res of cases) {
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(typeof res.body.errors[0].message).toBe("string");
    }
  });
});
```

- [ ] **Step 2: Run and verify it passes**

```bash
pnpm --filter @learnbase/api test
pnpm run typecheck
```

- [ ] **Step 3: Prove the contract test has teeth**

Temporarily change `toPublicTrack` to omit `id`, confirm `pnpm run typecheck` fails (the literal no longer satisfies `Track`), restore. Then change the tracks controller to respond `{ success: true, tracks }` without `count`, confirm typecheck fails, restore. Report both, and confirm `git diff apps/api` is empty.

- [ ] **Step 4: Document the new routes in the README**

Add a section to `apps/api/README.md` listing the catalogue endpoints and which require an Admin role, in the same style as the existing content.

- [ ] **Step 5: Verify every previously-404ing route now answers**

Start the server against a local or Atlas database and confirm each returns something other than 404:

```bash
pnpm --filter @learnbase/api dev
# in another shell:
for p in tracks courses learners invoices; do
  printf "GET /api/%-10s -> " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5050/api/$p"
done
```

Expected: `tracks` and `courses` return 200; `learners` and `invoices` return 401 (they require authentication). None returns 404. Record the real output in your report.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/tracks/catalogue.contract.test.ts apps/api/README.md
git commit -m "test(api): assert catalogue responses match the contract"
```

---

## Definition of Done

- [ ] All 13 endpoints respond; none of `/api/tracks`, `/api/courses`, `/api/learners`, `/api/invoices` returns 404.
- [ ] `pnpm run build`, `test`, `typecheck` and `lint` all pass from the root.
- [ ] Roughly 160 tests in `apps/api`.
- [ ] No response contains `password`, `verificationToken`, `verificationTokenExpiresAt`, `resetPasswordToken`, `resetPasswordExpiresAt`, `verificationAttempts` or `passwordChangedAt` — including inside a populated `admin` or `learner`.
- [ ] Every admin-only mutation returns 403 for a Learner, verified route by route.
- [ ] A learner's `GET /invoices` returns only their own invoices, proven with two learners' data present.
- [ ] Deleting a track with courses attached is refused with 409.
- [ ] A malformed `:id` returns 400, never 500.
- [ ] `price` arrives as a string and is stored as a number; `"abc"` is rejected.
- [ ] No `as unknown as` cast was added outside the two unpopulated-reference fallbacks.

## Not in this phase

- `POST /invoices`, `PUT /invoices/:id`, `POST /enrollments` and the Paystack webhook — Phase 3. The webhook needs `express.raw()` mounted before the global JSON parser, which is a change to `app.ts`'s middleware order and deserves its own plan.
- Ratings endpoints. The `ratings` array is modelled and returned but nothing writes to it yet.
- Deleting a track's courses in a cascade. This phase refuses the delete instead; a cascade needs a product decision about whether learners enrolled in that track keep access.
