import { TransactionList } from "@/components/TransactionList";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function History() {
  return (
    <div className="min-h-screen bg-background pb-24 px-4 pt-6">
      <header className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-display font-bold">Transaction History</h1>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-9 h-11 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary transition-all"
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border bg-card">
            <SlidersHorizontal className="w-4 h-4 text-foreground" />
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider text-[10px]">Recent</h3>
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
