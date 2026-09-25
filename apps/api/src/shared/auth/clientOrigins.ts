import { AppError } from "../errors/AppError.js";

export function allowedOrigins(): string[] {
  return [
    process.env.CLIENT_ADMIN_URL ?? "http://localhost:5173",
    process.env.CLIENT_LEARNER_URL ?? "http://localhost:5174",
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

  // Strip userinfo before returning: `.origin` ignores it, so
  // `https://evil.test@learner.example.com/reset` passes the check above
  // (the origin really is learner.example.com, no token is exfiltrated) but
  // would otherwise be emailed back out verbatim, reading as a link that
  // leads with "evil.test@" — a phishing tell we don't need to ship.
  parsed.username = "";
  parsed.password = "";

  // Return the PARSED url, never the caller's raw string: validating one
  // representation and using another is how `https://good.example\@evil.test`
  // passes a WHATWG origin check and still resolves to evil.test under RFC 3986.
  return parsed.href;
}
