import { useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { EthDisplay } from "@/components/EthDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { useAnalytics, useResidents, useProposals } from "@/lib/hooks";
import { Wallet, Users, FileText, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatINR } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: residents } = useResidents();
  const { data: proposals } = useProposals();

  const pendingCount = residents?.filter(r => r.status !== "paid").length ?? 0;
  const totalCollected = (residents?.filter(r => r.status === "paid").length ?? 0) * 0.01;
  const activeProposals = proposals?.filter(p => p.status === "active").length ?? 0;
  const completedProposals = proposals?.filter(p => p.status === "completed").length ?? 0;

  if (analyticsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading from blockchain...</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Treasury overview • <span className="text-primary text-xs font-mono">On-chain ⛓</span> + <span className="text-orange-400 text-xs font-mono">Firebase 🔥</span></p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Treasury Balance" value={`${analytics?.treasuryBalance.toFixed(2)} ETH`} subtitle={formatINR(analytics?.treasuryBalanceINR ?? 0)} icon={<Wallet className="h-5 w-5" />} trend={{ value: "+12%", positive: true }} />
        <StatCard title="Total Residents" value={`${residents?.length ?? 0}`} subtitle="Active members" icon={<Users className="h-5 w-5" />} />
        <StatCard title="Funds Collected" value={`${totalCollected.toFixed(2)} ETH`} subtitle={formatINR(totalCollected * 200000)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Pending Payments" value={`${pendingCount}`} subtitle="Residents overdue" icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Active Proposals" value={`${activeProposals}`} subtitle="Awaiting votes" icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Completed Works" value={`${completedProposals}`} subtitle="This quarter" icon={<CheckCircle className="h-5 w-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">Monthly Fund Collection</h2>
            <span className="text-xs text-orange-400 font-mono">Firebase cached 🔥</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics?.monthlyCollection ?? []}>
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(225, 15%, 10%)", border: "1px solid hsl(225, 15%, 20%)", borderRadius: "8px", color: "hsl(210, 40%, 95%)" }} />
              <Bar dataKey="collected" fill="hsl(200, 100%, 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="hsl(225, 15%, 20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">Spending by Domain</h2>
            <span className="text-xs text-orange-400 font-mono">Firebase cached 🔥</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={analytics?.spendingByDomain ?? []} dataKey="amount" nameKey="domain" cx="50%" cy="50%" outerRadius={90} strokeWidth={0} label={({ domain, amount }) => `${domain}: ${amount} ETH`}>
                {(analytics?.spendingByDomain ?? []).map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(225, 15%, 10%)", border: "1px solid hsl(225, 15%, 20%)", borderRadius: "8px", color: "hsl(210, 40%, 95%)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data source indicator */}
      <div className="glass-card p-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> On-chain: Treasury balance, payment statuses, votes</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" /> Firebase: Analytics cache, charts, user metadata</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
