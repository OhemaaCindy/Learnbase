import type { Mailer, MailMessage } from "../shared/adapters/index.js";

export function fakeMailer(): { mailer: Mailer; sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return {
    sent,
    mailer: {
      async send(message: MailMessage): Promise<void> {
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
