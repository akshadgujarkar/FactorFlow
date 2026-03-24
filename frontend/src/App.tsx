import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { AppLayout } from "@/components/AppLayout";
import { initEventSync } from "@/lib/eventSync";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Resident
import ResidentDashboard from "./pages/resident/Dashboard";
import ResidentMaintenance from "./pages/resident/Maintenance";
import ResidentProposals from "./pages/resident/Proposals";
import CreateProposal from "./pages/resident/CreateProposal";
import Notifications from "./pages/resident/Notifications";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMaintenance from "./pages/admin/Maintenance";
import AdminProposals from "./pages/admin/Proposals";
import Vendors from "./pages/admin/Vendors";
import Verification from "./pages/admin/Verification";
import Transparency from "./pages/admin/Transparency";

const queryClient = new QueryClient();

const ProtectedRoute = ({ role, children }: { role: "resident" | "admin"; children: React.ReactNode }) => {
  const { isLoggedIn, role: userRole } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (userRole !== role) return <Navigate to="/" />;
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />

    <Route path="/resident/dashboard" element={<ProtectedRoute role="resident"><ResidentDashboard /></ProtectedRoute>} />
    <Route path="/resident/maintenance" element={<ProtectedRoute role="resident"><ResidentMaintenance /></ProtectedRoute>} />
    <Route path="/resident/proposals" element={<ProtectedRoute role="resident"><ResidentProposals /></ProtectedRoute>} />
    <Route path="/resident/create-proposal" element={<ProtectedRoute role="resident"><CreateProposal /></ProtectedRoute>} />
    <Route path="/resident/notifications" element={<ProtectedRoute role="resident"><Notifications /></ProtectedRoute>} />

    <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/maintenance" element={<ProtectedRoute role="admin"><AdminMaintenance /></ProtectedRoute>} />
    <Route path="/admin/proposals" element={<ProtectedRoute role="admin"><AdminProposals /></ProtectedRoute>} />
    <Route path="/admin/vendors" element={<ProtectedRoute role="admin"><Vendors /></ProtectedRoute>} />
    <Route path="/admin/verification" element={<ProtectedRoute role="admin"><Verification /></ProtectedRoute>} />
    <Route path="/admin/transparency" element={<ProtectedRoute role="admin"><Transparency /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  useEffect(() => {
    const cleanup = initEventSync();
    console.log("[App] Event sync initialized — bridging blockchain → Firebase");
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
