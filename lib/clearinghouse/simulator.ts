/**
 * Clearinghouse simulator for development and testing.
 * 
 * This module simulates third-party clearinghouse APIs for EDI claim submission,
 * status lookups, and acknowledgment processing. It is intentionally separate from
 * the real provider adapters so that a real clearinghouse can be integrated later
 * without modifying the core submission logic.
 * 
 * The simulator is feature-parity with a minimal real clearinghouse but does NOT
 * produce a "successful submission" unless explicitly configured to do so. It is
 * meant for UI development, QA, and local testing only.
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ClaimSubmission,
  ClaimStatus,
  FullValidationResult,
} from "@/lib/firestore/claims";
import { PayerConfig } from "@/lib/payer/types";
import { generateEdi837P } from "@/lib/edi/generate";

/**
 * Simulated submission response from a clearinghouse.
 */
export interface SimulatedSubmissionResponse {
  /** Clearinghouse-assigned reference ID */
  submissionId: string;
  /** Timestamp of submission */
  submittedAt: string;
  /** Acknowledgment status */
  status: "accepted" | "rejected" | "pending";
  /** HIPAA 277/278 equivalent acknowledgment */
  acknowledgment?: {
    type: "277";
    controlNumber: string;
    status: "accepted" | "rejected";
    timestamp: string;
  };
  /** Error details if rejected */
  errors?: string[];
  /** Provider reference for tracking */
  providerRef?: string;
}

/**
 * Simulated eligibility verification response.
 */
export interface SimulatedEligibilityResponse {
  /** Whether the patient is eligible */
  eligible: boolean;
  /** Patient name */
  patientName: string;
  /** Payer name */
  payerName: string;
  /** Plan name */
  planName: string;
  /** Member ID */
  memberId: string;
  /** Coverage details */
  coverageDetails: {
    copay: number;
    coinsurance: number;
    deductible: number;
    remainingDeductible: number;
    priorAuthRequired: boolean;
    priorAuthNumber?: string;
  };
  /** Restrictions or notes */
  restrictions: string[];
  /** Verification timestamp */
  verifiedAt: string;
}

/**
 * Provider-agnostic clearinghouse interface.
 * 
 * Real clearinghouse adapters must implement this interface. The simulator
 * satisfies it for development and testing purposes.
 */
export interface ClearinghouseAdapter {
  /** Unique adapter identifier */
  adapterId: string;
  /** Human-readable name */
  name: string;
  /** Supported claim types */
  supportedClaimTypes: PayerClaimType[];
  /** Environment */
  environment: "sandbox" | "production";

  /**
   * Verify patient eligibility against the payer.
   * 
   * @param payerConfig - Payer configuration
   * @param patientId - Patient Firestore document ID
   * @param providerId - Provider Firestore document ID
   * @param serviceDate - Service date (YYYY-MM-DD)
   * @param diagnosisCodes - ICD-10 diagnosis codes (optional)
   * @returns Eligibility verification result
   */
  verifyEligibility:
    | ((payerConfig: PayerConfig, patientId: string, providerId: string, serviceDate: string, diagnosisCodes?: string[]) => Promise<SimulatedEligibilityResponse>)
    | undefined;

  /**
   * Submit a claim to the clearinghouse as EDI 837P.
   * 
   * @param payerConfig - Payer configuration
   * @param claim - Claim document (must be validated and EDI-generated)
   * @returns Submission response with submissionId, status, and optional acknowledgment
   */
  submitClaim: | ((payerConfig: PayerConfig, claim: import("@/lib/firestore/claims").Claim) => Promise<SimulatedSubmissionResponse>) | undefined;

  /**
   * Look up the status of a previously submitted claim.
   * 
   * @param payerConfig - Payer configuration
   * @param submissionId - Clearinghouse submission reference ID
   * @returns Current submission status
   */
  lookupSubmissionStatus: | ((payerConfig: PayerConfig, submissionId: string) => Promise<{ status: string; details?: string }) | undefined;
}

/**
 * Default simulator adapter - satisfies the ClearinghouseAdapter interface
 * for development and testing. Does NOT simulate a successful live submission;
 * it is explicitly designed to require real provider integration.
 */
