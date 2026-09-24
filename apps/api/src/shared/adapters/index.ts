import { createBrevoMailer, type Mailer } from "./mailer.js";

export interface AppDeps {
  mailer: Mailer;
}

export function createRealDeps(): AppDeps {
  return { mailer: createBrevoMailer() };
}

export type { Mailer, MailMessage } from "./mailer.js";
