import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";

export type CredentialingStatus = "pending" | "in_progress" | "approved" | "expired" | "rejected";

export interface PayerEnrollment {
  payerName: string;
  payerId: string;
  status: "not_started" | "submitted" | "approved" | "rejected";
  submittedDate: string;
  approvedDate: string;
  notes: string;
}

export interface Credentialing {
  id?: string;
  companyId: string;
  providerId: string;
  providerName: string;
  npi: string;
  // License
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  // DEA
  deaNumber: string;
  deaExpiry: string;
  // Malpractice
  malpracticeInsurer: string;
  malpracticeExpiry: string;
  malpracticePolicyNumber: string;
  // Board Certification
  boardCertification: string;
  boardExpiry: string;
  // Payer Enrollments
  payers: PayerEnrollment[];
  // Overall Status
  status: CredentialingStatus;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COL = "credentialing";

export async function getCredentialings(companyId?: string): Promise<Credentialing[]> {
  const q = companyId
    ? query(collection(db, COL), where("companyId", "==", companyId), orderBy("createdAt", "desc"))
    : query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Credentialing));
}

export async function getCredentialing(id: string): Promise<Credentialing | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Credentialing) : null;
}

export async function getCredentialingByProvider(providerId: string): Promise<Credentialing | null> {
  const q = query(collection(db, COL), where("providerId", "==", providerId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Credentialing;
}

export async function addCredentialing(data: Omit<Credentialing, "id" | "createdAt" | "updatedAt">) {
  return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateCredentialing(id: string, data: Partial<Credentialing>) {
  return updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCredentialing(id: string) {
  return deleteDoc(doc(db, COL, id));
}

// Check expiry status
export function getExpiryStatus(dateStr: string): "expired" | "expiring_soon" | "valid" | "none" {
  if (!dateStr) return "none";
  const expiry = new Date(dateStr);
  const today  = new Date();
  const days   = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0)   return "expired";
  if (days <= 90) return "expiring_soon";
  return "valid";
}

export function daysUntilExpiry(dateStr: string): number {
  if (!dateStr) return 0;
  const expiry = new Date(dateStr);
  const today  = new Date();
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
