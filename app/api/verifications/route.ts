/**
 * API route: POST /api/verifications/eligibility
 * 
 * Insurance eligibility verification endpoint.
 * 
 * Expected JSON body:
 * {
 *   patientId: string,          // patient document ID
 *   providerId: string,         // provider document ID
 *   payerId: string,            // payer/insurance ID
 *   serviceDate: string,        // YYYY-MM-DD (optional, default: today)
 *   diagnosisCodes: string[],   // [ICD-10 codes] (optional)
 * }
 * 
 * Response on success:
 * {
 *   eligible: boolean,
 *   patientName: string,
 *   providerName: string,
 *   payerId: string,
 *   coverageDetails: {
 *     planName: string,
 *     memberId: string,
 *     groupNumber: string,
 *     copay: number,
 *     coinsurance: number,
 *     deductible: number,
 *     remainingDeductible: number,
 *     priorAuthRequired: boolean,
 *     priorAuthNumber?: string,
 *   },
 *   restrictions: string[],
 *   verificationTimestamp: string,
 * }
 * 
 * Response on error:
 * { error: string }
 */

import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      patientId,
      providerId,
      payerId,
      serviceDate,
      diagnosisCodes,
    } = body;

    if (!patientId || !providerId || !payerId) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, providerId, payerId" },
        { status: 400 }
      );
    }

    // Fetch patient data
    const patientRef = doc(db, "patients", patientId);
    const patientSnap = await getDoc(patientRef);
    if (!patientSnap.exists()) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }
    const patient = { id: patientSnap.id, ...patientSnap.data() } as any;

    // Fetch provider data
    const providerRef = doc(db, "providers", providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists()) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }
    const provider = { id: providerSnap.id, ...providerSnap.data() } as any;

    // Build verification response
    // In a production system, this would call actual insurance APIs (e.,e. real-time eligibility via
    //Change Healthcare, Availity, Zelis, etc.)
    const now = new Date();
    const verificationTimestamp = now.toISOString();

    // Simulate eligibility check based on patient insurance data
    const patientInsurance = patient.insurance || {};
    const planName = patientInsurance.planName || "Unknown Plan";
    const memberId = patientInsurance.memberId || "";
    const groupNumber = patientInsurance.groupNumber || "";

    // Determine eligibility based on simulated criteria
    const hasValidPlan = !!planName && planName !== "Unknown Plan";
    const hasMemberId = !!memberId;

    const eligible = hasValidPlan && hasMemberId;

    // Build coverage details
    const coverageDetails = {
      planName,
      memberId,
      groupNumber,
      copay: patientInsurance.copay || 25,
      coinsurance: patientInsurance.coinsurance || 20,
      deductible: patientInsurance.deductible || 500,
      remainingDeductible: Math.max(0, (patientInsurance.deductible || 500) - 100), // simulated remaining
      priorAuthRequired: patientInsurance.priorAuth === true || false,
      priorAuthNumber: patientInsurance.priorAuthNumber || undefined,
    };

    // Simulated restrictions based on plan type and diagnosis
    const restrictions: string[] = [];
    if (diagnosisCodes?.length) {
      // Check if any diagnosis codes might require prior auth
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

    const result = {
      eligible,
      patientName: patient.firstName + " " + (patient.lastName || ""),
      providerName: provider.firstName + " " + (provider.lastName || ""),
      payerId,
      coverageDetails,
      restrictions,
      verificationTimestamp,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("API /api/verifications/eligibility error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error during verification" },
      { status: 500 }
    );
  }
}

/**
 * GET route: fetch verification history for a claim
 * Used to track previous eligibility checks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const providerId = searchParams.get("providerId");

    if (!patientId || !providerId) {
      return NextResponse.json(
        { error: "Missing required query parameters: patientId, providerId" },
        { status: 400 }
      );
    }

    // In a production system, this would fetch from a verification history collection
    // For now, return a simulated history
    const history = [
      {
        id: "ref-1",
        patientId,
        providerId,
        payerId: "DEFAULT_PAYER",
        eligible: true,
        planName: "Sample Plan",
        verifiedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: "ref-2",
        patientId,
        providerId,
        payerId: "ALTERNATE_PAYER",
        eligible: false,
        planName: "Alternate Plan",
        verifiedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
    ];

    return NextResponse.json({ history }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/verifications/history error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}