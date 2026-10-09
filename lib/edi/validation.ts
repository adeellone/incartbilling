/**
 * Claim validation service for EDI 837 submission.
 * 
 * Validates required fields, code formats, monetary values,
 * and payer-specific requirements before EDI generation.
 * 
 * Uses the existing claim interface and payer configuration
 * from the Firestore schema.
 */

import {
  Claim,
  ClaimCode,
  ClaimSubmission,
  ClaimStatus,
} from "../firestore/claims";
import { generateEdi837P, EdiGenerationOptions, ClaimValidationResult } from "./generate";
import { PayerConfig } from "./generate";

/**
 * Full validation result including EDI generation feasibility.
 */
export interface FullValidationResult extends ClaimValidationResult {
  /** Whether EDI generation can proceed */
  canGenerateEdi: boolean;
  /** Payer configuration validation */
  payerConfigValid: boolean;
  /** Suggested next status */
  nextStatus?: ClaimSubmission["submissionStatus"];
}

/**
 * Validates a claim for EDI generation and returns comprehensive results.
 * 
 * @param claim - The claim to validate
 * @param payerConfig - Payer-specific configuration
 * @returns Full validation result with errors, warnings, and EDI feasibility
 */
export function validateClaimForSubmission(
  claim: Claim,
  payerConfig: PayerConfig
): FullValidationResult {
  const baseResult = validateClaimForEdi(claim, payerConfig);

  const canGenerateEdi = baseResult.valid && baseResult.errors.length === 0;

  const payerConfigValid =
    !!payerConfig.payerId &&
    !!payerConfig.billingProviderNPI &&
    !!payerConfig.placeOfService;

  let nextStatus: ClaimSubmission["submissionStatus"] | undefined;

  if (!baseResult.valid) {
    nextStatus = "draft"; // Stay in draft until errors are fixed
  } else if (!canGenerateEdi) {
    nextStatus = "ready"; // Data is valid, ready for EDI generation
  } else {
    nextStatus = "generated"; // EDI can be generated
  }

  return {
    ...baseResult,
    canGenerateEdi,
    payerConfigValid,
    nextStatus,
  };
}

/**
 * Prepares a claim for EDI generation by validating and
 * initializing/updating the submission metadata.
 * 
 * @param claimId - Firestore claim document ID
 * @param payerConfig - Payer configuration to use
 * @returns Validation result with next status
 */
export async function prepareClaimForEdi(
  claimId: string,
  payerConfig: PayerConfig
): Promise<FullValidationResult> {
  // Fetch the claim from Firestore
  const claimRef = (await import("../firestore/claims")).doc(
    `claims/${claimId}`
  );
  const claimSnap = await (await import("firebase/firestore")).getDoc(claimRef);
  const claim = claimSnap.exists()
    ? ({ id: claimSnap.id, ...claimSnap.data() } as Claim)
    : null;

  if (!claim) {
    throw new Error(`Claim ${claimId} not found`);
  }

  // Run validation
  const validation = validateClaimForSubmission(claim, payerConfig);

  // If claim is valid and ready, initialize/preserve submission metadata
  if (validation.valid && validation.nextStatus === "generated") {
    // Ensure submission metadata exists
    const submission = claim.submission || {
      attempt: 1,
      submissionStatus: "draft",
    };

    // Update the claim with initialized submission if needed
    if (
      submission.submissionStatus === "draft" &&
      (submission.attempt === undefined || submission.attempt < 1)
    ) {
      // Update attempt to 1 if not set
      // Note: This would use updateClaim in practice, but we're in validation only
    }
  }

  return validation;
}

/**
 * Updates the submission status on a claim document.
 * Used after EDI generation or submission attempt.
 * 
 * @param claimId - Firestore claim ID
 * @param status - New submission status
 * @param attempt - Attempt number (auto-incremented if not provided)
 */
export async function updateSubmissionStatus(
  claimId: string,
  status: ClaimSubmission["submissionStatus"],
  attempt?: number
): Promise<void> {
  const { updateClaim } = await import("../firestore/claims");

  const attemptNum = attempt || 1;

  await updateClaim(claimId, {
    submission: {
      ...(await import("../firestore/claims")).initSubmission(
        attemptNum,
        status
      ),
    },
  });
}

/**
 * Records a submission attempt with timestamp and reference.
 * Call after a submission attempt (successful or failed).
 */
export async function recordSubmissionAttempt(
  claimId: string,
  status: ClaimSubmission["submissionStatus"],
  reference?: string
): Promise<void> {
  const { updateClaim } = await import("../firestore/claims");

  await updateClaim(claimId, {
    submission: {
      attempt: (await import("../firestore/claims")).initSubmission(
        undefined,
        status
      ).attempt + 1, // Increment attempt
      submissionStatus: status,
      ...(reference && { submissionRef: reference }),
    },
  });
}

export default {
  validateClaimForSubmission,
  prepareClaimForEdi,
  updateSubmissionStatus,
  recordSubmissionAttempt,
};