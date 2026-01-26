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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex justify-between items-center">
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

      <main className="px-4 pt-6 space-y-8">
        {/* Balance Card */}
        <section className="text-center space-y-2 py-4">
          <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
          {isLoading ? (
            <Skeleton className="h-12 w-48 mx-auto" />
          ) : (
            <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">
              ${Number(stats?.totalBalance || 0).toLocaleString()}
            </h1>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium bg-green-500/10 w-fit mx-auto px-3 py-1 rounded-full">
            <ArrowDownLeft className="w-4 h-4 rotate-180" />
            <span>+2.4% this month</span>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="flex justify-between gap-2 px-2">
          {[
            { icon: Plus, label: "Add Money", href: "/add-funds" },
            { icon: Send, label: "Send", href: "/payments" },
            { icon: ArrowDownLeft, label: "Request", href: "/request" },
            { icon: MoreHorizontal, label: "More", href: "/more" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shadow-sm group-active:scale-95 transition-transform duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25">
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{action.label}</span>
              </div>
            </Link>
          ))}
        </section>

        {/* Spending Chart */}
        <section className="h-48 w-full bg-card rounded-3xl p-4 border border-border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm">Spending Activity</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Weekly</span>
          </div>
          <div className="h-32 w-full">
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
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold text-lg">Recent Activity</h3>
            <Link href="/history" className="text-primary text-sm font-semibold hover:underline">See All</Link>
          </div>
          <TransactionList limit={5} />
        </section>
      </main>
    </div>
  );
}
