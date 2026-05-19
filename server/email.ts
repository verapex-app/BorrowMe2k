import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `BorrowMe2K <hello@borrowme2k.com>`;

/** Convert [text](url) markdown links → <a> HTML tags, and escape the rest */
function markdownLinksToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Convert [label](url) → clickable anchor
  return escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (_match, label, url) =>
      `<a href="${url}" style="color:#15803d;font-weight:600;">${label}</a>`,
  );
}

/** Render plain message text as HTML paragraphs, preserving links */
function renderMessageHtml(msg: string): string {
  return msg
    .split(/\n\n+/)
    .map((para) => {
      const inner = para
        .split("\n")
        .map((line) => markdownLinksToHtml(line))
        .join("<br/>");
      return `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">${inner}</p>`;
    })
    .join("");
}

export async function sendLoanApplicationEmails(opts: {
  applicantEmail: string;
  applicantName: string;
  productName: string;
  amount: number;
  termMonths: number;
  reason: string;
}): Promise<void> {
  const { applicantEmail, applicantName, productName, amount, reason, termMonths } = opts;
  const adminEmail = process.env.ADMIN_EMAIL;
  const formatted = amount.toLocaleString("fr-CM") + " FCFA";

  await resend.emails.send({
    from: FROM,
    to: adminEmail!,
    subject: `New Loan Application — ${applicantName}`,
    headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "High" },
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1d4ed8;margin-bottom:4px;">BorrowMe2K — New Loan Application</h2>
        <p style="color:#6b7280;font-size:13px;margin-top:0;">Received just now</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;">Applicant</td><td style="padding:8px 0;font-weight:700;font-size:14px;color:#111827;">${applicantName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:8px 0;font-size:14px;color:#111827;">${applicantEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Product</td><td style="padding:8px 0;font-size:14px;color:#111827;">${productName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Amount</td><td style="padding:8px 0;font-weight:700;font-size:14px;color:#1d4ed8;">${formatted}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Term</td><td style="padding:8px 0;font-size:14px;color:#111827;">${termMonths} month${termMonths !== 1 ? "s" : ""}</td></tr>
        </table>
        <div style="margin-top:20px;background:#fff;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 6px;">Reason given by applicant:</p>
          <p style="color:#111827;font-size:14px;margin:0;">${reason}</p>
        </div>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">Log in to the admin panel to review and set up a KYC verification link for this user.</p>
      </div>
    `,
  });

  await resend.emails.send({
    from: FROM,
    to: applicantEmail,
    subject: "We received your loan application — BorrowMe2K",
    headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "High" },
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">BorrowMe2K</h2>
        <p style="color:#374151;font-size:15px;">Hi <strong>${applicantName}</strong>,</p>
        <p style="color:#374151;font-size:15px;">
          Great news — we've received your application for a <strong>${productName}</strong> of <strong>${formatted}</strong>.
          Our team is now reviewing your request.
        </p>
        <div style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
          <p style="color:#1e40af;font-weight:700;margin:0 0 4px;font-size:14px;">⏱ Estimated review time: 10 minutes</p>
          <p style="color:#374151;font-size:13px;margin:0;">We'll send you the next steps as soon as your application is processed. You can also check the status directly in the app.</p>
        </div>
        <p style="color:#6b7280;font-size:13px;">Thank you for trusting BorrowMe2K. We'll be in touch very soon.</p>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">— The BorrowMe2K Team</p>
      </div>
    `,
  });
}

export async function sendAdminMessageToUser(opts: {
  toEmail: string;
  toName: string;
  subject: string;
  bodyHtml: string;
  kycLink?: string;
}): Promise<void> {
  const { toEmail, toName, subject, bodyHtml, kycLink } = opts;
  const bodyRendered = renderMessageHtml(bodyHtml);

  const kycButtonBlock = kycLink
    ? `<div style="text-align:center;margin:24px 0;">
        <a href="${kycLink}" style="display:inline-block;background:#15803d;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          Start Identity Verification →
        </a>
        <p style="color:#6b7280;font-size:11px;margin-top:8px;">Or copy this link: <a href="${kycLink}" style="color:#15803d;">${kycLink}</a></p>
      </div>`
    : "";

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#15803d;margin-bottom:4px;">BorrowMe2K</h2>
        <p style="color:#374151;font-size:15px;">Hi <strong>${toName}</strong>,</p>
        ${bodyRendered}
        ${kycButtonBlock}
        <p style="color:#6b7280;font-size:12px;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:16px;">— The BorrowMe2K Team</p>
      </div>
    `,
  });
}

export async function sendKycStatusEmail(opts: {
  toEmail: string;
  toName: string;
  newStatus: "verified" | "rejected" | "pending" | "not_submitted";
  customMessage: string;
}): Promise<void> {
  const { toEmail, toName, newStatus, customMessage } = opts;

  const subjectMap: Record<string, string> = {
    verified: "Your identity has been verified — BorrowMe2K",
    rejected: "Action required on your KYC submission — BorrowMe2K",
    pending: "Your KYC submission is under review — BorrowMe2K",
    not_submitted: "Complete your identity verification — BorrowMe2K",
  };

  const accentMap: Record<string, string> = {
    verified: "#15803d",
    rejected: "#dc2626",
    pending: "#d97706",
    not_submitted: "#6b7280",
  };

  const subject = subjectMap[newStatus] ?? "Update on your account — BorrowMe2K";
  const accent = accentMap[newStatus] ?? "#1d4ed8";
  const bodyRendered = renderMessageHtml(customMessage);

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "High" },
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:${accent};margin-bottom:4px;">BorrowMe2K</h2>
        <p style="color:#374151;font-size:15px;">Hi <strong>${toName}</strong>,</p>
        <div style="background:#fff;border-radius:8px;padding:20px;border:1px solid #e5e7eb;margin:16px 0;">
          ${bodyRendered}
        </div>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">— The BorrowMe2K Team</p>
      </div>
    `,
  });
}
