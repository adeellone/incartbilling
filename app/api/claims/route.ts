/**
 * API route: POST /api/claims/submit
 * 
 * External system integration point for claim submission.
 * 
 * Expected JSON body:
 * {
 *   companyId: string,          // tenant company ID
 *   patientId: string,          // patient document ID
 *   providerId: string,         // provider document ID
 *   serviceDate: string,        // YYYY-MM-DD
 *   diagnosisCodes: string[],   // [ICD-10 codes]
 *   procedureCodes: [{ code, description, units?, charge? }],
 *   notes?: string,
 *   payerConfigId?: string,     // optional payer config identifier
 * }
 * 
 * Response on success:
 * {
 *   claimId: string,
 *   submissionRef: string,      // clearinghouse tracking ID (or sim- prefix for simulator)
 *   ediFile?: { name: string; size: number; contentBase64: string },
 *   nextStatus: "ready" | "generated" | "submitted" | "acknowledgment_pending",
 *   validationErrors: string[],
 *   payerConfigId: string,
 * }
 * 
 * Response on error:
 * { error: string, validationErrors: string[] }
 * 
 * Workflow:
 * 1. Validate claim data against payer config
 * 2. Generate EDI 837P file
 * 3. Record submission attempt (status stays "generated" until real provider confirms)
 * 4. Return submissionRef for external tracking
 * 5. Real submission status must be updated separately after provider acknowledgment
 */

