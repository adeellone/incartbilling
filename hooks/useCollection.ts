"use client";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  QueryConstraint,
  DocumentData,
  Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseCollectionOptions {
  companyId?: string;
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
  additionalConstraints?: QueryConstraint[];
}

interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Real-time Firestore collection hook using onSnapshot.
 * Automatically filters by companyId when provided.
 * Cleans up the listener on unmount.
 */
export function useCollection<T extends DocumentData>(
  collectionName: string,
  options: UseCollectionOptions = {}
): UseCollectionResult<T> {
  const {
    companyId,
    orderByField = "createdAt",
    orderByDirection = "desc",
    additionalConstraints = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the previous companyId to avoid re-subscribing unnecessarily
  const prevCompanyId = useRef<string | undefined>(undefined);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Don't re-subscribe if companyId hasn't changed
    if (prevCompanyId.current === companyId && unsubRef.current) return;
    prevCompanyId.current = companyId;

    // Clean up previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setLoading(true);
    setError(null);

    const constraints: QueryConstraint[] = [];

    if (companyId) {
      constraints.push(where("companyId", "==", companyId));
    }

    constraints.push(...additionalConstraints);

    // Try with orderBy first; fall back gracefully if index is missing
    let q: Query<DocumentData>;
    try {
      q = query(
        collection(db, collectionName),
        ...constraints,
        orderBy(orderByField, orderByDirection)
      );
    } catch {
      q = query(collection(db, collectionName), ...constraints);
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        // Client-side sort as fallback when orderBy index isn't available
        results.sort((a: T, b: T) => {
          const aTime = (a as { createdAt?: { seconds?: number } }).createdAt?.seconds ?? 0;
          const bTime = (b as { createdAt?: { seconds?: number } }).createdAt?.seconds ?? 0;
          return orderByDirection === "desc" ? bTime - aTime : aTime - bTime;
        });

        setData(results);
        setLoading(false);
      },
      (err) => {
        console.error(`useCollection error [${collectionName}]:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      unsub();
      unsubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, companyId]);

  return { data, loading, error };
}

/**
 * Real-time hook for a specific document field that acts as a counter/aggregate.
 * Re-derives stats from the live collection data.
 */
export function useLiveStats<T extends DocumentData>(
  data: T[],
  statsFn: (items: T[]) => Record<string, number | string>
) {
  return statsFn(data);
}
