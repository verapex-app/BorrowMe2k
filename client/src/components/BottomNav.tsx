import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, ArrowRightLeft, History, User } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Home" },
    { href: "/cards", icon: CreditCard, label: "Cards" },
    { href: "/payments", icon: ArrowRightLeft, label: "Transfer" },
    { href: "/history", icon: History, label: "History" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-50">
      <div className="flex justify-around items-center px-2 py-2 pb-3">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button 
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className="relative p-1.5">
                  <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
