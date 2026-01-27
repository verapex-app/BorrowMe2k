import { useAccounts } from "@/hooks/use-banking";
import { CreditCard, Lock, Settings, Eye, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

export default function Cards() {
  const { data: accounts, isLoading } = useAccounts();
  const [showNumber, setShowNumber] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped) return; // Disable tilt when flipped for clarity
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

      {/* Card Display Container */}
      <section className="w-full aspect-[1.7] relative perspective-[1200px]">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-2xl" />
        ) : (
          <div 
            className="w-full h-full cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              style={{
                rotateX: isFlipped ? 0 : rotateX,
                rotateY: isFlipped ? 0 : rotateY,
                transformStyle: "preserve-3d",
              }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                rotateY: { duration: 0.6 }
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full relative"
            >
              {/* Front Side */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#333333] to-[#000000] p-6 text-white shadow-2xl overflow-hidden border border-white/10"
                style={{ backfaceVisibility: "hidden" }}
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
              </div>

              {/* Back Side */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl bg-[#1a1a1a] text-white shadow-2xl overflow-hidden border border-white/10"
                style={{ 
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <div className="mt-8 bg-black/80 h-10 w-full" />
                <div className="px-6 mt-6">
                  <div className="bg-white/10 h-10 rounded flex items-center justify-end px-4 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2/3 h-px bg-white/20" />
                    <div className="absolute left-4 top-1/3 w-1/2 h-px bg-white/20" />
                    <div className="absolute left-4 top-2/3 w-3/4 h-px bg-white/20" />
                    <span className="font-mono text-sm font-bold text-white tracking-widest relative z-10">742</span>
                  </div>
                  <p className="text-[8px] mt-2 opacity-40 uppercase font-bold text-right mr-1 tracking-widest">Security Code</p>
                </div>
                
                <div className="px-6 mt-10">
                  <div className="flex justify-between items-center opacity-30">
                    <p className="text-[8px] uppercase font-bold tracking-[0.2em]">Platinum Preferred</p>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full border border-white/50" />
                      <div className="w-6 h-6 rounded-full border border-white/50" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* Card Actions */}
      <section className="grid grid-cols-3 gap-3">
        <ActionButton 
          icon={Lock} 
          label="Freeze" 
        />
        <ActionButton 
          icon={showNumber ? Eye : Copy} 
          label={showNumber ? "Hide" : "Copy"} 
          onClick={() => setShowNumber(!showNumber)} 
        />
        <ActionButton 
          icon={isFlipped ? CreditCard : Settings} 
          label={isFlipped ? "Front" : "Details"} 
          onClick={() => setIsFlipped(!isFlipped)} 
        />
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
