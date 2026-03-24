import { useState } from "react";
import { useVendors, useAddVendor, useDeleteVendor } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Plus, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const VendorsPage = () => {
  const { data: vendorList, isLoading } = useVendors();
  const addVendorMutation = useAddVendor();
  const deleteVendorMutation = useDeleteVendor();
  const [showAdd, setShowAdd] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: "", specialty: "", contact: "", wallet: "" });

  // Local state for optimistic UI when Firebase isn't configured
  const [localVendors, setLocalVendors] = useState<typeof vendorList>([]);
  const allVendors = [...(vendorList ?? []), ...(localVendors ?? [])];

  const handleAdd = () => {
    if (!newVendor.name) return;
    addVendorMutation.mutate({ ...newVendor, rating: 0, completedJobs: 0 });
    // Optimistic local add
    setLocalVendors(prev => [...(prev ?? []), { ...newVendor, id: String(Date.now()), rating: 0, completedJobs: 0 }]);
    setNewVendor({ name: "", specialty: "", contact: "", wallet: "" });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    deleteVendorMutation.mutate(id);
    setLocalVendors(prev => prev?.filter(v => v.id !== id));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div><h1 className="text-3xl font-display font-bold">Vendor Management</h1></div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Vendor Management</h1>
          <p className="text-muted-foreground mt-1">{allVendors.length} vendors • Stored in <span className="text-orange-400 text-xs font-mono">Firebase 🔥</span></p>
        </div>
        <Button variant="neon" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {showAdd && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-display font-semibold">New Vendor</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input placeholder="Vendor name" value={newVendor.name} onChange={e => setNewVendor(p => ({ ...p, name: e.target.value }))} className="bg-muted/50 border-border" />
            <Input placeholder="Specialty" value={newVendor.specialty} onChange={e => setNewVendor(p => ({ ...p, specialty: e.target.value }))} className="bg-muted/50 border-border" />
            <Input placeholder="Contact" value={newVendor.contact} onChange={e => setNewVendor(p => ({ ...p, contact: e.target.value }))} className="bg-muted/50 border-border" />
            <Input placeholder="Wallet address" value={newVendor.wallet} onChange={e => setNewVendor(p => ({ ...p, wallet: e.target.value }))} className="bg-muted/50 border-border" />
          </div>
          <Button onClick={handleAdd} variant="neon">Save Vendor</Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {allVendors.map(v => (
          <div key={v.id} className="glass-card-hover p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold">{v.name}</h3>
                <p className="text-sm text-muted-foreground">{v.specialty}</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> {v.rating}</span>
              <span>{v.completedJobs} jobs</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Contact: {v.contact}</p>
              <p className="font-mono">Wallet: {v.wallet}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorsPage;
