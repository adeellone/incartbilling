# Incart Billing — Complete Platform Documentation

## 1. What Is Incart Billing?

Incart Billing is a multi-tenant medical billing SaaS platform with two business models:

**Model A — Billing Service**
You (Incart) provide billing services directly to providers/clinics. Your team logs in and handles all billing on behalf of doctors.

**Model B — White-Label SaaS**
Other medical billing companies license your platform, bring their own clients (providers), and their team uses Incart as their billing software under their own brand.

---

## 2. User Roles

| Role | Who | What They Can Do |
|------|-----|-----------------|
| `superadmin` | Incart owner/team | See ALL companies, ALL data, manage plans |
| `company_admin` | Billing company owner | Manage their team, their providers, all billing |
| `billing_staff` | PK/India billing team | Create claims, patients, payments, denials |
| `provider` | Doctor/Clinic | Read-only view of their own claims and revenue |

---

## 3. Login Flow

```
Landing Page (incartbilling.com)
│
├── "Request Demo" → /contact
│   └── Fills form → saved to Firestore → Super Admin sees in /admin/requests
│   └── Super admin contacts them → manually creates their company account
│
└── "Start Free Trial" → /register
    └── Fills name + company + email + password
    └── Auto-creates: Company record + company_admin user profile
    └── Redirects to /dashboard
```

After login, users are redirected based on role:
- `superadmin` → /admin
- `company_admin` / `billing_staff` → /dashboard
- `provider` → /provider-portal

---

## 4. Portal Structure

### Super Admin Portal (/admin)
- View all companies on the platform
- Add / suspend companies
- Change plan (trial → professional etc.)
- See all users across all companies
- Manage demo requests (leads)

### Company Admin Portal (/dashboard + /company + /team)
- Full billing dashboard
- Manage team members (invite staff, providers)
- Company settings (name, email, plan info)
- All billing features same as billing staff

### Billing Staff Portal (/dashboard)
- Create and manage claims
- Add patients and providers
- Post payments
- Log and manage denials
- View reports

### Provider Portal (/provider-portal)
- Read-only dashboard with their stats
- View their claims and statuses
- View payments collected for them
- Cannot edit anything — billing team manages all

---

## 5. Multi-Tenant Architecture

Every record in Firestore contains a `companyId` field.
This ensures companies only see their own data.

```
Firestore Collections
├── companies/{companyId}       — one per billing company
├── users/{uid}                 — one per user, has companyId + role
├── patients/{id}               — has companyId
├── claims/{id}                 — has companyId
├── providers/{id}              — has companyId
├── payments/{id}               — has companyId
├── denials/{id}                — has companyId
└── demo_requests/{id}          — no companyId (public leads)
```

Super admin queries without companyId filter — sees everything.
All other roles query with `where("companyId", "==", companyId)`.

---

## 6. How Billing Works (Step by Step)

```
1. Billing staff adds patient (demographics + insurance)
2. Billing staff adds provider (NPI + specialty + payers)
3. Patient visits doctor → service rendered
4. Billing staff creates claim:
   - Links patient + provider
   - Enters service date
   - Adds ICD-10 diagnosis codes
   - Adds CPT procedure codes
   - System calculates total charge
5. Claim status: Draft → Submitted
6. Claim goes to insurance company (manually or via EDI)
7. Insurance pays (ERA) or denies
8. If paid: billing staff posts payment → status: Paid
9. If denied: billing staff logs denial → files appeal
10. Provider logs in → sees their dashboard updated
```

---

## 7. What Medicare, BCBS, Aetna Are

These are **payers** — insurance companies that pay claims on behalf of patients.

| Payer | Type | Notes |
|-------|------|-------|
| Medicare | Government | For patients 65+ |
| Medicaid | Government | For low-income patients |
| Blue Cross Blue Shield (BCBS) | Private | Largest private network |
| Aetna | Private | Owned by CVS |
| Cigna | Private | Large employer coverage |
| UnitedHealth | Private | Largest US insurer |

Providers must **enroll** (credential) with each payer to receive payments from them.
This takes 60–120 days and is handled by the credentialing module (Phase 3).

---

## 8. File Structure

```
app/
├── page.tsx                          Landing page (marketing)
├── layout.tsx                        Root layout + AuthProvider
│
├── (auth)/
│   ├── login/page.tsx                Login
│   ├── register/page.tsx             Self-serve signup (creates company)
│   └── contact/page.tsx             Request demo form
│
├── (superadmin)/
│   ├── layout.tsx                    Superadmin auth guard
│   └── admin/
│       ├── page.tsx                  All companies
│       ├── users/page.tsx            All users
│       └── requests/page.tsx        Demo requests
│
└── (dashboard)/
    ├── layout.tsx                    Auth guard + role redirect
    ├── dashboard/page.tsx            Main dashboard
    ├── patients/page.tsx             Patients list
    ├── patients/[id]/page.tsx        Patient detail
    ├── claims/page.tsx               Claims list
    ├── claims/new/page.tsx           New claim form
    ├── claims/[id]/page.tsx          Claim detail
    ├── providers/page.tsx            Providers list
    ├── payments/page.tsx             Payments
    ├── denials/page.tsx              Denials
    ├── reports/page.tsx              Reports
    ├── team/page.tsx                 Team management
    ├── company/page.tsx              Company settings
    └── provider-portal/
        ├── page.tsx                  Provider dashboard (read-only)
        ├── claims/page.tsx           Provider claims view
        └── payments/page.tsx        Provider payments view

context/AuthContext.tsx               Auth + role + companyId
lib/
├── firebase.ts                       Firebase init
├── theme.ts                          Shared CSS design system
└── firestore/
    ├── companies.ts                  Companies CRUD
    ├── users.ts                      Users + roles CRUD
    ├── patients.ts                   Patients CRUD
    ├── claims.ts                     Claims CRUD
    └── providers.ts                  Providers CRUD

firestore.rules                       Multi-tenant security rules
firestore.indexes.json               Required indexes
```

---

## 9. Setup Super Admin Account

After deploying, manually set your account as superadmin:

1. Register normally at /register
2. Go to Firebase Console → Firestore → users collection
3. Find your user document
4. Change `role` from `company_admin` to `superadmin`
5. Change `companyId` to `incart`
6. Log out and log back in → you'll see /admin

---

## 10. Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 11. Phase Roadmap

| Phase | Status | Features |
|-------|--------|---------|
| Phase 1 | ✅ Done | Core billing, claims, patients, providers, payments, denials, reports |
| Phase 2 | ✅ Done | Multi-tenant, roles, super admin, provider portal, team management, contact form |
| Phase 3 | 🔜 Next | Insurance verification API, credentialing module, EDI submission, document upload |
| Phase 4 | 🔜 Future | White-label custom domains, subscription billing, mobile app, AI coding assist |
