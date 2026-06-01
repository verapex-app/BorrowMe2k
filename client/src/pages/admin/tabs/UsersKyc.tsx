import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  ShieldCheck, ShieldX, Clock, Shield, ExternalLink, X, Link2,
  ChevronDown, Mail, Send, CheckCircle2, AlertCircle, Hourglass,
  Link as LinkIcon, Eye, Trash2,
} from "lucide-react";

type AdminUser = {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  kycStatus: "not_submitted" | "pending" | "verified" | "rejected";
  kycLink: string | null;
  kycLinkSecondary: string | null;
  kycNotes: string | null;
  idCardNumber?: string | null;
  kycWaitingUntil?: string | null;
};

/** Extract the email address embedded in a Persona KYC URL */
function extractKycEmail(kycLink: string | null): string | null {
  if (!kycLink) return null;
  try {
    const url = new URL(kycLink);
    // Try both encoded and decoded param names
    const encoded = url.searchParams.get("fields[email_address]");
    if (encoded) return decodeURIComponent(encoded);
    // Some links may have the param with percent-encoded brackets in the raw string
    const raw = kycLink.match(/fields(?:%5B|\[)email_address(?:%5D|\])=([^&]+)/i);
    if (raw) return decodeURIComponent(raw[1]);
  } catch {
    // not a valid URL
  }
  return null;
}

const kycConfig = {
  not_submitted: { label: "Not Submitted", color: "bg-gray-100 text-gray-600", Icon: Shield },
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700", Icon: Clock },
  verified: { label: "Verified", color: "bg-green-100 text-green-700", Icon: ShieldCheck },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", Icon: ShieldX },
};

const defaultKycMessages: Record<AdminUser["kycStatus"], string> = {
  verified:
    "Great news! Your identity has been successfully verified on BorrowMe2K. You can now apply for any of our loan products. Log in to the app to get started.",
  rejected:
    "Unfortunately, we were unable to verify your identity with the documents submitted. Please resubmit your KYC with a clear, valid, government-issued ID. If you have any questions, reply to this email.",
  pending:
    "We have received your KYC submission and it is currently under review. Our team will get back to you within 24 hours.",
  not_submitted:
    "Please complete your identity verification on BorrowMe2K to unlock access to our loan products. Open the app and follow the KYC steps to get started.",
};

function isWaiting(user: AdminUser): boolean {
  if (!user.kycWaitingUntil) return false;
  return new Date(user.kycWaitingUntil).getTime() > Date.now();
}

function waitingMinutes(user: AdminUser): number {
  if (!user.kycWaitingUntil) return 0;
  return Math.max(0, Math.ceil((new Date(user.kycWaitingUntil).getTime() - Date.now()) / 60000));
}

// ── Rich email editor with link insertion ──────────────────────────────────

function LinkInsertDialog({
  onInsert,
  onClose,
}: {
  onInsert: (text: string, url: string) => void;
  onClose: () => void;
}) {
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");

  return (
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-full mb-2 z-[90] bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700">Insert Clickable Link</p>
        <input
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          placeholder="Link label (e.g. Verify your identity)"
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
          autoFocus
        />
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (linkText.trim() && linkUrl.trim()) {
                onInsert(linkText.trim(), linkUrl.trim());
                onClose();
              }
            }}
            className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg font-medium"
          >
            Insert
          </button>
        </div>
      </div>
    </>
  );
}

