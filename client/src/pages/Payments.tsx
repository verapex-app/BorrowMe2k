import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
});

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  sortCode: z.string().length(6, "Sort code must be 6 digits"),
  accountNumber: z.string().min(8, "Account number is required"),
  name: z.string().min(2, "Account holder name is required"),
});

export default function Payments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"send" | "withdraw">("send");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const transferForm = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: { title: "", amount: "" },
  });

  const withdrawForm = useForm({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { amount: "", sortCode: "", accountNumber: "", name: "" },
  });

  const onTransfer = async (data: any) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/transactions", {
        ...data,
        type: "debit",
        category: "transfer",
        icon: "send"
      });
      if (res.ok) {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setTimeout(() => setLocation("/"), 2000);
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (err: any) {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onWithdraw = async (data: any) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/withdraw", data);
      if (res.ok) {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        setTimeout(() => setLocation("/"), 2000);
      } else {
        const err = await res.json();
        throw new Error(err.message);
      }
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold">Success!</h2>
        <p className="text-muted-foreground">Your request has been processed.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2">
        <Button 
          variant={mode === "send" ? "default" : "outline"} 
          onClick={() => setMode("send")}
          className="flex-1"
        >
          Send Money
        </Button>
        <Button 
          variant={mode === "withdraw" ? "default" : "outline"} 
          onClick={() => setMode("withdraw")}
          className="flex-1"
        >
          Withdraw
        </Button>
      </div>

      {mode === "send" ? (
        <form onSubmit={transferForm.handleSubmit(onTransfer)} className="space-y-4">
          <Input placeholder="Phone or Email" {...transferForm.register("title")} />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">£</span>
            <Input className="pl-7" placeholder="0.00" type="number" step="0.01" {...transferForm.register("amount")} />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Send Money"}
          </Button>
        </form>
      ) : (
        <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">£</span>
            <Input className="pl-7" placeholder="0.00" type="number" step="0.01" {...withdrawForm.register("amount")} />
          </div>
          <Input placeholder="Account Holder Name" {...withdrawForm.register("name")} />
          <Input placeholder="Sort Code (6 digits)" maxLength={6} {...withdrawForm.register("sortCode")} />
          <Input placeholder="Account Number" {...withdrawForm.register("accountNumber")} />
          <Button className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Withdraw Funds"}
          </Button>
        </form>
      )}
    </div>
  );
}
