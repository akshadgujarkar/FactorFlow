import { useAuth } from "@/lib/authContext";
import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, CreditCard, FileText, PlusCircle, Bell,
  Users, Store, CheckCircle, BarChart3, LogOut, Hexagon, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEther } from "@/context/EtherContext";

const residentLinks = [
  { to: "/resident/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/resident/maintenance", icon: CreditCard, label: "Pay Maintenance" },
  { to: "/resident/proposals", icon: FileText, label: "Proposals" },
  { to: "/resident/create-proposal", icon: PlusCircle, label: "Create Proposal" },
  { to: "/resident/notifications", icon: Bell, label: "Notifications" },
];

const adminLinks = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/maintenance", icon: CreditCard, label: "Maintenance" },
  { to: "/admin/proposals", icon: FileText, label: "Proposals" },
  { to: "/admin/vendors", icon: Store, label: "Vendors" },
  { to: "/admin/verification", icon: CheckCircle, label: "Verification" },
  { to: "/admin/transparency", icon: BarChart3, label: "Transparency" },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, wallet, logout } = useAuth();
  const { disconnectWallet } = useEther();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const links = role === "admin" ? adminLinks : residentLinks;

  const handleLogout = () => {
    logout();
    disconnectWallet();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <Hexagon className="h-8 w-8 text-primary shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-foreground text-sm">DAO Treasury</h1>
              <p className="text-xs text-muted-foreground capitalize">{role} Panel</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                collapsed && "justify-center px-2"
              )}
              activeClassName="bg-sidebar-accent text-primary font-medium"
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          {!collapsed && (
            <div className="glass-card p-3 text-xs">
              <p className="text-muted-foreground">Connected Wallet</p>
              <p className="text-foreground font-mono mt-1">{wallet}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className={cn("w-full text-muted-foreground", collapsed && "px-2")}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Disconnect</span>}
          </Button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        collapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
