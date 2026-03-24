import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export const StatCard = ({ title, value, subtitle, icon, trend, className }: StatCardProps) => (
  <div className={cn("glass-card-hover p-6 space-y-3", className)}>
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-2xl font-bold font-display">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {trend && (
      <p className={cn("text-xs", trend.positive ? "text-neon-green" : "text-destructive")}>
        {trend.positive ? "↑" : "↓"} {trend.value}
      </p>
    )}
  </div>
);
