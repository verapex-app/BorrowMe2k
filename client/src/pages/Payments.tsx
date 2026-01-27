import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, CheckCircle2, Building2, Send, Wallet, Share2, Download, Clock, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

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
  const [receipt, setReceipt] = useState<any>(null);
  const [mode, setMode] = useState<"transfer" | "withdraw">("transfer");

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
      onSuccess: (res) => {
        setReceipt({
          type: "transfer",
          id: res.id || `TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          amount: data.amount,
          recipient: data.title,
          date: new Date().toLocaleString(),
          status: res.status || "completed",
        });
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
        const withdrawal = await res.json();
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setReceipt({
          type: "withdrawal",
          id: withdrawal.id || `WDN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          amount: data.amount,
          recipient: data.accountName,
          accountNumber: data.accountNumber,
          sortCode: data.sortCode,
          date: new Date().toLocaleString(),
          status: "pending",
        });
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    }
  };

  if (receipt) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col animate-in fade-in duration-500 pb-24">
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Transfer Successful</h2>
            <p className="text-muted-foreground">Your transaction has been processed</p>
          </div>

          <Card className="w-full bg-card border-none shadow-xl overflow-hidden rounded-3xl">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-border/50 pb-4">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold text-primary">£{Number(receipt.amount).toFixed(2)}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recipient</span>
                  <span className="text-sm font-semibold">{receipt.recipient}</span>
                </div>
                {receipt.type === "withdrawal" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Account</span>
                      <span className="text-sm font-semibold">{receipt.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sort Code</span>
                      <span className="text-sm font-semibold">{receipt.sortCode}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-semibold">{receipt.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reference ID</span>
                  <span className="text-sm font-mono text-xs text-muted-foreground">{receipt.id}</span>
                </div>
              </div>

              {receipt.status === "pending" && (
                <div className="bg-amber-500/10 p-4 rounded-2xl flex gap-3 items-start border border-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {receipt.type === "transfer" 
                      ? "This user is not registered. Money will be held for 5 days. If not claimed, it will be automatically refunded to your account."
                      : "Withdrawal is being processed and will arrive in your bank account shortly."}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <Button variant="secondary" className="h-14 rounded-2xl font-bold gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button onClick={() => setLocation("/")} className="h-14 rounded-2xl font-bold">
            Done
          </Button>
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

      <Tabs defaultValue="transfer" onValueChange={(v) => setMode(v as any)} className="space-y-6">
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
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground/30 mr-1">£</span>
                  <Input
                    {...transferForm.register("amount")}
                    type="number"
                    placeholder="0.00"
                    className="h-20 text-5xl font-bold text-center border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/20 w-48 px-0"
                  />
                </div>
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
            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="flex items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground/30 mr-1">£</span>
                <Input
                  {...withdrawalForm.register("amount")}
                  type="number"
                  placeholder="0.00"
                  className="h-20 text-5xl font-bold text-center border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/20 w-48 px-0"
                />
              </div>
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
