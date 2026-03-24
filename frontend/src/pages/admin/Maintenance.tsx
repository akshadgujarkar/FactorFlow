import { useResidents, useTransactions, useTreasuryState } from "@/lib/hooks";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR } from "@/lib/currency";
import { ETH_TO_INR } from "@/lib/currency";
import { Users, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

const AdminMaintenance = () => {
  const { data: residents, isLoading } = useResidents();
  const { data: treasury } = useTreasuryState();
  const { data: transactions } = useTransactions();

  const paid = residents?.filter(r => r.status === "paid") ?? [];
  const totalCollected =
    transactions?.filter((t) => t.type === "maintenance").reduce((sum, tx) => sum + tx.amount, 0) ??
    paid.reduce((sum, r) => sum + r.maintenanceDue / ETH_TO_INR, 0);
  const defaulters = residents?.filter(r => r.status === "late") ?? [];
  const monthlyDueEth = treasury?.monthlyFeeETH ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Maintenance Management</h1>
          <p className="text-muted-foreground mt-1">Loading payment statuses from blockchain...</p>
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Maintenance Management</h1>
        <p className="text-muted-foreground mt-1">Payment statuses from <span className="text-primary text-xs font-mono">blockchain ⛓</span> • User data from <span className="text-orange-400 text-xs font-mono">Firebase 🔥</span></p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={`${totalCollected.toFixed(2)} ETH`} subtitle={formatINR(totalCollected * ETH_TO_INR)} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Paid Residents" value={`${paid.length} / ${residents?.length ?? 0}`} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Defaulters" value={`${defaulters.length}`} subtitle="With late fees" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-lg mb-4">All Residents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium">Resident</th>
                <th className="text-left py-3 font-medium">Flat</th>
                <th className="text-left py-3 font-medium">Wallet</th>
                <th className="text-left py-3 font-medium">Due</th>
                <th className="text-left py-3 font-medium">Late Fee</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-left py-3 font-medium">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {residents?.map(r => (
                <tr key={r.walletAddress} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-3 font-medium">{r.name}</td>
                  <td className="py-3">{r.flatNumber}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{r.walletAddress}</td>
                  <td className="py-3"><EthDisplay eth={monthlyDueEth} size="sm" /></td>
                  <td className="py-3">{r.lateFee > 0 ? <span className="text-destructive">{formatINR(r.lateFee)}</span> : "—"}</td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                  <td className="py-3 text-muted-foreground">{r.paidDate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMaintenance;
