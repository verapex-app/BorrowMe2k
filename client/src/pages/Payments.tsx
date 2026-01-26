import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, CheckCircle2, Building2, Send, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const transferSchema = z.object({
  title: z.string().min(2, "Phone or Email is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().default("transfer"),
  type: z.enum(["debit", "credit"]).default("debit"),
  icon: z.string().default("transfer"),
});

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  sortCode: z.string().length(6, "Sort code must be 6 digits"),
  accountNumber: z.string().min(8, "Account number must be at least 8 digits"),
  accountName: z.string().min(2, "Account name is required"),
});

export default function Payments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useCreateTransaction();
  const [success, setSuccess] = useState(false);

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { title: "", amount: "", category: "transfer", type: "debit", icon: "transfer" },
  });

  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { amount: "", sortCode: "", accountNumber: "", accountName: "" },
  });

  const onTransfer = (data: z.infer<typeof transferSchema>) => {
    mutate(data, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => setLocation("/"), 2000);
      },
      onError: (err: any) => {
        toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
      },
    });
  };

  const onWithdraw = async (data: z.infer<typeof withdrawalSchema>) => {
    try {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setSuccess(true);
        setTimeout(() => setLocation("/"), 2000);
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Success!</h2>
          <p className="text-muted-foreground mt-2">Your request is being processed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-5 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground">Transfer funds or withdraw to your bank</p>
      </header>

      <Tabs defaultValue="transfer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="transfer" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Send className="w-4 h-4 mr-2" />
            Send
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2" />
            Withdraw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-8">
            <div className="space-y-4">
              <div className="relative py-4">
                <span className="absolute left-1/2 -translate-x-[110%] top-1/2 -translate-y-1/2 text-4xl font-bold text-muted-foreground/30">£</span>
                <Input
                  {...transferForm.register("amount")}
                  type="number"
                  placeholder="0.00"
                  className="h-20 text-5xl font-bold text-center border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/20"
                />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Recipient</label>
                  <Input 
                    {...transferForm.register("title")} 
                    placeholder="Email or phone number" 
                    className="h-14 rounded-2xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary transition-all text-base"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Send Money <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="withdraw" className="animate-in fade-in slide-in-from-bottom-2">
          <form onSubmit={withdrawalForm.handleSubmit(onWithdraw)} className="space-y-6">
            <div className="relative py-4">
              <span className="absolute left-1/2 -translate-x-[110%] top-1/2 -translate-y-1/2 text-4xl font-bold text-muted-foreground/30">£</span>
              <Input
                {...withdrawalForm.register("amount")}
                type="number"
                placeholder="0.00"
                className="h-20 text-5xl font-bold text-center border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/20"
              />
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Holder</label>
                <Input {...withdrawalForm.register("accountName")} placeholder="Chol Akook" className="h-12 rounded-xl bg-muted/50 border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort Code</label>
                  <Input {...withdrawalForm.register("sortCode")} placeholder="230120" className="h-12 rounded-xl bg-muted/50 border-transparent" maxLength={6} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Number</label>
                  <Input {...withdrawalForm.register("accountNumber")} placeholder="59400543" className="h-12 rounded-xl bg-muted/50 border-transparent" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
              <Wallet className="w-5 h-5 mr-2" />
              Confirm Withdrawal
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
