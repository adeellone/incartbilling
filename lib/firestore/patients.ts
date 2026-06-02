import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where,
  serverTimestamp, Timestamp,
} from "firebase/firestore";

export interface Insurance {
  planName: string; memberId: string; groupNumber: string; payer: string;
}

export interface Patient {
  id?: string;
  companyId: string;
  firstName: string; lastName: string; dob: string; gender: string;
  phone: string; email: string; address: string;
  insurance: Insurance;
  createdAt?: Timestamp;
}

const COL = "patients";

export async function getPatients(companyId?: string): Promise<Patient[]> {
  // No orderBy — avoids composite index requirement
  const q = companyId
    ? query(collection(db, COL), where("companyId", "==", companyId))
    : query(collection(db, COL));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
  // Sort client-side by createdAt descending
  return results.sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    return bTime - aTime;
  });
}

export async function getPatient(id: string): Promise<Patient | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Patient) : null;
}

export async function addPatient(data: Omit<Patient, "id" | "createdAt">) {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  return updateDoc(doc(db, COL, id), data);
}

export async function deletePatient(id: string) {
  return deleteDoc(doc(db, COL, id));
}
