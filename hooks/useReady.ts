"use client";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns auth state synchronously — no useState delay.
 * ready = true when auth + profile both loaded.
 */
export function useReady() {
  const { user, profile, loading } = useAuth();

  // Synchronous — no useEffect, no state delay
  const ready = !loading && !!user && !!profile;
  const isSuperAdmin = profile?.role === "superadmin";

  // SuperAdmin sees all data (no companyId filter)
  const queryCompanyId = isSuperAdmin
    ? undefined
    : profile?.companyId ?? undefined;

  return {
    ready,
    companyId: profile?.companyId,
    queryCompanyId,
    isSuperAdmin,
    profile,
  };
}
