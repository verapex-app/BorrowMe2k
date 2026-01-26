import { TransactionList } from "@/components/TransactionList";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function History() {
  return (
    <div className="bg-background px-4 py-5">
      <header className="mb-5 space-y-3">
        <h1 className="text-xl font-bold">Transaction History</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              data-testid="input-search"
              placeholder="Search transactions..." 
              className="pl-9 h-10 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary"
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/50 bg-card">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Recent</h3>
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
