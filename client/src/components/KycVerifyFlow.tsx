import { useState } from "react";
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
}

export function KycVerifyFlow({
  user,
  kycLink,
  kycStatus,
  onClose,
}: KycVerifyFlowProps) {
  const { toast } = useToast();
  const profileComplete = !!(
    user?.firstName &&
    user?.lastName &&
    user?.dateOfBirth &&
    user?.idCardNumber
  );
  const [step, setStep] = useState<"profile" | "verify">(
    profileComplete ? "verify" : "profile",
  );

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
      setStep("verify");
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

  const StepIndicator = ({ active }: { active: "profile" | "verify" }) => (
    <div className="flex items-center gap-2 w-full mb-5">
      <span
        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
          active === "profile"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        1
      </span>
      <span
        className={`text-xs font-semibold ${active === "profile" ? "text-foreground" : "text-muted-foreground line-through"}`}
      >
        Personal Details
      </span>
      <div className="flex-1 h-px bg-border mx-1" />
      <span
        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
          active === "verify"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        2
      </span>
      <span
        className={`text-xs font-semibold ${active === "verify" ? "text-foreground" : "text-muted-foreground"}`}
      >
        ID Verification
      </span>
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
                    <FormLabel className="text-xs font-semibold">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Marie"
                        data-testid="input-first-name"
                        {...field}
                      />
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
                    <FormLabel className="text-xs font-semibold">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Mbeki"
                        data-testid="input-last-name"
                        {...field}
                      />
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
                  <FormLabel className="text-xs font-semibold">
                    Date of Birth
                  </FormLabel>
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
                  <FormLabel className="text-xs font-semibold">
                    National ID Card Number
                  </FormLabel>
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
              {saveProfile.isPending ? "Saving…" : "Continue to Verification"}
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

  const buttonLabel =
    kycStatus === "rejected" ? "Resubmit ID Document" : "Start ID Verification";

  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-2 text-center">
      <img
        src="/KYC.png"
        alt="Identity verification"
        className="w-36 h-36 object-contain"
      />
      <h2 className="text-xl font-bold text-foreground mt-1">
        Verify Your Identity
      </h2>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
        Have a valid Cameroonian government-issued ID ready — the process takes
        under 3 minutes.
      </p>

      <div className="w-full mt-4">
        <StepIndicator active="verify" />
      </div>

      {kycStatus === "pending" && (
        <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3 w-full text-left mb-4">
          Your submission is under review. We'll notify you as soon as it's
          approved.
        </p>
      )}
      {kycStatus === "rejected" && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-3 w-full text-left mb-4">
          Your previous submission wasn't accepted. Please resubmit a clear,
          valid document.
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
