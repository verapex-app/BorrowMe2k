import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, CheckCircle2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
      <div className="flex gap-2 mb-6">
        <Button 
          variant={mode === "transfer" ? "default" : "secondary"} 
          className="flex-1 rounded-xl"
          onClick={() => setMode("transfer")}
        >
          Send Money
        </Button>
        <Button 
          variant={mode === "withdraw" ? "default" : "secondary"} 
          className="flex-1 rounded-xl"
          onClick={() => setMode("withdraw")}
        >
          Withdraw
        </Button>
      </div>

      {mode === "transfer" ? (
        <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-6">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">£</span>
              <Input
                {...transferForm.register("amount")}
                type="number"
                placeholder="0.00"
                className="pl-10 h-16 text-3xl font-bold text-center border-b-2 rounded-none focus-visible:ring-0"
              />
            </div>
            <Input 
              {...transferForm.register("title")} 
              placeholder="Phone number or Email" 
              className="h-12 rounded-xl"
            />
            <Button type="submit" className="w-full h-12 rounded-xl" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : "Send Money"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={withdrawalForm.handleSubmit(onWithdraw)} className="space-y-4">
           <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">£</span>
              <Input
                {...withdrawalForm.register("amount")}
                type="number"
                placeholder="0.00"
                className="pl-10 h-16 text-3xl font-bold text-center border-b-2 rounded-none focus-visible:ring-0"
              />
            </div>
          <Input {...withdrawalForm.register("accountName")} placeholder="Account Name (e.g. Chol Akook)" className="h-12 rounded-xl" />
          <Input {...withdrawalForm.register("sortCode")} placeholder="Sort Code (e.g. 230120)" className="h-12 rounded-xl" maxLength={6} />
          <Input {...withdrawalForm.register("accountNumber")} placeholder="Account Number (e.g. 59400543)" className="h-12 rounded-xl" />
          <Button type="submit" className="w-full h-12 rounded-xl bg-primary">
            Confirm Withdrawal
          </Button>
        </form>
      )}
    </div>
  );
}
