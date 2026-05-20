import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, where, serverTimestamp, Timestamp,
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
  const q = companyId
    ? query(collection(db, COL), where("companyId", "==", companyId), orderBy("createdAt", "desc"))
    : query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
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