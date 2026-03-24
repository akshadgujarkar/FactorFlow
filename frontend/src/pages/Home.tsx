import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hexagon, Shield, Vote, Eye, ArrowRight, Blocks, Lock, Users } from "lucide-react";

const features = [
  { icon: Eye, title: "Transparent Fund Tracking", description: "Every transaction recorded on-chain for complete transparency" },
  { icon: Vote, title: "Democratic Voting", description: "Residents vote on proposals with verifiable on-chain ballots" },
  { icon: Shield, title: "Fraud Prevention", description: "Smart contracts ensure funds are used as approved" },
];

const HomePage = () => {
  const { isLoggedIn, role } = useAuth();
  const navigate = useNavigate();

  if (isLoggedIn) {
    navigate(role === "admin" ? "/admin/dashboard" : "/resident/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Hexagon className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-lg">DAO Treasury</span>
          </div>
          <Button variant="neon" onClick={() => navigate("/login")}>
            Launch App <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="container relative text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground">
            <Blocks className="h-4 w-4 text-primary" />
            Powered by Blockchain Technology
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            <span className="gradient-text">Decentralized</span>
            <br />
            Community Treasury
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparent. Secure. Community-Driven.
            <br />
            A DAO-powered housing society management system.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="neon" size="lg" onClick={() => navigate("/login")}>
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="glass" size="lg">
              <Lock className="h-5 w-5" /> Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Why <span className="gradient-text">DAO Treasury</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card-hover p-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Residents", value: "80+" },
              { label: "Treasury", value: "2.5 ETH" },
              { label: "Proposals", value: "24" },
              { label: "Transparency", value: "100%" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-display font-bold gradient-text">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-primary" />
            <span>DAO Treasury</span>
          </div>
          <p>Built for transparent community governance</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
