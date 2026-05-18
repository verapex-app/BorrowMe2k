import { useState, useEffect, useRef } from "react";
import { useLoans, useRepayLoan } from "@/hooks/use-loans";
import { useUser } from "@/hooks/use-user";
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
import { CheckCircle2, Clock, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function MyLoans() {
  const { data: loans, isLoading } = useLoans();
  const { user } = useUser();
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [kycLoan, setKycLoan] = useState<Loan | null>(null);

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
              onKyc={() => setKycLoan(loan)}
            />
          ))
        )}
      </main>

      <RepaySheet loan={repayLoan} onClose={() => setRepayLoan(null)} />
      <KycSheet loan={kycLoan} user={user} onClose={() => setKycLoan(null)} />
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

function LoanCard({
  loan,
  onRepay,
  onKyc,
}: {
  loan: Loan;
  onRepay: () => void;
  onKyc: () => void;
}) {
  const principal = Number(loan.principal);
  const total = Number(loan.totalRepayment);
  const paid = Number(loan.amountPaid);
  const outstanding = Math.max(0, total - paid);
  const progress = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  const statusColors: Record<Loan["status"], string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
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
              {loan.status === "pending" ? "Under Review" : loan.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {loan.purpose}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase">Requested</p>
          <p className="font-bold text-sm">{formatXAF(principal)}</p>
        </div>
      </div>

      {loan.status !== "pending" && (
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Repaid {formatXAF(paid)}</span>
            <span>of {formatXAF(total)}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {loan.status !== "pending" && (
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <Stat label="Outstanding" value={formatXAF(outstanding)} />
          <Stat label="Monthly" value={formatXAF(loan.monthlyPayment)} />
          <Stat label="Due" value={formatDate(loan.dueDate)} />
        </div>
      )}

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
          <Button
            data-testid={`button-kyc-${loan.id}`}
            onClick={onKyc}
            className="flex-1"
            variant="outline"
          >
            <Clock className="w-4 h-4 mr-2" />
            View application status
          </Button>
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

function CountdownTimer({ loan }: { loan: Loan }) {
  const initSeconds = (() => {
    const elapsed = Math.floor((Date.now() - new Date(loan.appliedAt).getTime()) / 1000);
    return Math.max(0, 600 - elapsed);
  })();

  const [remaining, setRemaining] = useState(initSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initSeconds <= 0) return;
    ref.current = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(ref.current!); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [initSeconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / 600) * 100;

  return (
    <div className="w-full mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>Estimated review time</span>
        <span className="font-bold tabular-nums text-foreground">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      {remaining === 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Taking a little longer than expected — we'll reach out shortly.
        </p>
      )}
    </div>
  );
}

function KycSheet({
  loan,
  user,
  onClose,
}: {
  loan: Loan | null;
  user: any;
  onClose: () => void;
}) {
  if (!loan) return null;

  const hasLink = !!user?.kycLink;
  const kycStatus = user?.kycStatus ?? "not_submitted";

  const statusNote =
    kycStatus === "pending"
      ? "Your submission is under review. We'll notify you once it's approved."
      : kycStatus === "rejected"
      ? "Your previous submission wasn't approved. Please resubmit to continue."
      : "Complete this one-time verification to receive your loan funds.";

  return (
    <Sheet open={!!loan} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 shrink-0" />

        <div className="flex flex-col items-center px-6 pb-8 pt-2 text-center overflow-y-auto">
          <img
            src="/KYC.png"
            alt="Identity verification illustration"
            className="w-44 h-44 object-contain"
          />

          {hasLink ? (
            <>
              <h2 className="text-xl font-bold text-foreground mt-1">Identity verification needed</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
                Your application for <span className="font-semibold text-foreground">{loan.productName}</span> is ready. 
                Complete your identity verification to receive your funds.
              </p>
              <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-xl px-4 py-3 w-full text-left">
                {statusNote}
              </p>
              <a
                href={user.kycLink}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-start-kyc"
                className="mt-5 flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                {kycStatus === "rejected" ? "Resubmit ID" : "Start ID Verification"}
              </a>
              <button onClick={onClose} className="mt-3 text-sm text-muted-foreground py-1.5">
                I'll do this later
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground mt-1">Application under review</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
                Your <span className="font-semibold text-foreground">{loan.productName}</span> application for{" "}
                <span className="font-semibold text-foreground">{formatXAF(loan.principal)}</span> is being reviewed by our team.
              </p>
              <div className="w-full mt-3 bg-muted rounded-xl px-4 py-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">Review in progress</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We'll send you an email with your ID verification link as soon as your application is processed.
                </p>
                <CountdownTimer loan={loan} />
              </div>
              <button onClick={onClose} className="mt-5 w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm">
                Got it
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
