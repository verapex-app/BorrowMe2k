import { useCreateTransaction } from "@/hooks/use-banking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Loader2, CheckCircle2, Sparkles, Users, Building2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";

const formSchema = z.object({
  title: z.string().min(2, "Name/Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().default("transfer"),
  type: z.enum(["debit", "credit"]).default("debit"),
  icon: z.string().default("transfer"),
});

type FormData = z.infer<typeof formSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

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
        amount: String(Math.abs(Number(data.amount))),
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setLocation("/");
          }, 2500);
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
      <div className="min-h-full flex flex-col items-center justify-center bg-background p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-primary rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/30"
        >
          <CheckCircle2 className="w-14 h-14 text-white" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-2">Transfer Sent!</h2>
          <p className="text-muted-foreground">Your money is on its way.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-background min-h-full px-5 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Send Money</h1>
        <p className="text-sm text-muted-foreground">Transfer funds instantly to anyone, anywhere.</p>
      </motion.header>

      {/* Quick Send Options */}
      <motion.section variants={itemVariants} className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {[
            { icon: Users, label: "Contacts", color: "from-blue-500 to-indigo-600" },
            { icon: Building2, label: "Banks", color: "from-slate-500 to-slate-600" },
            { icon: Globe, label: "International", color: "from-violet-500 to-purple-600" },
          ].map((option) => (
            <button key={option.label} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <motion.div variants={itemVariants} className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Amount</label>
          <div className="relative bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-muted-foreground/50">$</span>
              <Input
                {...form.register("amount")}
                data-testid="input-amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                className="text-4xl font-bold bg-transparent border-none text-center w-40 focus-visible:ring-0 placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {['$25', '$50', '$100', '$500'].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => form.setValue("amount", amount.replace('$', ''))}
                  className="px-4 py-2 rounded-full bg-background border border-border text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive text-center">{form.formState.errors.amount.message}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient</label>
            <Input 
              {...form.register("title")}
              data-testid="input-recipient"
              placeholder="Name, email, or phone" 
              className="h-14 rounded-2xl bg-secondary/50 border-transparent focus:border-primary focus:bg-background text-base"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select 
              onValueChange={(val) => form.setValue("category", val)} 
              defaultValue="transfer"
            >
              <SelectTrigger data-testid="select-category" className="h-14 rounded-2xl bg-secondary/50 border-transparent">
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            data-testid="button-send"
            disabled={isPending}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-emerald-400 hover:opacity-90 shadow-xl shadow-primary/30"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Send Money
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
