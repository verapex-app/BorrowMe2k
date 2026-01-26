import { User, Settings, Shield, HelpCircle, LogOut, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  return (
    <div className="min-h-screen bg-background pb-24 px-4 pt-6">
      <header className="flex flex-col items-center mb-8 pt-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent p-[3px] mb-4 shadow-xl shadow-primary/20">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <User className="w-10 h-10 text-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-display">Alex Morgan</h1>
        <p className="text-muted-foreground">alex.morgan@example.com</p>
        <div className="mt-4 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
          Premium Member
        </div>
      </header>

      <div className="space-y-6">
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

        <Button variant="ghost" className="w-full h-14 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold justify-start px-4 gap-3">
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">{title}</h3>
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, children }: { icon: any, label: string, children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      {children || <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </div>
  );
}
