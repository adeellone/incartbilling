/**
 * Payer configuration types for InCart Billing.
 * 
 * Stores payer information needed for EDI claim submission and insurance verification.
 * Credentials and sensitive secrets are stored server-side only; frontend documents
 * contain only non-sensitive configuration data.
 */

export type PayerClaimType = "837P" | "837I" | "837D";

export interface PayerConfig {
  /** Unique payer configuration ID */
  id: string;
  /** Payer name (e.g. "Blue Cross Blue Shield") */
  name: string;
  /** Payer ID (ICN, BIN, or payer-specific identifier) */
  payerId: string;
  /** Supported claim types */
  claimTypes: PayerClaimType[];
  /** Clearinghouse provider name */
  clearinghouse: "eclipsys" | "availity" | "changehealthcare" | "zetlin" | "other";
  /** Environment: "sandbox" or "production" */
  environment: "sandbox" | "production";
  /** Whether this configuration is active */
  active: boolean;
  /** Sort order for UI display */
  sortOrder: number;
  /** Additional metadata */
  metadata?: {
    [key: string]: string;
  };
}

/** Default sandbox payer config for development/testing */
export const SANDBOX_PAYER_CONFIG: PayerConfig = {
  id: "sandbox-default",
  name: "Test Payer (Sandbox)",
  payerId: "TEST123",
  claimTypes: ["837P"],
  clearinghouse: "eclipsys",
  environment: "sandbox",
  active: true,
  sortOrder: 0,
  metadata: {
    description: "Development sandbox configuration - do not use for production submissions",
  },
};