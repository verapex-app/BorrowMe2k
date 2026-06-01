import { useState, useEffect, useRef } from "react";
import { useDashboardStats, useLoanProducts, useLoans } from "@/hooks/use-loans";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Bell, Plus, FileText, ChevronRight, Banknote, ArrowDownToLine, Clock } from "lucide-react";
import { Link } from "wouter";
import { LoanProductIcon } from "@/components/LoanProductIcon";
import { formatXAF, formatDate } from "@/lib/format";
import type { Loan } from "@shared/schema";
import { KycVerifyFlow } from "@/components/KycVerifyFlow";

export default function Dashboard() {
  const { user } = useUser();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: products } = useLoanProducts();
  const { data: loans } = useLoans();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [kycLoan, setKycLoan] = useState<Loan | null>(null);

  const activeLoan = loans?.find((l) => l.status === "active");
  const pendingLoan = loans?.find((l) => l.status === "pending");
  const featured = (products ?? []).slice(0, 4);
  const displayName = user?.fullName?.split(" ")[0] ?? user?.username ?? "there";

  return (
    <div className="bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hello,</p>
            <h2
              data-testid="text-welcome-name"
              className="text-sm font-bold capitalize"
            >
              {displayName}
            </h2>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5 text-foreground" />
        </Button>
      </header>

      <main className="px-4 py-5 space-y-6">
        {/* Outstanding balance card */}
        <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 shadow-lg shadow-primary/20">
          <p className="text-xs uppercase tracking-wider opacity-80 font-semibold">
            Outstanding balance
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-44 mt-2 bg-primary-foreground/20" />
          ) : (
            <h1
              data-testid="text-outstanding-balance"
              className="text-3xl font-extrabold mt-1 tracking-tight"
            >
              {formatXAF(stats?.outstandingBalance)}
            </h1>
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <p className="text-[10px] uppercase opacity-70">Active loans</p>
              <p
                data-testid="text-active-loans-count"
                className="text-lg font-bold"
              >
                {stats?.activeLoans ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase opacity-70">Next payment</p>
              <p
                data-testid="text-next-payment"
                className="text-lg font-bold"
              >
                {stats?.nextPaymentAmount
                  ? formatXAF(stats.nextPaymentAmount)
                  : "—"}
              </p>
              {stats?.nextPaymentDate && (
                <p className="text-[10px] opacity-70">
                  Due {formatDate(stats.nextPaymentDate)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Pending loan alert */}
        {pendingLoan && (
          <section>
            <button
              data-testid="button-pending-loan-banner"
              onClick={() => setKycLoan(pendingLoan)}
              className="w-full rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                    Application under review
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 line-clamp-1">
                    {pendingLoan.productName} · {formatXAF(pendingLoan.principal)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">
                    {user?.kycLink ? "Tap to verify your identity →" : "Tap to check status →"}
                  </p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* Quick actions */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/loans">
              <button
                data-testid="button-borrow-now"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground px-4 py-3 font-semibold shadow-md active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" /> Borrow now
              </button>
            </Link>
            <Link href="/my-loans">
              <button
                data-testid="button-view-my-loans"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary text-secondary-foreground px-4 py-3 font-semibold border border-border active:scale-95 transition-transform"
              >
                <FileText className="w-4 h-4" /> My loans
              </button>
            </Link>
          </div>
          <button
            onClick={() => setWithdrawOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary text-secondary-foreground px-4 py-3 font-semibold border border-border active:scale-95 transition-transform"
          >
            <ArrowDownToLine className="w-4 h-4" /> Withdraw
          </button>
        </section>

        <WithdrawBlockedSheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} user={user} />
        <PendingKycSheet loan={kycLoan} user={user} onClose={() => setKycLoan(null)} />

        {/* Active loan summary */}
        {activeLoan && (
          <section className="rounded-2xl bg-card border border-border/60 p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Active loan
                </p>
                <h3 className="font-bold mt-0.5">{activeLoan.productName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeLoan.termMonths} months · {activeLoan.interestRate}% /
                  month
                </p>
              </div>
              <Link href="/my-loans">
                <button
                  data-testid="button-view-active-loan"
                  className="text-xs font-semibold text-primary flex items-center"
                >
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <p className="text-muted-foreground">Borrowed</p>
                <p className="font-bold">{formatXAF(activeLoan.principal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Repaid</p>
                <p className="font-bold">
                  {formatXAF(activeLoan.amountPaid)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Featured loan products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Loans you can borrow</h3>
            <Link href="/loans">
              <button
                data-testid="link-see-all-loans"
                className="text-xs font-semibold text-primary flex items-center"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(featured.length === 0
              ? Array.from({ length: 4 })
              : featured
            ).map((p: any, idx) =>
              p ? (
                <Link key={p.id} href={`/loans?product=${p.id}`}>
                  <div
                    data-testid={`card-product-${p.id}`}
                    className="rounded-2xl bg-card border border-border/60 p-3.5 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <LoanProductIcon name={p.icon} className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-sm leading-tight">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {p.description}
                    </p>
                    <p className="text-[11px] font-semibold text-primary mt-2">
                      from {formatXAF(p.minAmount)}
                    </p>
                  </div>
                </Link>
              ) : (
                <Skeleton key={idx} className="h-32 rounded-2xl" />
              ),
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function PendingCountdown({ loan }: { loan: Loan }) {
  const initSeconds = Math.max(
    0,
    600 - Math.floor((Date.now() - new Date(loan.appliedAt).getTime()) / 1000),
  );
  const [remaining, setRemaining] = useState(initSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(initSeconds);
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
      <div className="h-2 bg-background rounded-full overflow-hidden">
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

function PendingKycSheet({
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

  return (
    <Sheet open={!!loan} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 shrink-0" />
        {hasLink ? (
          <div className="overflow-y-auto">
            <KycVerifyFlow
              user={user}
              kycLink={user.kycLink!}
              kycStatus={kycStatus}
              onClose={onClose}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 pb-8 pt-2 text-center overflow-y-auto">
            <img
              src="/KYC.png"
              alt="Identity verification illustration"
              className="w-44 h-44 object-contain"
            />
            <h2 className="text-xl font-bold text-foreground mt-1">Application under review</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
              Your <span className="font-semibold text-foreground">{loan.productName}</span> application is being processed. We'll email you with the next steps.
            </p>
            <div className="w-full mt-3 bg-muted rounded-xl px-4 py-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">Review in progress</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Amount: <span className="font-semibold text-foreground">{formatXAF(loan.principal)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                Reason: {loan.purpose}
              </p>
              <PendingCountdown loan={loan} />
            </div>
            <button onClick={onClose} className="mt-5 w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm">
              Got it
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function WithdrawBlockedSheet({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
}) {
  const kycStatus = user?.kycStatus as string | undefined;
  const [assignedLink, setAssignedLink] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const existingLink = user?.kycLink as string | null | undefined;
  const kycLink = assignedLink ?? existingLink;

  useEffect(() => {
    if (!open) return;
    if (kycLink) return;
    setAssigning(true);
    setAssignError(null);
    fetch("/api/kyc/assign-link", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? "Could not assign verification link");
        }
        return res.json();
      })
      .then((data) => setAssignedLink(data.kycLink))
      .catch((err) => setAssignError(err.message))
      .finally(() => setAssigning(false));
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 shrink-0" />

        {kycLink ? (
          <div className="overflow-y-auto flex-1">
            <KycVerifyFlow
              user={user}
              kycLink={kycLink}
              kycStatus={kycStatus ?? "not_submitted"}
              onClose={onClose}
              skipWaiting={true}
            />
          </div>
        ) : assigning ? (
          <div className="overflow-y-auto flex-1 px-6 pb-10 pt-3 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Preparing your verification…</p>
          </div>
        ) : assignError ? (
          <div className="overflow-y-auto flex-1 px-6 pb-10 pt-3">
            <div className="flex flex-col items-center text-center mb-5">
              <img
                src="/KYC.png"
                alt="Identity verification illustration"
                className="w-40 h-40 object-contain"
              />
              <h2 className="text-xl font-bold text-foreground mt-1">
                Verification Unavailable
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
                {assignError}
              </p>
            </div>
            <Button className="w-full" onClick={onClose}>
              Got it
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
