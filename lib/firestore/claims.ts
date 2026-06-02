import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where,
  serverTimestamp, Timestamp,
} from "firebase/firestore";

export type ClaimStatus = "draft" | "submitted" | "paid" | "denied" | "pending";
export interface ClaimCode { code: string; description: string; units: number; charge: number; }

export interface Claim {
  id?: string;
  companyId: string;
  patientId: string; patientName: string;
  providerId: string; providerName: string;
  serviceDate: string; status: ClaimStatus;
  diagnosisCodes: string[];
  procedureCodes: ClaimCode[];
  totalCharge: number; paidAmount: number;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COL = "claims";

export async function getClaims(companyId?: string): Promise<Claim[]> {
  const q = companyId
    ? query(collection(db, COL), where("companyId", "==", companyId))
    : query(collection(db, COL));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Claim));
  return results.sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    return bTime - aTime;
  });
}

export async function getClaim(id: string): Promise<Claim | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Claim) : null;
}

export async function addClaim(data: Omit<Claim, "id" | "createdAt" | "updatedAt">) {
  return addDoc(collection(db, COL), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function updateClaim(id: string, data: Partial<Claim>) {
  return updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteClaim(id: string) {
  return deleteDoc(doc(db, COL, id));
}
