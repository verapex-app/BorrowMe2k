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
    <div className="min-h-screen bg-background pb-24 px-4 pt-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">My Cards</h1>
        <Button size="icon" variant="ghost" className="rounded-full bg-secondary text-foreground hover:bg-secondary/80">
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      {/* Card Carousel Area */}
      <section className="w-full aspect-[1.586] relative perspective-1000">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-3xl" />
        ) : (
          <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-6 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            {/* Glossy Effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="opacity-80 text-sm font-medium">Current Balance</p>
                <h2 className="text-2xl font-bold tracking-tight">${Number(accounts?.[0]?.balance || 0).toLocaleString()}</h2>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-8 object-contain" />
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-9 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90 shadow-sm" />
              <CreditCard className="w-6 h-6 opacity-50" />
            </div>

            <div className="flex justify-between items-end">
              <div className="font-mono text-lg tracking-wider opacity-90">
                {showNumber ? "4582 1923 8842 9012" : "**** **** **** 9012"}
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-60 uppercase font-bold">Expires</p>
                <p className="font-mono text-sm">12/28</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Card Actions */}
      <section className="grid grid-cols-3 gap-4">
        <ActionButton icon={Lock} label="Freeze Card" />
        <ActionButton icon={showNumber ? Eye : Copy} label={showNumber ? "Hide Details" : "Copy Number"} onClick={() => setShowNumber(!showNumber)} />
        <ActionButton icon={Settings} label="Settings" />
      </section>

      {/* Limits & Controls */}
      <section className="space-y-4">
        <h3 className="font-bold text-lg">Spending Limits</h3>
        <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Limit</span>
            <span className="text-sm font-bold text-primary">$2,000 / $5,000</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">You've spent 40% of your monthly limit.</p>
        </div>
      </section>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group">
      <div className="w-14 h-14 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-foreground group-active:scale-95 transition-all duration-200 group-hover:border-primary group-hover:text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground">{label}</span>
    </button>
  );
}
