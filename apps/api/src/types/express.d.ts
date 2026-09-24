import type { UserDocument } from "../modules/auth/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
