import { useState } from "react";
import { useProposals, useVote, domains } from "@/lib/hooks";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, Filter, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Skeleton } from "@/components/ui/skeleton";

const ProposalsPage = () => {
  const { wallet } = useAuth();
  const { data: proposals, isLoading } = useProposals();
  const voteMutation = useVote();
  const [filter, setFilter] = useState("All");
  const [voted, setVoted] = useState<Record<number, "for" | "against">>({});

  const filtered = filter === "All" ? proposals : proposals?.filter(p => p.domain === filter);

  const handleVote = async (id: number, support: boolean) => {
    await voteMutation.mutateAsync({ proposalId: id, voter: wallet, support });
    setVoted(prev => ({ ...prev, [id]: support ? "for" : "against" }));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div><h1 className="text-3xl font-display font-bold">Proposals</h1></div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Proposals</h1>
          <p className="text-muted-foreground mt-1">{proposals?.length ?? 0} proposals • Votes recorded <span className="text-primary text-xs font-mono">on-chain ⛓</span></p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["All", ...domains].map(d => (
          <Button key={d} size="sm" variant={filter === d ? "default" : "ghost"} onClick={() => setFilter(d)}>
            {d}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered?.map(p => {
          const total = p.votesFor + p.votesAgainst;
          const pct = total > 0 ? Math.round((p.votesFor / total) * 100) : 0;
          return (
            <div key={p.id} className="glass-card-hover p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-lg">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <p className="text-xs text-muted-foreground">Proposed by {p.createdBy} • {p.createdAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <EthDisplay eth={p.amount} size="sm" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Approval: {pct}%</span>
                  <span>{total} / {p.totalVoters} voted</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>

              {p.status === "active" && !voted[p.id] && (
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => handleVote(p.id, true)}
                    disabled={voteMutation.isPending}
                    className="bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20"
                  >
                    {voteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />} Vote YES
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(p.id, false)}
                    disabled={voteMutation.isPending}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <ThumbsDown className="h-4 w-4" /> Vote NO
                  </Button>
                </div>
              )}
              {voted[p.id] && (
                <p className={`text-sm font-medium ${voted[p.id] === "for" ? "text-neon-green" : "text-destructive"}`}>
                  ✓ You voted {voted[p.id] === "for" ? "YES" : "NO"} — recorded on-chain
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProposalsPage;
