import { useEffect, useMemo, useState } from "react";
import { useLoanProducts, useApplyLoan } from "@/hooks/use-loans";
import { LoanProductIcon } from "@/components/LoanProductIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatXAF } from "@/lib/format";
import type { LoanProduct } from "@shared/schema";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function Loans() {
  const { data: products, isLoading } = useLoanProducts();
  const [selected, setSelected] = useState<LoanProduct | null>(null);
  const [location] = useLocation();

  // Auto-open product if ?product=ID is in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    const id = Number(params.get("product"));
    if (id && products) {
      const found = products.find((p) => p.id === id);
      if (found) setSelected(found);
    }
  }, [location, products]);

  return (
    <div className="bg-background pb-4">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <h1 className="text-lg font-extrabold tracking-tight">Available loans</h1>
        <p className="text-xs text-muted-foreground">
          Pick a product, choose your amount and term, then apply.
        </p>
      </header>

      <main className="px-4 py-5 space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : (products ?? []).map((p) => (
              <button
                key={p.id}
                data-testid={`card-loan-product-${p.id}`}
                onClick={() => setSelected(p)}
                className="w-full text-left rounded-2xl bg-card border border-border/60 p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <LoanProductIcon name={p.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-sm">{p.name}</h3>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {p.interestRate}% / mo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">
                          {formatXAF(p.minAmount)}
                        </span>{" "}
                        – {formatXAF(p.maxAmount)}
                      </span>
                      <span>
                        {p.minTermMonths}–{p.maxTermMonths} months
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground self-center" />
                </div>
              </button>
            ))}
      </main>

      <ApplyDialog
        product={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function ApplyDialog({
  product,
  onClose,
}: {
  product: LoanProduct | null;
  onClose: () => void;
}) {
  const { mutateAsync, isPending } = useApplyLoan();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      const min = Number(product.minAmount);
      const max = Number(product.maxAmount);
      setAmount(Math.round((min + max) / 2));
      setTerm(product.minTermMonths);
      setPurpose("");
      setSuccess(false);
    }
  }, [product]);

  const summary = useMemo(() => {
    if (!product) return null;
    const rate = Number(product.interestRate);
    const fee = (amount * Number(product.processingFeePct)) / 100;
    const total = amount * (1 + (rate / 100) * term);
    const monthly = total / Math.max(1, term);
    return {
      monthly,
      total,
      fee,
      received: amount - fee,
    };
  }, [product, amount, term]);

  if (!product) return null;

  const min = Number(product.minAmount);
  const max = Number(product.maxAmount);

  const handleApply = async () => {
    try {
      await mutateAsync({
        productId: product.id,
        principal: amount,
        termMonths: term,
        purpose: purpose.trim() || `${product.name} application`,
      });
      setSuccess(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Application failed",
        description: err?.message ?? "Please try again",
      });
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center">Loan approved!</DialogTitle>
              <DialogDescription className="text-center">
                {formatXAF(amount)} has been credited toward your{" "}
                {product.name}. You can view it in My Loans.
              </DialogDescription>
            </DialogHeader>
            <Button
              data-testid="button-go-to-my-loans"
              className="w-full"
              onClick={() => {
                onClose();
                setLocation("/my-loans");
              }}
            >
              Go to My Loans
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-2 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold">Amount</label>
                  <span
                    data-testid="text-amount-display"
                    className="text-sm font-bold text-primary"
                  >
                    {formatXAF(amount)}
                  </span>
                </div>
                <Slider
                  data-testid="slider-amount"
                  min={min}
                  max={max}
                  step={Math.max(1000, Math.round((max - min) / 100))}
                  value={[amount]}
                  onValueChange={(v) => setAmount(v[0])}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{formatXAF(min)}</span>
                  <span>{formatXAF(max)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold">Term</label>
                  <span className="text-sm font-bold text-primary">
                    {term} {term === 1 ? "month" : "months"}
                  </span>
                </div>
                <Slider
                  data-testid="slider-term"
                  min={product.minTermMonths}
                  max={product.maxTermMonths}
                  step={1}
                  value={[term]}
                  onValueChange={(v) => setTerm(v[0])}
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Purpose</label>
                <Textarea
                  data-testid="input-purpose"
                  rows={2}
                  placeholder="What will you use this loan for?"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1"
                />
              </div>

              {summary && (
                <div className="rounded-xl bg-secondary/60 border border-border p-3 text-xs space-y-1.5">
                  <Row
                    label="Monthly payment"
                    value={formatXAF(summary.monthly)}
                    highlight
                  />
                  <Row
                    label="Total to repay"
                    value={formatXAF(summary.total)}
                  />
                  <Row
                    label="Processing fee"
                    value={formatXAF(summary.fee)}
                  />
                  <Row
                    label="You receive"
                    value={formatXAF(summary.received)}
                  />
                  <Row
                    label="Interest"
                    value={`${product.interestRate}% / month`}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="px-6 pb-6 pt-2">
              <Button
                data-testid="button-submit-application"
                onClick={handleApply}
                disabled={isPending || amount < min || amount > max}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Apply for {formatXAF(amount)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-semibold ${
          highlight ? "text-primary text-sm" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
