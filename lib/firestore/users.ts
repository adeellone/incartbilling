import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where,
  serverTimestamp, Timestamp, setDoc,
} from "firebase/firestore";
import { CustomPermissions } from "@/lib/permissions";

export type UserRole = "superadmin" | "company_admin" | "billing_staff" | "provider";

export interface AppUser {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  providerClientId?: string;
  customPermissions?: CustomPermissions;
  active: boolean;
  createdAt?: Timestamp;
}

const COL = "users";

export async function createUserProfile(uid: string, data: Omit<AppUser, "id" | "uid" | "createdAt">) {
  return setDoc(doc(db, COL, uid), { uid, ...data, createdAt: serverTimestamp() });
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, COL, uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null;
}

export async function getUsersByCompany(companyId: string): Promise<AppUser[]> {
  const q = query(collection(db, COL), where("companyId", "==", companyId));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
  return results.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, COL)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
  return results.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function updateUserProfile(uid: string, data: Partial<AppUser>) {
  return updateDoc(doc(db, COL, uid), data);
}

export async function deleteUserProfile(uid: string) {
  return deleteDoc(doc(db, COL, uid));
}
