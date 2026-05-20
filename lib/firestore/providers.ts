import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";

export interface Provider {
  id?: string;
  firstName: string;
  lastName: string;
  npi: string;
  specialty: string;
  email: string;
  phone: string;
  taxId: string;
  payers: string[];
  createdAt?: Timestamp;
}

const COL = "providers";

export async function getProviders(): Promise<Provider[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Provider));
}

export async function getProvider(id: string): Promise<Provider | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Provider) : null;
}

export async function addProvider(data: Omit<Provider, "id" | "createdAt">) {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
}

export async function updateProvider(id: string, data: Partial<Provider>) {
  return updateDoc(doc(db, COL, id), data);
}

export async function deleteProvider(id: string) {
  return deleteDoc(doc(db, COL, id));
}
