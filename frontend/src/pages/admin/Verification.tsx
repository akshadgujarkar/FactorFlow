import { useState } from "react";
import { useProposals, useVendors, useExecuteProposal, useTreasuryState } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle, Send, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const VerificationPage = () => {
  const { data: proposals, isLoading } = useProposals();
  const { data: vendors } = useVendors();
  const { data: treasury } = useTreasuryState();
  const executeProposal = useExecuteProposal();
  const [localCompleted, setLocalCompleted] = useState<Set<number>>(new Set());

  const verificationQueue = proposals?.filter((p) => p.status !== "pending") ?? [];

  const markComplete = async (id: number) => {
    await executeProposal.mutateAsync(id);
    setLocalCompleted(prev => new Set(prev).add(id));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div><h1 className="text-3xl font-display font-bold">Work Verification</h1></div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Work Verification</h1>
        <p className="text-muted-foreground mt-1">Execute proposals <span className="text-primary text-xs font-mono">on-chain ⛓</span> to release funds</p>
      </div>

      <div className="space-y-4">
        {verificationQueue.length === 0 && (
          <div className="glass-card p-6 text-sm text-muted-foreground">
            No proposals available for verification yet.
          </div>
        )}
        {verificationQueue.map(p => {
          const vendor =
            vendors?.find(v => v.id === p.vendorId) ||
            vendors?.find(v => v.wallet.toLowerCase() === p.recipient.toLowerCase());
          const isDone = localCompleted.has(p.id) || p.executed;
          const totalVotes = p.votesFor + p.votesAgainst;
          const unanimousYes = totalVotes > 0 && p.votesAgainst === 0;
          const deadlinePassed = p.status !== "active";
          const hasTreasuryFunds = (treasury?.balanceETH ?? 0) >= p.amount;
          const canExecute = !isDone && hasTreasuryFunds && (deadlinePassed || unanimousYes) && p.votesFor > p.votesAgainst;
          const votePct = totalVotes > 0 ? Math.round((p.votesFor / totalVotes) * 100) : 0;
          const disabledReason = !hasTreasuryFunds
            ? "Insufficient treasury funds"
            : !canExecute
            ? "Need deadline pass or unanimous YES votes"
            : "";
          return (
            <div key={p.id} className="glass-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold">{p.title}</h3>
                    <StatusBadge status={isDone ? "completed" : "active"} />
                  </div>
                  <p className="text-sm text-muted-foreground">Vendor: {vendor?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    Votes: {p.votesFor} yes / {p.votesAgainst} no ({votePct}% yes)
                  </p>
                </div>
                <EthDisplay eth={p.amount} size="sm" />
              </div>
              {!isDone ? (
                <div className="flex gap-3">
                  <Button
                    variant="neon"
                    onClick={() => markComplete(p.id)}
                    disabled={executeProposal.isPending || !canExecute}
                    title={disabledReason}
                  >
                    {executeProposal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Mark Complete & Release Funds
                  </Button>
                  <Button variant="outline">
                    <Send className="h-4 w-4" /> Request Update
                  </Button>
                </div>
              ) : (
                <p className="text-neon-green text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Work verified • Payment released on-chain
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerificationPage;
