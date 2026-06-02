# Complete Fix — Replace Instructions

## REPLACE these files (copy over existing):

context/AuthContext.tsx
hooks/useReady.ts                          ← NEW file, add to project
lib/permissions.ts                         ← NEW file, add to project
lib/firestore/users.ts
firestore.rules
firestore.indexes.json
components/layout/Sidebar.tsx

app/(dashboard)/layout.tsx
app/(dashboard)/dashboard/page.tsx
app/(dashboard)/patients/page.tsx
app/(dashboard)/providers/page.tsx
app/(dashboard)/claims/page.tsx
app/(dashboard)/claims/new/page.tsx
app/(dashboard)/payments/page.tsx
app/(dashboard)/denials/page.tsx
app/(dashboard)/reports/page.tsx
app/(dashboard)/credentialing/page.tsx
app/(dashboard)/team/page.tsx
app/(dashboard)/company/page.tsx

app/(superadmin)/layout.tsx
app/(superadmin)/admin/page.tsx
app/(superadmin)/admin/users/page.tsx
app/(superadmin)/admin/requests/page.tsx

## What's Fixed

1. Provider/Patient/Claims list empty → useReady waits for companyId before fetching
2. Provider not showing in claims dropdown → fixed, waits for companyId
3. Credentialing shows providers → fixed with useReady
4. Company data isolation → companyId attached to all records
5. SuperAdmin sees ALL data → queryCompanyId=undefined for superadmin
6. Role-based sidebar → billing_staff sees no credentialing by default
7. Permission management → company admin can customize per-user permissions
8. Team member not saving session → secondary Firebase app fix

## Role Access Summary

| Module          | SuperAdmin | Company Admin | Billing Staff | Provider |
|----------------|-----------|---------------|---------------|----------|
| Dashboard       | ✅        | ✅            | ✅            | ✅ (own) |
| Claims          | ✅        | ✅            | ✅            | 👁 read  |
| Patients        | ✅        | ✅            | ✅            | ❌       |
| Providers       | ✅        | ✅            | ✅            | ❌       |
| Credentialing   | ✅        | ✅            | ❌ default    | ❌       |
| Documents       | ✅        | ✅            | ❌ default    | ❌       |
| Payments        | ✅        | ✅            | ✅            | 👁 read  |
| Denials         | ✅        | ✅            | ✅            | ❌       |
| Reports         | ✅        | ✅            | ✅            | ❌       |
| Team Mgmt       | ✅        | ✅            | ❌            | ❌       |
| All Companies   | ✅        | ❌            | ❌            | ❌       |

Billing staff credentialing access can be granted by company admin in /team → Permissions button.
