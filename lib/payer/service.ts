/**
 * Payer configuration service for InCart Billing.
 * 
 * Handles CRUD operations for payer configurations stored in Firestore.
 * Sensitive credentials are managed server-side only; this service works with
 * non-sensitive configuration data that can be safely read by authorized users.
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PayerConfig, PayerClaimType, SANDBOX_PAYER_CONFIG } from "@/lib/payer/types";

const COL = "payerConfigs";

/**
 * Fetch all payer configurations for a company (or all if superadmin).
 * 
 * @param companyId - Optional companyId filter. If omitted, returns all configs.
 * @returns Array of PayerConfig objects
 */
export async function fetchPayerConfigs(companyId?: string): Promise<PayerConfig[]> {
  let configs: PayerConfig[] = [];

  if (companyId) {
    const q = query(collection(db, COL), where("companyId", "==", companyId));
    const snap = await getDocs(q);
    configs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayerConfig));
  } else {
    // Superadmin: fetch all configs
    const snap = await getDocs(collection(db, COL));
    configs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayerConfig));
  }

  // Ensure sandbox config is always included at the top
  if (!configs.some((c) => c.id === SANDBOX_PAYER_CONFIG.id)) {
    configs.unshift(SANDBOX_PAYER_CONFIG);
  }

  // Sort by sortOrder, then alphabetically by name
  configs.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });

  return configs;
}

/**
 * Fetch a single payer configuration by ID.
 * 
 * @param id - Payer configuration document ID
 * @returns PayerConfig or null if not found
 */
export async function fetchPayerConfig(id: string): Promise<PayerConfig | null> {
  const docRef = doc(db, COL, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as PayerConfig;
  }
  return null;
}

/**
 * Create a new payer configuration.
 * 
 * @param data - Payer configuration data (without id, it will be generated)
 * @returns Created PayerConfig with ID
 */
export async function createPayerConfig(
  data: Omit<PayerConfig, "id">
): Promise<PayerConfig> {
  const id = `payer-${Date.now()}-${Math.floor(1000 + Math.random() * 8999)}`;
  const dataWithId = { ...data, id } as PayerConfig;

  await addDoc(collection(db, COL), dataWithId);
  return dataWithId;
}

/**
 * Update an existing payer configuration.
 * 
 * @param id - Payer configuration document ID
 * @param data - Partial PayerConfig data to update
 * @returns Updated PayerConfig
 */
export async function updatePayerConfig(
  id: string,
  data: Partial<Omit<PayerConfig, "id">>
): Promise<PayerConfig> {
  const docRef = doc(db, COL, id);
  await updateDoc(docRef, data);

  return fetchPayerConfig(id);
}

/**
 * Delete a payer configuration (superadmin only).
 * 
 * @param id - Payer configuration document ID
 */
export async function deletePayerConfig(id: string): Promise<void> {
  const docRef = doc(db, COL, id);
  await deleteDoc(docRef);
}

/**
 * Validate a payer configuration.
 * Checks that required fields are present and the config is active.
 * 
 * @param config - PayerConfig to validate
 * @returns Validation result
 */
export function validatePayerConfig(
  config: PayerConfig | undefined
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    errors.push("Payer configuration is missing");
    return { valid: false, errors, warnings };
  }

  if (!config.name || config.name.trim().length === 0) {
    errors.push("Payer name is required");
  }

  if (!config.payerId || config.payerId.trim().length === 0) {
    errors.push("Payer ID is required");
  }

  if (!config.claimTypes || config.claimTypes.length === 0) {
    errors.push("At least one claim type must be supported (837P, 837I, 837D)");
  } else {
    const validTypes: PayerClaimType[] = ["837P", "837I", "837D"];
    const allValid = config.claimTypes.every((t) => validTypes.includes(t));
    if (!allValid) {
      errors.push(
        `Unsupported claim type. Valid types: ${validTypes.join(", ")}`
      );
    }
  }

  if (!config.clearinghouse || config.clearinghouse === "other") {
    warnings.push(
      "Clearinghouse not specified. Configure a supported provider for automated submission."
    );
  }

  if (config.environment !== "sandbox" && config.environment !== "production") {
    errors.push("Environment must be 'sandbox' or 'production'");
  }

  if (!config.active) {
    warnings.push("Payer configuration is inactive. Claims will be blocked.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Initialize default payer configurations if none exist.
 * Called during app setup. Should be run once by superadmin.
 * 
 * @param companyId - Company ID to associate configs with (optional)
 */
export async function initializePayerConfigs(companyId?: string): Promise<void> {
  const existing = await fetchPayerConfigs(companyId);

  if (existing.length === 0) {
    // Create sandbox config for the company
    if (companyId) {
      await createPayerConfig({
        ...SANDBOX_PAYER_CONFIG,
        companyId,
        name: "Default Payer",
        payerId: "DEFAULT",
        sortOrder: 1,
      });
    } else {
      // No company context - create standalone sandbox config
      await createPayerConfig({
        ...SANDBOX_PAYER_CONFIG,
        name: "Default Payer",
        payerId: "DEFAULT",
      });
    }
  }
}

/**
 * Get the active sandbox payer config for a company.
 * 
 * @param companyId - Company ID
 * @returns PayerConfig or null
 */
export async function getActiveSandboxConfig(companyId: string): Promise<PayerConfig | null> {
  const configs = await fetchPayerConfigs(companyId);
  const sandbox = configs.find(
    (c) => c.environment === "sandbox" && c.active
  );
  return sandbox || null;
}

/**
 * Get the active production payer config for a company.
 * 
 * @param companyId - Company ID
 * @returns PayerConfig or null
 */
export async function getActiveProductionConfig(companyId: string): Promise<PayerConfig | null> {
  const configs = await fetchPayerConfigs(companyId);
  const production = configs.find(
    (c) => c.environment === "production" && c.active
  );
  return production || null;
}

export default {
  fetchPayerConfigs,
  fetchPayerConfig,
  createPayerConfig,
  updatePayerConfig,
  deletePayerConfig,
  validatePayerConfig,
  initializePayerConfigs,
  getActiveSandboxConfig,
  getActiveProductionConfig,
};