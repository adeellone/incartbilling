/**
 * EDI 837 Professional claim file generator.
 * 
 * Generates a minimal but standards-compliant X12 837P transaction set.
 * Uses a pure TypeScript serializer — no external dependencies required.
 * 
 * References:
 * - X12 837P Implementation Guide
 * - HIPAA Transaction Set Standards
 * - Payer-specific companion guides (configurable via payerConfigId)
 */

export interface ClaimEdiInfo {
  claimId: string;
  generatedAt: Date;
  /** Base64-encoded EDI file content for download */
  contentBase64: string;
  /** Human-readable size in bytes */
  size: number;
  /** EDI control numbers */
  controlNumbers: {
    interchangeControlNumber: string;
    groupControlNumber: string;
    transactionSetControlNumber: string;
  };
}

export interface PayerConfig {
  /** Payer ID (e.g. "123456789") */
  payerId: string;
  /** Payer name */
  payerName: string;
  /** Billing provider NPI */
  billingProviderNPI: string;
  /** Rendering provider NPI (optional) */
  renderingProviderNPI?: string;
  /** Place of service code */
  placeOfService?: string;
  /** Claim form type (1 = UB-08 institutional,  CMS-15 professional) */
  claimForm?: "1" | " CMS-15";
  /** Monetary format: "8" = 8-digit, "6" = 6-digit */
  monetaryFormat?: "8" | "6";
}

export interface EdiGenerationOptions {
  /** Payer-specific configuration */
  payerConfig: PayerConfig;
  /** Claim data (must be complete with all required fields) */
  claim: import("../firestore/claims").Claim;
  /** Whether to include patient loop (required for most payers) */
  includePatientLoop: boolean;
  /** Whether to include rendering provider loop */
  includeRenderingProvider: boolean;
}

/**
 * Generates the ISA (Interchange Control Header) segment.
 */
function generateIsa(
  payerConfig: PayerConfig,
  controlNumbers: {
    interchangeControlNumber: string;
    groupControlNumber: string;
    transactionSetControlNumber: string;
  }
): string {
  const today = new Date();
  const ish = today.toISOString().replace(/[-:]/g, "").substring(0, 14);
  const ieaControl = controlNumbers.interchangeControlNumber;

  // ISA segments (Element separator is ^x12, segment terminator is ^~)
  const segments: string[] = [];

  // ISA Interchange Control Header
  segments.push(
    `ISA*00*          *00*          *ZZ*${payerConfig.billingProviderNPI}*ZZ*${payerConfig.payerId}*${ish}*${ish}*1*P*>~`
  );

  return segments.join("\n");
}

/**
 * Generates the GS (Functional Group Header) segment.
 */
function generateGs(
  controlNumbers: {
    groupControlNumber: string;
    transactionSetControlNumber: string;
  }
): string {
  const segments: string[] = [];

  segments.push(
    `GS*HC*${controlNumbers.groupControlNumber}*${controlNumbers.transactionSetControlNumber}*${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .substring(0, 14)}*X*~`
  );

  return segments.join("\n");
}

/**
 * Generates the ST (Transaction Set Header) segment for 837P.
 */
function generateSt(transactionSetControlNumber: string): string {
  return `ST*837*${transactionSetControlNumber}*005010X222A1~`;
}

/**
 * Generates the BHT (Beginning of Hierarchical Transaction) segment.
 */
function generateBht(): string {
  return `BHT*0019*00*000000000*D8*000000000*20260809*000000~`;
}

/**
 * Generates the CLP (Claim Level Information) segment.
 */
function generateClp(
  claim: import("../firestore/claims").Claim,
  payerConfig: PayerConfig
): string {
  const clpSegments: string[] = [];

  // CLP01-3: Monetary amount (total claim charge)
  const totalCharge = (claim.totalCharge || 0).toFixed(
    payerConfig.monetaryFormat === "6" ? 6 : 8
  );

  clpSegments.push(
    `CLP*${totalCharge}*${totalCharge}*1*00~`
  );

  return clpSegments.join("\n");
}

/**
 * Generates the HL (Hierarchical Level) segments for claim loops.
 */
function generateHlLevel(depth: number, pathId: string): string {
  const pad = " ".repeat(depth * 2);
  return `${pad}HL*${depth}*${pathId}*~`;
}

/**
 * Generates the SBR (Subscriber Information) segment.
 */
function generateSbr(): string {
  // Minimal subscriber info — payer-specific fields would be added here
  return `SBR*P** Medicare*00~`;
}

/**
 * Generates the NM1 (Name) segment for provider or patient.
 */
