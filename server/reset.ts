import crypto from "crypto";
import nodemailer from "nodemailer";

interface ResetEntry {
  userId: number;
  expiresAt: number;
}

const resetStore = new Map<string, ResetEntry>();

export function createResetToken(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  resetStore.set(token, {
    userId,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });
  return token;
}

export function consumeResetToken(token: string): number | null {
  const entry = resetStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetStore.delete(token);
    return null;
  }
  resetStore.delete(token);
  return entry.userId;
}

export async function sendResetEmail(email: string, resetUrl: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"BorrowMe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Reset your BorrowMe password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">BorrowMe</h2>
          <p style="color:#374151;font-size:15px;">We received a request to reset your password.</p>
          <p style="color:#374151;font-size:15px;">Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
              Reset my password
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
        </div>
      `,
    });
  } catch (err: any) {
    if (err.code === "EAUTH" || err.responseCode === 535) {
      throw new Error("Gmail authentication failed.");
    }
    throw new Error("Failed to send reset email. Please try again.");
  }
}
