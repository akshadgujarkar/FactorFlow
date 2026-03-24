import React, { createContext, useContext, useState, ReactNode } from "react";

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
  const [role, setRole] = useState<Role>(null);
  const [wallet, setWallet] = useState("");

  const login = (r: Role, nextWallet: string) => {
    setRole(r);
    setWallet(nextWallet);
  };

  const logout = () => {
    setRole(null);
    setWallet("");
  };

  return (
    <AuthContext.Provider value={{ role, wallet, isLoggedIn: !!role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
