import { useTransactions } from "@/hooks/use-banking";
import { ShoppingBag, Coffee, Car, ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const ICONS: Record<string, any> = {
  shopping: ShoppingBag,
  food: Coffee,
  transport: Car,
  transfer: ArrowRightLeft,
  income: ArrowDownLeft,
  default: Wallet,
};

function TransactionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TransactionList({ limit }: { limit?: number }) {
  const { data: transactions, isLoading, error } = useTransactions();

  if (isLoading) return <TransactionSkeleton />;
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-destructive/5 rounded-xl border border-destructive/20">
        <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
        <p>Failed to load transactions</p>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-secondary/50 rounded-2xl border border-border/50">
        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No transactions yet</p>
      </div>
    );
  }

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="space-y-3">
      {displayTransactions.map((tx) => {
        const Icon = ICONS[tx.icon] || ICONS.default;
        const isCredit = tx.type === 'credit';
        
        return (
          <div 
            key={tx.id}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-card hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50 active:scale-[0.99] duration-200"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-full ${isCredit ? 'bg-green-500/10 text-green-600' : 'bg-secondary text-foreground'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{tx.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
            <div className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-foreground'}`}>
              {isCredit ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ArrowRightLeft({ className }: { className?: string }) {
  return <ArrowUpRight className={className} />;
}
