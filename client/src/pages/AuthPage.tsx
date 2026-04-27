import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, type InsertUser } from "@shared/schema";
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
import { Banknote } from "lucide-react";
import { z } from "zod";

const loginSchema = insertUserSchema.pick({ username: true, password: true });
const registerSchema = insertUserSchema.extend({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().min(8, "Enter a valid Cameroonian phone number"),
  city: z.string().min(2, "City is required"),
});

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
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              BorrowMe
            </CardTitle>
            <CardDescription className="mt-1">
              Cameroon&apos;s instant loan partner — borrow, build, repay.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" data-testid="tab-login">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSubmit={login} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSubmit={register} />
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
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await onSubmit(data as InsertUser);
      toast({ title: "Welcome back to BorrowMe" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error?.message ?? "Invalid credentials",
      });
    }
  };

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
                <Input
                  placeholder="e.g. +237 6 70 00 00 00"
                  data-testid="input-login-username"
                  {...field}
                />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter password"
                  data-testid="input-login-password"
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
          data-testid="button-login"
          disabled={form.formState.isSubmitting}
        >
          Sign in
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({
  onSubmit,
}: {
  onSubmit: (data: InsertUser) => Promise<any>;
}) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      city: "Douala",
    },
  });

  const handleSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await onSubmit(data as InsertUser);
      toast({ title: "Welcome to BorrowMe!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error?.message ?? "Could not create account",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Awa Tabe"
                  data-testid="input-register-fullname"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Pick a username"
                  data-testid="input-register-username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Mobile Money)</FormLabel>
              <FormControl>
                <Input
                  placeholder="+237 6 XX XX XX XX"
                  data-testid="input-register-phone"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  data-testid="input-register-email"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  placeholder="Douala, Yaoundé, Bamenda…"
                  data-testid="input-register-city"
                  {...field}
                  value={field.value ?? ""}
                />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Choose a strong password"
                  data-testid="input-register-password"
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
          data-testid="button-register"
          disabled={form.formState.isSubmitting}
        >
          Create my account
        </Button>
      </form>
    </Form>
  );
}
