import z from "zod";

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

export const UpdateLearnerTypeSchema = z.object({
  profileImage: fileSchema.optional().or(z.literal(null)), // optional or null
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  location: z.string().optional(),
  contact: z
    .string()
    // .regex(/^0?\d{9}$/, {
    //   message: "Contact must be 10 digits",
    // })
    .transform((val) => {
      console.log("🚀 ~ val:", val);
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

export type UpdateLearnerFormData = z.infer<typeof UpdateLearnerTypeSchema>;

export const UpdatePasswordTypeSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    // password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type UpdatePasswordFormData = z.infer<typeof UpdatePasswordTypeSchema>;

export const CheckoutSchema = z.object({
  amount: z.number(),
});

export type CheckoutFormData = z.infer<typeof CheckoutSchema>;
