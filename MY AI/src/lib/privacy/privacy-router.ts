/**
 * AVRENYX Privacy Router (Rule 17)
 * - Classifies content into PUBLIC, NORMAL, SENSITIVE, HIGHLY_SENSITIVE
 * - Enforces Local Only mode so sensitive or local-only data is never sent to external cloud APIs
 * - Generates transparent privacy badges ("Processing: Local | Data sent externally: No")
 */

export type PrivacyClassification =
  | "PUBLIC"
  | "NORMAL"
  | "SENSITIVE"
  | "HIGHLY_SENSITIVE";

export interface PrivacyDecision {
  classification: PrivacyClassification;
  detectedSensitiveIndicators: string[];
  requireLocalOnly: boolean;
  processingModeLabel: string;
  dataSentExternally: boolean;
  providerLabel: string;
  allowedProviderTypes: Array<"LOCAL" | "EXTERNAL">;
  explanation: string;
}

const HIGHLY_SENSITIVE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "Social Security / National ID Pattern",
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
  },
  {
    name: "Payment Card Number Pattern",
    regex: /\b(?:\d[ -]*?){13,16}\b/,
  },
  {
    name: "Private Cryptographic Key / PEM Block",
    regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  },
  {
    name: "Medical / HIPAA Protected Health Record Marker",
    regex: /\b(patient\s+diagnosis|medical\s+record\s+number|mrn\s*:|hipaa\s+confidential)\b/i,
  },
];

const SENSITIVE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "Confidential / Internal Only Marker",
    regex: /\b(strictly\s+confidential|internal\s+use\s+only|nda\s+protected|trade\s+secret)\b/i,
  },
  {
    name: "Financial / Payroll Data",
    regex: /\b(salary\s+breakdown|bank\s+routing\s+number|iban\s*:|tax\s+return)\b/i,
  },
  {
    name: "Personal Contact / Credentials",
    regex: /\b(password\s*is\s*|secret_key\s*=|bearer\s+[a-zA-Z0-9_-]{16,})\b/i,
  },
];

export function classifyContentPrivacy(
  content: string,
  userExplicitLevel?: PrivacyClassification,
  userForceLocalOnly = false,
  selectedProviderName = "Ollama"
): PrivacyDecision {
  const detected: string[] = [];
  let inferred: PrivacyClassification = "NORMAL";

  for (const p of HIGHLY_SENSITIVE_PATTERNS) {
    if (p.regex.test(content)) {
      detected.push(p.name);
      inferred = "HIGHLY_SENSITIVE";
    }
  }

  if (inferred !== "HIGHLY_SENSITIVE") {
    for (const p of SENSITIVE_PATTERNS) {
      if (p.regex.test(content)) {
        detected.push(p.name);
        inferred = "SENSITIVE";
      }
    }
  }

  if (
    inferred === "NORMAL" &&
    /\b(public\s+press\s+release|open\s+access|wikipedia|public\s+domain)\b/i.test(
      content
    )
  ) {
    inferred = "PUBLIC";
  }

  const finalClassification = userExplicitLevel || inferred;
  const requireLocalOnly =
    userForceLocalOnly || finalClassification === "HIGHLY_SENSITIVE";

  if (requireLocalOnly) {
    return {
      classification: finalClassification,
      detectedSensitiveIndicators: detected,
      requireLocalOnly: true,
      processingModeLabel: "Processing: Local",
      dataSentExternally: false,
      providerLabel: "Local AI (Ollama)",
      allowedProviderTypes: ["LOCAL"],
      explanation: userForceLocalOnly
        ? "User enabled 'Local Only' privacy mode. External cloud APIs are strictly blocked."
        : `Content classified as ${finalClassification} (${detected.join(", ") || "policy"}). Restricted to Local AI processing only.`,
    };
  }

  const isLocalProvider =
    selectedProviderName.toLowerCase().includes("ollama") ||
    selectedProviderName.toLowerCase().includes("local");

  return {
    classification: finalClassification,
    detectedSensitiveIndicators: detected,
    requireLocalOnly: false,
    processingModeLabel: isLocalProvider
      ? "Processing: Local"
      : "Processing: External API",
    dataSentExternally: !isLocalProvider,
    providerLabel: selectedProviderName,
    allowedProviderTypes: ["LOCAL", "EXTERNAL"],
    explanation: isLocalProvider
      ? `Processed locally on device via ${selectedProviderName}. Data sent externally: No.`
      : `Processed via authorized external provider (${selectedProviderName}). Content classification: ${finalClassification}.`,
  };
}
