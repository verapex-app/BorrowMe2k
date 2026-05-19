import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ArrowRight, ExternalLink, Clock } from "lucide-react";
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

  // Manual poll every 20 s — never fires on first render so stale cache
  // cannot accidentally trigger an immediate skip.
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

  // Auto-advance when the local 30-min countdown reaches zero
  useEffect(() => {
    if (remaining === 0 && !clearedRef.current) {
      clearedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onCleared();
    }
  }, [remaining]);

  const pct = Math.max(
    0,
    Math.min(
      100,
      (1 - remaining / (30 * 60 * 1000)) * 100,
    ),
  );
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 mt-2">
        <Clock className="w-7 h-7 text-amber-500" />
      </div>

      <h2 className="text-xl font-bold text-foreground">Setting Up Your Account</h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
        Your details have been received. Our team is configuring your account.
        This usually takes up to 30 minutes — we'll notify you by email when you're ready to proceed.
      </p>

      {/* Circular countdown */}
      <div className="relative flex items-center justify-center my-8">
        <svg width="112" height="112" className="-rotate-90">
          <circle
            cx="56" cy="56" r={r}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          <circle
            cx="56" cy="56" r={r}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">remaining</span>
        </div>
      </div>

      <div className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-left">
        <p className="text-xs font-semibold text-amber-800 mb-0.5">What happens next?</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Once our team finishes your setup, you'll receive an email with a link
          to complete your identity verification.
        </p>
      </div>

      <button
        onClick={onClose}
        className="mt-5 text-sm text-muted-foreground py-1.5 w-full"
      >
        I'll check back later
      </button>
    </div>
  );
}

export function KycVerifyFlow({
  user,
  kycLink,
  kycStatus,
  onClose,
}: KycVerifyFlowProps) {
  const { toast } = useToast();

  const waitingUntil: Date | null = (() => {
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

  // Determine initial step
  const initialStep = (): "profile" | "waiting" | "verify" => {
    if (!profileComplete) return "profile";
    if (waitingUntil) return "waiting";
    return "verify";
  };

  const [step, setStep] = useState<"profile" | "waiting" | "verify">(initialStep);

  const saveProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("POST", "/api/kyc/profile", data);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Could not save details");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setStep("waiting");
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

  const StepIndicator = ({ active }: { active: "profile" | "waiting" | "verify" }) => (
    <div className="flex items-center gap-2 w-full mb-5">
      {[
        { id: "profile", label: "Personal Details", num: 1 },
        { id: "waiting", label: "Account Setup", num: 2 },
        { id: "verify", label: "ID Verification", num: 3 },
      ].map(({ id, label, num }, idx, arr) => (
        <div key={id} className="flex items-center gap-1 flex-1 min-w-0">
          <span
            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
              active === id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {num}
          </span>
          <span
            className={`text-xs font-semibold truncate ${
              active === id ? "text-foreground" : "text-muted-foreground"
            } ${
              (active === "waiting" && id === "profile") ||
              (active === "verify" && (id === "profile" || id === "waiting"))
                ? "line-through"
                : ""
            }`}
          >
            {label}
          </span>
          {idx < arr.length - 1 && (
            <div className="flex-1 h-px bg-border mx-0.5 shrink" />
          )}
        </div>
      ))}
    </div>
  );

  if (step === "profile") {
    return (
      <div className="flex flex-col px-6 pb-8 pt-2">
        <div className="flex flex-col items-center text-center mb-4">
          <img
            src="/KYC.png"
            alt="Identity verification"
            className="w-32 h-32 object-contain"
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
            className="space-y-4"
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
            <Button
              type="submit"
              className="w-full"
              disabled={saveProfile.isPending}
              data-testid="button-save-kyc-profile"
            >
              {saveProfile.isPending ? "Saving…" : "Submit Details"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </Form>

        <button
          onClick={onClose}
          className="mt-3 text-sm text-muted-foreground py-1.5 text-center w-full"
        >
          I'll do this later
        </button>
      </div>
    );
  }

  if (step === "waiting") {
    const target = waitingUntil ?? new Date(Date.now() + 30 * 60 * 1000);
    return (
      <div className="flex flex-col px-6 pb-8 pt-2">
        <StepIndicator active="waiting" />
        <CountdownScreen
          waitingUntil={target}
          onClose={onClose}
          onCleared={() => setStep("verify")}
        />
      </div>
    );
  }

  const buttonLabel =
    kycStatus === "rejected" ? "Resubmit ID Document" : "Start ID Verification";

  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-2 text-center">
      <img
        src="/KYC.png"
        alt="Identity verification"
        className="w-36 h-36 object-contain"
      />
      <h2 className="text-xl font-bold text-foreground mt-1">Verify Your Identity</h2>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
        Have a valid Cameroonian government-issued ID ready — the process takes under 3 minutes.
      </p>

      <div className="w-full mt-4">
        <StepIndicator active="verify" />
      </div>

      {kycStatus === "pending" && (
        <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3 w-full text-left mb-4">
          Your submission is under review. We'll notify you as soon as it's approved.
        </p>
      )}
      {kycStatus === "rejected" && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-3 w-full text-left mb-4">
          Your previous submission wasn't accepted. Please resubmit a clear, valid document.
        </p>
      )}

      <a
        href={kycLink}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-start-verification"
        className="mt-2 flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm"
      >
        <ShieldCheck className="w-4 h-4" />
        {buttonLabel}
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>
      <button
        onClick={onClose}
        className="mt-3 text-sm text-muted-foreground py-1.5 w-full"
      >
        I'll do this later
      </button>
    </div>
  );
}
