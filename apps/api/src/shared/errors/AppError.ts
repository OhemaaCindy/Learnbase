/**
 * The only error type controllers and services throw deliberately.
 * Anything else reaching the error handler is treated as unexpected
 * and its message is hidden from the client.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
