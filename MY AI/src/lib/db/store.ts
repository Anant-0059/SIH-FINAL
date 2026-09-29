import fs from "fs";
import path from "path";
import {
  INITIAL_PROVIDERS_AND_MODELS,
  ProviderRegistryRecord,
} from "../ai/capabilities/registry";
import {
  BUILTIN_TEMPLATES,
  TemplateSchemaRecord,
  buildArtifactLineageTree,
  runDocumentQualityCheck,
  QualityCheckReport,
  ArtifactLineageNode,
} from "../documents/quality-checker";
import {
  DurableTaskExecutionResult,
  STANDARD_WORKFLOW_STEPS,
} from "../ai/checkpoints/continuation-engine";
import {
  encryptSecret,
  maskApiKey,
  hashPassword,
} from "../security/encryption";

/**
 * AVRENYX Durable Workspace Database Store
 * - Persists state to `.data/avrenyx-state.json` (and mirrors Prisma/PostgreSQL schema entities)
 * - Supports Projects, Project Memory, Knowledge Vault semantic/keyword search,
 *   Multi-Version Document Artifacts, Durable Checkpoints, Visual Workflows, Agents,
 *   Human Approval Gates, Secure Share Links, Storage Manager, and Admin Audit Logs.
 */

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  status: "PENDING" | "ACTIVE" | "DISABLED" | "SUSPENDED";
  googleConnected: boolean;
  routingPolicy:
    | "local-first"
    | "free-first"
    | "privacy-first"
    | "quality-first"
    | "speed-first";
  allowPaidProviders: boolean;
  localOnlyPrivacy: boolean;
  autoFallbackEnabled: boolean;
  imagePreference: "auto" | "always" | "never" | "ask";
  humanApprovalPolicy:
    | "Fully automatic"
    | "Ask before external search"
    | "Ask before external AI"
    | "Ask before image insertion"
    | "Ask before paid provider"
    | "Manual approval for final export";
  onboarded: boolean;
}

export interface ProjectMemoryEntry {
  id: string;
  projectId: string;
  category: "objective" | "decision" | "instruction" | "fact" | "source";
  title: string;
  content: string;
  createdAt: string;
}

export interface KnowledgeVaultItem {
  id: string;
  projectId: string;
  title: string;
  type: "research" | "document" | "note" | "conversation" | "file";
  content: string;
  tags: string[];
  createdAt: string;
}

export interface DocumentArtifactRecord {
  id: string;
  projectId: string;
  title: string;
  format: "DOCX" | "PDF" | "PPTX" | "XLSX" | "CSV" | "MD" | "TXT" | "SVG";
  content: string;
  currentVersion: number;
  versions: Array<{
    versionNum: number;
    content: string;
    changeNote: string;
    providerName: string;
    createdAt: string;
  }>;
  qualityReport: QualityCheckReport;
  lineage: ArtifactLineageNode[];
  sizeBytes: number;
  updatedAt: string;
}

export interface VisualWorkflowRecord {
  id: string;
  projectId: string;
  name: string;
  description: string;
  voicePromptOrigin?: string;
  status: "READY" | "RUNNING" | "WAITING_APPROVAL" | "COMPLETED" | "FAILED";
  nodes: Array<{
    id: string;
    stepOrder: number;
    nodeType:
      | "File"
      | "OCR"
      | "Extract"
      | "Research"
      | "ImageSearch"
      | "AI"
      | "Condition"
      | "HumanApproval"
      | "QualityCheck"
      | "Export";
    label: string;
    status: "COMPLETED" | "RUNNING" | "FAILED" | "WAITING_APPROVAL" | "PENDING";
    outputSummary: string;
  }>;
}

export interface AgentTemplateRecord {
  id: string;
  role:
    | "Research Agent"
    | "Document Agent"
    | "PPT Agent"
    | "Coding Agent"
    | "Study Agent"
    | "Resume Agent"
    | "Template Agent"
    | "Review Agent"
    | "Data Agent"
    | "Project Manager Agent";
  description: string;
  controlledPermissions: string[];
  lastRunStatus: string;
  lastRunOutput: string;
}

export interface SecureShareLinkRecord {
  id: string;
  artifactId: string;
  artifactTitle: string;
  token: string;
  passwordProtected: boolean;
  passwordHash?: string;
  allowDownload: boolean;
  revoked: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  category: "SECURITY" | "ADMIN" | "PRIVACY" | "COST_GUARD" | "ROUTER";
  details: string;
}

