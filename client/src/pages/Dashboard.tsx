import { useState } from "react";
import { useDashboardStats, useLoanProducts, useLoans } from "@/hooks/use-loans";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Bell, Plus, FileText, ChevronRight, Banknote, ArrowDownToLine } from "lucide-react";
import { Link } from "wouter";
import { LoanProductIcon } from "@/components/LoanProductIcon";
import { formatXAF, formatDate } from "@/lib/format";

export default function Dashboard() {
  const { user } = useUser();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: products } = useLoanProducts();
  const { data: loans } = useLoans();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const activeLoan = loans?.find((l) => l.status === "active");
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

        <WithdrawBlockedSheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

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

function WithdrawBlockedSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 shrink-0" />
        <div className="flex flex-col items-center px-6 pb-10 pt-2 text-center">
          <img
            src="/ERROR.png"
            alt="Access error illustration"
            className="w-52 h-52 object-contain"
          />
          <h2 className="text-xl font-bold text-foreground mt-1">
            Withdrawals unavailable
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
            You cannot access withdrawals right now. You need to complete your
            KYC verification before this feature is unlocked.
          </p>
          <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-xl px-4 py-3 w-full text-left leading-relaxed">
            Once your identity is verified, withdrawals will be available
            instantly. Head to any loan product to start your KYC.
          </p>
          <Button className="mt-5 w-full" onClick={onClose}>
            Got it
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
