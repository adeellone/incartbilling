"use client";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
  Query,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseCollectionOptions {
  companyId?: string;
  enabled?: boolean;
  additionalConstraints?: QueryConstraint[];
}

interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useCollection<T extends DocumentData>(
  collectionName: string,
  options: UseCollectionOptions = {}
): UseCollectionResult<T> {
  const { companyId, enabled = true, additionalConstraints = [] } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to always have latest unsub
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cleanup previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Don't subscribe until auth is ready
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build constraints
    const constraints: QueryConstraint[] = [];
    if (companyId) {
      constraints.push(where("companyId", "==", companyId));
    }
    constraints.push(...additionalConstraints);

    // Simple query — NO orderBy to avoid composite index requirement
    const q: Query<DocumentData> = query(
      collection(db, collectionName),
      ...constraints
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        // Sort client-side by createdAt descending
        results.sort((a, b) => {
          const aT =
            (a as { createdAt?: { seconds?: number } }).createdAt?.seconds ?? 0;
          const bT =
            (b as { createdAt?: { seconds?: number } }).createdAt?.seconds ?? 0;
          return bT - aT;
        });

        setData(results);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(
          `[useCollection] ${collectionName} error:`,
          err.code,
          err.message
        );
        setError(err.message);
        setLoading(false);
        setData([]);
      }
    );

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  // enabled and companyId MUST be in deps so hook re-runs when auth loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, companyId, enabled]);

  return { data, loading, error };
}

export function useLiveStats<T extends DocumentData>(
  data: T[],
  statsFn: (items: T[]) => Record<string, number | string>
) {
  return statsFn(data);
}
