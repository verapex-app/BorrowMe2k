import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, CheckCircle2, Building2, Send, Wallet, Share2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

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

const generateLongId = (prefix: string) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const moreRandom = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${timestamp}-${random}-${moreRandom}`;
};

export default function Payments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useCreateTransaction();
  const [receipt, setReceipt] = useState<any>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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
          id: res.id ? `FT-${res.id}-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : generateLongId("FT"),
          amount: data.amount,
          recipient: data.title,
          date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: res.status || "completed",
        });
      },
      onError: (err: any) => {
        toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
      },
    });
  };

  const onWithdraw = async (data: z.infer<typeof withdrawalSchema>) => {
    setIsWithdrawing(true);
    try {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      if (res.ok) {
        const withdrawal = await res.json();
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setReceipt({
          type: "withdrawal",
          id: withdrawal.id ? `WD-${withdrawal.id}-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : generateLongId("WD"),
          amount: data.amount,
          recipient: data.accountName,
          accountNumber: data.accountNumber,
          sortCode: data.sortCode,
          date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: "pending",
        });
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (receipt) {
    return (
      <div className="bg-background px-4 py-8 pb-24 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Success!</h2>
            <p className="text-muted-foreground text-sm">Your transfer has been processed</p>
          </div>
        </div>

        <Card className="border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="bg-muted/30 p-6 text-center space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Amount Sent</p>
              <h3 className="text-4xl font-bold tracking-tighter">£{Number(receipt.amount).toFixed(2)}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-semibold text-right max-w-[200px] break-all">{receipt.recipient}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{receipt.date}</span>
              </div>
              <div className="pt-4 border-t border-border/50 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction ID</p>
                <p className="font-mono text-[10px] text-muted-foreground break-all bg-muted/50 p-2 rounded-lg leading-relaxed">
                  {receipt.id}
                </p>
              </div>
            </div>

            {receipt.status === "pending" && (
              <div className="bg-primary/5 p-4 flex gap-3 items-start border-t border-primary/10">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
                  {receipt.type === "transfer" 
                    ? "Recipient is not registered. Funds will be held for 5 days before returning to your balance if unclaimed."
                    : "Processing withdrawal. Funds will appear in your bank account shortly."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 rounded-xl font-semibold gap-2 no-default-hover-elevate no-default-active-elevate">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button onClick={() => setLocation("/")} className="h-12 rounded-xl font-bold no-default-hover-elevate no-default-active-elevate">
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-6 pb-24 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground">Transfer money or withdraw funds</p>
      </header>

      <Tabs defaultValue="transfer" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="transfer" className="rounded-lg text-sm font-semibold transition-all">
            <Send className="w-3.5 h-3.5 mr-2" />
            Send
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="rounded-lg text-sm font-semibold transition-all">
            <Building2 className="w-3.5 h-3.5 mr-2" />
            Withdraw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="duration-300">
          <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-10">
            <div className="flex flex-col items-center justify-center space-y-2 py-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Enter Amount</p>
              <div className="flex items-center justify-center">
                <span className="text-3xl font-bold text-muted-foreground/40 mr-1.5">£</span>
                <Input
                  {...transferForm.register("amount")}
                  type="number"
                  placeholder="0.00"
                  className="h-16 text-5xl font-bold text-center border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/10 w-48 px-0 tracking-tighter"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">To Account</label>
                <Input 
                  {...transferForm.register("title")} 
                  placeholder="Email address or phone number" 
                  className="h-12 rounded-xl bg-secondary/30 border-transparent focus:bg-background focus:border-border px-4"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold no-default-hover-elevate no-default-active-elevate" disabled={isPending}>
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    Send Money <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="withdraw" className="duration-300">
          <form onSubmit={withdrawalForm.handleSubmit(onWithdraw)} className="space-y-8">
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Withdraw Amount</p>
              <div className="flex items-center justify-center">
                <span className="text-3xl font-bold text-muted-foreground/40 mr-1.5">£</span>
                <Input
                  {...withdrawalForm.register("amount")}
                  type="number"
                  placeholder="0.00"
                  className="h-16 text-5xl font-bold text-center border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/10 w-48 px-0 tracking-tighter"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 bg-card p-5 rounded-2xl border border-border/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Holder</label>
                  <Input {...withdrawalForm.register("accountName")} placeholder="Full Name" className="h-11 rounded-xl bg-background border-border/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sort Code</label>
                    <Input {...withdrawalForm.register("sortCode")} placeholder="00-00-00" className="h-11 rounded-xl bg-background border-border/50 text-center font-mono" maxLength={6} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Number</label>
                    <Input {...withdrawalForm.register("accountNumber")} placeholder="00000000" className="h-11 rounded-xl bg-background border-border/50 text-center font-mono" />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold no-default-hover-elevate no-default-active-elevate" disabled={isWithdrawing}>
                {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Confirm Withdrawal
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
