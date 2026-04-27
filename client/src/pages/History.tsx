import { useLoans, useRepayments } from "@/hooks/use-loans";
import { Skeleton } from "@/components/ui/skeleton";
import { formatXAF, formatDate } from "@/lib/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History as HistoryIcon,
} from "lucide-react";

type Entry = {
  id: string;
  title: string;
  subtitle: string;
  date: string | Date;
  amount: number;
  direction: "in" | "out";
};

export default function History() {
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: repayments, isLoading: payLoading } = useRepayments();

  const isLoading = loansLoading || payLoading;

  const entries: Entry[] = [
    ...(loans ?? []).map(
      (l): Entry => ({
        id: `loan-${l.id}`,
        title: `${l.productName} disbursed`,
        subtitle: l.purpose,
        date: l.approvedAt ?? l.appliedAt,
        amount: Number(l.principal),
        direction: "in",
      }),
    ),
    ...(repayments ?? []).map(
      (r): Entry => ({
        id: `repay-${r.id}`,
        title: "Repayment",
        subtitle: methodLabel(r.method),
        date: r.paidAt,
        amount: Number(r.amount),
        direction: "out",
      }),
    ),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="bg-background pb-4">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <h1 className="text-lg font-extrabold tracking-tight">History</h1>
        <p className="text-xs text-muted-foreground">
          All loan disbursements and repayments.
        </p>
      </header>

      <main className="px-4 py-5 space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No activity yet</p>
            <p className="text-xs text-muted-foreground">
              Once you take a loan or make a payment, it&apos;ll show up here.
            </p>
          </div>
        ) : (
          entries.map((e) => <EntryRow key={e.id} entry={e} />)
        )}
      </main>
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const isIn = entry.direction === "in";
  return (
    <div
      data-testid={`row-history-${entry.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isIn
            ? "bg-primary/10 text-primary"
            : "bg-accent/15 text-accent-foreground"
        }`}
      >
        {isIn ? (
          <ArrowDownLeft className="w-5 h-5" />
        ) : (
          <ArrowUpRight className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{entry.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {entry.subtitle} · {formatDate(entry.date)}
        </p>
      </div>
      <p
        className={`text-sm font-bold whitespace-nowrap ${
          isIn ? "text-primary" : "text-foreground"
        }`}
      >
        {isIn ? "+" : "−"}
        {formatXAF(entry.amount)}
      </p>
    </div>
  );
}

function methodLabel(m: string) {
  switch (m) {
    case "mobile_money":
      return "Mobile Money";
    case "bank_transfer":
      return "Bank transfer";
    case "cash":
      return "Cash at agent";
    default:
      return m;
  }
}
