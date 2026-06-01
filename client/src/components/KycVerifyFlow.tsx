import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { User } from "@shared/schema";

const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100)
    .transform((v) => v.trim()),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100)
    .transform((v) => v.trim()),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  idCardNumber: z
    .string()
    .min(1, "ID card number is required")
    .max(50)
    .transform((v) => v.trim()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface KycVerifyFlowProps {
  user: User | null;
  kycLink: string;
  kycStatus: string;
  onClose: () => void;
  skipWaiting?: boolean;
}

function useCountdown(targetDate: Date | null) {
  const calcRemaining = () => {
    if (!targetDate) return 0;
    return Math.max(0, targetDate.getTime() - Date.now());
  };
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (!targetDate) { setRemaining(0); return; }
    setRemaining(calcRemaining());
    const id = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(id);
  }, [targetDate?.getTime()]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { remaining, minutes, seconds };
}

// Shared step indicator used by all three steps
function StepIndicator({ active }: { active: "profile" | "waiting" | "verify" }) {
  const steps = [
    { id: "profile", label: "Personal Details", num: 1 },
    { id: "waiting", label: "Account Setup", num: 2 },
    { id: "verify", label: "ID Verification", num: 3 },
  ] as const;

  return (
    <div className="flex items-center w-full mb-5">
      {steps.map(({ id, label, num }, idx) => {
        const isActive = active === id;
        const isDone =
          (active === "waiting" && id === "profile") ||
          (active === "verify" && (id === "profile" || id === "waiting"));

        return (
          <div key={id} className="flex items-center flex-1 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {num}
              </span>
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? "text-foreground"
                    : isDone
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-px bg-border mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// All three steps share this outer shell so the sheet height is identical
function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col px-6 pt-3 pb-6 min-h-[420px]">
      {children}
    </div>
  );
}

function CountdownScreen({
  waitingUntil,
  onClose,
  onCleared,
}: {
  waitingUntil: Date;
  onClose: () => void;
  onCleared: () => void;
}) {
  const { remaining, minutes, seconds } = useCountdown(waitingUntil);
  const clearedRef = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (clearedRef.current) return;
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (!res.ok) return;
        const user = await res.json();
        const wu = user.kycWaitingUntil;
        if (!wu || new Date(wu).getTime() <= Date.now()) {
          if (clearedRef.current) return;
          clearedRef.current = true;
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          onCleared();
        }
      } catch {}
    };

    const id = setInterval(check, 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !clearedRef.current) {
      clearedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onCleared();
    }
  }, [remaining]);

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, (1 - remaining / (10 * 60 * 1000)) * 100));
  const dash = circumference * (1 - pct / 100);

  return (
    <>
      {/* Hero image — same treatment as steps 1 & 3 */}
      <div className="flex flex-col items-center text-center mb-4">
        <img
          src="/PENDING.png"
          alt="Account setup in progress"
          className="w-28 h-28 object-contain"
        />
        <h2 className="text-xl font-bold text-foreground mt-1">
          Setting Up Your Account
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
          Your details have been received. Our team is reviewing your account
          — this takes up to 10 minutes. You'll get an email when you're ready
          to proceed.
        </p>
      </div>

      {/* Countdown — styled with app primary colour */}
      <div className="flex items-center justify-center gap-5 py-3">
        <div className="relative flex items-center justify-center">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="44" cy="44" r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dash}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center leading-none">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">left</span>
          </div>
        </div>

        <div className="flex-1 text-left space-y-1.5">
          <p className="text-sm font-semibold text-foreground">What happens next?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Once our team finishes your setup, you'll receive an email with a
            link to complete your identity verification.
          </p>
        </div>
      </div>

      <div className="mt-auto pt-3">
        <button
          onClick={onClose}
          className="w-full py-3 text-sm text-muted-foreground font-medium border border-border rounded-xl"
        >
          I'll check back later
        </button>
      </div>
    </>
  );
}

