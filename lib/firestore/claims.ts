import { db } from "@/lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where,
  serverTimestamp, Timestamp,
} from "firebase/firestore";

export type ClaimStatus = "draft" | "submitted" | "paid" | "denied" | "pending";
export interface ClaimCode { code: string; description: string; units: number; charge: number; }

export interface ClaimSubmission {
  /** Unique submission reference (e.g. clearinghouse tracking ID) */
  submissionRef?: string;
  /** Submission attempt number, starting at 1 */
  attempt: number;
  /** Scheduled/actual submission timestamp */
  submittedAt?: Timestamp;
  /** Clearinghouse or provider identifier */
  providerId?: string;
  /** Submission status pipeline */
  submissionStatus: "draft" | "ready" | "generated" | "submitted" | "accepted" | "rejected" | "acknowledgment_pending";
  /** Validation result from last check */
  lastValidation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  /** EDI 837 file generated (base64 or blob storage reference) */
  ediFile?: {
    name: string;
    size: number;
    generatedAt: Timestamp;
    /** Base64-encoded content for download */
    contentBase64?: string;
  };
  /** Payer-specific configuration used for this submission */
  payerConfigId?: string;
}

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
  /** Extended submission metadata */
  submission: ClaimSubmission;
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
  const submission: ClaimSubmission = {
    attempt: 1,
    submissionStatus: "draft",
  };
  return addDoc(collection(db, COL), {
    ...data,
    submission,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateClaim(id: string, data: Partial<Claim>) {
  const claimRef = doc(db, COL, id);
  const snap = await getDoc(claimRef);
  const existing = snap.exists() ? snap.data() as Claim : { submission: { attempt: 1, submissionStatus: "draft" } } as Claim;

  // Merge submission: keep existing attempt, only update status if explicitly provided
  const submission = data.submission
    ? { ...existing.submission, ...data.submission, attempt: existing.submission.attempt + (data.submission.attempt ? 0 : 0) }
    : existing.submission;

  return updateDoc(claimRef, {
    ...data,
    submission,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClaim(id: string) {
  return deleteDoc(doc(db, COL, id));
}
