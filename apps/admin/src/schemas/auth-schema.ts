import z from "zod";

export const registrationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters"),
    email: z.email("Invalid email address").min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    // password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    contact: z
      .string()
      .regex(/^0?\d{9}$/, {
        message: "Contact must be 10 digits",
      })
      .transform((val) => {
        if (val.startsWith("0")) {
          return "+233" + val.slice(1);
        }
        return "+233" + val;
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  email: z.email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address").min(1, "Email is required"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});
export type ResetFormData = z.infer<typeof resetSchema>;

export const otpVerifying = z.object({
  code: z.string().min(1, "Please enter a valid otp number"),
});
export type OtpFormData = z.infer<typeof otpVerifying>;

const fileSchema = z
  .instanceof(File, { message: "Please upload a file" })
  .refine((file) => file.size <= 1 * 1024 * 1024, {
    message: "File size must be less than 1MB",
  })
  .refine(
    (file) =>
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
        file.type
      ),
    {
      message: "Only JPEG, PNG, GIF, and WebP files are allowed",
    }
  );

export const UpdateAdminTypeSchema = z.object({
  profileImage: fileSchema.optional().or(z.literal(null)), // optional or null
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  location: z.string().optional(),
  contact: z
    .string()

    .transform((val) => {
      if (val.startsWith("+233")) {
        return val;
      } else if (val.startsWith("0")) {
        return "+233" + val.slice(1);
      }
      return "+233" + val;
    }),
  disabled: z.boolean(),
  description: z.string().min(1, "Please enter description").optional(),
});

export type UpdateAdminFormData = z.infer<typeof UpdateAdminTypeSchema>;
