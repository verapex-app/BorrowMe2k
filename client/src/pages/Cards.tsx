import { useAccounts } from "@/hooks/use-banking";
import { CreditCard, Lock, Settings, Eye, EyeOff, Copy, Plus, Snowflake, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Cards() {
  const { data: accounts, isLoading } = useAccounts();
  const [showNumber, setShowNumber] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div 
      className="bg-background min-h-full px-5 py-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Cards</h1>
          <p className="text-sm text-muted-foreground">Manage your payment methods</p>
        </div>
        <Button size="icon" variant="ghost" className="rounded-2xl w-11 h-11 bg-secondary/50">
          <Plus className="w-5 h-5" />
        </Button>
      </motion.header>

      {/* 3D Credit Card */}
      <motion.section variants={itemVariants} className="card-3d" onClick={() => setIsFlipped(!isFlipped)}>
        {isLoading ? (
          <Skeleton className="w-full aspect-[1.7] rounded-3xl" />
        ) : (
          <motion.div
            className="card-3d-inner relative w-full aspect-[1.7] cursor-pointer"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl overflow-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="card-shine rounded-3xl" />
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl translate-x-20 -translate-y-20" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full blur-3xl -translate-x-10 translate-y-10" />
              
              {/* Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full pattern-dots" />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <p className="text-xs opacity-60 font-medium uppercase tracking-wider">Current Balance</p>
                    <h2 data-testid="text-card-balance" className="text-2xl font-bold tracking-tight">
                      ${Number(accounts?.[0]?.balance || 0).toLocaleString()}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Wifi className="w-6 h-6 opacity-60 rotate-90" />
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-red-500" />
                      <div className="w-8 h-8 rounded-full bg-amber-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-inner flex items-center justify-center">
                    <div className="w-8 h-6 border border-amber-500/30 rounded-sm" />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-mono text-lg tracking-[0.25em] mb-1">
                      {showNumber ? "4582 1923 8842 9012" : "**** **** **** 9012"}
                    </p>
                    <p className="text-xs opacity-60">ALEX MORGAN</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-40 uppercase tracking-wider">Valid Thru</p>
                    <p className="font-mono text-sm">12/28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl overflow-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="h-14 bg-slate-950 mt-6" />
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-10 bg-slate-200 rounded flex items-center justify-end pr-4">
                    <span className="font-mono text-slate-900 text-sm">847</span>
                  </div>
                  <span className="text-xs opacity-60">CVV</span>
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed">
                  This card is issued by NeoBank. Use of this card is subject to the terms and conditions of the cardholder agreement. For customer service, visit neobank.com/help
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.section>

      <motion.p variants={itemVariants} className="text-center text-xs text-muted-foreground">
        Tap card to flip
      </motion.p>

      {/* Card Actions */}
      <motion.section variants={itemVariants} className="grid grid-cols-4 gap-3">
        <ActionButton icon={showNumber ? EyeOff : Eye} label={showNumber ? "Hide" : "Show"} onClick={() => setShowNumber(!showNumber)} />
        <ActionButton icon={Copy} label="Copy" />
        <ActionButton icon={Snowflake} label="Freeze" />
        <ActionButton icon={Settings} label="Settings" />
      </motion.section>

      {/* Limits & Controls */}
      <motion.section variants={itemVariants} className="space-y-4">
        <h3 className="font-semibold">Spending Limits</h3>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-secondary/20 border border-border/50 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Monthly Limit</span>
              <p className="text-xs text-muted-foreground">Resets in 5 days</p>
            </div>
            <span className="text-sm font-bold text-primary">$2,000 / $5,000</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$2,000 spent</span>
            <span>$3,000 remaining</span>
          </div>
        </div>
      </motion.section>

      {/* Recent Card Transactions */}
      <motion.section variants={itemVariants} className="space-y-4">
        <h3 className="font-semibold">Recent Card Activity</h3>
        <div className="space-y-3">
          {[
            { name: "Apple Store", amount: "-$129.00", time: "Today, 2:34 PM" },
            { name: "Uber Trip", amount: "-$24.50", time: "Yesterday" },
            { name: "Netflix", amount: "-$15.99", time: "Jan 24" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.name}</p>
                  <p className="text-xs text-muted-foreground">{tx.time}</p>
                </div>
              </div>
              <span className="text-sm font-semibold">{tx.amount}</span>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <motion.button 
      onClick={onClick} 
      data-testid={`button-card-${label.toLowerCase()}`}
      className="flex flex-col items-center gap-2 group"
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-foreground group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors duration-200">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </motion.button>
  );
}
