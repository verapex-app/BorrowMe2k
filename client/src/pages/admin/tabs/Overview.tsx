import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, CreditCard, TrendingUp, ShieldCheck, Clock, Banknote, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatXAF } from "@/lib/format";

function BulkLoanApproval() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; loansCreated: number; emailsSent: number; totalUsers: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const run = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/bulk-approve-loans", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setResult(data);
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
      setConfirmed(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-200 col-span-2">
      <p className="text-sm font-semibold text-gray-800 mb-1">Bulk Loan Approval</p>
      <p className="text-xs text-gray-500 mb-3">
        Creates a <strong>100,000 XAF</strong> active loan at <strong>5% annual interest</strong> for every existing user, and sends each user an approval email.
      </p>

      {result ? (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Done — {result.loansCreated} loan{result.loansCreated !== 1 ? "s" : ""} created, {result.emailsSent} email{result.emailsSent !== 1 ? "s" : ""} sent.</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 mb-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      {!result && (
        confirmed ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmed(false)}
              className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
              disabled={running}
            >
              Cancel
            </button>
            <button
              onClick={run}
              disabled={running}
              className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {running ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</> : "Confirm & Run"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold"
          >
            Approve Loans for All Users
          </button>
        )
      )}
    </div>
  );
}

export default function Overview() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats").then((r) => r.json()),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      format: "number",
    },
    {
      label: "Total Loans",
      value: stats?.totalLoans ?? 0,
      icon: CreditCard,
      color: "bg-purple-50 text-purple-600",
      format: "number",
    },
    {
      label: "Active Loans",
      value: stats?.activeLoans ?? 0,
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
      format: "number",
    },
    {
      label: "Total Disbursed",
      value: stats?.totalDisbursed ?? 0,
      icon: Banknote,
      color: "bg-green-50 text-green-600",
      format: "currency",
    },
    {
      label: "Total Repaid",
      value: stats?.totalRepaid ?? 0,
      icon: TrendingUp,
      color: "bg-teal-50 text-teal-600",
      format: "currency",
    },
    {
      label: "KYC Pending",
      value: stats?.pendingKyc ?? 0,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      format: "number",
    },
    {
      label: "KYC Verified",
      value: stats?.verifiedKyc ?? 0,
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600",
      format: "number",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Platform Overview</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {card.format === "currency"
                ? formatXAF(card.value)
                : card.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
        <BulkLoanApproval />
      </div>
    </div>
  );
}
