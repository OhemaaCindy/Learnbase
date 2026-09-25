import { describe, it, expect, beforeEach } from "vitest";
import { assertAllowedResetUrl } from "./clientOrigins.js";
import { AppError } from "../errors/AppError.js";

const ADMIN_ORIGIN = "https://admin.example.com";
const LEARNER_ORIGIN = "https://learner.example.com";

beforeEach(() => {
  process.env.CLIENT_ADMIN_URL = ADMIN_ORIGIN;
  process.env.CLIENT_LEARNER_URL = LEARNER_ORIGIN;
});

describe("assertAllowedResetUrl", () => {
  it("accepts an allowed url and returns its parsed, re-serialised form", () => {
    const candidate = `${LEARNER_ORIGIN}/reset-password`;
    const result = assertAllowedResetUrl(candidate);
    expect(result).toBe(new URL(candidate).href);
    expect(result).toBe("https://learner.example.com/reset-password");
  });

  it("normalises a backslash-disguised userinfo attack instead of returning it raw", () => {
    const candidate = `${LEARNER_ORIGIN}\\@evil.test/reset-password`;
    const result = assertAllowedResetUrl(candidate);
    // WHATWG's `new URL(...).origin` treats the backslash as a path
    // separator, so the origin check alone accepts this candidate. The fix
    // is what gets RETURNED: the parsed, re-serialised url, which never
    // carries the literal backslash — unlike the raw candidate, it resolves
    // to learner.example.com under every parser, WHATWG or RFC 3986.
    expect(result).not.toContain("\\");
    expect(result).toBe(new URL(candidate).href);
    expect(new URL(result).host).toBe("learner.example.com");
  });

  it("rejects a suffix attack — an origin that merely starts with an allowed one", () => {
    expect(() =>
      assertAllowedResetUrl("https://learner.example.com.evil.test/reset-password"),
    ).toThrow(AppError);
  });

  it("rejects a userinfo attack — an allowed host used as credentials for a different origin", () => {
    expect(() =>
      assertAllowedResetUrl("https://learner.example.com@evil.test/reset-password"),
    ).toThrow(AppError);
  });

  it("strips userinfo from an allowed host instead of returning it verbatim", () => {
    // Origin here really is the allowed learner.example.com — `.origin`
    // ignores userinfo — so this passes the allowlist check. Returning it
    // unchanged would email a link that reads as leading with "evil.test@",
    // a phishing tell, even though no parser is actually fooled about the host.
    const candidate = "https://evil.test@learner.example.com/reset-password";
    const result = assertAllowedResetUrl(candidate);
    expect(result).not.toContain("evil.test@");
    expect(result).not.toContain("@");
    expect(new URL(result).username).toBe("");
    expect(new URL(result).host).toBe("learner.example.com");
  });

  it("rejects a non-http(s) scheme", () => {
    expect(() =>
      assertAllowedResetUrl("ftp://learner.example.com/reset-password"),
    ).toThrow(AppError);
  });

  it("rejects a protocol-relative url", () => {
    expect(() =>
      assertAllowedResetUrl("//learner.example.com/reset-password"),
    ).toThrow(AppError);
  });

  it("rejects an otherwise-allowed host on the wrong port", () => {
    expect(() =>
      assertAllowedResetUrl("https://learner.example.com:8443/reset-password"),
    ).toThrow(AppError);
  });

  it("rejects an otherwise-allowed host on the wrong scheme", () => {
    expect(() =>
      assertAllowedResetUrl("http://learner.example.com/reset-password"),
    ).toThrow(AppError);
  });

  it("also accepts the other configured origin", () => {
    const candidate = `${ADMIN_ORIGIN}/reset-password`;
    expect(assertAllowedResetUrl(candidate)).toBe(new URL(candidate).href);
  });
});
