import { useDashboardStats } from "@/hooks/use-banking";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { Plus, Send, ArrowDownLeft, MoreHorizontal, Bell, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Link } from "wouter";

const mockChartData = [
  { name: 'Mon', amount: 400 },
  { name: 'Tue', amount: 300 },
  { name: 'Wed', amount: 600 },
  { name: 'Thu', amount: 200 },
  { name: 'Fri', amount: 900 },
  { name: 'Sat', amount: 450 },
  { name: 'Sun', amount: 700 },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px]">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <User className="w-5 h-5 text-foreground" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <h2 className="text-sm font-bold">Alex Morgan</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="w-5 h-5 text-foreground" />
        </Button>
      </header>

      <main className="px-4 py-5 space-y-6">
        {/* Balance Card */}
        <section className="text-center space-y-1.5 py-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Balance</p>
          {isLoading ? (
            <Skeleton className="h-10 w-40 mx-auto" />
          ) : (
            <h1 data-testid="text-balance" className="text-3xl font-bold tracking-tight text-foreground">
              ${Number(stats?.totalBalance || 0).toLocaleString()}
            </h1>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium bg-green-500/10 w-fit mx-auto px-2.5 py-1 rounded-full">
            <ArrowDownLeft className="w-3.5 h-3.5 rotate-180" />
            <span>+2.4% this month</span>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-4 gap-3">
          {[
            { icon: Plus, label: "Add", href: "/add-funds" },
            { icon: Send, label: "Send", href: "/payments" },
            { icon: ArrowDownLeft, label: "Request", href: "/request" },
            { icon: MoreHorizontal, label: "More", href: "/more" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
                <div 
                  data-testid={`button-${action.label.toLowerCase()}`}
                  className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-active:scale-95 transition-transform duration-150"
                >
                  <action.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
              </div>
            </Link>
          ))}
        </section>

        {/* Spending Chart */}
        <section className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex justify-between items-center mb-3 gap-2">
            <h3 className="font-semibold text-sm">Spending Activity</h3>
            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md font-medium">Weekly</span>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex justify-between items-center mb-3 gap-2">
            <h3 className="font-semibold text-base">Recent Activity</h3>
            <Link href="/history" className="text-primary text-xs font-semibold">See All</Link>
          </div>
          <TransactionList limit={4} />
        </section>
      </main>
    </div>
  );
}
