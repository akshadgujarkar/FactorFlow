import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useEther } from "@/context/EtherContext";

type Role = "resident" | "admin" | null;

interface AuthContextType {
  role: Role;
  wallet: string;
  isLoggedIn: boolean;
  login: (role: Role, wallet: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  wallet: "",
  isLoggedIn: false,
  login: () => undefined,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { walletAddress, isHydrated } = useEther();
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("ff_role");
    return saved === "admin" || saved === "resident" ? saved : null;
  });
  const [wallet, setWallet] = useState(() => localStorage.getItem("ff_wallet") || "");

  const login = (r: Role, nextWallet: string) => {
    setRole(r);
    setWallet(nextWallet);
    if (r) localStorage.setItem("ff_role", r);
    localStorage.setItem("ff_wallet", nextWallet);
  };

  const logout = () => {
    setRole(null);
    setWallet("");
    localStorage.removeItem("ff_role");
    localStorage.removeItem("ff_wallet");
  };

  useEffect(() => {
    if (!wallet) return;
    localStorage.setItem("ff_wallet", wallet);
  }, [wallet]);

  useEffect(() => {
    if (!role) {
      localStorage.removeItem("ff_role");
      return;
    }
    localStorage.setItem("ff_role", role);
  }, [role]);

  useEffect(() => {
    if (!isHydrated || !role) return;

    if (!walletAddress) {
      logout();
      return;
    }

    if (wallet && walletAddress.toLowerCase() !== wallet.toLowerCase()) {
      logout();
      return;
    }

    if (!wallet) {
      setWallet(walletAddress);
    }
  }, [isHydrated, role, wallet, walletAddress]);

  return (
    <AuthContext.Provider value={{ role, wallet, isLoggedIn: !!role && !!wallet, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
