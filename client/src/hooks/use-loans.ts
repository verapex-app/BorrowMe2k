import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type {
  ApplyLoanInput,
  Loan,
  LoanProduct,
  Repayment,
  RepaymentInput,
} from "@shared/schema";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.getStats.path],
    queryFn: async () => {
      const res = await apiRequest("GET", api.dashboard.getStats.path);
      return api.dashboard.getStats.responses[200].parse(await res.json());
    },
  });
}

export function useLoanProducts() {
  return useQuery<LoanProduct[]>({
    queryKey: [api.loanProducts.list.path],
  });
}

export function useLoans() {
  return useQuery<Loan[]>({
    queryKey: [api.loans.list.path],
  });
}

export function useRepayments() {
  return useQuery<Repayment[]>({
    queryKey: [api.repayments.list.path],
  });
}

export function useApplyLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplyLoanInput) => {
      const res = await apiRequest("POST", api.loans.apply.path, input);
      return (await res.json()) as Loan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.loans.list.path] });
      qc.invalidateQueries({ queryKey: [api.dashboard.getStats.path] });
    },
  });
}

export function useRepayLoan(loanId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RepaymentInput) => {
      const res = await apiRequest(
        "POST",
        `/api/loans/${loanId}/repay`,
        input,
      );
      return (await res.json()) as Repayment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.loans.list.path] });
      qc.invalidateQueries({ queryKey: [api.repayments.list.path] });
      qc.invalidateQueries({ queryKey: [api.dashboard.getStats.path] });
    },
  });
}
