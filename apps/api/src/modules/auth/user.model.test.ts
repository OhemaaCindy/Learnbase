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
