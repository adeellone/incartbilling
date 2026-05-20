# Incart Billing — Setup Guide

## ─── STEP 1: Install Dependencies ───────────────────

```bash
npm install firebase
npm run dev
```

---

## ─── STEP 2: Setup .env.local ───────────────────────

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy_YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> Get these from: console.firebase.google.com
> → Your Project → Settings ⚙️ → Your Apps → Web App Config

---

## ─── STEP 3: Enable Firebase Auth ───────────────────

1. Go to console.firebase.google.com
2. Select your project
3. Left sidebar → Build → Authentication
4. Click "Get started"
5. Sign-in method tab → Click "Email/Password"
6. Toggle ENABLE → Save ✅

> ⚠️ THIS IS THE #1 REASON REGISTRATION FAILS
> If Email/Password is not enabled, you get "operation-not-allowed" error

---

## ─── STEP 4: Create Firestore Database ──────────────

Firestore is NoSQL — NO schema needed!
Collections are created automatically when you first save data.

1. Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Select "Production mode"
4. Choose region: us-central1
5. Click "Enable" ✅

### Database structure (auto-created on first use):

```
Firestore
├── patients/          ← created when you add first patient
│   └── {id}
│       ├── firstName, lastName, dob, gender
│       ├── phone, email, address
│       └── insurance: { planName, memberId, groupNumber, payer }
│
├── providers/         ← created when you add first provider
│   └── {id}
│       ├── firstName, lastName, npi, specialty
│       ├── email, phone, taxId
│       └── payers: []
│
├── claims/            ← created when you add first claim
│   └── {id}
│       ├── patientId, patientName
│       ├── providerId, providerName
│       ├── serviceDate, status
│       ├── diagnosisCodes: []
│       ├── procedureCodes: []
│       ├── totalCharge, paidAmount
│       └── notes, createdAt, updatedAt
│
└── payments/          ← future use
```

---

## ─── STEP 5: Set Firestore Rules ────────────────────

1. Firebase Console → Firestore → Rules tab
2. Replace existing rules with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish" ✅

---

## ─── STEP 6: Enable Firebase Storage ────────────────

1. Firebase Console → Build → Storage
2. Click "Get started"
3. Select "Production mode"
4. Same region as Firestore
5. Click "Done" ✅

---

## ─── STEP 7: Run Locally ────────────────────────────

```bash
npm run dev
```

Open: http://localhost:3000

Pages:
- /             → Landing page
- /register     → Create account
- /login        → Sign in
- /dashboard    → Main dashboard (requires login)
- /patients     → Patient management
- /claims       → Claims list
- /claims/new   → New claim form
- /providers    → Providers list

---

## ─── COMMON ERRORS & FIXES ──────────────────────────

| Error | Fix |
|-------|-----|
| "operation-not-allowed" | Enable Email/Password in Firebase Auth |
| "api-key-not-valid" | Check .env.local keys are correct |
| "network-request-failed" | Check internet connection |
| "permission-denied" | Update Firestore Rules (Step 5) |
| White screen on dashboard | You're not logged in, go to /login first |
| .env.local not working | Restart dev server after editing .env.local |

---

## ─── DEPLOY TO NETLIFY ───────────────────────────────

```bash
# 1. Push to GitHub
git add .
git commit -m "Phase 1 complete"
git push

# 2. Netlify Dashboard
#    → New Site → Import from GitHub → Select repo
#    → Build command: npm run build
#    → Publish dir: .next
#    → Add all NEXT_PUBLIC_FIREBASE_ env vars
#    → Deploy ✅
```

---

## ─── FILE STRUCTURE ─────────────────────────────────

```
app/
├── page.tsx                    Landing page
├── layout.tsx                  Root layout
├── (auth)/
│   ├── login/page.tsx          Login
│   └── register/page.tsx       Register
└── (dashboard)/
    ├── layout.tsx              Auth guard + sidebar
    ├── dashboard/page.tsx      Dashboard home
    ├── patients/page.tsx       Patients list
    ├── patients/[id]/page.tsx  Patient detail
    ├── claims/page.tsx         Claims list
    ├── claims/new/page.tsx     New claim
    ├── claims/[id]/page.tsx    Claim detail
    └── providers/page.tsx      Providers

components/layout/Sidebar.tsx   Navigation
context/AuthContext.tsx         Firebase Auth
lib/
├── firebase.ts                 Firebase init
├── theme.ts                    Shared CSS
└── firestore/
    ├── patients.ts             CRUD helpers
    ├── claims.ts               CRUD helpers
    └── providers.ts            CRUD helpers
```

---

Built with ❤️ by Incart Software
