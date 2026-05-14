import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, TrendingUp, ShieldCheck, Clock, Banknote } from "lucide-react";
import { formatXAF } from "@/lib/format";

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
      </div>
    </div>
  );
}
