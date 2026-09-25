import type { RequestHandler } from "express";
import { verifyToken } from "../auth/jwt.js";
import { AppError } from "../errors/AppError.js";
import { User } from "../../modules/auth/user.model.js";

// A token minted in the same second as a password change must not be
// spuriously rejected: `iat` has 1-second resolution, so a token signed a
// few ms before `passwordChangedAt` (but stamped with the same floored
// second) is legitimate — it's not the one the reset was meant to evict.
const IAT_SKEW_SECONDS = 1;

/**
 * Re-loads the user on every request rather than trusting the token's claims,
 * so a disabled or deleted account stops working immediately instead of at
 * token expiry. Also rejects a token issued before the account's most recent
 * password change: without this, a token stolen before a reset or
 * change-password keeps working for the rest of its 7-day life, and the
 * owner's own recovery never evicts the attacker.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Not authorised", 401));
  }

  const payload = verifyToken(header.slice("Bearer ".length).trim());
  const user = await User.findById(payload.sub).select("+passwordChangedAt");

  if (!user || user.disabled) {
    return next(new AppError("Not authorised", 401));
  }

  if (user.passwordChangedAt && payload.iat !== undefined) {
    // `iat` is seconds since epoch; `passwordChangedAt` is a `Date`
    // (milliseconds). Floor to seconds before comparing, or every
    // comparison spuriously fails by up to 999ms.
    const changedAtSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (payload.iat < changedAtSeconds - IAT_SKEW_SECONDS) {
      return next(new AppError("Not authorised", 401));
    }
  }

  req.user = user;
  next();
};
