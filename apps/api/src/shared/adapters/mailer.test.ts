import { describe, it, expect } from "vitest";
import { verificationEmail, resetPasswordEmail } from "./mailer.js";

describe("email templates", () => {
  it("puts the code in both the html and the text of a verification email", () => {
    const mail = verificationEmail("482913");
    expect(mail.html).toContain("482913");
    expect(mail.text).toContain("482913");
    expect(mail.subject.length).toBeGreaterThan(0);
  });

  it("puts the link in both parts of a reset email", () => {
    const link = "https://admin.example.com/reset-password/abc123";
    const mail = resetPasswordEmail(link);
    expect(mail.html).toContain(link);
    expect(mail.text).toContain(link);
  });

  it("escapes html-significant characters in the link", () => {
    const mail = resetPasswordEmail("https://x.example/a?b=1&c=2");
    expect(mail.html).toContain("&amp;");
    expect(mail.html).not.toContain("b=1&c=2");
  });
});
