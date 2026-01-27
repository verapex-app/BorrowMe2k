import { useAccounts } from "@/hooks/use-banking";
import { CreditCard, Lock, Settings, Eye, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function Cards() {
  const { data: accounts, isLoading } = useAccounts();
  const [showNumber, setShowNumber] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="bg-background px-4 py-5 space-y-6">
      <header className="flex justify-between items-center gap-2">
        <h1 className="text-xl font-bold">My Cards</h1>
        <Button size="icon" variant="ghost" className="rounded-full bg-secondary">
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      {/* Card Display */}
      <section className="w-full aspect-[1.7] relative perspective-[1000px]">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-2xl" />
        ) : (
          <motion.div
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#333333] to-[#000000] p-6 text-white shadow-2xl relative overflow-hidden border border-white/10"
          >
            {/* Glossy Effect */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            
            <div style={{ transform: "translateZ(50px)" }} className="flex justify-between items-start mb-8">
              <div className="space-y-0.5">
                <p className="opacity-50 text-[10px] font-bold uppercase tracking-widest">Current Balance</p>
                <h2 data-testid="text-card-balance" className="text-2xl font-bold tracking-tight">£{Number(accounts?.[0]?.balance || 0).toLocaleString()}</h2>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#eb001b] opacity-90 shadow-lg" />
                <div className="w-8 h-8 rounded-full bg-[#f79e1b] opacity-90 shadow-lg" />
              </div>
            </div>

            <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-8">
              <div className="w-12 h-8 rounded-md bg-gradient-to-br from-[#ffd700] via-[#daa520] to-[#b8860b] shadow-inner border border-white/20" />
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <CreditCard className="w-5 h-5 opacity-40" />
              </div>
            </div>

            <div style={{ transform: "translateZ(40px)" }} className="flex justify-between items-end">
              <div className="font-mono text-lg tracking-[0.2em] opacity-90 drop-shadow-md">
                {showNumber ? "4582 1923 8842 9012" : "**** **** **** 9012"}
              </div>
              <div className="text-right">
                <p className="text-[8px] opacity-40 uppercase font-black tracking-tighter">Valid Thru</p>
                <p className="font-mono text-sm font-bold tracking-wider">12/28</p>
              </div>
            </div>
          </motion.div>
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
            <span className="text-sm font-medium text-muted-foreground">Monthly Limit</span>
            <span className="text-xs font-bold text-primary">£2,000 / £5,000</span>
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
      className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
    >
      <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-foreground shadow-sm group-hover:bg-secondary/50 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
    </button>
  );
}
