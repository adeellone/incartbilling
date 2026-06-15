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
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
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
  const {
    companyId,
    enabled = true,
    orderByField = "createdAt",
    orderByDirection = "desc",
    additionalConstraints = [],
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const constraints: QueryConstraint[] = [];
    if (companyId) {
      constraints.push(where("companyId", "==", companyId));
    }
    constraints.push(...additionalConstraints);

    const q: Query<DocumentData> = query(
      collection(db, collectionName),
      ...constraints
    );

    // FIXED: Added 'as unknown as T[]' to resolve TypeScript error
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as T[];

        results.sort((a, b) => {
          const aVal = (a as any)[orderByField];
          const bVal = (b as any)[orderByField];
          
          // Handle Firestore timestamps
          const aTime = aVal?.seconds ?? (typeof aVal === 'string' ? new Date(aVal).getTime() : aVal);
          const bTime = bVal?.seconds ?? (typeof bVal === 'string' ? new Date(bVal).getTime() : bVal);
          
          if (orderByDirection === "desc") {
            return bTime > aTime ? 1 : -1;
          } else {
            return aTime > bTime ? 1 : -1;
          }
        });

        setData(results);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[useCollection] ${collectionName} error:`, err.code, err.message);
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
  }, [collectionName, companyId, enabled, orderByField, orderByDirection, additionalConstraints]);

  return { data, loading, error };
}

export function useLiveStats<T extends DocumentData>(
  data: T[],
  statsFn: (items: T[]) => Record<string, number | string>
) {
  return statsFn(data);
}