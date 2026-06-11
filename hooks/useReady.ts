"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns { ready, companyId, isSuperAdmin, queryCompanyId }
 * ready = true only when auth + profile are fully loaded.
 * Use this in every dashboard page before fetching or subscribing.
 */
export function useReady() {
  const { user, profile, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) setReady(true);
    else if (!loading && !user) setReady(false);
  }, [loading, user, profile]);

  const isSuperAdmin = profile?.role === "superadmin";

  // SuperAdmin queries without companyId filter (sees all data)
  // Others query with their companyId
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
