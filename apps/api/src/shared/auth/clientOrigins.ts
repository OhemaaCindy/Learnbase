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
