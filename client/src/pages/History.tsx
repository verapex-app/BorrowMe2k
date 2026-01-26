import { TransactionList } from "@/components/TransactionList";
import { Search, SlidersHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useDashboardStats } from "@/hooks/use-banking";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function History() {
  const { data: stats } = useDashboardStats();

  return (
    <motion.div 
      className="bg-background min-h-full px-5 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants} className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Your complete transaction history</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              data-testid="input-search"
              placeholder="Search transactions..." 
              className="pl-10 h-12 rounded-2xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/50 bg-card">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Summary Cards */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Total Income</p>
          <p className="text-lg font-bold text-emerald-600">+${Number(stats?.income || 0).toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Total Spending</p>
          <p className="text-lg font-bold">-${Number(stats?.monthlySpending || 0).toLocaleString()}</p>
        </div>
      </motion.section>

      {/* Filter Pills */}
      <motion.section variants={itemVariants} className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {['All', 'Income', 'Shopping', 'Food', 'Transport'].map((filter, i) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                i === 0 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">January 2026</h3>
        <TransactionList />
      </motion.section>
    </motion.div>
  );
}
