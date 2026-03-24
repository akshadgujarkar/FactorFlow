import { useTransactions, useTreasuryState } from "@/lib/hooks";
import { EthDisplay } from "@/components/EthDisplay";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ETH_TO_INR } from "@/lib/currency";

const TransparencyPage = () => {
  const { data: transactions, isLoading } = useTransactions();
  const { data: treasury } = useTreasuryState();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div><h1 className="text-3xl font-display font-bold">Transparency Panel</h1></div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const inflow = transactions?.filter(t => t.type === "maintenance").reduce((s, t) => s + t.amount, 0) ?? 0;
  const outflow = transactions?.filter(t => t.type === "payment").reduce((s, t) => s + t.amount, 0) ?? 0;
  const netBalance = treasury?.balanceETH ?? inflow - outflow;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Transparency Panel</h1>
        <p className="text-muted-foreground mt-1">Activity logs from Firebase with contract-backed treasury totals.</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-lg mb-4">All Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium">Type</th>
                <th className="text-left py-3 font-medium">From</th>
                <th className="text-left py-3 font-medium">To</th>
                <th className="text-left py-3 font-medium">Amount</th>
                <th className="text-left py-3 font-medium">Date</th>
                <th className="text-left py-3 font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map(tx => (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${tx.type === "maintenance" ? "bg-neon-green/10 text-neon-green" : "bg-primary/10 text-primary"}`}>
                      {tx.type === "maintenance" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {tx.type === "maintenance" ? "Income" : "Payment"}
                    </span>
                  </td>
                  <td className="py-3">{tx.from}</td>
                  <td className="py-3">{tx.to}</td>
                  <td className="py-3"><EthDisplay eth={tx.amount} size="sm" /></td>
                  <td className="py-3 text-muted-foreground">{tx.date}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{tx.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">Fund Flow Summary</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-neon-green/5 border border-neon-green/20 text-center">
            <p className="text-xs text-muted-foreground">Total Inflow</p>
            <p className="text-xl font-display font-bold text-neon-green mt-1">{inflow.toFixed(2)} ETH</p>
            <p className="text-xs text-muted-foreground">Rs {(inflow * ETH_TO_INR).toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">Total Outflow</p>
            <p className="text-xl font-display font-bold text-primary mt-1">{outflow.toFixed(2)} ETH</p>
            <p className="text-xs text-muted-foreground">Rs {(outflow * ETH_TO_INR).toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20 text-center">
            <p className="text-xs text-muted-foreground">Treasury Balance</p>
            <p className="text-xl font-display font-bold text-secondary mt-1">{netBalance.toFixed(2)} ETH</p>
            <p className="text-xs text-muted-foreground">Rs {(netBalance * ETH_TO_INR).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPage;