export function KycVerifyFlow({
  user,
  kycLink,
  kycStatus,
  onClose,
  skipWaiting = false,
}: KycVerifyFlowProps) {
  const { toast } = useToast();

  const waitingUntil: Date | null = (() => {
    if (skipWaiting) return null;
    const wu = (user as any)?.kycWaitingUntil;
    if (!wu) return null;
    const d = new Date(wu);
    return d.getTime() > Date.now() ? d : null;
  })();

  const profileComplete = !!(
    user?.firstName &&
    user?.lastName &&
    user?.dateOfBirth &&
    (user as any)?.idCardNumber
  );

  const initialStep = (): "profile" | "waiting" | "verify" => {
    if (!profileComplete) return "profile";
    if (waitingUntil) return "waiting";
    return "verify";
  };

  const [step, setStep] = useState<"profile" | "waiting" | "verify">(initialStep);

  const saveProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("POST", "/api/kyc/profile", { ...data, skipWaiting });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Could not save details");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setStep(skipWaiting ? "verify" : "waiting");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: err.message });
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      dateOfBirth: user?.dateOfBirth ?? "",
      idCardNumber: (user as any)?.idCardNumber ?? "",
    },
  });

  // ── Step 1: Personal Details ─────────────────────────────────────────────
  if (step === "profile") {
    return (
      <StepShell>
        <div className="flex flex-col items-center text-center mb-4">
          <img
            src="/KYC.png"
            alt="Identity verification"
            className="w-28 h-28 object-contain"
          />
          <h2 className="text-xl font-bold text-foreground mt-1">
            Personal Details
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
            We need a few details before your identity verification. This is
            stored securely and used only for loan processing.
          </p>
        </div>

        <StepIndicator active="profile" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => saveProfile.mutate(d))}
            className="space-y-3 flex-1"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Marie" data-testid="input-first-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mbeki" data-testid="input-last-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Date of Birth</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-dob"
                      max={new Date().toISOString().split("T")[0]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idCardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">National ID Card Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 123456789"
                      data-testid="input-id-card-number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-1 space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={saveProfile.isPending}
                data-testid="button-save-kyc-profile"
              >
                {saveProfile.isPending ? "Saving…" : "Submit Details"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-sm text-muted-foreground font-medium"
              >
                I'll do this later
              </button>
            </div>
          </form>
        </Form>
      </StepShell>
    );
  }

  // ── Step 2: Waiting ──────────────────────────────────────────────────────
  if (step === "waiting") {
    const target = waitingUntil ?? new Date(Date.now() + 10 * 60 * 1000);
    return (
      <StepShell>
        <StepIndicator active="waiting" />
        <CountdownScreen
          waitingUntil={target}
          onClose={onClose}
          onCleared={() => setStep("verify")}
        />
      </StepShell>
    );
  }

  // ── Step 3: ID Verification ──────────────────────────────────────────────
  const buttonLabel =
    kycStatus === "rejected" ? "Resubmit ID Document" : "Start ID Verification";

  return (
    <StepShell>
      <div className="flex flex-col items-center text-center mb-4">
        <img
          src="/KYC.png"
          alt="Identity verification"
          className="w-28 h-28 object-contain"
        />
        <h2 className="text-xl font-bold text-foreground mt-1">
          Verify Your Identity
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
          Have a valid Cameroonian government-issued ID ready — the process
          takes under 3 minutes.
        </p>
      </div>

      <StepIndicator active="verify" />

      {kycStatus === "pending" && (
        <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3 w-full text-left mb-3">
          Your submission is under review. We'll notify you as soon as it's approved.
        </p>
      )}
      {kycStatus === "rejected" && (
        <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3 w-full text-left mb-3">
          Your previous submission wasn't accepted. Please resubmit a clear,
          valid document.
        </p>
      )}

      <div className="mt-auto space-y-2">
        <a
          href={kycLink}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-start-verification"
          className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          {buttonLabel}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
        <button
          onClick={onClose}
          className="w-full py-3 text-sm text-muted-foreground font-medium"
        >
          I'll do this later
        </button>
      </div>
    </StepShell>
  );
}
