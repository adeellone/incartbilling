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
 *   submissionRef: string,
 *   ediFile?: { name: string; size: number; contentBase64: string },
 *   nextStatus: "ready" | "generated" | "submitted",
 *   validationErrors: string[],
 * }
 * 
 * Response on error:
 * { error: string, validationErrors: string[] }
 */

import { NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  validateClaimForSubmission,
  prepareClaimForEdi,
  updateSubmissionStatus,
  recordSubmissionAttempt,
} from "@/lib/edi/validation";
import { generateEdi837P } from "@/lib/edi/generate";
import type { FullValidationResult } from "@/lib/edi/validation";

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
    // 1. Validate incoming data
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

    // We need a payer config for validation. Since we don't have it from the body,
    // we'll use a default minimal config and flag it for the caller.
    // In production, fetch from Firestore payer configs.
    const defaultPayerConfig: PayerConfig = {
      payerId: "PAYER_ID_DEFAULT",
      payerName: "Default Payer",
      billingProviderNPI: "1234567890",
      placeOfService: "11", // Default: Office
      monetaryFormat: "8",
    };

    const validation =
      await validateClaimForSubmission(claimPlaceholder, defaultPayerConfig);

    // If there are validation errors, return them early
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          validationErrors: validation.errors,
          nextStatus: validation.nextStatus,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 2. If a real claim document exists, use it
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
    // 3. Initialize/update submission status to "ready"
    // ==========================================

    await updateSubmissionStatus(realClaim?.id || "", "ready", 1);

    // ==========================================
    // 4. Generate EDI 837P file
    // ==========================================

    const ediInfo = await generateEdi837P({
      payerConfig: {
        ...defaultPayerConfig,
        payerId: payerConfigId || defaultPayerConfig.payerId,
        placeOfService: defaultPayerConfig.placeOfService,
      },
      claim: realClaim || claimPlaceholder,
      includePatientLoop: true,
      includeRenderingProvider: false,
    });

    // ==========================================
    // 5. Record the submission attempt
    // ==========================================

    await recordSubmissionAttempt(
      realClaim?.id || "",
      "submitted",
      ediInfo.controlNumbers.interchangeControlNumber
    );

    // ==========================================
    // 6. Return response
    // ==========================================

    const response = {
      claimId: realClaim?.id || "",
      submissionRef: ediInfo.controlNumbers.interchangeControlNumber,
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
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    console.error("API /api/claims/submit error:", err);
    return NextResponse.json(
      {
        error: err.message || "Unexpected error during claim submission",
        validationErrors: [],
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