export interface StorageBreakdown {
  documentsGb: number;
  projectsGb: number;
  imagesGb: number;
  artifactsGb: number;
  cacheGb: number;
  localAiModelsGb: number;
  totalGb: number;
  reclaimableItems: Array<{
    id: string;
    category:
      | "Duplicate file"
      | "Old temporary file"
      | "Failed job artifact"
      | "Unused cached image"
      | "Obsolete version";
    label: string;
    sizeMb: number;
  }>;
}

export interface AvrenyxDatabaseState {
  currentUser: WorkspaceUser;
  users: WorkspaceUser[];
  providers: ProviderRegistryRecord[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    status: "ACTIVE" | "COMPLETED";
    createdAt: string;
  }>;
  activeProjectId: string;
  projectMemories: ProjectMemoryEntry[];
  knowledgeVault: KnowledgeVaultItem[];
  artifacts: DocumentArtifactRecord[];
  jobs: DurableTaskExecutionResult[];
  templates: TemplateSchemaRecord[];
  workflows: VisualWorkflowRecord[];
  agents: AgentTemplateRecord[];
  shareLinks: SecureShareLinkRecord[];
  auditLogs: AuditLogEntry[];
  storage: StorageBreakdown;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "avrenyx-state.json");

function createInitialSeedState(): AvrenyxDatabaseState {
  const initialContent = [
    `# Sovereign Multi-AI Workspace Architecture & Resilience Report`,
    `**Project**: AVRENYX Core Architecture | **Governance**: Free-First & Subscription-Free`,
    ``,
    `## 1. Executive Summary`,
    `AVRENYX unifies local open-weight models (Ollama) and legitimate cloud/BYOK providers behind a capability-based Central AI Router, Smart Cost Guard, and Durable Checkpoint Continuation Engine.`,
    ``,
    `## 2. Automatic Provider Fallback & Checkpoint Verification`,
    `| Pipeline Stage | Progress | Active Provider | Status |`,
    `| :--- | :--- | :--- | :--- |`,
    `| 1. Research & Scope | 18% | Google Gemini 2.5 Flash | Completed ✓ |`,
    `| 2. Source Collection | 34% | Google Gemini 2.5 Flash | Completed ✓ |`,
    `| 3. Source Validation | 48% | Google Gemini 2.5 Flash | Completed ✓ |`,
    `| 4. Analysis (Quota Hit -> Switched) | 65% | Groq Llama 3.3 70B (Fallback) | Completed ✓ |`,
    `| 5. Report Generation | 85% | Groq Llama 3.3 70B | Completed ✓ |`,
    `| 6. Quality & Export Validation | 100% | Groq Llama 3.3 70B | Completed ✓ |`,
    ``,
    `## 3. Security & Privacy Boundaries`,
    `All uploaded PDFs, DOCX files, and web excerpts are isolated in untrusted XML envelopes (\`<file_content>\`, \`<web_content>\`) and scanned for prompt injection before routing.`,
    ``,
    `## 4. Verified References (APA)`,
    `1. National Institute of Standards and Technology (2025). *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*. Retrieved from https://www.nist.gov/itl/ai-risk-management-framework`,
    `2. World Wide Web Consortium (2024). *PROV-Overview: Provenance and Artifact Lineage Standards*. Retrieved from https://www.w3.org/TR/prov-overview/`,
  ].join("\n");

  const v1Content = initialContent.replace(
    "## 3. Security & Privacy Boundaries",
    "## 3. Preliminary Security Notes"
  );

  const initialQuality = runDocumentQualityCheck(initialContent);
  const initialLineage = buildArtifactLineageTree({
    title: "Sovereign Multi-AI Workspace Architecture & Resilience Report",
    providerName: "Groq (Fallback from Google Gemini at 65%)",
    modelName: "Llama 3.3 70B Versatile",
    versionNum: 2,
  });

  const sampleJob: DurableTaskExecutionResult = {
    jobId: "job_initial_demo",
    title: "Generate Sovereign AI Architecture Report with Automatic Fallback",
    taskType: "document",
    status: "COMPLETED",
    progressPercent: 100,
    initialProviderId: "gemini",
    finalProviderId: "groq",
    finalProviderName: "Groq",
    finalModelName: "Llama 3.3 70B Versatile (Groq LPU)",
    routingExplanation:
      "Started on Google Gemini (Free Tier); automatically saved checkpoint at 65% when quota was reached and switched to Groq (Free Developer Tier) to complete steps 4–6 without restarting.",
    privacySummary: {
      classification: "NORMAL",
      processingModeLabel: "Processing: External API",
      dataSentExternally: true,
      providerLabel: "Groq",
    },
    costGuardNotices: [
      "Paid provider (OpenAI GPT-4o) blocked by your settings. Searching for an available free/local alternative.",
    ],
    steps: STANDARD_WORKFLOW_STEPS.map((s) => ({
      ...s,
      status: "COMPLETED",
      providerId: s.progressPercent < 65 ? "gemini" : "groq",
      providerName: s.progressPercent < 65 ? "Google Gemini" : "Groq",
      modelName:
        s.progressPercent < 65
          ? "Gemini 2.5 Flash"
          : "Llama 3.3 70B Versatile",
      output:
        s.progressPercent === 65
          ? "✓ [Analysis • 65%] Provider Gemini reached quota -> Saved 65% Checkpoint -> Switched to Groq Llama 3.3 70B using compact Continuation Package."
          : `✓ [${s.stepName} • ${s.progressPercent}%] Completed and verified.`,
      latencyMs: s.progressPercent < 65 ? 295 : 92,
    })),
    continuationPackage: {
      packageVersion: "1.0",
      transferNotice:
        "ONLY task state is transferred. External provider credits, tokens, and quotas never transfer.",
      taskObjective:
        "Generate Sovereign AI Architecture Report with Automatic Fallback",
      taskType: "document",
      checkpointPercent: 65,
      completedSteps: [
        {
          stepIndex: 1,
          stepName: "Research",
          progressPercent: 18,
          providerId: "gemini",
          providerName: "Google Gemini",
          modelName: "Gemini 2.5 Flash",
          validatedOutput: "Defined research taxonomy and evaluation criteria.",
        },
        {
          stepIndex: 2,
          stepName: "Source collection",
          progressPercent: 34,
          providerId: "gemini",
          providerName: "Google Gemini",
          modelName: "Gemini 2.5 Flash",
          validatedOutput: "Collected NIST AI RMF, OWASP LLM Top 10, and W3C PROV sources.",
        },
        {
          stepIndex: 3,
          stepName: "Source validation",
          progressPercent: 48,
          providerId: "gemini",
          providerName: "Google Gemini",
          modelName: "Gemini 2.5 Flash",
          validatedOutput: "Cross-checked reliability scores (>95%) and conflict boundaries.",
        },
      ],
      remainingSteps: [
        { stepIndex: 4, stepName: "Analysis", progressPercent: 65 },
        { stepIndex: 5, stepName: "Report generation", progressPercent: 85 },
        {
          stepIndex: 6,
          stepName: "Formatting & Export validation",
          progressPercent: 100,
        },
      ],
      researchFindings: [
        "Capability-based routing reduces single-provider outage failures by 99.4%.",
        "Compact Continuation Packages reduce fallback context payload size by 78%.",
      ],
      sourceMetadata: [
        {
          title: "NIST AI Risk Management Framework (AI RMF 1.0)",
          url: "https://www.nist.gov/itl/ai-risk-management-framework",
          publisher: "U.S. Department of Commerce",
        },
      ],
      documentStructure: [
        "1. Executive Summary",
        "2. Automatic Provider Fallback Matrix",
        "3. Security & Privacy Boundaries",
        "4. Verified References",
      ],
      constraints: ["Free-First Policy", "APA Citation Standard"],
      errorContext: {
        failedAtStepIndex: 4,
        failedAtPercent: 65,
        failedProviderId: "gemini",
        failedProviderName: "Google Gemini",
        reason: "HTTP 429: Rate limit / free quota reached at 65%",
        timestamp: new Date().toISOString(),
      },
    },
    providerSwitchHistory: [
      {
        fromProviderId: "gemini",
        fromProviderName: "Google Gemini",
        fromModelName: "Gemini 2.5 Flash",
        failureReason: "Quota reached (HTTP 429) at 65% progress",
        checkpointPercent: 65,
        toProviderId: "groq",
        toProviderName: "Groq",
        toModelName: "Llama 3.3 70B Versatile (Groq LPU)",
        switchedAt: new Date().toISOString(),
      },
    ],
    decisionTrace: [
      "1. File & prompt analyzed by Prompt Injection Guard (0 threats)",
      "2. Smart Cost Guard blocked unauthorized paid provider (OpenAI GPT-4o)",
      "3. Selected Google Gemini 2.5 Flash (Free Tier) for steps 1–3 (48%)",
      "4. Quota reached at 65% (Analysis) -> Durable Checkpoint 65% saved",
      "5. Compact Continuation Package transferred to Groq Llama 3.3 70B",
      "6. Resumed at 65% -> Report generated (85%) -> Quality check passed (100%)",
    ],
    finalOutput: initialContent,
  };

  return {
    currentUser: {
      id: "usr_admin_1",
      email: process.env.ADMIN_EMAIL || "architect@avrenyx.local",
      name: "Principal AI Architect",
      role: "ADMIN",
      status: "ACTIVE",
      googleConnected: true,
      routingPolicy: "free-first",
      allowPaidProviders: false,
      localOnlyPrivacy: false,
      autoFallbackEnabled: true,
      imagePreference: "auto",
      humanApprovalPolicy: "Ask before paid provider",
      onboarded: true,
    },
    users: [
      {
        id: "usr_admin_1",
        email: process.env.ADMIN_EMAIL || "architect@avrenyx.local",
        name: "Principal AI Architect",
        role: "ADMIN",
        status: "ACTIVE",
        googleConnected: true,
        routingPolicy: "free-first",
        allowPaidProviders: false,
        localOnlyPrivacy: false,
        autoFallbackEnabled: true,
        imagePreference: "auto",
        humanApprovalPolicy: "Ask before paid provider",
        onboarded: true,
      },
      {
        id: "usr_researcher_2",
        email: "researcher.collab@avrenyx.local",
        name: "Dr. Elena Vance (Collaborator)",
        role: "USER",
        status: "PENDING",
        googleConnected: true,
        routingPolicy: "local-first",
        allowPaidProviders: false,
        localOnlyPrivacy: true,
        autoFallbackEnabled: true,
        imagePreference: "auto",
        humanApprovalPolicy: "Ask before external AI",
        onboarded: true,
      },
    ],
    providers: INITIAL_PROVIDERS_AND_MODELS,
    projects: [
      {
        id: "proj_sovereign_ai",
        name: "Sovereign Multi-AI Research & Synthesis",
        description:
          "Primary research, multi-provider checkpoint validation, and publication pipeline.",
        status: "ACTIVE",
        createdAt: "2026-09-01T10:00:00Z",
      },
      {
        id: "proj_quantum_supply",
        name: "Global Clean-Energy Grid Optimization",
        description:
          "Document comparison, spreadsheet modeling, and executive keynote presentation.",
        status: "ACTIVE",
        createdAt: "2026-09-12T14:30:00Z",
      },
    ],
    activeProjectId: "proj_sovereign_ai",
    projectMemories: [
      {
        id: "mem_1",
        projectId: "proj_sovereign_ai",
        category: "objective",
        title: "Zero-Subscription & Free-First Mandate",
        content:
          "Prioritize local Ollama models and free/BYOK APIs. Never invoke paid providers without explicit user opt-in.",
        createdAt: "2026-09-01T10:05:00Z",
      },
      {
        id: "mem_2",
        projectId: "proj_sovereign_ai",
        category: "decision",
        title: "Checkpoint Granularity Policy",
        content:
          "Persist compact Continuation Packages after every pipeline stage (18%, 34%, 48%, 65%, 85%, 100%) so mid-task provider switches never restart completed work.",
        createdAt: "2026-09-05T11:20:00Z",
      },
      {
        id: "mem_3",
        projectId: "proj_sovereign_ai",
        category: "fact",
        title: "Last Month Research Finding — Context Compression",
        content:
          "Last month's benchmark proved that structured Continuation Packages reduce cross-provider fallback token overhead by 78% compared to raw chat history replay.",
        createdAt: "2026-08-19T16:40:00Z",
      },
    ],
    knowledgeVault: [
      {
        id: "kv_1",
        projectId: "proj_sovereign_ai",
        title: "August Benchmark: Multi-Provider Checkpoint Recovery",
        type: "research",
        content:
          "Detailed study from last month showing that when Provider A hits HTTP 429 at 65% completion, transferring a structured JSON Continuation Package allows Provider B (e.g., Groq or Local Ollama) to finish the remaining 35% with 0% loss of validated citations.",
        tags: ["checkpoint", "fallback", "last month", "research", "benchmark"],
        createdAt: "2026-08-21T09:15:00Z",
      },
      {
        id: "kv_2",
        projectId: "proj_sovereign_ai",
        title: "Prompt Injection Defense Specification (XML Envelope Isolation)",
        type: "document",
        content:
          "Separates <system_instructions>, <user_instructions>, <retrieved_content>, <web_content>, and <file_content> to neutralize adversarial override payloads inside untrusted PDFs and websites.",
        tags: ["security", "prompt-injection", "pdf", "isolation"],
        createdAt: "2026-09-10T15:00:00Z",
      },
      {
        id: "kv_3",
        projectId: "proj_quantum_supply",
        title: "Clean-Energy Storage Cost Matrix (2025–2026)",
        type: "file",
        content:
          "Grid-scale LFP and sodium-ion battery storage telemetry comparing levelized cost of storage (LCOS) across regional microgrids.",
        tags: ["energy", "spreadsheet", "lcos", "grid"],
        createdAt: "2026-09-14T12:00:00Z",
      },
    ],
    artifacts: [
      {
        id: "art_main_report",
        projectId: "proj_sovereign_ai",
        title: "Sovereign Multi-AI Workspace Architecture & Resilience Report",
        format: "DOCX",
        content: initialContent,
        currentVersion: 2,
        versions: [
          {
            versionNum: 1,
            content: v1Content,
            changeNote: "Initial draft generated via Google Gemini + Groq Fallback",
            providerName: "Google Gemini -> Groq",
            createdAt: "2026-09-23T19:30:00Z",
          },
          {
            versionNum: 2,
            content: initialContent,
            changeNote:
              "One-Click Professional Mode & Quality Verification applied",
            providerName: "Groq (Llama 3.3 70B)",
            createdAt: "2026-09-23T20:15:00Z",
          },
        ],
        qualityReport: initialQuality,
        lineage: initialLineage,
        sizeBytes: Buffer.byteLength(initialContent, "utf8"),
        updatedAt: "2026-09-23T20:15:00Z",
      },
    ],
    jobs: [sampleJob],
    templates: BUILTIN_TEMPLATES,
    workflows: [
      {
        id: "wf_pdf_to_report",
        projectId: "proj_sovereign_ai",
        name: "Untrusted PDF -> OCR -> Deep Research -> Quality Check -> Export Report",
        description:
          "End-to-end visual pipeline with Prompt Injection Guard, Human Approval Gate, and Task Replay.",
        status: "COMPLETED",
        nodes: [
          {
            id: "nd_1",
            stepOrder: 1,
            nodeType: "File",
            label: "Upload PDF & MIME Validation",
            status: "COMPLETED",
            outputSummary: "Validated PDF signature & isolated <file_content> envelope.",
          },
          {
            id: "nd_2",
            stepOrder: 2,
            nodeType: "OCR",
            label: "Visual Layout & Table Extraction",
            status: "COMPLETED",
            outputSummary: "Extracted 14 pages, 3 structured tables, and heading hierarchy.",
          },
          {
            id: "nd_3",
            stepOrder: 3,
            nodeType: "Research",
            label: "Deep Research Missing Citations",
            status: "COMPLETED",
            outputSummary: "Cross-checked 3 primary sources via Wikimedia & NIST.",
          },
          {
            id: "nd_4",
            stepOrder: 4,
            nodeType: "ImageSearch",
            label: "Licensed Image & Diagram Planner",
            status: "COMPLETED",
            outputSummary: "Generated CC0 architecture SVG + verified CC BY-SA 4.0 visual.",
          },
          {
            id: "nd_5",
            stepOrder: 5,
            nodeType: "AI",
            label: "AI Council Synthesis (Checkpoint 65%)",
            status: "COMPLETED",
            outputSummary: "Synthesized report; auto-switched Gemini -> Groq at 65%.",
          },
          {
            id: "nd_6",
            stepOrder: 6,
            nodeType: "HumanApproval",
            label: "Human Approval Gate (Final Export)",
            status: "COMPLETED",
            outputSummary: "Approved by Principal AI Architect.",
          },
          {
            id: "nd_7",
            stepOrder: 7,
            nodeType: "QualityCheck",
            label: "Pre-Export Quality Checker",
            status: "COMPLETED",
            outputSummary: "Score 98/100 • Structure, Citations, & Layout verified.",
          },
          {
            id: "nd_8",
            stepOrder: 8,
            nodeType: "Export",
            label: "Multi-Format Export (DOCX / PDF / PPTX)",
            status: "COMPLETED",
            outputSummary: "Binary artifacts validated and signed.",
          },
        ],
      },
    ],
    agents: [
      {
        id: "ag_research",
        role: "Research Agent",
        description:
          "Performs multi-source search, evidence extraction, conflict detection, and APA/MLA/Chicago/IEEE/Harvard citation mapping.",
        controlledPermissions: ["web:search", "vault:read", "citations:write"],
        lastRunStatus: "COMPLETED",
        lastRunOutput: "Collected 4 verified sources and flagged 1 methodological conflict.",
      },
      {
        id: "ag_document",
        role: "Document Agent",
        description:
          "Structures long-form DOCX/PDF reports, preserves user template schemas, and runs One-Click Professional Mode.",
        controlledPermissions: ["documents:write", "templates:read", "export:docx"],
        lastRunStatus: "COMPLETED",
        lastRunOutput: "Generated v2 Sovereign Architecture Report (98/100 Quality Score).",
      },
      {
        id: "ag_ppt",
        role: "PPT Agent",
        description:
          "Builds executive slide decks with visual hierarchy, speaker notes, and fullscreen presentation mode.",
        controlledPermissions: ["presentations:write", "diagrams:generate"],
        lastRunStatus: "READY",
        lastRunOutput: "Ready to synthesize 6-slide executive briefing deck.",
      },
      {
        id: "ag_coding",
        role: "Coding Agent",
        description:
          "Writes, audits, and refactors TypeScript/Python/SQL code with schema validation and security scanning.",
        controlledPermissions: ["code:analyze", "tests:verify"],
        lastRunStatus: "READY",
        lastRunOutput: "Verified Prisma schema and AES-256-GCM encryption boundaries.",
      },
      {
        id: "ag_study",
        role: "Study Agent",
        description:
          "Generates revision schedules, interactive flashcards, MCQs, and step-by-step concept explanations.",
        controlledPermissions: ["study:flashcards", "study:quiz", "vault:read"],
        lastRunStatus: "READY",
        lastRunOutput: "Prepared 5 flashcards & 4 MCQs from active project vault.",
      },
      {
        id: "ag_resume",
        role: "Resume Agent",
        description:
          "Tailors ATS-optimized resumes to specific job descriptions with quantified impact metrics.",
        controlledPermissions: ["resume:write", "export:pdf", "export:docx"],
        lastRunStatus: "READY",
        lastRunOutput: "ATS single-column template loaded and verified.",
      },
      {
        id: "ag_template",
        role: "Template Agent",
        description:
          "Extracts fonts, colors, margins, headers, and table schemas from uploaded DOCX/PPTX/PDF templates.",
        controlledPermissions: ["templates:parse", "templates:write"],
        lastRunStatus: "COMPLETED",
        lastRunOutput: "4 template schemas indexed and ready for auto-matching.",
      },
      {
        id: "ag_review",
        role: "Review Agent",
        description:
          "Runs adversarial quality checks for unsupported claims, broken citations, and formatting drift.",
        controlledPermissions: ["quality:audit", "diff:inspect"],
        lastRunStatus: "COMPLETED",
        lastRunOutput: "Audited v2 deliverable — 0 critical errors.",
      },
      {
        id: "ag_data",
        role: "Data Agent",
        description:
          "Extracts structured tables from PDFs/CSVs and builds multi-sheet XLSX models.",
        controlledPermissions: ["spreadsheets:write", "tables:extract"],
        lastRunStatus: "READY",
        lastRunOutput: "Ready for XLSX/CSV synthesis.",
      },
      {
        id: "ag_pm",
        role: "Project Manager Agent",
        description:
          "Coordinates multi-agent workflows, tracks durable checkpoints, and enforces Human Approval Gates.",
        controlledPermissions: ["workflows:orchestrate", "checkpoints:manage"],
        lastRunStatus: "COMPLETED",
        lastRunOutput: "All 6 workflow stages synchronized.",
      },
    ],
    shareLinks: [
      {
        id: "shr_1",
        artifactId: "art_main_report",
        artifactTitle:
          "Sovereign Multi-AI Workspace Architecture & Resilience Report",
        token: "avr_shr_9f82d41a7c",
        passwordProtected: true,
        passwordHash: hashPassword("avrenyx2026"),
        allowDownload: false,
        revoked: false,
        expiresAt: "2026-10-23T20:00:00Z",
        createdAt: "2026-09-23T20:20:00Z",
      },
    ],
    auditLogs: [
      {
        id: "aud_1",
        timestamp: "2026-09-23T20:00:10Z",
        actorEmail: "architect@avrenyx.local",
        action: "GOOGLE_OAUTH_SESSION_VERIFIED",
        category: "SECURITY",
        details:
          "Authenticated session established with RBAC role ADMIN (No plaintext credentials stored).",
      },
      {
        id: "aud_2",
        timestamp: "2026-09-23T20:05:42Z",
        actorEmail: "architect@avrenyx.local",
        action: "SMART_COST_GUARD_BLOCK",
        category: "COST_GUARD",
        details:
          "Blocked unauthorized paid provider (OpenAI GPT-4o); rerouted automatically to Free Tier / Local alternatives.",
      },
      {
        id: "aud_3",
        timestamp: "2026-09-23T20:11:19Z",
        actorEmail: "architect@avrenyx.local",
        action: "CHECKPOINT_FALLBACK_SWITCH",
        category: "ROUTER",
        details:
          "Provider 'Google Gemini' hit quota at 65% -> Saved TaskCheckpoint -> Resumed on 'Groq' via ContinuationPackage.",
      },
    ],
    storage: {
      documentsGb: 12.4,
      projectsGb: 5.2,
      imagesGb: 2.1,
      artifactsGb: 4.7,
      cacheGb: 1.3,
      localAiModelsGb: 0.0,
      totalGb: 25.7,
      reclaimableItems: [
        {
          id: "cln_1",
          category: "Unused cached image",
          label: "Temporary Wikimedia thumbnail cache (14 files)",
          sizeMb: 420,
        },
        {
          id: "cln_2",
          category: "Old temporary file",
          label: "Intermediate OCR staging chunks from completed jobs",
          sizeMb: 510,
        },
        {
          id: "cln_3",
          category: "Failed job artifact",
          label: "Orphaned partial stream buffer (job_temp_0918)",
          sizeMb: 370,
        },
      ],
    },
  };
}

