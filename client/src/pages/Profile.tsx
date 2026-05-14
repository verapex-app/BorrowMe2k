import { useUser } from "@/hooks/use-user";
import {
  User,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Shield,
  HelpCircle,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Signed out" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sign out failed" });
    }
  };

  return (
    <div className="bg-background px-4 py-5 pb-8">
      <header className="flex flex-col items-center mb-6 pt-2">
        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
          <User className="w-9 h-9" />
        </div>
        <h1
          data-testid="text-profile-name"
          className="text-xl font-bold capitalize"
        >
          {user?.fullName ?? user?.username}
        </h1>
        {user?.email && (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        )}
        <div className="mt-3 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
          BorrowMe2K Member
        </div>
      </header>

      <div className="space-y-5">
        <Section title="Account">
          <Row icon={User} label="Username" value={user?.username ?? "—"} />
          {user?.phone && (
            <Row icon={Phone} label="Phone" value={user.phone} />
          )}
          {user?.email && <Row icon={Mail} label="Email" value={user.email} />}
          {user?.city && (
            <Row icon={MapPin} label="City" value={user.city} />
          )}
        </Section>

        <Section title="Preferences">
          <ItemRow icon={Bell} label="Notifications">
            <Switch defaultChecked data-testid="switch-notifications" />
          </ItemRow>
          <ItemRow icon={Shield} label="Privacy & Security">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </ItemRow>
          <ItemRow icon={HelpCircle} label="Help & Support">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </ItemRow>
        </Section>

        <Button
          data-testid="button-logout"
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          BorrowMe2K · Cameroon · Loans subject to review and approval.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">
        {title}
      </p>
      <div className="rounded-2xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground flex-1">{label}</p>
      <p
        data-testid={`text-profile-${label.toLowerCase()}`}
        className="text-sm font-semibold truncate max-w-[55%]"
      >
        {value}
      </p>
    </div>
  );
}

function ItemRow({
  icon: Icon,
  label,
  children,
}: {
  icon: any;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-sm font-medium flex-1">{label}</p>
      {children}
    </div>
  );
}
