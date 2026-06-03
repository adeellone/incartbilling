"use client";
// This file MUST stay separate from layout.tsx
// because it uses "use client" which blocks metadata export

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, createUserProfile, AppUser, UserRole } from "@/lib/firestore/users";
import { getPermissions, Permission } from "@/lib/permissions";

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  role: UserRole | null;
  companyId: string | null;
  permissions: Permission | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isProvider: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    const p = await getUserProfile(u.uid);
    setProfile(p);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(cred.user);
  };

  const register = async (email: string, password: string, name: string, companyName: string) => {
    const { addCompany } = await import("@/lib/firestore/companies");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const companyRef = await addCompany({
      name: companyName, email, phone: "", address: "",
      plan: "trial", ownerId: cred.user.uid, active: true,
    });
    await createUserProfile(cred.user.uid, {
      email, displayName: name,
      role: "company_admin",
      companyId: companyRef.id,
      active: true,
    });
    await loadProfile(cred.user);
    setUser({ ...cred.user });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const role        = profile?.role ?? null;
  const companyId   = profile?.companyId ?? null;
  const permissions = role ? getPermissions(role) : null;

  return (
    <AuthContext.Provider value={{
      user, profile, role, companyId, permissions, loading,
      login, register, logout, refreshProfile,
      isSuperAdmin:   role === "superadmin",
      isCompanyAdmin: role === "company_admin",
      isProvider:     role === "provider",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
