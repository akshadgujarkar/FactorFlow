import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { useTreasuryState, usePayMaintenance } from "@/lib/hooks";
import { formatINR, formatETH, ETH_TO_INR } from "@/lib/mockData";
import { CreditCard, ArrowRightLeft, CheckCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/authContext";

const MaintenancePage = () => {
  const { wallet } = useAuth();
  const { data: treasury, isLoading } = useTreasuryState();
  const payMaintenance = usePayMaintenance();
  const [maintenancePaid, setMaintenancePaid] = useState(false);
  const [lateFeePaid, setLateFeePaid] = useState(false);

  const monthlyDue = treasury?.monthlyFeeINR ?? 2000;
  const monthlyDueETH = treasury?.monthlyFeeETH ?? 0.01;
  const lateFee = 500;

  const handlePayMaintenance = async () => {
    await payMaintenance.mutateAsync(wallet);
    setMaintenancePaid(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Pay Maintenance</h1>
          <p className="text-muted-foreground mt-1">Fetching from blockchain...</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Pay Maintenance</h1>
        <p className="text-muted-foreground mt-1">March 2024 dues • Payment via <span className="text-primary text-xs font-mono">smart contract ⛓</span></p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Maintenance */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Monthly Maintenance</h2>
              <p className="text-sm text-muted-foreground">Due: March 31, 2024</p>
            </div>
          </div>

          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount (₹)</span>
              <span className="font-medium">{formatINR(monthlyDue)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <span>Conversion Rate: 1 ETH = ₹{ETH_TO_INR.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount (ETH)</span>
              <span className="font-medium text-primary">{formatETH(monthlyDueETH)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-medium">Total</span>
              <EthDisplay eth={monthlyDueETH} size="md" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={maintenancePaid ? "paid" : "pending"} />
            <Button
              variant="neon"
              disabled={maintenancePaid || payMaintenance.isPending}
              onClick={handlePayMaintenance}
            >
              {payMaintenance.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : maintenancePaid ? (
                <><CheckCircle className="h-4 w-4" /> Paid</>
              ) : (
                "Pay Maintenance"
              )}
            </Button>
          </div>
        </div>

        {/* Late Fee */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Late Fee</h2>
              <p className="text-sm text-muted-foreground">Penalty calculated <span className="text-primary text-xs font-mono">on-chain ⛓</span></p>
            </div>
          </div>

          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Late Fee (₹)</span>
              <span className="font-medium">{formatINR(lateFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Late Fee (ETH)</span>
              <span className="font-medium text-primary">{formatETH(lateFee / ETH_TO_INR)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={lateFeePaid ? "paid" : "late"} />
            <Button
              variant="destructive"
              disabled={lateFeePaid}
              onClick={() => setLateFeePaid(true)}
            >
              {lateFeePaid ? <><CheckCircle className="h-4 w-4" /> Paid</> : "Pay Late Fee"}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Payment History</h2>
          <span className="text-xs text-muted-foreground">Tx hashes verified <span className="text-primary font-mono">on-chain ⛓</span></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium">Month</th>
                <th className="text-left py-3 font-medium">Amount</th>
                <th className="text-left py-3 font-medium">Tx Hash</th>
                <th className="text-left py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { month: "Jan 2024", eth: 0.01, hash: "0xabc...123", status: "paid" as const },
                { month: "Feb 2024", eth: 0.01, hash: "0xdef...456", status: "paid" as const },
                { month: "Mar 2024", eth: 0.01, hash: maintenancePaid ? "0x" + Math.random().toString(16).slice(2, 8) + "..." : "—", status: (maintenancePaid ? "paid" : "pending") as "paid" | "pending" },
              ].map((p) => (
                <tr key={p.month} className="border-b border-border/50">
                  <td className="py-3">{p.month}</td>
                  <td className="py-3"><EthDisplay eth={p.eth} size="sm" /></td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{p.hash}</td>
                  <td className="py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
