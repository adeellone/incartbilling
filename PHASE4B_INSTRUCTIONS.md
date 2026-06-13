# Phase 4B — Notifications System

## What's New

- 🔔 Bell icon in sidebar with live unread count badge
- Notification drawer slides out next to sidebar (last 30 notifications)
- Full notifications page at /notifications
- Auto-triggers on: claim status change, payment posted, denial logged, team member added
- Mark individual or all notifications as read
- Real-time updates via onSnapshot

---

## Files to ADD (new — don't exist yet)

```
lib/firestore/notifications.ts     ← notification CRUD + factory helpers
hooks/useNotifications.ts          ← real-time hook for bell icon
app/(dashboard)/notifications/page.tsx  ← full notifications list page
```

## Files to REPLACE (changed)

```
components/layout/Sidebar.tsx      ← adds bell icon + notification drawer
app/(dashboard)/claims/[id]/page.tsx   ← notifies on status change + payment
app/(dashboard)/payments/page.tsx  ← notifies on payment posted
app/(dashboard)/denials/page.tsx   ← notifies on denial logged
app/(dashboard)/team/page.tsx      ← notifies on team member added
firestore.rules                    ← adds notifications collection rules
```

## Files NOT changed (keep as-is from Phase 4A)

```
hooks/useCollection.ts
hooks/useReady.ts
context/AuthContext.tsx
lib/firebase.ts
lib/theme.ts
lib/permissions.ts
lib/firestore/*.ts (all except new notifications.ts)
app/(dashboard)/dashboard/page.tsx
app/(dashboard)/claims/page.tsx
app/(dashboard)/claims/new/page.tsx
app/(dashboard)/patients/*.tsx
app/(dashboard)/providers/page.tsx
app/(dashboard)/reports/page.tsx
app/(dashboard)/credentialing/*.tsx
app/(dashboard)/documents/page.tsx
app/(dashboard)/company/page.tsx
app/(dashboard)/provider-portal/*.tsx
app/(superadmin)/**
app/layout.tsx
app/page.tsx
app/(auth)/**
firestore.indexes.json
storage.rules
package.json
tsconfig.json
next.config.ts
postcss.config.mjs
```

---

## Firestore Rules

After replacing `firestore.rules`:
1. Go to Firebase Console → Firestore → Rules
2. Paste the new rules
3. Click Publish ✅

---

## How Notifications Trigger

| Action | Notification |
|--------|-------------|
| Claim status changed | "Claim Status Updated — Patient X is now paid" |
| Payment posted | "Payment Posted — $250.00 posted for Patient X" |
| Denial logged | "Denial Logged — Denial for Patient X — Code: CO-4" |
| Team member added | "Team Member Added — John joined your team" |

---

## Testing

1. Open the app — bell icon appears in sidebar bottom
2. Create a claim, change its status → bell shows 1 unread
3. Click bell → drawer slides open showing the notification
4. Click notification → navigates to the claim
5. Mark as read → unread count drops
