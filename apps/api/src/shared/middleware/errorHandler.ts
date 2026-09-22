import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import type { ApiErrorResponse } from "@learnbase/types";
import { AppError } from "../errors/AppError.js";

interface DuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is DuplicateKeyError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  );
}

/**
 * Converts every failure into `{ success: false, errors: [{ message }] }`.
 * Mounted last, so no controller ever formats an error itself.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, messages: string[]) => {
    const body: ApiErrorResponse = {
      success: false,
      errors: messages.map((message) => ({ message })),
    };
    res.status(status).json(body);
  };

  if (err instanceof AppError) {
    return send(err.statusCode, [err.message]);
  }

  if (err instanceof ZodError) {
    return send(
      400,
      err.issues.map((issue) =>
        issue.path.length > 0
          ? `${issue.path.join(".")}: ${issue.message}`
          : issue.message,
      ),
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return send(400, [`Invalid ${err.path}: ${String(err.value)}`]);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return send(
      400,
      Object.values(err.errors).map((issue) => issue.message),
    );
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    return send(409, [`A record with that ${field} already exists`]);
  }

  console.error("Unhandled error:", err);
  return send(500, ["Something went wrong"]);
};