export const simulatorAdapter: ClearinghouseAdapter = {
  adapterId: "simulator",
  name: "In-Cart Simulator",
  supportedClaimTypes: ["837P"],
  environment: "sandbox",

  verifyEligibility: async (
    payerConfig: PayerConfig,
    patientId: string,
    providerId: string,
    serviceDate: string,
    diagnosisCodes?: string[]
  ): Promise<SimulatedEligibilityResponse> => {
    // Fetch patient data from Firestore
    const patientRef = doc(db, "patients", patientId);
    const patientSnap = await getDoc(patientRef);
    if (!patientSnap.exists()) {
      throw new Error(`Patient ${patientId} not found`);
    }
    const patient = patientSnap.data() as any;

    // Fetch provider data from Firestore
    const providerRef = doc(db, "providers", providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists()) {
      throw new Error(`Provider ${providerId} not found`);
    }
    const provider = providerSnap.data() as any;

    // Build eligibility response based on patient insurance data
    const insurance = patient.insurance || {};
    const planName = insurance.planName || "Unknown Plan";
    const memberId = insurance.memberId || "";
    const groupNumber = insurance.groupNumber || "";

    // Determine eligibility based on simulated criteria
    const hasValidPlan = planName && planName !== "Unknown Plan";
    const hasMemberId = !!memberId;
    const eligible = hasValidPlan && hasMemberId;

    // Simulated restrictions
    const restrictions: string[] = [];
    if (diagnosisCodes?.length) {
      const complexDiagnoses = diagnosisCodes.filter(
        (c: string) => c.startsWith("E") || c.startsWith("I8")
      );
      if (complexDiagnoses.length > 0) {
        restrictions.push("Prior authorization may be required for reported diagnoses");
      }
    }
    if (!eligible) {
      restrictions.push("Coverage not verified - contact insurance provider");
    }

    return {
      eligible,
      patientName: `${patient.firstName} ${patient.lastName || ""}`,
      payerName: payerConfig.name,
      planName,
      memberId,
      coverageDetails: {
        copay: insurance.copay || 25,
        coinsurance: insurance.coinsurance || 20,
        deductible: insurance.deductible || 500,
        remainingDeductible: Math.max(0, (insurance.deductible || 500) - 100),
        priorAuthRequired: insurance.priorAuth === true || false,
        priorAuthNumber: insurance.priorAuthNumber,
      },
      restrictions,
      verifiedAt: new Date().toISOString(),
    };
  },

  submitClaim: async (
    payerConfig: PayerConfig,
    claim: import("@/lib/firestore/claims").Claim
  ): Promise<SimulatedSubmissionResponse> => {
    // Generate EDI 837P file for the claim
    const ediInfo = await generateEdi837P({
      payerConfig,
      claim,
      includePatientLoop: true,
      includeRenderingProvider: false,
    });

    // Simulate a submission ID
    const submissionId = `sim-${Math.floor(100000000 + Math.random() * 899999999)}`;

    // IMPORTANT: The simulator does NOT automatically mark a claim as submitted.
    // It returns a "pending" status to remind the user that real provider
    # integration is required. To simulate acceptance, set the `simulateAcceptance`
    # flag below. Leaving it as "pending" is the correct behavior.
    const simulateAcceptance = false; // ← Keep false for correct behavior

    let status: "accepted" | "rejected" | "pending";
    let acknowledgment: { type: "277"; controlNumber: string; status: "accepted" | "rejected"; timestamp: string } | undefined;
    let errors: string[] | undefined;

    if (simulateAcceptance) {
      status = "accepted";
      acknowledgment = {
        type: "277",
        controlNumber: `A${Math.floor(100000 + Math.random() * 899999)}`,
        status: "accepted",
        timestamp: new Date().toISOString(),
      };
    } else {
      // Correct production-like behavior: submission is pending real acknowledgment
      status = "pending";
      // Provide guidance but do not fake a success
      errors = [
        "Submission pending real clearinghouse acknowledgment.",
        "Configure a real clearinghouse adapter to complete submission.",
        `EDI file generated (control: ${ediInfo.controlNumbers.interchangeControlNumber})`,
      ];
    }

    return {
      submissionId,
      submittedAt: new Date().toISOString(),
      status,
      acknowledgment,
      errors,
      providerRef: claim.providerId,
    };
  },

  lookupSubmissionStatus: async (
    payerConfig: PayerConfig,
    submissionId: string
  ): Promise<{ status: string; details?: string }> => {
    // In a real system, this would query the clearinghouse API.
    // The simulator returns pending to reflect that real acknowledgment is pending.
    return {
      status: "acknowledgment_pending",
      details: "Simulated: awaiting real clearinghouse acknowledgment. Configure a production adapter for live status lookup.",
    };
  },
};

/**
 * Creates a default simulator adapter registered in the system.
 * Call once during setup to ensure the simulator is available.
 */
export function registerSimulatorAdapter(): void {
  // In a production system, this would register the adapter in a central registry.
  // For now, it's exported for manual import and use.
  console.log("[simulator] Adapter registered: In-Cart Simulator (development only)");
}

/**
 * Maps a clearinghouse status string to InCart ClaimSubmission status.
 * 
 * @param status - Clearinghouse status string
 * @returns InCart ClaimSubmission submissionStatus
 */
export function mapClearinghouseStatusToInCartStatus(
  status: string
): ClaimSubmission["submissionStatus"] {
  const mapping: Record<string, ClaimSubmission["submissionStatus"]> = {
    submitted: "submitted",
    accepted: "accepted",
    rejected: "rejected",
    "acknowledgment_pending": "acknowledgment_pending",
    pending: "acknowledgment_pending",
    generated: "generated",
    validation_failed: "validation_failed",
    draft: "draft",
  };
  return mapping[status] || "acknowledgment_pending";
}

export default {
  simulatorAdapter,
  mapClearinghouseStatusToInCartStatus,
};