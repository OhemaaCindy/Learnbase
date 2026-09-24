import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import type { ApiErrorResponse } from "@learnbase/types";

const PASS_THROUGH: RequestHandler = (_req, _res, next) => next();

export interface LimiterOptions {
  windowMs: number;
  max: number;
}

/**
 * Limiters are inert under NODE_ENV=test so suites do not trip each other,
 * except when RATE_LIMIT_IN_TESTS is set — which is how the limiter's own
 * behaviour is tested.
 */
export function makeLimiter(options: LimiterOptions): RequestHandler {
  if (process.env.NODE_ENV === "test" && !process.env.RATE_LIMIT_IN_TESTS) {
    return PASS_THROUGH;
  }

  const body: ApiErrorResponse = {
    success: false,
    errors: [{ message: "Too many requests. Please try again later." }],
  };

  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(body);
    },
  });
}

export const loginLimiter: RequestHandler = makeLimiter({ windowMs: 15 * 60_000, max: 10 });
export const emailLimiter: RequestHandler = makeLimiter({ windowMs: 60 * 60_000, max: 5 });
export const otpLimiter: RequestHandler = makeLimiter({ windowMs: 15 * 60_000, max: 10 });
