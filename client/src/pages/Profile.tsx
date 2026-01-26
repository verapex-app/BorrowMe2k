import { User, Settings, Shield, HelpCircle, LogOut, ChevronRight, Bell, Moon, Globe, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Profile() {
  return (
    <motion.div 
      className="bg-background min-h-full px-5 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants} className="flex flex-col items-center mb-8 pt-4">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-emerald-400 to-primary p-[3px] shadow-xl shadow-primary/20 animate-pulse-glow">
            <div className="w-full h-full rounded-[21px] bg-background flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-background flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
        <h1 data-testid="text-username" className="text-2xl font-bold">Alex Morgan</h1>
        <p className="text-sm text-muted-foreground mb-3">alex.morgan@example.com</p>
        <div className="px-4 py-1.5 bg-gradient-to-r from-primary/10 to-emerald-400/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider border border-primary/20">
          Premium Member
        </div>
      </motion.header>

      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <Section title="Account">
            <ProfileItem icon={User} label="Personal Information" />
            <ProfileItem icon={Shield} label="Security" />
            <ProfileItem icon={Fingerprint} label="Biometrics">
              <Switch defaultChecked />
            </ProfileItem>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section title="Preferences">
            <ProfileItem icon={Bell} label="Notifications">
              <Switch defaultChecked />
            </ProfileItem>
            <ProfileItem icon={Moon} label="Dark Mode">
              <Switch />
            </ProfileItem>
            <ProfileItem icon={Globe} label="Language" subtitle="English (US)" />
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section title="Support">
            <ProfileItem icon={HelpCircle} label="Help Center" />
            <ProfileItem icon={Settings} label="App Settings" />
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button 
            data-testid="button-logout"
            variant="ghost" 
            className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold justify-start px-5 gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            Log Out
          </Button>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-xs text-muted-foreground pt-4">
          NeoBank v2.1.0
        </motion.p>
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</h3>
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, subtitle, children }: { icon: any, label: string, subtitle?: string, children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 gap-3 cursor-pointer active:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <span className="font-medium text-sm">{label}</span>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </div>
  );
}