import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  validateClaimForSubmission,
  prepareClaimForEdi,
  updateSubmissionStatus,
  recordSubmissionAttempt,
} from "@/lib/edi/validation";
import { generateEdi837P } from "@/lib/edi/generate";
import {
  fetchPayerConfigs,
  fetchPayerConfig,
  validatePayerConfig,
} from "@/lib/payer/service";
import { simulatorAdapter } from "@/lib/clearinghouse/simulator";
import type { FullValidationResult } from "@/lib/edi/validation";
import type { PayerConfig } from "@/lib/payer/types";
import type { Claim } from "@/lib/firestore/claims";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      companyId,
      patientId,
      providerId,
      serviceDate,
      diagnosisCodes,
      procedureCodes,
      notes,
      payerConfigId,
    } = body;

    // ==========================================
    // 1. Fetch and validate payer configuration
    // ==========================================

    let payerConfig: PayerConfig | null = null;

    if (payerConfigId) {
      payerConfig = await fetchPayerConfig(payerConfigId);
    }

    // If no config ID provided or not found, try to get active sandbox config for company
    if (!payerConfig) {
      if (companyId) {
        payerConfig = await getActiveSandboxConfig(companyId);
      }
    }

    // If still no config, create/default to sandbox
    if (!payerConfig) {
      payerConfig = SANDBOX_PAYER_CONFIG;
    }

    // Validate the payer configuration
    const payerValidation = validatePayerConfig(payerConfig);
    if (!payerValidation.valid) {
      return NextResponse.json(
        {
          error: "Invalid payer configuration",
          validationErrors: payerValidation.errors,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 2. Validate claim data against payer config
    // ==========================================

    // Build a minimal claim object for validation
    const claimPlaceholder: Claim = {
      id: "",
      companyId,
      patientId,
      patientName: "",
      providerId,
      providerName: "",
      serviceDate: serviceDate || "",
      status: "draft",
      diagnosisCodes: diagnosisCodes || [],
      procedureCodes: (procedureCodes || []).map((c: any) => ({
        code: c.code || "",
        description: c.description || "",
        units: c.units !== undefined ? c.units : 1,
        charge: c.charge !== undefined ? c.charge : 0,
      })),
      totalCharge: 0,
      paidAmount: 0,
      notes: notes || "",
      createdAt: undefined,
      updatedAt: undefined,
      submission: {
        attempt: 1,
        submissionStatus: "draft",
      },
    };

    const validation =
      await validateClaimForSubmission(claimPlaceholder, payerConfig);

    // If there are validation errors, return them early
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          validationErrors: validation.errors,
          nextStatus: validation.nextStatus,
          payerConfigId,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 3. Fetch real claim document if patientId provided
    // ==========================================

    let realClaim: Claim | null = null;

    if (patientId) {
      try {
        const claimRef = doc(db, "claims", patientId);
        const claimSnap = await getDoc(claimRef);
        if (claimSnap.exists()) {
          realClaim = { id: claimSnap.id, ...claimSnap.data() } as Claim;
          // Ensure real claim has proper submission metadata
          if (!realClaim.submission) {
            realClaim.submission = {
              attempt: 1,
              submissionStatus: "draft",
            };
          }
        }
      } catch (e) {
        console.error("Failed to fetch claim:", e);
      }
    }

    const claimToUse = realClaim || claimPlaceholder;

    // ==========================================
    // 4. Prepare claim for EDI generation
    // ==========================================

    // Update submission status to "ready" (claim is validated, ready for EDI generation)
    await updateSubmissionStatus(realClaim?.id || "", "ready", 1);

    // ==========================================
    // 4. Generate EDI 837P file
    // ==========================================

    const ediInfo = await generateEdi837P({
      payerConfig,
      claim: realClaim || claimPlaceholder,
      includePatientLoop: true,
      includeRenderingProvider: false,
    });

    // ==========================================
    // 5. Submit claim via clearinghouse adapter
    // ==========================================

    // Use the simulator adapter by default; in production, replace with
    // a real adapter instance that implements ClearinghouseAdapter.
    const submissionResponse = await (simulatorAdapter.submitClaim
      ? simulatorAdapter.submitClaim(payerConfig, realClaim || claimPlaceholder)
      : {
        // Fallback: simulate submission without adapter
        submissionId: `sim-${Math.floor(100000000 + Math.random() * 899999999)}`,
        submittedAt: new Date().toISOString(),
        status: "pending",
        acknowledgment: undefined,
        errors: [
          "No clearinghouse adapter configured. Simulator not available.",
        ],
        providerRef: (realClaim?.providerId || ""),
      ]);

    // ==========================================
    // 6. Record the submission attempt
    // ==========================================

    // The claim status should NOT automatically change to "submitted" here.
    // It should remain "generated" until the provider confirms receipt.
    // We record the attempt with "generated" status, and the calling system
    // should update to "submitted" only after the provider confirms receipt.
    await recordSubmissionAttempt(
      realClaim?.id || "",
      "generated", // stays "generated" until real provider confirms
      submissionResponse.submissionId
    );

    // ==========================================
    // 7. Return response
    // ==========================================

    const response = {
      claimId: realClaim?.id || "",
      submissionRef: submissionResponse.submissionId,
      ediFile: ediInfo.contentBase64
        ? {
            name: `claim-${realClaim?.id || "unknown"}-${new Date()
              .toISOString()
              .replace(/[:.-]/g, "")}.edi`,
            size: ediInfo.size,
            contentBase64: ediInfo.contentBase64,
          }
        : undefined,
      nextStatus: validation.nextStatus,
      validationErrors: validation.errors,
      payerConfigId,
      // Inform the caller about the submission pipeline state
      submissionStatus: "generated", // "generated" until real provider confirms
      simulator: simulatorAdapter.adapterId,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    console.error("API /api/claims/submit error:", err);
    return NextResponse.json(
      {
        error: err.message || "Unexpected error during claim submission",
        validationErrors: [],
        nextStatus: "draft",
        payerConfigId: body?.payerConfigId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET route: fetch claim details by ID
 * Used by external systems to retrieve claim state.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get("claimId");

    if (!claimId) {
      return NextResponse.json({ error: "claimId query parameter required" }, { status: 400 });
    }

    const claimRef = doc(db, "claims", claimId);
    const claimSnap = await getDoc(claimRef);

    if (!claimSnap.exists()) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const claim = { id: claimSnap.id, ...claimSnap.data() } as any;

    return NextResponse.json({ claim }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/claims/get error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}