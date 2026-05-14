import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `BorrowMe2K <no-reply@borrowme2k.com>`;

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function storeOtp(email: string, code: string) {
  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
}

export function verifyOtp(email: string, code: string): boolean {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(email.toLowerCase());
  return true;
}

export async function sendOtpEmail(email: string): Promise<string> {
  const code = generateOtp();
  storeOtp(email, code);

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your BorrowMe2K verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">BorrowMe2K</h2>
          <p style="color:#374151;font-size:15px;">Your email verification code is:</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1d4ed8;margin:24px 0;text-align:center;">
            ${code}
          </div>
          <p style="color:#6b7280;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
  } catch (err: any) {
    otpStore.delete(email.toLowerCase());
    throw new Error("Failed to send verification email. Please check the address and try again.");
  }

  return code;
}