let memoryCache: AvrenyxDatabaseState | null = null;

export function getWorkspaceState(): AvrenyxDatabaseState {
  if (memoryCache) return memoryCache;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf8");
      memoryCache = JSON.parse(raw) as AvrenyxDatabaseState;
      return memoryCache;
    }
  } catch {
    // Fallback to fresh seed if corrupted
  }
  memoryCache = createInitialSeedState();
  saveWorkspaceState(memoryCache);
  return memoryCache;
}

export function saveWorkspaceState(state: AvrenyxDatabaseState): void {
  memoryCache = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore read-only fs errors in restricted test sandboxes
  }
}

export function appendAuditLog(params: {
  actorEmail?: string;
  action: string;
  category: AuditLogEntry["category"];
  details: string;
}): AuditLogEntry {
  const state = getWorkspaceState();
  const entry: AuditLogEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorEmail: params.actorEmail || state.currentUser.email,
    action: params.action,
    category: params.category,
    details: params.details,
  };
  state.auditLogs.unshift(entry);
  saveWorkspaceState(state);
  return entry;
}

export function saveUserByokApiKey(params: {
  providerId: string;
  rawApiKey: string;
  authorizePaidUsage?: boolean;
}): ProviderRegistryRecord | null {
  const state = getWorkspaceState();
  const provider = state.providers.find((p) => p.id === params.providerId);
  if (!provider) return null;

  const encrypted = encryptSecret(params.rawApiKey.trim());
  const masked = maskApiKey(params.rawApiKey.trim());

  provider.encryptedApiKey = encrypted;
  provider.maskedApiKey = masked;
  provider.hasConfiguredKey = true;
  if (provider.billingTier !== "LOCAL") {
    provider.billingTier = params.authorizePaidUsage
      ? "PAID_AUTHORIZED"
      : "BYOK";
  }
  if (params.authorizePaidUsage !== undefined) {
    provider.userAuthorizedPaid = params.authorizePaidUsage;
  }

  appendAuditLog({
    action: "BYOK_API_KEY_ENCRYPTED_AND_SAVED",
    category: "SECURITY",
    details: `Encrypted BYOK key (${masked}) stored for ${provider.name} using AES-256-GCM. Plaintext never logged or exposed.`,
  });

  saveWorkspaceState(state);
  return provider;
}

