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
import { useLang, LangToggle, translations } from "@/lib/i18n";
import { detectCountryFromTimezone } from "@/lib/countryPhone";


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
  const { lang } = useLang();
  const t = translations[lang].auth;

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="flex justify-end -mb-2">
            <LangToggle className="border-border text-muted-foreground hover:text-foreground" />
          </div>
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
              {t.tagline}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">{t.tabLogin}</TabsTrigger>
              <TabsTrigger value="register">{t.tabSignup}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSubmit={login} t={t} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterWizard onSubmit={register} t={t} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

type AuthT = typeof translations["en"]["auth"];

function LoginForm({
  onSubmit,
  t,
}: {
  onSubmit: (data: InsertUser) => Promise<any>;
  t: AuthT;
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
      toast({ title: t.login.welcomeBack });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.login.loginFailed,
        description: error?.message ?? t.login.invalidCredentials,
      });
    }
  };

  if (showForgot) {
    return <ForgotPasswordForm onBack={() => setShowForgot(false)} t={t} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.login.credentialLabel}</FormLabel>
              <FormControl>
                <Input placeholder={t.login.credentialPlaceholder} {...field} />
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
                <FormLabel>{t.login.passwordLabel}</FormLabel>
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => setShowForgot(true)}
                >
                  {t.login.forgotPassword}
                </button>
              </div>
              <FormControl>
                <Input type="password" placeholder={t.login.passwordPlaceholder} {...field} />
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
          {form.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : t.login.submitButton}
        </Button>
      </form>
    </Form>
  );
}

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

function ForgotPasswordForm({ onBack, t }: { onBack: () => void; t: AuthT }) {
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
        title: t.forgot.couldNotSend,
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
        <p className="text-sm font-semibold">{t.forgot.checkInbox}</p>
        <p className="text-xs text-muted-foreground">{t.forgot.sent}</p>
        <Button variant="outline" className="w-full" onClick={onBack}>
          {t.forgot.backToLogin}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">{t.forgot.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{t.forgot.subtitle}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.forgot.emailLabel}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t.forgot.emailPlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1" /> {t.forgot.back}
            </Button>
            <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : t.forgot.sendButton}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {steps.map((label, i) => {
        const num = i + 1;
        return (
          <div key={num} className="flex items-center">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                num < current
                  ? "bg-primary text-primary-foreground"
                  : num === current
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1"
                  : "bg-muted text-muted-foreground"
              }`}
              title={label}
            >
              {num < current ? <CheckCircle2 className="w-4 h-4" /> : num}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-6 mx-1 transition-all ${
                  num < current ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RegisterWizard({
  onSubmit,
  t,
}: {
  onSubmit: (data: InsertUser) => Promise<any>;
  t: AuthT;
}) {
  const { toast } = useToast();
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [collected, setCollected] = useState<Partial<InsertUser>>({});
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const r = t.register;
  const countryInfo = detectCountryFromTimezone();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { fullName: "", username: "", city: "" },
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
    const valid = await step2Form.trigger();
    if (!valid) return;
    const data = step2Form.getValues();
    setSendingOtp(true);
    try {
      await postJson("/api/send-otp", { email: data.email, lang });
      setCollected((prev) => ({ ...prev, ...data }));
      setOtpSent(true);
      setStep(3);
      toast({ title: r.codeSentTitle, description: r.codeSentDesc(data.email) });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: r.couldNotSend,
        description: err.message ?? r.tryAgain,
      });
    } finally {
      setSendingOtp(false);
    }
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
      toast({ title: r.welcome });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: r.registrationFailed,
        description: error?.message ?? r.couldNotCreate,
      });
    }
  };

  return (
    <div>
      <StepIndicator current={step} steps={r.steps} />

      {step === 1 && (
        <Form {...step1Form}>
          <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
            <p className="text-sm font-semibold text-foreground mb-1">{r.step1Title}</p>
            <FormField
              control={step1Form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.fullNameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={r.fullNamePlaceholder} {...field} />
                  </FormControl>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                    {r.fullNameWarning}
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
                  <FormLabel>{r.usernameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={r.usernamePlaceholder}
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.usernameHint}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={step1Form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.cityLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={r.cityPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {r.continueButton} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...step2Form}>
          <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
            <p className="text-sm font-semibold text-foreground mb-1">{r.step2Title}</p>
            <FormField
              control={step2Form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.phoneLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={countryInfo.phonePlaceholder} {...field} />
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
                  <FormLabel>{r.emailLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={r.emailPlaceholder}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setOtpSent(false);
                      }}
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
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> {r.backButton}
              </Button>
              <Button type="submit" className="flex-1" disabled={sendingOtp}>
                {sendingOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {r.sendCodeButton}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 3 && (
        <Form {...step3Form}>
          <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
            <div className="text-center space-y-1 mb-2">
              <p className="text-sm font-semibold text-foreground">{r.step3VerifyTitle}</p>
              <p className="text-xs text-muted-foreground">
                {r.step3VerifySubtitle}{" "}
                <span className="font-medium text-foreground">{collected.email}</span>
              </p>
            </div>
            <FormField
              control={step3Form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.codeLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={r.codePlaceholder}
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
                <ArrowLeft className="w-4 h-4 mr-1" /> {r.backButton}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={step3Form.formState.isSubmitting}
              >
                {step3Form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : r.verifyButton}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {r.didntGetIt}{" "}
              <button
                type="button"
                className="underline text-primary"
                onClick={() => { setOtpSent(false); setStep(2); }}
              >
                {r.goBackToResend}
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
                <span className="font-semibold">{verifiedEmail}</span> {r.verifiedLabel}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">{r.step4Title}</p>
            <FormField
              control={step4Form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r.passwordLabel}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={r.passwordPlaceholder}
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
                <ArrowLeft className="w-4 h-4 mr-1" /> {r.backButton}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={step4Form.formState.isSubmitting}
              >
                {step4Form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : r.createAccountButton}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
