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

export const AddCourseTypeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  track: z.string().min(1, "Please select a track"),
  image: fileSchema, // Required image
  description: z.string().min(1, "Description is required"),
});

export type AddCourseFormData = z.infer<typeof AddCourseTypeSchema>;

export const UpdateCourseTypeSchema = z.object({
  title: z.string().optional(),
  track: z.string().optional(),
  image: fileSchema.optional().or(z.literal(null)), // Make optional or required based on your needs

  description: z.string().optional(),
});

export type UpdateCourseFormData = z.infer<typeof UpdateCourseTypeSchema>;

// export const UpdateTrackTypeSchema = z.object({
//   name: z.string().optional(),
//   price: z.string().optional(),
//   duration: z.string().optional(),
//   instructor: z.string().optional(),
//   // image: fileSchema, // Required image
//   image: fileSchema.optional().or(z.literal(null)), // Make optional or required based on your needs
//   description: z.string().optional(),
// });

// export type UpdateTrackFormData = z.infer<typeof UpdateTrackTypeSchema>;
