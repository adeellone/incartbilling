import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType =
  | "claim_status"
  | "denial_logged"
  | "payment_posted"
  | "credential_expiring"
  | "credential_expired"
  | "document_expiring"
  | "document_expired"
  | "team_member_added";

export interface AppNotification {
  id?: string;
  companyId: string;
  userId?: string; // if targeted to specific user, else all in company
  type: NotificationType;
  title: string;
  message: string;
  link?: string; // e.g. /claims/abc123
  read: boolean;
  createdAt?: Timestamp;
}

const COL = "notifications";

// ── Create a notification ────────────────────────────────────────────────────
export async function createNotification(
  data: Omit<AppNotification, "id" | "createdAt" | "read">
) {
  return addDoc(collection(db, COL), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ── Mark one as read ─────────────────────────────────────────────────────────
export async function markNotificationRead(id: string) {
  return updateDoc(doc(db, COL, id), { read: true });
}

// ── Mark ALL unread as read for a company ────────────────────────────────────
export async function markAllNotificationsRead(companyId: string) {
  const q = query(
    collection(db, COL),
    where("companyId", "==", companyId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  return batch.commit();
}

// ── Real-time listener (last 30, newest first) ───────────────────────────────
export function subscribeNotifications(
  companyId: string,
  callback: (notifications: AppNotification[]) => void
) {
  const q = query(
    collection(db, COL),
    where("companyId", "==", companyId),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AppNotification[];
    callback(results);
  });
}

// ── Notification factory helpers ─────────────────────────────────────────────
export const notify = {
  claimStatusChanged: (
    companyId: string,
    patientName: string,
    status: string,
    claimId: string
  ) =>
    createNotification({
      companyId,
      type: "claim_status",
      title: "Claim Status Updated",
      message: `${patientName}'s claim is now ${status}`,
      link: `/claims/${claimId}`,
    }),

  denialLogged: (
    companyId: string,
    patientName: string,
    reasonCode: string,
    denialId: string
  ) =>
    createNotification({
      companyId,
      type: "denial_logged",
      title: "Denial Logged",
      message: `Denial for ${patientName} — Code: ${reasonCode}`,
      link: `/denials`,
    }),

  paymentPosted: (
    companyId: string,
    patientName: string,
    amount: number,
    claimId: string
  ) =>
    createNotification({
      companyId,
      type: "payment_posted",
      title: "Payment Posted",
      message: `$${amount.toFixed(2)} posted for ${patientName}`,
      link: `/payments`,
    }),

  credentialExpiring: (
    companyId: string,
    providerName: string,
    field: string,
    daysLeft: number,
    credId: string
  ) =>
    createNotification({
      companyId,
      type: daysLeft < 0 ? "credential_expired" : "credential_expiring",
      title: daysLeft < 0 ? "Credential Expired" : "Credential Expiring Soon",
      message:
        daysLeft < 0
          ? `${providerName}'s ${field} has expired`
          : `${providerName}'s ${field} expires in ${daysLeft} days`,
      link: `/credentialing/${credId}`,
    }),

  documentExpiring: (
    companyId: string,
    docName: string,
    providerName: string,
    daysLeft: number
  ) =>
    createNotification({
      companyId,
      type: daysLeft < 0 ? "document_expired" : "document_expiring",
      title: daysLeft < 0 ? "Document Expired" : "Document Expiring Soon",
      message:
        daysLeft < 0
          ? `${docName} for ${providerName} has expired`
          : `${docName} for ${providerName} expires in ${daysLeft} days`,
      link: `/documents`,
    }),

  teamMemberAdded: (companyId: string, memberName: string) =>
    createNotification({
      companyId,
      type: "team_member_added",
      title: "Team Member Added",
      message: `${memberName} joined your team`,
      link: `/team`,
    }),
};
