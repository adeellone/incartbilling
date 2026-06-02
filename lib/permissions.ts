import { UserRole } from "@/lib/firestore/users";

export interface Permission {
  canViewClaims: boolean;
  canEditClaims: boolean;
  canViewPatients: boolean;
  canEditPatients: boolean;
  canViewProviders: boolean;
  canEditProviders: boolean;
  canViewCredentialing: boolean;
  canEditCredentialing: boolean;
  canViewDocuments: boolean;
  canEditDocuments: boolean;
  canViewPayments: boolean;
  canEditPayments: boolean;
  canViewDenials: boolean;
  canEditDenials: boolean;
  canViewReports: boolean;
  canViewTeam: boolean;
  canEditTeam: boolean;
  canViewCompany: boolean;
  canViewAllCompanies: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  superadmin: {
    canViewClaims: true, canEditClaims: true,
    canViewPatients: true, canEditPatients: true,
    canViewProviders: true, canEditProviders: true,
    canViewCredentialing: true, canEditCredentialing: true,
    canViewDocuments: true, canEditDocuments: true,
    canViewPayments: true, canEditPayments: true,
    canViewDenials: true, canEditDenials: true,
    canViewReports: true,
    canViewTeam: true, canEditTeam: true,
    canViewCompany: true,
    canViewAllCompanies: true,
  },
  company_admin: {
    canViewClaims: true, canEditClaims: true,
    canViewPatients: true, canEditPatients: true,
    canViewProviders: true, canEditProviders: true,
    canViewCredentialing: true, canEditCredentialing: true,
    canViewDocuments: true, canEditDocuments: true,
    canViewPayments: true, canEditPayments: true,
    canViewDenials: true, canEditDenials: true,
    canViewReports: true,
    canViewTeam: true, canEditTeam: true,
    canViewCompany: true,
    canViewAllCompanies: false,
  },
  billing_staff: {
    canViewClaims: true, canEditClaims: true,
    canViewPatients: true, canEditPatients: true,
    canViewProviders: true, canEditProviders: true,
    canViewCredentialing: false, canEditCredentialing: false,
    canViewDocuments: false, canEditDocuments: false,
    canViewPayments: true, canEditPayments: true,
    canViewDenials: true, canEditDenials: true,
    canViewReports: true,
    canViewTeam: false, canEditTeam: false,
    canViewCompany: false,
    canViewAllCompanies: false,
  },
  provider: {
    canViewClaims: true, canEditClaims: false,
    canViewPatients: false, canEditPatients: false,
    canViewProviders: false, canEditProviders: false,
    canViewCredentialing: false, canEditCredentialing: false,
    canViewDocuments: false, canEditDocuments: false,
    canViewPayments: true, canEditPayments: false,
    canViewDenials: false, canEditDenials: false,
    canViewReports: false,
    canViewTeam: false, canEditTeam: false,
    canViewCompany: false,
    canViewAllCompanies: false,
  },
};

export function getPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.billing_staff;
}

// Custom permissions stored per user in Firestore (overrides role defaults)
export interface CustomPermissions extends Partial<Permission> {}
