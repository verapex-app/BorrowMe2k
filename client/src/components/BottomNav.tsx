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
    <div className="absolute bottom-0 left-0 right-0 glass border-t border-border/30 z-50">
      <div className="flex justify-around items-center px-2 py-1.5 pb-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.button 
                data-testid={`nav-${item.label.toLowerCase()}`}
                className="flex flex-col items-center gap-0.5 min-w-[60px] py-2 relative"
                whileTap={{ scale: 0.9 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-x-2 -top-1.5 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`p-2 rounded-2xl transition-colors duration-200 ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
