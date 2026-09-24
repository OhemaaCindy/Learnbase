import mongoose, { Schema, model, type Document, type Model } from "mongoose";
import bcrypt from "bcrypt";
import type { Role, User as PublicUser } from "@learnbase/types";

const BCRYPT_ROUNDS = 12;

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  contact?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
  verificationAttempts: number;
  lastLogin?: Date;
  profileImage?: string;
  description?: string;
  location?: string;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  comparePassword(plain: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["Admin", "Learner"], required: true },
    contact: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpiresAt: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
    verificationAttempts: { type: Number, default: 0, select: false },
    lastLogin: { type: Date },
    profileImage: { type: String },
    description: { type: String },
    location: { type: String },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function comparePassword(
  plain: string,
): Promise<boolean> {
  return bcrypt.compare(plain, this.password);
};

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  model<UserDocument>("User", userSchema);

const HIDDEN = [
  "password",
  "verificationToken",
  "verificationTokenExpiresAt",
  "resetPasswordToken",
  "resetPasswordExpiresAt",
  "verificationAttempts",
] as const;

/**
 * The only way a user reaches a response body. Deletes every credential and
 * token field rather than listing what to keep, so a field added to the schema
 * is never leaked by omission.
 */
export function toPublicUser(doc: UserDocument): PublicUser {
  const plain = doc.toObject({ virtuals: false }) as Record<string, unknown>;
  for (const key of HIDDEN) delete plain[key];
  return plain as unknown as PublicUser;
}
