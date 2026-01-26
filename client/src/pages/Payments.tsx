import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(2, "Name/Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().default("transfer"),
  type: z.enum(["debit", "credit"]).default("debit"),
  icon: z.string().default("transfer"),
});

type FormData = z.infer<typeof formSchema>;

export default function Payments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useCreateTransaction();
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: "",
      category: "transfer",
      type: "debit",
      icon: "transfer",
    },
  });

  const onSubmit = (data: FormData) => {
    mutate(
      {
        ...data,
        amount: String(data.type === 'debit' ? -Math.abs(Number(data.amount)) : Math.abs(Number(data.amount))),
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setLocation("/");
          }, 2000);
        },
        onError: (err) => {
          toast({
            title: "Transfer failed",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display">Transfer Successful!</h2>
          <p className="text-muted-foreground mt-2">Your money is on its way.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-5">
      <header className="mb-6">
        <h1 className="text-xl font-bold mb-1">Send Money</h1>
        <p className="text-sm text-muted-foreground">Transfer funds securely to anyone.</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">£</span>
            <Input
              {...form.register("amount")}
              data-testid="input-amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              className="pl-10 h-16 text-3xl font-bold bg-transparent border-none border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-center placeholder:text-muted-foreground/30"
              autoFocus
            />
          </div>
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive text-center">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">To (Recipient)</label>
            <Input 
              {...form.register("title")}
              data-testid="input-recipient"
              placeholder="Name, email, or phone" 
              className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:bg-background"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select 
              onValueChange={(val) => form.setValue("category", val)} 
              defaultValue="transfer"
            >
              <SelectTrigger data-testid="select-category" className="h-12 rounded-xl bg-secondary/50 border-transparent">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">General Transfer</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          data-testid="button-send"
          disabled={isPending}
          className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Send Money <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
