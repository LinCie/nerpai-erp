import { Resend } from "resend";

export async function sendEmail(data: {
  to: string;
  subject: string;
  content: string;
}): Promise<void> {
  const { to, content, subject } = data;
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to,
    subject,
    html: content,
  });
}
