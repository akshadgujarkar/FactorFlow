import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "paid" | "pending" | "late" | "active" | "completed";
  className?: string;
}

const statusConfig = {
  paid: { label: "Paid", className: "bg-neon-green/10 text-neon-green border-neon-green/30" },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  late: { label: "Late", className: "bg-destructive/10 text-destructive border-destructive/30" },
  active: { label: "Active", className: "bg-primary/10 text-primary border-primary/30" },
  completed: { label: "Completed", className: "bg-neon-green/10 text-neon-green border-neon-green/30" },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
