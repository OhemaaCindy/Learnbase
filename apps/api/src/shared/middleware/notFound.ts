import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

/** Mounted after all routes so unmatched paths get the envelope, not Express HTML. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
