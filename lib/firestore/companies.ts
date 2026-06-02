import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query,
  serverTimestamp, Timestamp,
} from "firebase/firestore";

export type CompanyPlan = "trial" | "starter" | "professional" | "enterprise";

export interface Company {
  id?: string;
  name: string; email: string; phone: string; address: string;
  plan: CompanyPlan; ownerId: string; active: boolean;
  createdAt?: Timestamp;
}

const COL = "companies";

export async function getCompanies(): Promise<Company[]> {
  const snap = await getDocs(query(collection(db, COL)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
  return results.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function getCompany(id: string): Promise<Company | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Company) : null;
}

export async function addCompany(data: Omit<Company, "id" | "createdAt">) {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
}

export async function updateCompany(id: string, data: Partial<Company>) {
  return updateDoc(doc(db, COL, id), data);
}

export async function deleteCompany(id: string) {
  return deleteDoc(doc(db, COL, id));
}
