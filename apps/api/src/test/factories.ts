import type { Mailer, MailMessage } from "../shared/adapters/index.js";

export interface FakeMailerOptions {
  /**
   * Simulates a slow mail provider round trip (default 0). Needed to
   * reproduce/guard the forgot-password timing oracle: `send` used to sit
   * on the response path, so a slow mailer meant a slow response only when
   * an account existed. Combine with `flushPendingSends` (from
   * `auth.service.ts`) to await a send deterministically instead of racing it.
   */
  delayMs?: number;
}

export function fakeMailer(
  options: FakeMailerOptions = {},
): { mailer: Mailer; sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  const { delayMs = 0 } = options;
  return {
    sent,
    mailer: {
      async send(message: MailMessage): Promise<void> {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        sent.push(message);
      },
    },
  };
}

export function fakeImageStore(url = "https://images.example/test.png") {
  const uploads: { folder: string; bytes: number }[] = [];
  return {
    uploads,
    imageStore: {
      async upload(file: Buffer, folder: string): Promise<string> {
        uploads.push({ folder, bytes: file.length });
        return url;
      },
    },
  };
}
