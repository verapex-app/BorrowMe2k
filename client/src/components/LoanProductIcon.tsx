import {
  Zap,
  Wallet,
  Store,
  GraduationCap,
  Sprout,
  Bike,
  Banknote,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  wallet: Wallet,
  store: Store,
  "graduation-cap": GraduationCap,
  sprout: Sprout,
  bike: Bike,
};

export function LoanProductIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Banknote;
  return <Icon className={className} />;
}
