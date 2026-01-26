import { useDashboardStats } from "@/hooks/use-banking";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { Plus, Send, ArrowDownLeft, MoreHorizontal, Bell, TrendingUp, Wallet, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { motion } from "framer-motion";

const mockChartData = [
  { name: 'Mon', amount: 400 },
  { name: 'Tue', amount: 300 },
  { name: 'Wed', amount: 600 },
  { name: 'Thu', amount: 200 },
  { name: 'Fri', amount: 900 },
  { name: 'Sat', amount: 450 },
  { name: 'Sun', amount: 700 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <motion.div 
      className="bg-background min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 p-[2px] shadow-lg shadow-primary/20">
            <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center">
              <span className="text-lg font-bold gradient-text">N</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Good morning</p>
            <h2 className="text-sm font-bold">Alex Morgan</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-2xl w-11 h-11 bg-secondary/50">
          <Bell className="w-5 h-5" />
        </Button>
      </header>

      <main className="px-5 py-6 space-y-7">
        {/* Balance Hero */}
        <motion.section variants={itemVariants} className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl" />
          <div className="relative text-center py-8 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Total Balance</p>
            {isLoading ? (
              <Skeleton className="h-12 w-48 mx-auto rounded-xl" />
            ) : (
              <motion.h1 
                data-testid="text-balance" 
                className="text-5xl font-bold tracking-tight"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              >
                ${Number(stats?.totalBalance || 0).toLocaleString()}
              </motion.h1>
            )}
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.5%</span>
              </div>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={itemVariants} className="grid grid-cols-4 gap-4">
          {[
            { icon: Plus, label: "Add", color: "from-emerald-500 to-green-600", href: "/add-funds" },
            { icon: Send, label: "Send", color: "from-blue-500 to-indigo-600", href: "/payments" },
            { icon: ArrowDownLeft, label: "Request", color: "from-violet-500 to-purple-600", href: "/request" },
            { icon: MoreHorizontal, label: "More", color: "from-slate-400 to-slate-500", href: "/more" },
          ].map((action, i) => (
            <Link key={action.label} href={action.href}>
              <motion.div 
                className="flex flex-col items-center gap-2 group cursor-pointer"
                whileTap={{ scale: 0.95 }}
              >
                <div 
                  data-testid={`button-${action.label.toLowerCase()}`}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.section>

        {/* Stats Cards */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Income</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-lg font-bold text-emerald-600">+${Number(stats?.income || 0).toLocaleString()}</p>
            )}
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Spending</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-lg font-bold">-${Number(stats?.monthlySpending || 0).toLocaleString()}</p>
            )}
          </div>
        </motion.section>

        {/* Spending Chart */}
        <motion.section variants={itemVariants} className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-sm">Spending Activity</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <div className="flex gap-1">
              {['D', 'W', 'M'].map((period, i) => (
                <button 
                  key={period}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Card Preview */}
        <motion.section variants={itemVariants}>
          <Link href="/cards">
            <div className="card-3d cursor-pointer">
              <div className="card-3d-inner relative w-full aspect-[1.8] rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-2xl overflow-hidden">
                <div className="card-shine rounded-3xl" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-x-10 translate-y-10" />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 to-amber-400" />
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-red-500" />
                      <div className="w-7 h-7 rounded-full bg-amber-400" />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-sm tracking-[0.2em] opacity-80 mb-1">**** **** **** 4582</p>
                    <p className="text-xs opacity-50">Tap to manage card</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.section>

        {/* Recent Transactions */}
        <motion.section variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Link href="/history" className="text-primary text-xs font-semibold">See All</Link>
          </div>
          <TransactionList limit={4} />
        </motion.section>
      </main>
    </motion.div>
  );
}
