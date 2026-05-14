import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, usernameField, passwordField, emailField, phoneField, nameField, cityField, type InsertUser } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";


const loginSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

const step1Schema = z.object({
  fullName: nameField,
  username: usernameField,
  city: cityField,
});

const step2Schema = z.object({
  phone: phoneField,
  email: emailField,
});

const step3Schema = z.object({
  otp: z.string().length(4, "Enter the 4-digit code"),
});

const step4Schema = z.object({
  password: passwordField,
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, register } = useUser();

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="text-center space-y-2 pb-2">
          <img
            src="/SIGN_IN.png"
            alt="Sign in illustration"
            className="mx-auto w-44 h-44 object-contain"
          />
          <div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              BorrowMe2K
            </CardTitle>
            <CardDescription className="mt-1">
              Cameroon&apos;s instant loan partner — borrow, build, repay.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSubmit={login} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterWizard onSubmit={register} />
            </TabsContent>
          </Tabs>
          <p className="text-[11px] text-muted-foreground text-center mt-5">
            Demo account — username: <span className="font-semibold">demo</span>{" "}
            · password: <span className="font-semibold">demo1234</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm({
  onSubmit,
}: {
  onSubmit: (data: InsertUser) => Promise<any>;
}) {
  const { toast } = useToast();
  const [showForgot, setShowForgot] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await onSubmit(data as InsertUser);
      toast({ title: "Welcome back to BorrowMe2K" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error?.message ?? "Invalid credentials",
      });
    }
  };

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone, email or username</FormLabel>
              <FormControl>
                <Input placeholder="e.g. +237 6 70 00 00 00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>
              <FormControl>
                <Input type="password" placeholder="Enter password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          Sign in
        </Button>
      </form>
    </Form>
  );
}

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (data: z.infer<typeof forgotSchema>) => {
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    let json: any = null;
    try { json = await res.json(); } catch {}
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "Could not send reset link",
        description: json?.message ?? `Error ${res.status}`,
      });
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center py-2">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <p className="text-sm font-semibold">Check your inbox</p>
        <p className="text-xs text-muted-foreground">
          A password reset link has been sent. It expires in 1 hour.
        </p>
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Reset your password</p>
        <p className="text-xs text-muted-foreground mt-1">
          Enter the email on your account and we'll send you a reset link.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send reset link"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

const STEPS = [
  { label: "Personal", number: 1 },
  { label: "Contact", number: 2 },
  { label: "Verify", number: 3 },
  { label: "Password", number: 4 },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              step.number < current
                ? "bg-primary text-primary-foreground"
                : step.number === current
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.number < current ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              step.number
            )}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-6 mx-1 transition-all ${
                step.number < current ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function RegisterWizard({
  onSubmit,
}: {
  onSubmit: (data: InsertUser) => Promise<any>;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [collected, setCollected] = useState<Partial<InsertUser>>({});
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { fullName: "", username: "", city: "Douala" },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { phone: "", email: "" },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { otp: "" },
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { password: "" },
  });

  const handleStep1 = (data: Step1Data) => {
    setCollected((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch {}
    if (!res.ok) {
      throw new Error(json?.message ?? `Error ${res.status}`);
    }
    return json;
  };

  const handleSendOtp = async () => {
    const email = step2Form.getValues("email");
    const valid = await step2Form.trigger("email");
    if (!valid) return;
    setSendingOtp(true);
    try {
      await postJson("/api/send-otp", { email });
      setOtpSent(true);
      toast({ title: "Code sent!", description: `Check ${email} for your 4-digit code.` });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could not send code",
        description: err.message ?? "Try again",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleStep2 = async (data: Step2Data) => {
    if (!otpSent) {
      toast({ variant: "destructive", title: "Please send the verification code first" });
      return;
    }
    setCollected((prev) => ({ ...prev, ...data }));
    setStep(3);
  };

  const handleStep3 = async (data: Step3Data) => {
    const email = (collected.email as string) ?? step2Form.getValues("email");
    try {
      await postJson("/api/verify-otp", { email, code: data.otp });
      setVerifiedEmail(email);
      setStep(4);
    } catch (err: any) {
      step3Form.setError("otp", { message: err.message ?? "Invalid or expired code" });
    }
  };

  const handleStep4 = async (data: Step4Data) => {
    const payload = { ...collected, ...data } as InsertUser;
    try {
      await onSubmit(payload);
      toast({ title: "Welcome to BorrowMe2K!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error?.message ?? "Could not create account",
      });
    }
  };

  return (
    <div>
      <StepIndicator current={step} />

      {step === 1 && (
        <Form {...step1Form}>
          <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
            <p className="text-sm font-semibold text-foreground mb-1">Personal information</p>
            <FormField
              control={step1Form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Awa Tabe" {...field} />
                  </FormControl>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                    ⚠ Enter your real legal name exactly as it appears on your ID. This will be used for KYC verification.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={step1Form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. awa_tabe"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      {...field}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "")
                          .replace(/[^a-z0-9_]/g, "");
                        field.onChange(cleaned);
                      }}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Lowercase letters, numbers and underscores only.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={step1Form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Douala, Yaoundé, Bamenda…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...step2Form}>
          <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
            <p className="text-sm font-semibold text-foreground mb-1">Contact details</p>
            <FormField
              control={step2Form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Mobile Money)</FormLabel>
                  <FormControl>
                    <Input placeholder="+237 6 XX XX XX XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={step2Form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setOtpSent(false);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : otpSent ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        <span className="ml-1 text-xs">
                          {otpSent ? "Resend" : "Send code"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  {otpSent && (
                    <p className="text-xs text-green-600 mt-1">
                      Code sent — check your inbox.
                    </p>
                  )}
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 3 && (
        <Form {...step3Form}>
          <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
            <div className="text-center space-y-1 mb-2">
              <p className="text-sm font-semibold text-foreground">Verify your email</p>
              <p className="text-xs text-muted-foreground">
                We sent a 4-digit code to{" "}
                <span className="font-medium text-foreground">{collected.email}</span>
              </p>
            </div>
            <FormField
              control={step3Form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="_ _ _ _"
                      maxLength={4}
                      className="text-center text-2xl tracking-[0.5em] font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={step3Form.formState.isSubmitting}
              >
                {step3Form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                className="underline text-primary"
                onClick={() => { setOtpSent(false); setStep(2); }}
              >
                Go back to resend
              </button>
            </p>
          </form>
        </Form>
      )}

      {step === 4 && (
        <Form {...step4Form}>
          <form onSubmit={step4Form.handleSubmit(handleStep4)} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700">
                <span className="font-semibold">{verifiedEmail}</span> verified successfully
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">Set your password</p>
            <FormField
              control={step4Form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(3)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={step4Form.formState.isSubmitting}
              >
                {step4Form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
