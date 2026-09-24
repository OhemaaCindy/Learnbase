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
