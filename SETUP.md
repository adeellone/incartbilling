# Phase 3 — Setup Instructions

## Files to Replace in Your Project

```
components/layout/Sidebar.tsx          ← replace (adds Credentialing + Documents)
firestore.rules                         ← replace (adds credentialing + documents rules)
firestore.indexes.json                  ← replace (adds new indexes)
```

## New Files to Add

```
lib/firestore/credentialing.ts         → copy to your project
lib/firestore/documents.ts             → copy to your project
app/(dashboard)/credentialing/page.tsx → copy to your project
app/(dashboard)/credentialing/[id]/page.tsx → copy to your project
app/(dashboard)/documents/page.tsx     → copy to your project
storage.rules                          → paste into Firebase Console → Storage → Rules
```

---

## Firebase Storage Rules Setup

1. Go to Firebase Console → Storage → Rules tab
2. Replace all content with contents of `storage.rules`
3. Click Publish ✅

---

## Firebase Storage CORS (if needed)

If you get CORS errors on file upload, run this once:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only storage
```

---

## Firestore Rules Update

1. Firebase Console → Firestore → Rules tab
2. Replace with contents of `firestore.rules`
3. Click Publish ✅

---

## Firestore Indexes

Open browser console after first query — Firebase will print
a direct link to create each missing index automatically.
OR deploy indexes manually:

```bash
firebase deploy --only firestore:indexes
```

---

## What's Now Complete

```
✅ Phase 1 — Core billing (claims, patients, providers, payments, denials, reports)
✅ Phase 2 — Multi-tenant, roles, super admin, provider portal, team management
✅ Phase 3A — Credentialing module (NPI, license, DEA, malpractice, board cert)
✅ Phase 3B — Payer enrollment tracking (per provider, status tracking)
✅ Phase 3C — Document upload (Firebase Storage, progress bar, drag & drop)
✅ Phase 3D — Document expiry alerts (expired, expiring soon, valid)

❌ Phase 4 (needs paid APIs)
   — EDI 837 real claim submission (Change Healthcare account)
   — Insurance verification API (Availity account)
   — ERA auto-posting (clearinghouse account)
```

---

## New Sidebar Sections Added

Billing Staff and Company Admin now see:

```
CREDENTIALING
├── 📜 Credentialing   → /credentialing
└── 📄 Documents       → /documents
```

---

## Credentialing Features

- Add credentialing profile per provider
- Track: NPI, Medical License, DEA, Malpractice, Board Certification
- Expiry alerts: ✅ Valid / ⚠️ Expiring in 90 days / ⛔ Expired
- Payer enrollment tracking per provider
- Link to provider's uploaded documents

## Document Features

- Upload PDF, JPG, PNG (max 10MB)
- Drag & drop upload with progress bar
- Filter by: type, expiring, expired
- View document in browser
- Expiry date tracking with color alerts
- Stored in Firebase Storage

---

## Firestore Collections Added

```
credentialing/{id}
  companyId, providerId, providerName, npi
  licenseNumber, licenseState, licenseExpiry
  deaNumber, deaExpiry
  malpracticeInsurer, malpracticeExpiry, malpracticePolicyNumber
  boardCertification, boardExpiry
  payers: [{ payerName, status, submittedDate, approvedDate }]
  status, notes

documents/{id}
  companyId, providerId, providerName
  type, name, fileName, fileUrl, storagePath
  fileSize, expiryDate, status
  notes, uploadedAt
```
