import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLang, LangToggle, translations } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import { Loader2, ShieldCheck, Clock, XCircle, CheckCircle2, FileText, Camera, Phone, ExternalLink, RefreshCw } from "lucide-react";

export default function KycPage() {
  const { user, logout } = useUser();
  const { lang } = useLang();
  const t = translations[lang].kyc;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const status = user.kycStatus;
  const hasLink = !!user.kycLink;

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc/assign-link", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: data.message ?? t.noLinkAvailable });
        return;
      }
      const link: string = data.kycLink;
      await fetch("/api/kyc/start", { method: "POST", credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {
      toast({ variant: "destructive", title: t.noLinkAvailable });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="fixed top-4 right-4 z-10">
        <LangToggle className="bg-background/90 border-border text-foreground shadow-sm" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="BorrowMe2K" className="h-12 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="bg-background border border-border/60 rounded-2xl shadow-xl overflow-hidden">
          {status === "pending" && <PendingView t={t} onRefresh={handleRefresh} onLogout={logout} />}
          {status === "rejected" && <RejectedView t={t} onLogout={logout} />}
          {status === "not_submitted" && (
            hasLink
              ? <LinkReadyView t={t} kycLink={user.kycLink!} loading={loading} onOpen={handleStart} onRefresh={handleRefresh} onLogout={logout} />
              : <InstructionsView t={t} loading={loading} onStart={handleStart} onLogout={logout} />
          )}
        </div>
      </div>
    </div>
  );
}

type T = typeof translations["en"]["kyc"];

function InstructionsView({ t, loading, onStart, onLogout }: { t: T; loading: boolean; onStart: () => void; onLogout: () => void }) {
  const docIcons = [FileText, Camera, Phone];
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t.docsTitle}</p>
        <ul className="space-y-2.5">
          {t.docs.map((doc, i) => {
            const Icon = docIcons[i] ?? FileText;
            return (
              <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {doc}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t.howTitle}</p>
        <ol className="space-y-2">
          {t.howSteps.map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <span className="text-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={onStart}
        disabled={loading}
        data-testid="button-start-kyc"
        className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />{t.loadingButton}</>
        ) : (
          <><ShieldCheck className="w-4 h-4" />{t.startButton}</>
        )}
      </button>

      <button onClick={onLogout} className="w-full text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
        {t.logout}
      </button>
    </div>
  );
}

function LinkReadyView({ t, kycLink, loading, onOpen, onRefresh, onLogout }: { t: T; kycLink: string; loading: boolean; onOpen: () => void; onRefresh: () => void; onLogout: () => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/15 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <ExternalLink className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{t.linkOpenedTitle}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.linkOpenedBody}</p>
        </div>
      </div>

      <button
        onClick={onOpen}
        disabled={loading}
        data-testid="button-open-kyc-link"
        className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />{t.loadingButton}</>
        ) : (
          <><ExternalLink className="w-4 h-4" />{t.openButton}</>
        )}
      </button>

      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground py-1 hover:text-foreground transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />{t.refreshButton}
      </button>

      <button onClick={onLogout} className="w-full text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
        {t.logout}
      </button>
    </div>
  );
}

function PendingView({ t, onRefresh, onLogout }: { t: T; onRefresh: () => void; onLogout: () => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">{t.pendingTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{t.pendingBody}</p>
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{t.pendingEta}</span>
        </div>
      </div>

      <div className="space-y-2">
        {[t.howSteps[0], t.howSteps[1], t.howSteps[2]].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${i < 2 ? "text-primary" : "text-muted-foreground/40"}`} />
            <span className={i < 2 ? "text-foreground" : "text-muted-foreground"}>{step}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onRefresh}
        className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground py-1 hover:text-foreground transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />{t.refreshButton}
      </button>

      <button onClick={onLogout} className="w-full text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
        {t.logout}
      </button>
    </div>
  );
}

function RejectedView({ t, onLogout }: { t: T; onLogout: () => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">{t.rejectedTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{t.rejectedBody}</p>
      </div>

      <a
        href="mailto:support@borrowme2k.com"
        className="block w-full text-center bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm"
      >
        {t.contactSupport}
      </a>

      <button onClick={onLogout} className="w-full text-xs text-muted-foreground py-1 hover:text-foreground transition-colors">
        {t.logout}
      </button>
    </div>
  );
}
