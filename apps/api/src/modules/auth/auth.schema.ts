import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain an uppercase letter, a lowercase letter and a number",
  );

const withConfirmation = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .refine(
      (data) =>
        (data as { password: string; confirmPassword: string }).password ===
        (data as { confirmPassword: string }).confirmPassword,
      { message: "Passwords do not match", path: ["confirmPassword"] },
    );

export const adminSignupSchema = withConfirmation({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email,
  password,
  confirmPassword: z.string(),
  contact: z.string().trim().min(1, "Contact is required"),
});

export const learnerSignupSchema = withConfirmation({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email,
  password,
  confirmPassword: z.string(),
  contact: z.string().trim().optional(),
});

export type AdminSignupInput = z.infer<typeof adminSignupSchema>;
export type LearnerSignupInput = z.infer<typeof learnerSignupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const forgotPasswordSchema = z.object({
  email,
  baseResetURL: z.string().trim().min(1, "baseResetURL is required"),
});

export const resetPasswordSchema = withConfirmation({
  password,
  confirmPassword: z.string(),
});
