import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AuditAction =
  | "claim_created"
  | "status_changed"
  | "payment_posted"
  | "field_edited"
  | "code_added"
  | "code_removed"
  | "note_updated"
  | "viewed";

export interface ClaimHistoryEntry {
  id?: string;
  action: AuditAction;
  label: string;          // human-readable summary e.g. "Status changed to Paid"
  oldValue?: string;      // e.g. "submitted"
  newValue?: string;      // e.g. "paid"
  field?: string;         // which field changed e.g. "status", "paidAmount"
  userId: string;
  userName: string;
  timestamp?: Timestamp;
}

const historyCol = (claimId: string) =>
  collection(db, "claims", claimId, "history");

// ── Append a history entry ────────────────────────────────────────────────────
export async function addClaimHistory(
  claimId: string,
  entry: Omit<ClaimHistoryEntry, "id" | "timestamp">
) {
  return addDoc(historyCol(claimId), {
    ...entry,
    timestamp: serverTimestamp(),
  });
}

// ── Real-time listener on the subcollection ───────────────────────────────────
export function subscribeClaimHistory(
  claimId: string,
  callback: (entries: ClaimHistoryEntry[]) => void
) {
  const q = query(historyCol(claimId), orderBy("timestamp", "asc"));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ClaimHistoryEntry[];
    callback(entries);
  });
}

// ── Action icon + colour helpers ─────────────────────────────────────────────
export const ACTION_META: Record<
  AuditAction,
  { icon: string; color: string; bg: string }
> = {
  claim_created:  { icon: "✨", color: "var(--cyan)",   bg: "rgba(0,212,255,0.12)"   },
  status_changed: { icon: "🔄", color: "var(--blue2)",  bg: "rgba(61,142,255,0.12)"  },
  payment_posted: { icon: "💰", color: "var(--green)",  bg: "rgba(0,212,138,0.12)"   },
  field_edited:   { icon: "✏️", color: "var(--muted)",  bg: "rgba(138,156,192,0.12)" },
  code_added:     { icon: "➕", color: "var(--green)",  bg: "rgba(0,212,138,0.12)"   },
  code_removed:   { icon: "➖", color: "var(--red)",    bg: "rgba(255,77,106,0.12)"  },
  note_updated:   { icon: "📝", color: "var(--yellow)", bg: "rgba(255,184,0,0.12)"   },
  viewed:         { icon: "👁",  color: "var(--muted)",  bg: "rgba(138,156,192,0.08)" },
};

// ── Format timestamp ──────────────────────────────────────────────────────────
export function formatHistoryTime(ts?: Timestamp): string {
  if (!ts?.seconds) return "";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
