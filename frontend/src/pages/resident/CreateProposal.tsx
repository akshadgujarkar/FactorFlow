import { useState } from "react";
import { useCreateProposal, domains } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";
import { ETH_TO_INR } from "@/lib/currency";

const CreateProposal = () => {
  const { wallet } = useAuth();
  const createProposal = useCreateProposal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [budget, setBudget] = useState("");
  const [recipient, setRecipient] = useState("");
  const showDuplicate = title.toLowerCase().includes("solar");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !budget) {
      toast.error("Title and budget are required");
      return;
    }

    if (!wallet) {
      toast.error("Connect wallet first");
      return;
    }

    await createProposal.mutateAsync({
      title,
      description,
      domain,
      budget: parseFloat(budget),
      recipient: recipient || "0x0000000000000000000000000000000000000000",
      deadline: Math.floor(Date.now() / 1000) + 86400 * 30,
      createdBy: wallet,
    });

    setTitle("");
    setDescription("");
    setDomain("");
    setBudget("");
    setRecipient("");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Create Proposal</h1>
        <p className="text-muted-foreground mt-1">
          Metadata in Firebase and core proposal values on-chain.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title <span className="text-xs text-orange-400">(Firebase)</span></label>
          <Input placeholder="Proposal title" value={title} onChange={e => setTitle(e.target.value)} className="bg-muted/50 border-border" />
          {showDuplicate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Similar proposal exists: "Install Solar Panels"
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Domain <span className="text-xs text-orange-400">(Firebase)</span></label>
          <select value={domain} onChange={e => setDomain(e.target.value)} className="w-full h-10 rounded-lg bg-muted/50 border border-border px-3 text-sm text-foreground">
            <option value="">Select domain</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description <span className="text-xs text-orange-400">(Firebase)</span></label>
          <Textarea placeholder="Detailed description stored off-chain..." value={description} onChange={e => setDescription(e.target.value)} className="bg-muted/50 border-border min-h-[120px]" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Budget (ETH) <span className="text-xs text-primary">(On-chain)</span></label>
          <Input type="number" step="0.0001" placeholder="0.00" value={budget} onChange={e => setBudget(e.target.value)} className="bg-muted/50 border-border" />
          {budget && <p className="text-xs text-muted-foreground">Rs {(parseFloat(budget) * ETH_TO_INR).toLocaleString("en-IN")}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Recipient Wallet <span className="text-xs text-primary">(On-chain)</span></label>
          <Input placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} className="bg-muted/50 border-border font-mono" />
        </div>

        <Button type="submit" variant="neon" size="lg" className="w-full" disabled={createProposal.isPending}>
          {createProposal.isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Submitting to blockchain...</>
          ) : (
            <><PlusCircle className="h-5 w-5" /> Submit Proposal</>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          This submits a contract transaction and stores off-chain metadata in Firebase.
        </p>
      </form>
    </div>
  );
};

export default CreateProposal;