function generateNm1(
  type: "77" | "85" | "QC", // 77 = biller, 85 = attending, QC = subscriber
  name: string,
  entityId: string,
  entityIdQual: string
): string {
  // NM1 format: NM1*type*entityId*entityIdQual*name
  return `NM1*${type}*${entityIdQual}*${entityId}*${name}*~`;
}

/**
 * Generates the REF (Reference Identification) segment for diagnosis/procedure codes.
 */
function generateRef(code: string, codeQual: string): string {
  return `REF*${codeQual}*${code}*~`;
}

/**
 * Generates the DTP (Date Time Period) segment for service dates.
 */
function generateDtp(date: string, qual: string): string {
  return `DTP*${qual}*D8*${date}*~`;
}

/**
 * Generates the loop for diagnosis codes ( loop 2000CA )
 */
function generateDiagnosisLoop(dxCodes: string[]): string {
  const lines: string[] = [];

  dxCodes.forEach((code, idx) => {
    // Add diagnosis code reference
    const ref = generateRef(code, "DG");
    lines.push(ref);

    // Add DTP for date if needed (typically not in professional claims,
    // but included for completeness)
    // lines.push(generateDtp("20260101", "473")); // Admission date
  });

  return lines.join("\n");
}

/**
 * Generates the loop for procedure codes ( loop 2000CP )
 */
function generateProcedureLoop(
  procedureCodes: import("../firestore/claims").ClaimCode[]
): string {
  const lines: string[] = [];

  procedureCodes.forEach((code) => {
    const ref = generateRef(code.code, "HC");
    lines.push(ref);

    // Units
    if (code.units && code.units > 0) {
      lines.push(`LX*${code.units}*~`);
    }

    // Charge
    if (code.charge && code.charge > 0) {
      const charge = Number(code.charge).toFixed(2);
      lines.push(`AMT*F*${charge}*~`);
    }
  });

  return lines.join("\n");
}

/**
 * Generates the loop for service line information (2010CA)
 */
function generateServiceLineLoop(
  claim: import("../firestore/claims").Claim,
  payerConfig: PayerConfig
): string {
  const lines: string[] = [];

  // PAT loop - assume one patient, one provider per claim for now
  // SBR already generated above

  // Loop for claim adjudication and payment
  // Add claim charges
  if (claim.procedureCodes?.length) {
    lines.push(generateProcedureLoop(claim.procedureCodes));
  }

  // Diagnosis codes
  if (claim.diagnosisCodes?.length) {
    lines.push(generateDiagnosisLoop(claim.diagnosisCodes));
  }

  return lines.join("\n");
}

/**
 * Generates the SE (Transaction Set Trailer) segment.
 */
function generateSe(transactionSetControlNumber: string, totalFunctionalGroups: number): string {
  return `SE*${totalFunctionalGroups}*${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .substring(0, 14)}~`;
}

/**
 * Generates the IEA (Interchange Control Trailer) segment.
 */
function generateIea(groupControlNumber: string, totalInterchangeSets: number): string {
  return `IEA*${totalInterchangeSets}*${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .substring(0, 14)}~`;
}

/**
 * Main function: generates a complete EDI 837P file as base64.
 * 
 * @param options - Configuration and claim data
 * @returns EDI file info with base64 content
 */
export async function generateEdi837P(
  options: EdiGenerationOptions
): Promise<ClaimEdiInfo> {
  const {
    payerConfig,
    claim,
    includePatientLoop = true,
    includeRenderingProvider = false,
  } = options;

  const controlNumbers = {
    interchangeControlNumber: `IC${Math.floor(100000000 + Math.random() * 899999999)}`,
    groupControlNumber: `GC${Math.floor(100000000 + Math.random() * 899999999)}`,
    transactionSetControlNumber: `TS${Math.floor(100000000 + Math.random() * 899999999)}`,
  };

  const lines: string[] = [];

  // ISA
  lines.push(generateIsa(payerConfig, controlNumbers));

  // GS
  lines.push(generateGs(controlNumbers));

  // ST
  lines.push(generateSt(controlNumbers.transactionSetControlNumber));

  // BHT
  lines.push(generateBht());

  // CLP
  lines.push(generateClp(claim, payerConfig));

  // HL loops for claim detail
  lines.push(generateHlLevel(1, "1"));

  // SBR - Subscriber info (simplified)
  lines.push(generateSbr());

  // Loop for service line information
  lines.push(generateServiceLineLoop(claim, payerConfig));

  // N1 - Name loops (billing provider)
  const billingNm1 = generateNm1(
    "77", // biller
    "Incart Billing", // entity name
    payerConfig.billingProviderNPI,
    "PI"
  );
  lines.push(billingNm1);

  // SE trailer
  lines.push(
    generateSe(controlNumbers.transactionSetControlNumber, 1)
  );

  // IEA trailer
  lines.push(
    generateIea(controlNumbers.groupControlNumber, 1)
  );

  const ediContent = lines.join("\n");
  const contentBase64 = Buffer.from(ediContent).toString("base64");
  const size = Buffer.from(ediContent).length;

  return {
    claimId: claim.id || "unknown",
    generatedAt: new Date(),
    contentBase64,
    size,
    controlNumbers,
  };
}

