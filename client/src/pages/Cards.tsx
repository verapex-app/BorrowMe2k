import { useAccounts } from "@/hooks/use-banking";
import { CreditCard, Lock, Settings, Eye, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Cards() {
  const { data: accounts, isLoading } = useAccounts();
  const [showNumber, setShowNumber] = useState(false);

  return (
    <div className="bg-background px-4 py-5 space-y-6">
      <header className="flex justify-between items-center gap-2">
        <h1 className="text-xl font-bold">My Cards</h1>
        <Button size="icon" variant="ghost" className="rounded-full bg-secondary">
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      {/* Card Display */}
      <section className="w-full aspect-[1.7] relative">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-2xl" />
        ) : (
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 text-white shadow-xl relative overflow-hidden">
            {/* Glossy Effect */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-0.5">
                <p className="opacity-70 text-xs font-medium">Current Balance</p>
                <h2 data-testid="text-card-balance" className="text-xl font-bold tracking-tight">${Number(accounts?.[0]?.balance || 0).toLocaleString()}</h2>
              </div>
              {/* Mastercard Logo Circles */}
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-red-500 opacity-90" />
                <div className="w-7 h-7 rounded-full bg-yellow-400 opacity-90" />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90" />
              <CreditCard className="w-5 h-5 opacity-40" />
            </div>

            <div className="flex justify-between items-end">
              <div className="font-mono text-base tracking-widest opacity-90">
                {showNumber ? "4582 1923 8842 9012" : "**** **** **** 9012"}
              </div>
              <div className="text-right">
                <p className="text-[9px] opacity-50 uppercase font-semibold">Expires</p>
                <p className="font-mono text-xs">12/28</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Card Actions */}
      <section className="grid grid-cols-3 gap-3">
        <ActionButton icon={Lock} label="Freeze" />
        <ActionButton icon={showNumber ? Eye : Copy} label={showNumber ? "Hide" : "Copy"} onClick={() => setShowNumber(!showNumber)} />
        <ActionButton icon={Settings} label="Settings" />
      </section>

      {/* Limits & Controls */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm">Spending Limits</h3>
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
          <div className="flex justify-between items-center gap-2">
            <span className="text-sm font-medium">Monthly Limit</span>
            <span className="text-xs font-bold text-primary">$2,000 / $5,000</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">You've spent 40% of your monthly limit.</p>
        </div>
      </section>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      data-testid={`button-card-${label.toLowerCase()}`}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="w-12 h-12 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground group-active:scale-95 transition-transform duration-150">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
