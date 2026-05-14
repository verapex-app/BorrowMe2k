import { useQuery } from "@tanstack/react-query";
import { formatXAF } from "@/lib/format";

type Repayment = {
  id: number;
  loanId: number;
  userId: number;
  amount: string;
  paidAt: string;
  method: string;
};

const methodLabel: Record<string, string> = {
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
};

const methodColors: Record<string, string> = {
  mobile_money: "bg-blue-100 text-blue-700",
  bank_transfer: "bg-purple-100 text-purple-700",
  cash: "bg-gray-100 text-gray-700",
};

export default function Repayments() {
  const { data: repayments = [], isLoading } = useQuery<Repayment[]>({
    queryKey: ["/api/admin/repayments"],
    queryFn: () => fetch("/api/admin/repayments").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const total = repayments.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Repayments</h2>
        <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
          {formatXAF(total)} total
        </span>
      </div>

      {repayments.length === 0 && (
        <p className="text-center text-gray-400 py-8">No repayments yet</p>
      )}

      <div className="space-y-2">
        {repayments.map((r) => (
          <div key={r.id} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{formatXAF(Number(r.amount))}</p>
              <p className="text-xs text-gray-500">
                User #{r.userId} · Loan #{r.loanId} · {new Date(r.paidAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodColors[r.method] ?? "bg-gray-100 text-gray-600"}`}>
              {methodLabel[r.method] ?? r.method}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
