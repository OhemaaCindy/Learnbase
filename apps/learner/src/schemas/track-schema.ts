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

// export const AddTrackTypeSchema = z.object({
//   name: z.string().min(1, "Track name is required"),
//   price: z.string().min(1, "Price is required"),
//   duration: z.string().min(1, "Duration is required"),
//   instructor: z.string().min(1, "Instructor is required"),
//   image: fileSchema.optional().or(z.literal(null)), // Make optional or required based on your needs
//   // For required image, use: image: fileSchema,
//   description: z.string().min(1, "Description is required"),
// });

// If you want to make the image required, use this instead:
export const AddTrackTypeSchema = z.object({
  name: z.string().min(1, "Track name is required"),
  price: z.string().min(1, "Price is required"),
  duration: z.string().min(1, "Duration is required"),
  instructor: z.string().min(1, "Instructor is required"),
  image: fileSchema, // Required image
  description: z.string().min(1, "Description is required"),
});

export type AddTrackFormData = z.infer<typeof AddTrackTypeSchema>;

export const UpdateTrackTypeSchema = z.object({
  name: z.string().optional(),
  price: z.string().optional(),
  duration: z.string().optional(),
  instructor: z.string().optional(),
  // image: fileSchema, // Required image
  image: fileSchema.optional().or(z.literal(null)), // Make optional or required based on your needs
  description: z.string().optional(),
});

export type UpdateTrackFormData = z.infer<typeof UpdateTrackTypeSchema>;
