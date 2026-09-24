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
