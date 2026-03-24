import React, { createContext, useContext, useState, ReactNode } from "react";

type Role = "resident" | "admin" | null;

interface AuthContextType {
  role: Role;
  wallet: string;
  isLoggedIn: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  wallet: "",
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(null);
  const wallet = "0x1a2b...3c4d";

  const login = (r: Role) => setRole(r);
  const logout = () => setRole(null);

  return (
    <AuthContext.Provider value={{ role, wallet, isLoggedIn: !!role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
