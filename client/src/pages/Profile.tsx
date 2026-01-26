import { User, Settings, Shield, HelpCircle, LogOut, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  return (
    <div className="bg-background px-4 py-5">
      <header className="flex flex-col items-center mb-6 pt-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] mb-3 shadow-lg shadow-primary/20">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <User className="w-8 h-8 text-foreground" />
          </div>
        </div>
        <h1 data-testid="text-username" className="text-xl font-bold">Alex Morgan</h1>
        <p className="text-sm text-muted-foreground">alex.morgan@example.com</p>
        <div className="mt-3 px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
          Premium Member
        </div>
      </header>

      <div className="space-y-5">
        <Section title="General">
          <ProfileItem icon={Settings} label="Account Settings" />
          <ProfileItem icon={Bell} label="Notifications">
            <Switch defaultChecked />
          </ProfileItem>
          <ProfileItem icon={Shield} label="Privacy & Security" />
        </Section>

        <Section title="Support">
          <ProfileItem icon={HelpCircle} label="Help & Support" />
        </Section>

        <Button 
          data-testid="button-logout"
          variant="ghost" 
          className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold justify-start px-4 gap-3"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h3>
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, children }: { icon: any, label: string, children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3.5 gap-3 cursor-pointer active:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-secondary text-foreground">
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {children || <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </div>
  );
}
