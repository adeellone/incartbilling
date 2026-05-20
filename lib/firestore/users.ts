import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where, orderBy, serverTimestamp, Timestamp, setDoc,
} from "firebase/firestore";

export type UserRole = "superadmin" | "company_admin" | "billing_staff" | "provider";

export interface AppUser {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;        // "incart" for superadmin
  providerClientId?: string; // only for provider role
  active: boolean;
  createdAt?: Timestamp;
}

const COL = "users";

export async function createUserProfile(uid: string, data: Omit<AppUser, "id" | "uid" | "createdAt">) {
  return setDoc(doc(db, COL, uid), {
    uid, ...data, createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, COL, uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null;
}

export async function getUsersByCompany(companyId: string): Promise<AppUser[]> {
  const q = query(collection(db, COL), where("companyId", "==", companyId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
}

export async function getAllUsers(): Promise<AppUser[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
}

export async function updateUserProfile(uid: string, data: Partial<AppUser>) {
  return updateDoc(doc(db, COL, uid), data);
}

export async function deleteUserProfile(uid: string) {
  return deleteDoc(doc(db, COL, uid));
}
