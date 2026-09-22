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

export const UpdateProfileTypeSchema = z.object({
  name: z.string().min(1, "Track name is required"),
  price: z.string().min(1, "Price is required"),
  duration: z.string().min(1, "Duration is required"),
  instructor: z.string().min(1, "Instructor is required"),
  image: fileSchema, // Required image
  description: z.string().min(1, "Description is required"),
});
