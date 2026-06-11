# Phase 4A — Real-Time Listeners

## What's In This Package

Every file here **replaces** its counterpart in your existing project.
All pages have been converted from manual `getDocs` fetches to
`onSnapshot` real-time listeners via the new `useCollection` hook.

---

## Files Included (replace in your project)

### NEW files (add these — they don't exist yet)
```
hooks/useCollection.ts          ← core real-time hook
hooks/useReady.ts               ← updated (replaces existing)
```

### REPLACE these files
```
app/(dashboard)/layout.tsx
app/(dashboard)/dashboard/page.tsx
app/(dashboard)/claims/page.tsx
app/(dashboard)/claims/new/page.tsx
app/(dashboard)/claims/[id]/page.tsx
app/(dashboard)/patients/page.tsx
app/(dashboard)/patients/[id]/page.tsx
app/(dashboard)/providers/page.tsx
app/(dashboard)/payments/page.tsx
app/(dashboard)/denials/page.tsx
app/(dashboard)/reports/page.tsx
app/(dashboard)/credentialing/page.tsx
app/(dashboard)/credentialing/[id]/page.tsx
app/(dashboard)/documents/page.tsx
app/(dashboard)/company/page.tsx
app/(dashboard)/team/page.tsx
app/(dashboard)/provider-portal/page.tsx
app/(dashboard)/provider-portal/claims/page.tsx
app/(dashboard)/provider-portal/payments/page.tsx
app/(superadmin)/layout.tsx
app/(superadmin)/admin/page.tsx
app/(superadmin)/admin/users/page.tsx
app/(superadmin)/admin/requests/page.tsx
```

---

## Files NOT included (keep your existing versions unchanged)
```
hooks/useCollection.ts          ← NEW (add it)
context/AuthContext.tsx         ← unchanged
lib/firebase.ts                 ← unchanged
lib/theme.ts                    ← unchanged
lib/permissions.ts              ← unchanged
lib/firestore/*.ts              ← ALL unchanged
app/layout.tsx                  ← unchanged
app/page.tsx                    ← unchanged
app/(auth)/login/page.tsx       ← unchanged
app/(auth)/register/page.tsx    ← unchanged
app/(auth)/contact/page.tsx     ← unchanged
components/layout/Sidebar.tsx   ← unchanged
firestore.rules                 ← unchanged
firestore.indexes.json          ← unchanged
storage.rules                   ← unchanged
package.json                    ← unchanged
tsconfig.json                   ← unchanged
next.config.ts                  ← unchanged
postcss.config.mjs              ← unchanged
```

---

## What Changed

- Every list page now uses `onSnapshot` instead of `getDocs`
- Add/delete operations no longer need a manual `load()` call — Firestore
  pushes the update automatically within ~100ms
- Every page shows a green **Live** dot indicator
- `useCollection` hook handles cleanup on unmount, prevents memory leaks
- `claims/[id]` and `patients/[id]` and `credentialing/[id]` detail pages
  now derive data from the live collection instead of one-time `getDoc`
- Dashboard stats update in real time when claims are added/changed
- Super admin pages show live counts across all companies

---

## How to Install

1. Copy `hooks/useCollection.ts` into your project (new file)
2. Replace `hooks/useReady.ts` with the new version
3. Replace all dashboard and superadmin pages listed above
4. Run `npm run dev` — no other changes needed
5. Firestore indexes already set up from Phase 3 — no new indexes required

---

## Testing Real-Time

1. Open the app in two browser tabs
2. In tab 1, go to /claims
3. In tab 2, create a new claim
4. Watch tab 1 update instantly without refresh ✅
