import { createBrevoMailer, type Mailer } from "./mailer.js";
import { createCloudinaryImageStore, type ImageStore } from "./imageStore.js";

export interface AppDeps {
  mailer: Mailer;
  imageStore: ImageStore;
}

export function createRealDeps(): AppDeps {
  return { mailer: createBrevoMailer(), imageStore: createCloudinaryImageStore() };
}

export type { Mailer, MailMessage } from "./mailer.js";
export type { ImageStore } from "./imageStore.js";
