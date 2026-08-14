import { env } from "../config/env.js";

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!env.brevoApiKey || !env.brevoSenderEmail) {
    console.log(`[SIMULATOR - RESET LINK] ${to}: ${resetUrl}`);
    return { success: true, simulated: true };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.brevoApiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: env.brevoSenderEmail, name: env.brevoSenderName },
      to: [{ email: to, name: name || undefined }],
      subject: "Reset your SmartTailor password",
      htmlContent: `<p>Hello ${name || "there"},</p><p>Use the link below to reset your SmartTailor password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>`
    })
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "Brevo could not send the reset email");
  }
  return { success: true };
}
