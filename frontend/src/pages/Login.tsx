import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hexagon, User, Shield, Wallet } from "lucide-react";
import { useEther } from "@/context/EtherContext";
import { toast } from "sonner";

const LoginPage = () => {
  const { login } = useAuth();
  const { connectWallet, walletAddress, isConnected } = useEther();
  const navigate = useNavigate();

  const handleLogin = (role: "resident" | "admin") => {
    if (!walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    login(role, walletAddress);
    navigate(role === "admin" ? "/admin/dashboard" : "/resident/dashboard");
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[100px]" />

      <div className="relative w-full max-w-md space-y-8 p-4">
        <div className="text-center space-y-3">
          <Hexagon className="h-16 w-16 text-primary mx-auto animate-pulse-glow rounded-full" />
          <h1 className="text-3xl font-display font-bold">DAO Treasury</h1>
          <p className="text-muted-foreground">Connect your wallet & select your role</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <Button
            variant="glass"
            size="lg"
            className="w-full justify-start gap-3 h-14"
            onClick={handleConnect}
          >
            <Wallet className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium">Connect MetaMask</p>
              <p className="text-xs text-muted-foreground">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not connected"}
              </p>
            </div>
            <span className="ml-auto text-xs text-neon-green">
              {isConnected ? "Connected" : "Connect"}
            </span>
          </Button>

          <div className="border-t border-border my-4" />

          <p className="text-sm text-muted-foreground text-center">Select your role</p>

          <div className="grid gap-3">
            <button
              onClick={() => handleLogin("resident")}
              className="glass-card-hover p-5 flex items-center gap-4 text-left group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold">Login as Resident</p>
                <p className="text-xs text-muted-foreground">View dashboard, pay maintenance, vote</p>
              </div>
            </button>

            <button
              onClick={() => handleLogin("admin")}
              className="glass-card-hover p-5 flex items-center gap-4 text-left group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="font-display font-semibold">Login as Admin</p>
                <p className="text-xs text-muted-foreground">Manage treasury, vendors, proposals</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
