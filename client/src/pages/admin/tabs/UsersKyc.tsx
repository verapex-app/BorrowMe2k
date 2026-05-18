import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck, ShieldX, Clock, Shield, ExternalLink, X, Link2,
  ChevronDown, Mail, Send, CheckCircle2, AlertCircle,
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
  kycNotes: string | null;
  idCardNumber?: string | null;
};

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
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-2xl p-5 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-900 text-sm">Notify User by Email</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-3 ${cfg.color}`}>
          <cfg.Icon className="w-3.5 h-3.5" />
          Status changing to: {cfg.label}
        </div>

        <p className="text-xs text-gray-500 mb-1">
          To: <span className="font-medium text-gray-800">{user.email ?? "No email on file"}</span>
        </p>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-1.5">Email Message</p>
        <textarea
          value={message}
          onChange={(e) => { setMessage(e.target.value); setError(""); }}
          rows={7}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Write your message here..."
        />

        {error && (
          <div className="flex items-center gap-1.5 text-red-600 text-xs mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {sent ? (
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-sm mt-3 py-2.5 bg-green-50 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            Email sent!
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
            >
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
    </>
  );
}

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
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Message</p>
        <textarea
          value={message}
          onChange={(e) => { setMessage(e.target.value); setError(""); }}
          placeholder="Write your message here..."
          rows={5}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>
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

function KycBottomSheet({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [kycLink, setKycLink] = useState(user.kycLink ?? "");
  const [kycNotes, setKycNotes] = useState(user.kycNotes ?? "");
  const [showIframe, setShowIframe] = useState(false);
  const [kycLinkError, setKycLinkError] = useState("");
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AdminUser["kycStatus"] | null>(null);

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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">{user.fullName ?? user.username}</p>
            <p className="text-xs text-gray-500">{user.email ?? user.phone ?? `@${user.username}`}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
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
                      user.kycStatus === status
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

          {/* KYC Provider Link */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">KYC Provider Link</p>
            <div className="flex gap-2">
              <input
                value={kycLink}
                onChange={(e) => { setKycLink(e.target.value); setKycLinkError(""); }}
                placeholder="https://kyc-provider.com/session/..."
                className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 ${kycLinkError ? "border-red-400" : "border-gray-200"}`}
              />
              <button
                onClick={saveLink}
                className="px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium"
              >
                Save
              </button>
            </div>
            {kycLinkError && (
              <p className="text-xs text-red-500 mt-1">{kycLinkError}</p>
            )}
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
                <a
                  href={kycLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 font-medium flex-shrink-0"
                >
                  Open tab
                </a>
              </div>
              <iframe
                src={kycLink}
                className="w-full"
                style={{ height: 420 }}
                title="KYC Provider"
                allow="camera; microphone"
              />
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

          {/* Send Email Panel */}
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
            {showEmailPanel && (
              <SendEmailPanel user={user} onClose={() => setShowEmailPanel(false)} />
            )}
          </div>

          {/* User Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">User Details</p>
            {[
              ["Username", user.username],
              ["Full Name", user.fullName],
              ["Email", user.email],
              ["Phone", user.phone],
              ["City", user.city],
              ["ID Card No.", user.idCardNumber],
            ].map(([label, val]) =>
              val ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%] break-all">{val}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* KYC status change email dialog */}
      {pendingStatus && (
        <KycEmailDialog
          user={user}
          newStatus={pendingStatus}
          onClose={() => setPendingStatus(null)}
          onSent={() => setPendingStatus(null)}
        />
      )}
    </>
  );
}

export default function UsersKyc() {
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then((r) => r.json()),
  });

  const filtered =
    filter === "all" ? users : users.filter((u) => u.kycStatus === filter);

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
        <h2 className="text-lg font-semibold text-gray-800">Users & KYC</h2>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 appearance-none bg-white"
          >
            <option value="all">All</option>
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
          return (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3 text-left hover:border-green-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 font-bold text-sm">
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <KycBottomSheet
          user={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
