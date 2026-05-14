import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatXAF } from "@/lib/format";
import { ChevronDown } from "lucide-react";

type Loan = {
  id: number;
  userId: number;
  applicantName: string;
  applicantPhone: string;
  productName: string;
  principal: string;
  interestRate: string;
  termMonths: number;
  monthlyPayment: string;
  totalRepayment: string;
  amountPaid: string;
  purpose: string;
  status: "pending" | "active" | "repaid" | "rejected";
  appliedAt: string;
  dueDate: string;
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  repaid: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
};

export default function Loans() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: ["/api/admin/loans"],
    queryFn: () => fetch("/api/admin/loans").then((r) => r.json()),
  });

  const updateLoan = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/admin/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/loans"] }),
  });

  const filtered = filter === "all" ? loans : loans.filter((l) => l.status === filter);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Loans</h2>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 appearance-none bg-white"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="repaid">Repaid</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">No loans found</p>
      )}

      <div className="space-y-3">
        {filtered.map((loan) => {
          const outstanding = Number(loan.totalRepayment) - Number(loan.amountPaid);
          const progress = (Number(loan.amountPaid) / Number(loan.totalRepayment)) * 100;
          return (
            <div key={loan.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{loan.applicantName}</p>
                  <p className="text-xs text-gray-500">{loan.applicantPhone} · {loan.productName} · {loan.termMonths}mo</p>
                  {loan.purpose && (
                    <p className="text-xs text-gray-400 italic mt-0.5">"{loan.purpose}"</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[loan.status]}`}>
                  {loan.status}
                </span>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Principal</span>
                <span className="font-medium">{formatXAF(Number(loan.principal))}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-500">Outstanding</span>
                <span className="font-medium text-orange-600">{formatXAF(outstanding)}</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>

              {loan.status === "active" || loan.status === "pending" ? (
                <div className="flex gap-2 mt-2">
                  {loan.status === "pending" && (
                    <button
                      onClick={() => updateLoan.mutate({ id: loan.id, status: "active" })}
                      className="flex-1 text-xs bg-green-600 text-white rounded-lg py-1.5 font-medium"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => updateLoan.mutate({ id: loan.id, status: "rejected" })}
                    className="flex-1 text-xs bg-red-50 text-red-600 rounded-lg py-1.5 font-medium"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
