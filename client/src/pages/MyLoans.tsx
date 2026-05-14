import { useState } from "react";
import { useLoans, useRepayLoan } from "@/hooks/use-loans";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatXAF, formatDate } from "@/lib/format";
import type { Loan } from "@shared/schema";
import { CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function MyLoans() {
  const { data: loans, isLoading } = useLoans();
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);

  return (
    <div className="bg-background pb-4">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <h1 className="text-lg font-extrabold tracking-tight">My loans</h1>
        <p className="text-xs text-muted-foreground">
          Track repayments and pay back your active loans.
        </p>
      </header>

      <main className="px-4 py-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))
        ) : !loans || loans.length === 0 ? (
          <EmptyState />
        ) : (
          loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onRepay={() => setRepayLoan(loan)}
            />
          ))
        )}
      </main>

      <RepaySheet loan={repayLoan} onClose={() => setRepayLoan(null)} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center">
        <FileText className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">No loans yet</p>
        <p className="text-xs text-muted-foreground">
          You haven&apos;t taken any loans. Browse what&apos;s available.
        </p>
      </div>
      <Link href="/loans">
        <Button data-testid="button-browse-loans" className="mt-1">
          Browse loans
        </Button>
      </Link>
    </div>
  );
}

function LoanCard({ loan, onRepay }: { loan: Loan; onRepay: () => void }) {
  const principal = Number(loan.principal);
  const total = Number(loan.totalRepayment);
  const paid = Number(loan.amountPaid);
  const outstanding = Math.max(0, total - paid);
  const progress = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  const statusColors: Record<Loan["status"], string> = {
    pending: "bg-accent/20 text-accent-foreground",
    active: "bg-primary/10 text-primary",
    repaid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <div
      data-testid={`card-loan-${loan.id}`}
      className="rounded-2xl bg-card border border-border/60 p-4 space-y-3"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm">{loan.productName}</h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[loan.status]}`}
            >
              {loan.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {loan.purpose}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase">Borrowed</p>
          <p className="font-bold text-sm">{formatXAF(principal)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>Repaid {formatXAF(paid)}</span>
          <span>of {formatXAF(total)}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Stat label="Outstanding" value={formatXAF(outstanding)} />
        <Stat label="Monthly" value={formatXAF(loan.monthlyPayment)} />
        <Stat label="Due" value={formatDate(loan.dueDate)} />
      </div>

      <div className="flex gap-2">
        {loan.status === "active" && (
          <Button
            data-testid={`button-repay-${loan.id}`}
            onClick={onRepay}
            className="flex-1"
          >
            Make a payment
          </Button>
        )}
        {loan.status === "repaid" && (
          <div
            data-testid={`text-repaid-${loan.id}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold py-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Loan fully repaid
          </div>
        )}
        {loan.status === "pending" && (
          <div className="flex-1 flex items-center justify-center gap-2 rounded-md bg-accent/15 text-accent-foreground text-xs font-semibold py-2">
            <Clock className="w-4 h-4" /> Awaiting review
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}

function RepaySheet({
  loan,
  onClose,
}: {
  loan: Loan | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mobile_money" | "bank_transfer" | "cash">(
    "mobile_money",
  );
  const repay = useRepayLoan(loan?.id ?? 0);

  if (!loan) return null;
  const outstanding = Number(loan.totalRepayment) - Number(loan.amountPaid);

  const handlePay = async () => {
    const raw = amount.trim();
    const value = Number(raw);
    if (!raw || Number.isNaN(value) || value <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    if (value > 100_000_000) {
      toast({ variant: "destructive", title: "Amount is too large" });
      return;
    }
    if (value > outstanding * 1.01) {
      toast({
        variant: "destructive",
        title: "Amount exceeds balance",
        description: `Maximum you can pay is ${formatXAF(Math.ceil(outstanding))}.`,
      });
      return;
    }
    try {
      await repay.mutateAsync({ amount: value, method });
      toast({
        title: "Payment received",
        description: `${formatXAF(value)} applied to your loan.`,
      });
      setAmount("");
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: err?.message ?? "Try again",
      });
    }
  };

  return (
    <Sheet open={!!loan} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 shrink-0" />

        <SheetHeader className="px-5 pt-4 pb-2 shrink-0">
          <SheetTitle>Repay {loan.productName}</SheetTitle>
          <SheetDescription>
            Outstanding balance:{" "}
            <span className="font-bold text-foreground">{formatXAF(outstanding)}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-2 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold">Amount (FCFA)</label>
            <Input
              data-testid="input-repay-amount"
              type="number"
              inputMode="numeric"
              placeholder={`${Math.round(Number(loan.monthlyPayment))}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                data-testid="button-pay-monthly"
                onClick={() =>
                  setAmount(Math.round(Number(loan.monthlyPayment)).toString())
                }
                className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg"
              >
                Pay 1 month
              </button>
              <button
                type="button"
                data-testid="button-pay-full"
                onClick={() => setAmount(Math.round(outstanding).toString())}
                className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg"
              >
                Pay full balance
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Payment method</label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as typeof method)}
            >
              <SelectTrigger data-testid="select-payment-method" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">MTN / Orange Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="cash">Cash at agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-5 pb-8 pt-3 shrink-0 border-t border-border/50">
          <Button
            data-testid="button-confirm-payment"
            onClick={handlePay}
            disabled={repay.isPending}
            className="w-full"
          >
            {repay.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirm payment
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
