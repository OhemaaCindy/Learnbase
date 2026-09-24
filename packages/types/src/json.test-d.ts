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
