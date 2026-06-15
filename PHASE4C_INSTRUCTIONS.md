# Phase 4C — Claim Audit Trail / History

## What's New

- Every claim now has a `history` subcollection in Firestore
- Every status change logs: who changed it, from what, to what, when
- Every payment post logs: who posted, old amount, new amount, when
- Claim detail page now has two tabs: **Details** and **History**
- History tab shows a beautiful timeline with icons, diff colors, timestamps
- Export audit trail as CSV for compliance/disputes
- Real-time — new events appear instantly without refresh

---

## Files to ADD (new — don't exist yet)

```
lib/firestore/claimHistory.ts     ← subcollection CRUD + helpers
hooks/useClaimHistory.ts          ← real-time hook for history tab
```

## Files to REPLACE

```
app/(dashboard)/claims/[id]/page.tsx   ← adds History tab + audit logging
```

## Files NOT changed (keep as-is)

Everything else from Phase 4A and 4B stays unchanged.

---

## Firestore Structure

```
claims/{claimId}/history/{entryId}
  action:    "status_changed" | "payment_posted" | "field_edited" | ...
  label:     "Status changed from submitted to paid"
  oldValue:  "submitted"
  newValue:  "paid"
  field:     "status"
  userId:    "uid123"
  userName:  "Dr. Jane Smith"
  timestamp: Timestamp
```

No new Firestore indexes needed — subcollection ordered by timestamp works without composite index.

---

## No Firestore Rules Change Needed

The existing rules allow authenticated users to read/write claims.
Subcollections inherit the parent document rules automatically.

---

## How Audit Entries Are Created

| User Action | Audit Entry |
|---|---|
| Change claim status | `status_changed` — old status → new status |
| Post payment | `payment_posted` — old amount → new amount |

To add more audit points (e.g. on claim create), call:
```ts
import { addClaimHistory } from "@/lib/firestore/claimHistory";

await addClaimHistory(claimId, {
  action: "claim_created",
  label: "Claim created",
  userId: profile.uid,
  userName: profile.displayName,
});
```

---

## Testing

1. Open any claim → you see **Details** and **History** tabs
2. Change status → click History tab → see the event with old/new values
3. Post a payment → see payment event in timeline
4. Click **Export CSV** → downloads audit trail for compliance
