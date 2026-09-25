import mongoose, { Schema, model, type Document, type Model } from "mongoose";
import bcrypt from "bcrypt";
import type { Role, User as PublicUser } from "@learnbase/types";

export const BCRYPT_ROUNDS = 12;

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
  passwordChangedAt?: Date;
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
    // Set on every password change (reset or change-password), never read
    // back by application code — only compared against a token's `iat` in
    // `authenticate` so a token issued before the change stops working.
    // `select: false` so it never appears on an ordinary query, on top of
    // being excluded from `toPublicUser` below.
    passwordChangedAt: { type: Date, select: false },
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

/**
 * The only way a user reaches a response body. This is an ALLOWLIST: every
 * field on `PublicUser` is copied here explicitly off the typed
 * `UserDocument`, so a field added to the schema later — a future
 * credential, token, or `passwordChangedAt` above — is excluded by default
 * until someone deliberately adds it here, instead of leaking by omission
 * the way a denylist (delete the known-sensitive fields, return the rest)
 * would.
 *
 * Because the return value is an object literal assigned to `PublicUser`
 * (never cast to it), tsc checks this against the contract on every build:
 * a field the contract requires but that isn't listed below is a compile
 * error, not a runtime surprise — which is how this used to ship a
 * `lastLogin` the type claimed was always present but signup never sets.
 */
export function toPublicUser(doc: UserDocument): PublicUser {
  return {
    _id: doc._id.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    role: doc.role,
    isVerified: doc.isVerified,
    lastLogin: doc.lastLogin,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    __v: doc.__v,
    contact: doc.contact,
    profileImage: doc.profileImage,
    description: doc.description,
    location: doc.location,
    disabled: doc.disabled,
  };
}
