import { StatCard } from "@/components/StatCard";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { useTreasuryState, useVotingHistory } from "@/lib/hooks";
import { Wallet, CreditCard, FileText, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ResidentDashboard = () => {
  const { data: treasury, isLoading } = useTreasuryState();
  const { data: votingHistory } = useVotingHistory();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Resident Dashboard</h1>
          <p className="text-muted-foreground mt-1">Connecting to blockchain...</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Resident Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Aarav Sharma • Flat A-101</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Wallet Balance" value="0.25 ETH" subtitle="₹50,000" icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Maintenance Due" value={`₹${treasury?.monthlyFeeINR.toLocaleString("en-IN")}`} subtitle={`${treasury?.monthlyFeeETH} ETH`} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title="Active Proposals" value="3" subtitle="2 pending your vote" icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Votes Cast" value={String(votingHistory?.length ?? 0)} subtitle="This quarter" icon={<History className="h-5 w-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg">Payment Status</h2>
          <div className="space-y-3">
            {["January", "February", "March"].map((month, i) => (
              <div key={month} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">{month} 2024</p>
                  <EthDisplay eth={treasury?.monthlyFeeETH ?? 0.01} size="sm" />
                </div>
                <StatusBadge status={i < 2 ? "paid" : "pending"} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">Voting History</h2>
            <span className="text-xs text-orange-400 font-mono">Firebase 🔥</span>
          </div>
          <div className="space-y-3">
            {votingHistory?.map((v) => (
              <div key={v.proposalId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.date}</p>
                </div>
                <span className={`text-sm font-medium ${v.vote === "for" ? "text-neon-green" : "text-destructive"}`}>
                  {v.vote === "for" ? "✓ For" : "✗ Against"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture indicator */}
      <div className="glass-card p-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> On-chain: Balance, dues, votes</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" /> Firebase: History, metadata, notifications</span>
      </div>
    </div>
  );
};

export default ResidentDashboard;
