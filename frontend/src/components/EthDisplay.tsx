import { formatETH, formatINR, ethToINR } from "@/lib/currency";

interface EthDisplayProps {
  eth: number;
  showINR?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const EthDisplay = ({ eth, showINR = true, className, size = "md" }: EthDisplayProps) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl font-bold font-display",
  };

  return (
    <span className={className}>
      <span className={sizeClasses[size]}>{formatETH(eth)}</span>
      {showINR && (
        <span className="text-muted-foreground text-xs ml-1">
          ({formatINR(ethToINR(eth))})
        </span>
      )}
    </span>
  );
};
