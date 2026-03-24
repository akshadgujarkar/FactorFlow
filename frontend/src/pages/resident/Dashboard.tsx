import { StatCard } from "@/components/StatCard";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { useProposals, useResidents, useTreasuryState, useVotingHistory } from "@/lib/hooks";
import { Wallet, CreditCard, FileText, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/authContext";

const ResidentDashboard = () => {
  const { wallet } = useAuth();
  const { data: treasury, isLoading } = useTreasuryState();
  const { data: votingHistory } = useVotingHistory();
  const { data: proposals } = useProposals();
  const { data: residents } = useResidents();

  const resident = residents?.find(
    (r) => r.walletAddress.toLowerCase() === wallet.toLowerCase()
  );

  const activeProposals = proposals?.filter((p) => p.status === "active") ?? [];
  const pendingVoteCount = Math.max(0, activeProposals.length - (votingHistory?.length ?? 0));

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
        <p className="text-muted-foreground mt-1">
          Connected wallet: {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Not connected"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wallet"
          value={wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Not connected"}
          subtitle="Current signer"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Maintenance Due"
          value={`Rs ${(treasury?.monthlyFeeINR ?? 0).toLocaleString("en-IN")}`}
          subtitle={`${treasury?.monthlyFeeETH ?? 0} ETH`}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Active Proposals"
          value={String(activeProposals.length)}
          subtitle={`${pendingVoteCount} pending your vote`}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Votes Cast"
          value={String(votingHistory?.length ?? 0)}
          subtitle="Recorded in activity logs"
          icon={<History className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg">Current Payment Status</h2>
          <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
            <div>
              <p className="font-medium">Current Maintenance Cycle</p>
              <EthDisplay eth={treasury?.monthlyFeeETH ?? 0} size="sm" />
            </div>
            <StatusBadge status={resident?.status ?? "pending"} />
          </div>
          {resident?.paidDate && (
            <p className="text-xs text-muted-foreground">Last paid on {resident.paidDate}</p>
          )}
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg">Voting History</h2>
          <div className="space-y-3">
            {(votingHistory ?? []).length === 0 && (
              <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                No voting actions logged yet.
              </div>
            )}
            {(votingHistory ?? []).map((v) => (
              <div key={`${v.proposalId}-${v.date}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.date}</p>
                </div>
                <span className={`text-sm font-medium ${v.vote === "for" ? "text-neon-green" : "text-destructive"}`}>
                  {v.vote === "for" ? "For" : "Against"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> On-chain: Dues, proposal votes, treasury</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" /> Firebase: Metadata, history, notifications</span>
      </div>
    </div>
  );
};

export default ResidentDashboard;
