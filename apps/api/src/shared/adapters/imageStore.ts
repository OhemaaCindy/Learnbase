import { v2 as cloudinary } from "cloudinary";

export interface ImageStore {
  /** Uploads bytes and resolves to the hosted URL. */
  upload(file: Buffer, folder: string): Promise<string>;
}

export function createCloudinaryImageStore(): ImageStore {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return {
    upload(file: Buffer, folder: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Cloudinary upload failed"));
              return;
            }
            resolve(result.secure_url);
          },
        );
        stream.end(file);
      });
    },
  };
}
