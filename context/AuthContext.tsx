"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, createUserProfile, AppUser, UserRole } from "@/lib/firestore/users";

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  role: UserRole | null;
  companyId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isProvider: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const p = await getUserProfile(cred.user.uid);
    setProfile(p);
  };

  // Self-serve register — creates company_admin + company record
  const register = async (email: string, password: string, name: string, companyName: string) => {
    const { addCompany } = await import("@/lib/firestore/companies");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Create company
    const companyRef = await addCompany({
      name: companyName, email, phone: "", address: "",
      plan: "trial", ownerId: cred.user.uid, active: true,
    });

    // Create user profile
    await createUserProfile(cred.user.uid, {
      email, displayName: name,
      role: "company_admin",
      companyId: companyRef.id,
      active: true,
    });

    const p = await getUserProfile(cred.user.uid);
    setProfile(p);
    setUser({ ...cred.user });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null); setProfile(null);
  };

  const role      = profile?.role ?? null;
  const companyId = profile?.companyId ?? null;

  return (
    <AuthContext.Provider value={{
      user, profile, role, companyId, loading,
      login, register, logout,
      isSuperAdmin:  role === "superadmin",
      isCompanyAdmin: role === "company_admin",
      isProvider:    role === "provider",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
