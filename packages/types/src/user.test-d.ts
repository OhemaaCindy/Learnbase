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
