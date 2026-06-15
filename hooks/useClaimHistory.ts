"use client";
import { useEffect, useState } from "react";
import {
  ClaimHistoryEntry,
  subscribeClaimHistory,
} from "@/lib/firestore/claimHistory";

export function useClaimHistory(claimId: string | undefined) {
  const [history, setHistory]   = useState<ClaimHistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!claimId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeClaimHistory(claimId, (entries) => {
      setHistory(entries);
      setLoading(false);
    });

    return () => unsub();
  }, [claimId]);

  return { history, loading };
}
