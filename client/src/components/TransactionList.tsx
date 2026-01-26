import { useTransactions } from "@/hooks/use-banking";
import { ShoppingBag, Coffee, Car, ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle, Film, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";

const ICONS: Record<string, any> = {
  "shopping-bag": ShoppingBag,
  shopping: ShoppingBag,
  coffee: Coffee,
  food: Coffee,
  car: Car,
  transport: Car,
  transfer: ArrowUpRight,
  income: ArrowDownLeft,
  "dollar-sign": DollarSign,
  film: Film,
  default: Wallet,
};

const ICON_COLORS: Record<string, string> = {
  "shopping-bag": "bg-violet-500/10 text-violet-600",
  shopping: "bg-violet-500/10 text-violet-600",
  coffee: "bg-amber-500/10 text-amber-600",
  food: "bg-amber-500/10 text-amber-600",
  car: "bg-blue-500/10 text-blue-600",
  transport: "bg-blue-500/10 text-blue-600",
  transfer: "bg-indigo-500/10 text-indigo-600",
  "dollar-sign": "bg-emerald-500/10 text-emerald-600",
  film: "bg-rose-500/10 text-rose-600",
  default: "bg-slate-500/10 text-slate-600",
};

function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/30">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16" />
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
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-destructive/5 rounded-2xl border border-destructive/20">
        <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
        <p className="text-sm">Failed to load transactions</p>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-2xl border border-border/30">
        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="space-y-2">
      {displayTransactions.map((tx, index) => {
        const Icon = ICONS[tx.icon] || ICONS.default;
        const iconColor = tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-600' : (ICON_COLORS[tx.icon] || ICON_COLORS.default);
        const isCredit = tx.type === 'credit';
        
        return (
          <motion.div 
            key={tx.id}
            data-testid={`transaction-${tx.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/30 hover:border-border/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-2xl ${iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{tx.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
            <div className={`font-semibold text-sm shrink-0 ml-3 ${isCredit ? 'text-emerald-600' : ''}`}>
              {isCredit ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