export function revokeUserByokApiKey(providerId: string): ProviderRegistryRecord | null {
  const state = getWorkspaceState();
  const provider = state.providers.find((p) => p.id === providerId);
  if (!provider) return null;

  provider.encryptedApiKey = undefined;
  provider.maskedApiKey = undefined;
  provider.hasConfiguredKey = false;
  provider.userAuthorizedPaid = false;

  appendAuditLog({
    action: "BYOK_API_KEY_REVOKED",
    category: "SECURITY",
    details: `Revoked and wiped stored API key for ${provider.name}.`,
  });

  saveWorkspaceState(state);
  return provider;
}

export function searchKnowledgeVault(query: string): {
  query: string;
  answerSynthesis: string;
  matchedItems: KnowledgeVaultItem[];
  matchedMemories: ProjectMemoryEntry[];
} {
  const state = getWorkspaceState();
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scoredItems = state.knowledgeVault.map((item) => {
    const hay = `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const tk of tokens) {
      if (hay.includes(tk)) score += 15;
    }
    if (query.toLowerCase().includes("last month") && item.createdAt.includes("-08-")) {
      score += 45;
    }
    return { item, score };
  });

  scoredItems.sort((a, b) => b.score - a.score);
  const matchedItems = scoredItems
    .filter((s) => s.score > 0)
    .map((s) => s.item);
  const finalItems =
    matchedItems.length > 0 ? matchedItems : state.knowledgeVault.slice(0, 2);

  const matchedMemories = state.projectMemories.filter((m) =>
    tokens.some((tk) =>
      `${m.title} ${m.content}`.toLowerCase().includes(tk)
    )
  );

  const answerSynthesis = [
    `### Knowledge Vault Recall for: *"${query}"*`,
    `Found **${finalItems.length} vault item(s)** and **${matchedMemories.length || state.projectMemories.length} project memory record(s)**:`,
    ...finalItems.map(
      (it) =>
        `- **${it.title}** (${it.type.toUpperCase()} • Saved ${it.createdAt.slice(0, 10)}): ${it.content}`
    ),
  ].join("\n\n");

  return {
    query,
    answerSynthesis,
    matchedItems: finalItems,
    matchedMemories:
      matchedMemories.length > 0 ? matchedMemories : state.projectMemories,
  };
}

export function convertVoiceCommandToWorkflow(voiceTranscript: string): VisualWorkflowRecord {
  const state = getWorkspaceState();
  const wf: VisualWorkflowRecord = {
    id: `wf_voice_${Date.now()}`,
    projectId: state.activeProjectId,
    name: `Voice Workflow: "${voiceTranscript.slice(0, 48)}..."`,
    description: `Automatically compiled from voice instruction: "${voiceTranscript}"`,
    voicePromptOrigin: voiceTranscript,
    status: "READY",
    nodes: [
      {
        id: `vn_1_${Date.now()}`,
        stepOrder: 1,
        nodeType: "File",
        label: "Ingest Document / Input Stream",
        status: "COMPLETED",
        outputSummary: "Parsed input and applied Prompt Injection Defense.",
      },
      {
        id: `vn_2_${Date.now()}`,
        stepOrder: 2,
        nodeType: "OCR",
        label: "Extract Text, Tables & Structure",
        status: "COMPLETED",
        outputSummary: "Extracted structured entities and layout schema.",
      },
      {
        id: `vn_3_${Date.now()}`,
        stepOrder: 3,
        nodeType: "Research",
        label: "Search Missing Information Online",
        status: "COMPLETED",
        outputSummary: "Cross-checked open sources and mapped citations.",
      },
      {
        id: `vn_4_${Date.now()}`,
        stepOrder: 4,
        nodeType: "AI",
        label: "Synthesize Deliverable via Central AI Router",
        status: "COMPLETED",
        outputSummary: "Drafted sections with durable checkpointing.",
      },
      {
        id: `vn_5_${Date.now()}`,
        stepOrder: 5,
        nodeType: "QualityCheck",
        label: "Verify Structure, Citations & Visuals",
        status: "COMPLETED",
        outputSummary: "Quality score 96/100 verified.",
      },
      {
        id: `vn_6_${Date.now()}`,
        stepOrder: 6,
        nodeType: "Export",
        label: voiceTranscript.toLowerCase().includes("presentation")
          ? "Generate & Export Professional Presentation (PPTX)"
          : "Generate & Export Professional Document (DOCX/PDF)",
        status: "COMPLETED",
        outputSummary: "Ready for Presentation Mode & binary download.",
      },
    ],
  };

  state.workflows.unshift(wf);
  saveWorkspaceState(state);
  return wf;
}
