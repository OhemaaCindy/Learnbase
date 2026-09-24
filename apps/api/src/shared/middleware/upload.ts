import multer from "multer";
import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

const MAX_BYTES = 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      cb(new AppError("Only JPEG, PNG, GIF and WebP images are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

/**
 * Wraps multer so its own errors become AppErrors in the standard envelope
 * rather than multer's bespoke error shape reaching the client as a 500.
 */
export function uploadSingle(field: string): RequestHandler {
  const handler = multerInstance.single(field);
  return (req, res, next) => {
    handler(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return next(
          err.code === "LIMIT_FILE_SIZE"
            ? new AppError("Image must be smaller than 1MB", 400)
            : new AppError(err.message, 400),
        );
      }
      next(err);
    });
  };
}
