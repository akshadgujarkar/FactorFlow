import { Button } from "@/components/ui/button";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { usePayMaintenance, useResidents, useTransactions, useTreasuryState } from "@/lib/hooks";
import { formatINR, formatETH, ETH_TO_INR } from "@/lib/currency";
import { CreditCard, ArrowRightLeft, CheckCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";

const MaintenancePage = () => {
  const { wallet } = useAuth();
  const { data: treasury, isLoading } = useTreasuryState();
  const { data: residents } = useResidents();
  const { data: transactions } = useTransactions();
  const payMaintenance = usePayMaintenance();

  const resident = residents?.find(
    (r) => r.walletAddress.toLowerCase() === wallet.toLowerCase()
  );

  const monthlyDue = treasury?.monthlyFeeINR ?? 0;
  const monthlyDueETH = treasury?.monthlyFeeETH ?? 0;
  const lateFee = resident?.lateFee ?? 0;
  const maintenancePaid = resident?.status === "paid";
  const lateFeePaid = resident?.status !== "late";

  const handlePayMaintenance = async () => {
    if (!wallet) {
      toast.error("Wallet not connected");
      return;
    }
    await payMaintenance.mutateAsync(wallet);
  };

  const paymentHistory = (transactions ?? [])
    .filter((tx) => tx.type === "maintenance" && tx.from.toLowerCase() === wallet.toLowerCase())
    .map((tx) => ({
      month: tx.date,
      eth: tx.amount,
      hash: tx.hash,
      status: "paid" as const,
    }));

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
        <p className="text-muted-foreground mt-1">
          Monthly dues via smart contract and activity logs via Firebase.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Monthly Maintenance</h2>
              <p className="text-sm text-muted-foreground">Current cycle payable on-chain</p>
            </div>
          </div>

          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount (INR)</span>
              <span className="font-medium">{formatINR(monthlyDue)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <span>Conversion Rate: 1 ETH = Rs {ETH_TO_INR.toLocaleString("en-IN")}</span>
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

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Late Fee</h2>
              <p className="text-sm text-muted-foreground">Derived from on-chain payment status</p>
            </div>
          </div>

          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Late Fee (INR)</span>
              <span className="font-medium">{formatINR(lateFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Late Fee (ETH)</span>
              <span className="font-medium text-primary">{formatETH(lateFee / ETH_TO_INR)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={lateFeePaid ? "paid" : "late"} />
            <Button variant="destructive" disabled>
              {lateFeePaid ? <><CheckCircle className="h-4 w-4" /> Settled</> : "Included in pending dues"}
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Payment History</h2>
          <span className="text-xs text-muted-foreground">From Firebase activity logs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium">Date</th>
                <th className="text-left py-3 font-medium">Amount</th>
                <th className="text-left py-3 font-medium">Tx Hash</th>
                <th className="text-left py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No on-chain maintenance payments logged yet.
                  </td>
                </tr>
              )}
              {paymentHistory.map((payment) => (
                <tr key={`${payment.hash}-${payment.month}`} className="border-b border-border/50">
                  <td className="py-3">{payment.month}</td>
                  <td className="py-3"><EthDisplay eth={payment.eth} size="sm" /></td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{payment.hash}</td>
                  <td className="py-3"><StatusBadge status={payment.status} /></td>
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
