import { useProposals, useVendors } from "@/lib/hooks";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const AdminProposals = () => {
  const { data: proposals, isLoading } = useProposals();
  const { data: vendors } = useVendors();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Proposal Management</h1>
        </div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Proposal Management</h1>
        <p className="text-muted-foreground mt-1">Votes from <span className="text-primary text-xs font-mono">blockchain ⛓</span> • Metadata from <span className="text-orange-400 text-xs font-mono">Firebase 🔥</span></p>
      </div>

      <div className="space-y-4">
        {proposals?.map(p => {
          const pct = p.votesFor + p.votesAgainst > 0 ? Math.round((p.votesFor / (p.votesFor + p.votesAgainst)) * 100) : 0;
          const vendor = vendors?.find(v => v.id === p.vendorId);
          return (
            <div key={p.id} className="glass-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold">{p.title}</h3>
                    <StatusBadge status={p.status} />
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p.domain}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
                <EthDisplay eth={p.amount} size="sm" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Votes: {p.votesFor} for / {p.votesAgainst} against</span>
                  <span>{pct}% approval</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                Vendor: {vendor ? <span className="text-foreground">{vendor.name}</span> : <span className="text-yellow-400">Not assigned</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProposals;