function RichEmailEditor({
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [preview, setPreview] = useState(false);

  const insertLink = (text: string, url: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const label = selected || text;
    const insertion = `[${label}](${url})`;
    const newVal = value.slice(0, start) + insertion + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  // Simple preview renderer — convert [text](url) to <a> tags
  const renderPreview = (msg: string) =>
    msg
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, "<br/>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        (_m, label, url) =>
          `<a href="${url}" style="color:#15803d;font-weight:600;">${label}</a>`,
      );

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-1">Email Message</p>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <Eye className="w-3 h-3" />
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 min-h-[120px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none pb-10"
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLinkDialog(!showLinkDialog)}
                className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-2 py-1 font-medium"
              >
                <LinkIcon className="w-3 h-3" />
                Insert Link
              </button>
              {showLinkDialog && (
                <LinkInsertDialog
                  onInsert={insertLink}
                  onClose={() => setShowLinkDialog(false)}
                />
              )}
            </div>
            <p className="text-xs text-gray-400 ml-1">Use [label](url) for clickable links</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Clear Waiting Dialog ───────────────────────────────────────────────────

function ClearWaitingDialog({
  user,
  onClose,
  onCleared,
}: {
  user: AdminUser;
  onClose: () => void;
  onCleared: () => void;
}) {
  const qc = useQueryClient();
  const kycLink = user.kycLink ?? "";
  const defaultMsg =
    `Hello,\n\nYour loan is almost approved.\n\nPlease log in to your account and apply for your loan application.\n\nWe will also need you to confirm your identity. You can easily verify your identity using the link below:\n\n[Verify Your Identity](${kycLink || "https://..."})\n\nThank you.`;

  const [message, setMessage] = useState(defaultMsg);
  const [sendEmail, setSendEmail] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const clear = async () => {
    setClearing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}/clear-waiting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailMessage: message, sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setDone(true);
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setTimeout(() => { onCleared(); onClose(); }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />
      <div className="fixed inset-x-3 top-[5%] bottom-[5%] z-[70] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-lg mx-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-gray-900 text-sm">End Waiting Period</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">What this does</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Ends the 10-minute waiting period for <strong>{user.fullName ?? user.username}</strong>.
              The user will immediately be able to proceed to identity verification.
              {user.email && " An email will be sent to notify them."}
            </p>
          </div>

          {user.email && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-gray-300 text-green-600"
                />
                <span className="text-sm text-gray-700 font-medium">Send email notification</span>
              </label>

              {sendEmail && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    To: <span className="font-medium text-gray-800">{user.email}</span>
                  </p>
                  <RichEmailEditor
                    value={message}
                    onChange={setMessage}
                    placeholder="Write your message..."
                    rows={9}
                  />
                  <p className="text-xs text-gray-400">
                    Tip: Use <code className="bg-gray-100 px-1 rounded">[label](url)</code> to insert a clickable link. Use the "Insert Link" button for help.
                  </p>
                </div>
              )}
            </>
          )}

          {!user.email && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              This user has no email address — no notification will be sent.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          {done ? (
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm py-2.5 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Waiting period ended!
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={clear}
                disabled={clearing}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Hourglass className="w-3.5 h-3.5" />
                {clearing ? "Processing…" : "End Waiting Period"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── KYC Status Email Dialog ────────────────────────────────────────────────

function KycEmailDialog({
  user,
  newStatus,
  onClose,
  onSent,
}: {
  user: AdminUser;
  newStatus: AdminUser["kycStatus"];
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState(defaultKycMessages[newStatus]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!message.trim()) { setError("Message cannot be empty"); return; }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/send-kyc-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newStatus, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to send");
      setSent(true);
      setTimeout(() => { onSent(); onClose(); }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const cfg = kycConfig[newStatus];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />
      <div className="fixed inset-x-3 top-[10%] bottom-[10%] z-[70] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-lg mx-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-900 text-sm">Notify User by Email</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${cfg.color}`}>
            <cfg.Icon className="w-3.5 h-3.5" />
            Status changing to: {cfg.label}
          </div>
          <p className="text-xs text-gray-500">
            To: <span className="font-medium text-gray-800">{user.email ?? "No email on file"}</span>
          </p>
          <RichEmailEditor value={message} onChange={setMessage} placeholder="Write your message..." rows={8} />
          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          {sent ? (
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm py-2.5 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Email sent!
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
                Skip
              </button>
              <button
                onClick={send}
                disabled={sending || !user.email}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending…" : "Send Email"}
              </button>
            </div>
          )}
          {!user.email && (
            <p className="text-xs text-amber-600 mt-2 text-center">This user has no email address on file.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Send Custom Email Panel ────────────────────────────────────────────────

function SendEmailPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!subject.trim()) { setError("Subject is required"); return; }
    if (!message.trim()) { setError("Message is required"); return; }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to send");
      setSent(true);
      setTimeout(onClose, 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm py-4 bg-green-50 rounded-xl">
        <CheckCircle2 className="w-4 h-4" />
        Email sent successfully!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        To: <span className="font-medium text-gray-800">{user.email ?? "No email on file"}</span>
      </p>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Subject</p>
        <input
          value={subject}
          onChange={(e) => { setSubject(e.target.value); setError(""); }}
          placeholder="Email subject..."
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <RichEmailEditor value={message} onChange={(v) => { setMessage(v); setError(""); }} placeholder="Write your message here..." rows={5} />
      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        onClick={send}
        disabled={sending || !user.email}
        className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-3.5 h-3.5" />
        {sending ? "Sending…" : "Send Email"}
      </button>
      {!user.email && (
        <p className="text-xs text-amber-600 text-center">This user has no email address on file.</p>
      )}
    </div>
  );
}

// ── Delete User Confirmation Dialog ───────────────────────────────────────

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUser;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to delete user");
      setDone(true);
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setTimeout(() => { onDeleted(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <p className="font-semibold text-gray-900 text-sm">Delete User</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-red-800 mb-0.5">This cannot be undone</p>
            <p className="text-xs text-red-700 leading-relaxed">
              Deleting <strong>{user.fullName ?? user.username}</strong> will permanently remove their
              account, all loans, and all repayments. Their assigned KYC link will
              be released back to the pool.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          {done ? (
            <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm py-2.5 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              User deleted
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Bottom Sheet ───────────────────────────────────────────────────────────

function KycBottomSheet({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient();
  const [kycLink, setKycLink] = useState(user.kycLink ?? "");
  const [kycLinkSecondary, setKycLinkSecondary] = useState(user.kycLinkSecondary ?? "");
  const [kycNotes, setKycNotes] = useState(user.kycNotes ?? "");
  const [showIframe, setShowIframe] = useState(false);
  const [showIframeSecondary, setShowIframeSecondary] = useState(false);
  const [kycLinkError, setKycLinkError] = useState("");
  const [kycLinkSecondaryError, setKycLinkSecondaryError] = useState("");
  const [savingSecondary, setSavingSecondary] = useState(false);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AdminUser["kycStatus"] | null>(null);
  const [showClearWaiting, setShowClearWaiting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use live user data (refetch to get waiting state)
  const { data: liveUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then((r) => r.json()),
  });
  const liveUser = liveUsers?.find((u) => u.id === user.id) ?? user;
  const userIsWaiting = isWaiting(liveUser);

  const updateUser = useMutation({
    mutationFn: (patch: Partial<AdminUser>) =>
      fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/users"] }),
  });

  const setStatus = (status: AdminUser["kycStatus"]) => {
    updateUser.mutate({ kycStatus: status, kycNotes, kycLink });
    setPendingStatus(status);
  };

  const isValidUrl = (val: string) => {
    if (!val) return true;
    try { new URL(val); return true; } catch { return false; }
  };

  const saveLink = () => {
    if (kycLink && !isValidUrl(kycLink)) {
      setKycLinkError("Must be a valid URL starting with https://");
      return;
    }
    setKycLinkError("");
    updateUser.mutate({ kycLink, kycNotes });
  };

  const saveSecondaryLink = async () => {
    if (!kycLinkSecondary) { setKycLinkSecondaryError("Enter a secondary KYC link"); return; }
    if (!isValidUrl(kycLinkSecondary)) {
      setKycLinkSecondaryError("Must be a valid URL starting with https://");
      return;
    }
    setKycLinkSecondaryError("");
    setSavingSecondary(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/secondary-kyc-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycLinkSecondary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to save");
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (e: any) {
      setKycLinkSecondaryError(e.message);
    } finally {
      setSavingSecondary(false);
    }
  };

  const kycEmailFromLink = extractKycEmail(liveUser.kycLink);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{liveUser.fullName ?? liveUser.username}</p>
              {userIsWaiting && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <Hourglass className="w-3 h-3" />
                  Waiting ({waitingMinutes(liveUser)}m)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{liveUser.email ?? liveUser.phone ?? `@${liveUser.username}`}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Waiting period control */}
          {userIsWaiting && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hourglass className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">User is in Waiting Period</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed mb-3">
                This user submitted their KYC details and is waiting for approval (10-minute window).
                Approx. <strong>{waitingMinutes(liveUser)} minutes</strong> remaining on the countdown.
              </p>
              <button
                onClick={() => setShowClearWaiting(true)}
                className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Hourglass className="w-4 h-4" />
                End Waiting Period & Notify User
              </button>
            </div>
          )}

          {/* KYC Status */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">KYC Status</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(kycConfig) as [AdminUser["kycStatus"], typeof kycConfig[keyof typeof kycConfig]][]).map(
                ([status, { label, color, Icon }]) => (
                  <button
                    key={status}
                    onClick={() => setStatus(status)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      liveUser.kycStatus === status
                        ? `${color} border-current`
                        : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-left leading-tight">{label}</span>
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Changing status will prompt you to notify the user by email.</p>
          </div>

          {/* Primary KYC Provider Link */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Primary KYC Link</p>
            {kycEmailFromLink && (
              <div className="flex items-center gap-1.5 mb-2 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                <Mail className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-blue-700 font-medium break-all">KYC Email: {kycEmailFromLink}</span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={kycLink}
                onChange={(e) => { setKycLink(e.target.value); setKycLinkError(""); }}
                placeholder="https://kyc-provider.com/session/..."
                className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 ${kycLinkError ? "border-red-400" : "border-gray-200"}`}
              />
              <button onClick={saveLink} className="px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium">
                Save
              </button>
            </div>
            {kycLinkError && <p className="text-xs text-red-500 mt-1">{kycLinkError}</p>}
            {kycLink && (
              <button
                onClick={() => setShowIframe(!showIframe)}
                className="mt-2 flex items-center gap-2 text-sm text-green-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {showIframe ? "Hide KYC review" : "Open KYC review in-app"}
              </button>
            )}
          </div>

          {showIframe && kycLink && (
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-100">
                <Link2 className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs text-gray-500 truncate flex-1">{kycLink}</p>
                <a href={kycLink} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 font-medium flex-shrink-0">
                  Open tab
                </a>
              </div>
              <iframe src={kycLink} className="w-full" style={{ height: 420 }} title="KYC Provider" allow="camera; microphone" />
            </div>
          )}

          {/* Secondary KYC Link (admin-assigned only) */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Secondary KYC Link</p>
            <p className="text-xs text-gray-400 mb-2">Admin-only. Does not overwrite the primary link.</p>
            <div className="flex gap-2">
              <input
                value={kycLinkSecondary}
                onChange={(e) => { setKycLinkSecondary(e.target.value); setKycLinkSecondaryError(""); }}
                placeholder="https://kyc-provider.com/session/..."
                className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${kycLinkSecondaryError ? "border-red-400" : "border-gray-200"}`}
              />
              <button
                onClick={saveSecondaryLink}
                disabled={savingSecondary}
                className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {savingSecondary ? "…" : "Save"}
              </button>
            </div>
            {kycLinkSecondaryError && <p className="text-xs text-red-500 mt-1">{kycLinkSecondaryError}</p>}
            {liveUser.kycLinkSecondary && (
              <button
                onClick={() => setShowIframeSecondary(!showIframeSecondary)}
                className="mt-2 flex items-center gap-2 text-sm text-blue-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {showIframeSecondary ? "Hide secondary review" : "Open secondary review in-app"}
              </button>
            )}
          </div>

          {showIframeSecondary && liveUser.kycLinkSecondary && (
            <div className="rounded-xl overflow-hidden border border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-200 bg-blue-100">
                <Link2 className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs text-blue-600 truncate flex-1">{liveUser.kycLinkSecondary}</p>
                <a href={liveUser.kycLinkSecondary} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 font-medium flex-shrink-0">
                  Open tab
                </a>
              </div>
              <iframe src={liveUser.kycLinkSecondary} className="w-full" style={{ height: 420 }} title="Secondary KYC Provider" allow="camera; microphone" />
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Admin Notes</p>
            <textarea
              value={kycNotes}
              onChange={(e) => setKycNotes(e.target.value)}
              placeholder="Add internal notes about this user's KYC..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              onClick={() => updateUser.mutate({ kycNotes, kycLink })}
              className="mt-2 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium"
            >
              Save Notes
            </button>
          </div>

          {/* Send Custom Email */}
          <div>
            <button
              onClick={() => setShowEmailPanel(!showEmailPanel)}
              className="flex items-center justify-between w-full text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
            >
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Send Email to User
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showEmailPanel ? "rotate-180" : ""}`} />
            </button>
            {showEmailPanel && <SendEmailPanel user={liveUser} onClose={() => setShowEmailPanel(false)} />}
          </div>

          {/* User Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">User Details</p>
            {[
              ["Username", liveUser.username],
              ["Full Name", liveUser.fullName],
              ["Email", liveUser.email],
              ["Phone", liveUser.phone],
              ["City", liveUser.city],
              ["ID Card No.", liveUser.idCardNumber],
            ].map(([label, val]) =>
              val ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%] break-all">{val}</span>
                </div>
              ) : null
            )}
          </div>

          {/* Danger Zone */}
          <div className="border border-red-100 rounded-xl p-4">
            <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-2">Danger Zone</p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete User Account
            </button>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Permanently removes this user, their loans, and releases their KYC link.
            </p>
          </div>
        </div>
      </div>

      {pendingStatus && (
        <KycEmailDialog
          user={liveUser}
          newStatus={pendingStatus}
          onClose={() => setPendingStatus(null)}
          onSent={() => setPendingStatus(null)}
        />
      )}

      {showClearWaiting && (
        <ClearWaitingDialog
          user={liveUser}
          onClose={() => setShowClearWaiting(false)}
          onCleared={() => {
            setShowClearWaiting(false);
            qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
          }}
        />
      )}

      {showDeleteDialog && (
        <DeleteUserDialog
          user={liveUser}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={onClose}
        />
      )}
    </>
  );
}

// ── Main List ──────────────────────────────────────────────────────────────

export default function UsersKyc() {
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const { data: usersRaw, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const users: AdminUser[] = Array.isArray(usersRaw) ? usersRaw : [];

  const filtered =
    filter === "all" ? users : filter === "waiting"
      ? users.filter(isWaiting)
      : users.filter((u) => u.kycStatus === filter);

  const waitingCount = users.filter(isWaiting).length;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Users & KYC</h2>
          {waitingCount > 0 && (
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              {waitingCount} user{waitingCount > 1 ? "s" : ""} waiting for setup
            </p>
          )}
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 appearance-none bg-white"
          >
            <option value="all">All</option>
            <option value="waiting">⏳ Waiting</option>
            <option value="not_submitted">Not Submitted</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">No users found</p>
      )}

      <div className="space-y-2">
        {filtered.map((user) => {
          const cfg = kycConfig[user.kycStatus];
          const waiting = isWaiting(user);
          return (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className={`w-full bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center gap-3 text-left transition-colors ${
                waiting
                  ? "border-amber-200 hover:border-amber-300"
                  : "border-gray-100 hover:border-green-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${waiting ? "bg-amber-100" : "bg-green-100"}`}>
                <span className={`font-bold text-sm ${waiting ? "text-amber-700" : "text-green-700"}`}>
                  {(user.fullName ?? user.username).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {user.fullName ?? user.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email ?? user.phone ?? `@${user.username}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {waiting && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <Hourglass className="w-3 h-3" />
                    {waitingMinutes(user)}m
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <KycBottomSheet user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