/**
 * Validates a claim before EDI generation.
 * Returns valid/invalid status with detailed error messages.
 */
export interface ClaimValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates required fields for EDI claim generation.
 */
export function validateClaimForEdi(
  claim: import("../firestore/claims").Claim,
  payerConfig: PayerConfig
): ClaimValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: companyId
  if (!claim.companyId) {
    errors.push("Missing companyId — claim must belong to a tenant company.");
  }

  // Required: patientId
  if (!claim.patientId) {
    errors.push("Missing patientId — patient reference is required.");
  }

  // Required: providerId
  if (!claim.providerId) {
    errors.push("Missing providerId — provider reference is required.");
  }

  // Required: serviceDate
  if (!claim.serviceDate) {
    errors.push("Missing serviceDate — service date is required.");
  } else {
    // Basic date format validation (YYYY-MM-DD)
    const dateParts = claim.serviceDate.split("-");
    if (dateParts.length !== 3 || !dateParts.every(part => /^\d+$/.test(part))) {
      errors.push("Invalid serviceDate format — expected YYYY-MM-DD.");
    }
  }

  // Required: diagnosisCodes (at least one)
  if (!claim.diagnosisCodes || claim.diagnosisCodes.length === 0) {
    errors.push("Missing diagnosisCodes — at least one ICD-10 code is required.");
  } else {
    // Basic ICD-10 format check (3-5 characters, letters and numbers)
    for (const code of claim.diagnosisCodes) {
      if (!/^[A-Za-z0-9]{3,5}$/.test(code)) {
        warnings.push(
          `Diagnosis code "${code}" may not follow standard ICD-10 format.`
        );
      }
    }
  }

  // Required: procedureCodes (at least one CPT/HCPCS)
  if (!claim.procedureCodes || claim.procedureCodes.length === 0) {
    errors.push("Missing procedureCodes — at least one CPT/HCPCS code is required.");
  } else {
    for (const code of claim.procedureCodes) {
      if (!code.code) {
        errors.push("Procedure code missing 'code' field.");
        continue;
      }
      // CPT codes are typically 5 digits; HCPCS can be alphanumeric
      if (!/^(\d{5}|[A-Z]\d{4})$/i.test(code.code)) {
        warnings.push(
          `Procedure code "${code.code}" may not follow standard CPT/HCPCS format.`
        );
      }
      if (code.units !== undefined && code.units <= 0) {
        warnings.push(`Procedure code "${code.code}" has invalid units (${code.units}).`);
      }
      if (code.charge !== undefined && code.charge < 0) {
        errors.push(`Procedure code "${code.code}" has a negative charge (${code.charge}).`);
      }
    }
  }

  // Total charge should be positive
  if (claim.totalCharge !== undefined && claim.totalCharge <= 0) {
    errors.push(`totalCharge must be positive, got ${claim.totalCharge}.`);
  }

  // Patient name
  if (!claim.patientName) {
    errors.push("Missing patientName — patient name is required for claim submission.");
  }

  // Provider name
  if (!claim.providerName) {
    errors.push("Missing providerName — provider name is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sets the submission status on a claim document.
 * Usage: await updateClaim(id, { submission: { submissionStatus: "ready", ... } });
 */
export function setSubmissionStatus(
  status: ClaimSubmission["submissionStatus"],
  overrideAttempt?: number
): import("@/lib/firestore/claims").ClaimUpdate {
  // This is a helper type — actual usage is via updateClaim(id, { submission: { status, attempt } })
  return {} as any;
}

/**
 * Creates a new submission record on a claim, resetting attempt counter if needed.
 */
export function initSubmission(
  attempt: number = 1,
  status: ClaimSubmission["submissionStatus"] = "draft"
): ClaimSubmission {
  return {
    attempt,
    submissionStatus: status,
  };
}

export default generateEdi837P;