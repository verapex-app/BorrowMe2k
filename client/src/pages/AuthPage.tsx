import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Landmark, ArrowRight, User, Mail, Phone, MapPin, Lock } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, register } = useUser();
  const { toast } = useToast();

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0a0a0a] p-4 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Landmark className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sterling Mobile</h1>
          <p className="text-muted-foreground">Secure UK Digital Banking</p>
        </div>

        <Card className="border-none shadow-xl bg-white dark:bg-[#161616] overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/50 p-0 h-14">
                <TabsTrigger 
                  value="login" 
                  className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-[#161616] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-all h-full"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-[#161616] data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-all h-full"
                >
                  Apply Now
                </TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="login" className="mt-0 space-y-4">
                  <AuthForm mode="login" onSubmit={login} />
                </TabsContent>
                <TabsContent value="register" className="mt-0 space-y-4">
                  <AuthForm mode="register" onSubmit={register} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-center items-center gap-6 opacity-40 grayscale pointer-events-none">
          <SiVisa className="h-8 w-12" />
          <SiMastercard className="h-8 w-12" />
          <div className="flex items-center gap-1 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            FSCS PROTECTED
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
          Sterling Bank is authorised by the Prudential Regulation Authority and regulated by the Financial Conduct Authority and the Prudential Regulation Authority.
        </p>
      </div>
    </div>
  );
}

function AuthForm({ mode, onSubmit }: { mode: "login" | "register"; onSubmit: (data: any) => Promise<any> }) {
  const { toast } = useToast();
  const form = useForm<any>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      const result = await onSubmit(data);
      if (result.ok) {
        toast({
          title: mode === "login" ? "Welcome back" : "Application successful",
          description: mode === "login" ? "Accessing your accounts..." : "Your digital account is ready.",
        });
      } else {
        const errorText = await result.text();
        toast({
          variant: "destructive",
          title: "System Error",
          description: errorText,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to reach banking servers.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {mode === "register" && (
          <>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Legal Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="As shown on your ID" className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="name@example.com" className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="+44 7000 000000" className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Residential Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Current UK address" className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Digital ID</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Username or customer ID" className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" {...field} />
                </div>
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
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Pin / Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full h-12 text-md font-semibold mt-4 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform" disabled={form.formState.isSubmitting}>
          {mode === "login" ? "Sign In Securely" : "Create My Account"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
