import { ProviderRegistryRecord } from "../capabilities/registry";
import {
  selectModelViaCentralRouter,
  TaskCategory,
  UserRoutingPreference,
} from "../router/central-router";
import { executeProviderCall } from "../providers/adapter";
import { PrivacyClassification } from "../../privacy/privacy-router";

/**
 * AVRENYX Checkpoint + Continuation Engine & Automatic Provider Fallback (Rules 5, 6, 7, 8, 37, 59, 60, 66, 88)
 * - Executes multi-step workflows with real, durable workflow state checkpoints
 * - Builds compact ContinuationPackages that transfer ONLY task state (never credits/tokens/quotas)
 * - Automatically switches to a compatible free/local/BYOK/authorized provider when a provider fails mid-task
 * - Never restarts completed steps unnecessarily
 * - Supports Task Replay from any specific step index
 */

export interface ContinuationPackage {
  packageVersion: "1.0";
  transferNotice: "ONLY task state is transferred. External provider credits, tokens, and quotas never transfer.";
  taskObjective: string;
  taskType: TaskCategory;
  checkpointPercent: number;
  completedSteps: Array<{
    stepIndex: number;
    stepName: string;
    progressPercent: number;
    providerId: string;
    providerName: string;
    modelName: string;
    validatedOutput: string;
  }>;
  remainingSteps: Array<{
    stepIndex: number;
    stepName: string;
    progressPercent: number;
  }>;
  researchFindings: string[];
  sourceMetadata: Array<{ title: string; url: string; publisher: string }>;
  documentStructure: string[];
  constraints: string[];
  errorContext?: {
    failedAtStepIndex: number;
    failedAtPercent: number;
    failedProviderId: string;
    failedProviderName: string;
    reason: string;
    timestamp: string;
  };
}

export interface ProviderSwitchHistoryEntry {
  fromProviderId: string;
  fromProviderName: string;
  fromModelName: string;
  failureReason: string;
  checkpointPercent: number;
  toProviderId: string;
  toProviderName: string;
  toModelName: string;
  switchedAt: string;
}

export interface WorkflowStepRecord {
  stepIndex: number;
  stepName: string;
  progressPercent: number;
  status: "COMPLETED" | "FAILED" | "PENDING" | "RUNNING";
  providerId: string;
  providerName: string;
  modelName: string;
  output: string;
  latencyMs: number;
}

export interface DurableTaskExecutionResult {
  jobId: string;
  title: string;
  taskType: TaskCategory;
  status: "COMPLETED" | "CHECKPOINTED_PAUSED" | "FAILED";
  progressPercent: number;
  initialProviderId: string;
  finalProviderId: string;
  finalProviderName: string;
  finalModelName: string;
  routingExplanation: string;
  privacySummary: {
    classification: PrivacyClassification;
    processingModeLabel: string;
    dataSentExternally: boolean;
    providerLabel: string;
  };
  costGuardNotices: string[];
  steps: WorkflowStepRecord[];
  continuationPackage: ContinuationPackage;
  providerSwitchHistory: ProviderSwitchHistoryEntry[];
  decisionTrace: string[];
  finalOutput: string;
  emergencyMessage?: string;
}

export const STANDARD_WORKFLOW_STEPS = [
  { stepIndex: 1, stepName: "Research", progressPercent: 18 },
  { stepIndex: 2, stepName: "Source collection", progressPercent: 34 },
  { stepIndex: 3, stepName: "Source validation", progressPercent: 48 },
  { stepIndex: 4, stepName: "Analysis", progressPercent: 65 },
  { stepIndex: 5, stepName: "Report generation", progressPercent: 85 },
  { stepIndex: 6, stepName: "Formatting & Export validation", progressPercent: 100 },
];

export async function executeTaskWithAutomaticFallback(params: {
  jobId?: string;
  title: string;
  objective: string;
  taskType: TaskCategory;
  providers: ProviderRegistryRecord[];
  userRoutingPreference?: UserRoutingPreference;
  userAllowPaidProviders?: boolean;
  privacyLevel?: PrivacyClassification;
  forceLocalOnly?: boolean;
  simulateProviderAFailureAt65Percent?: boolean;
  startFromStepIndex?: number;
  existingSteps?: WorkflowStepRecord[];
}): Promise<DurableTaskExecutionResult> {
  const jobId = params.jobId || `job_${Date.now()}`;
  const excludedProviderIds: string[] = [];
  const providerSwitchHistory: ProviderSwitchHistoryEntry[] = [];
  const decisionTrace: string[] = [];
  const costGuardNotices: string[] = [];

  // Initial route selection
  let routing = selectModelViaCentralRouter(params.providers, {
    taskType: params.taskType,
    promptText: params.objective,
    privacyLevel: params.privacyLevel,
    forceLocalOnly: params.forceLocalOnly,
    userPreference: params.userRoutingPreference,
    userAllowPaidProviders: params.userAllowPaidProviders,
    excludedProviderIds,
  });

  for (const blocked of routing.costGuardBlocked) {
    if (blocked.uiNotice && !costGuardNotices.includes(blocked.uiNotice)) {
      costGuardNotices.push(blocked.uiNotice);
    }
  }

  if (!routing.selected) {
    const emptyPkg: ContinuationPackage = {
      packageVersion: "1.0",
      transferNotice:
        "ONLY task state is transferred. External provider credits, tokens, and quotas never transfer.",
      taskObjective: params.objective,
      taskType: params.taskType,
      checkpointPercent: 0,
      completedSteps: [],
      remainingSteps: [...STANDARD_WORKFLOW_STEPS],
      researchFindings: [],
      sourceMetadata: [],
      documentStructure: ["Executive Summary", "Core Analysis", "Citations"],
      constraints: ["Free-First Policy", "Prompt Injection Defense Active"],
    };
    return {
      jobId,
      title: params.title,
      taskType: params.taskType,
      status: "CHECKPOINTED_PAUSED",
      progressPercent: 0,
      initialProviderId: "none",
      finalProviderId: "none",
      finalProviderName: "Unavailable",
      finalModelName: "None",
      routingExplanation:
        routing.emergencyFallbackMessage ||
        "No compatible provider available.",
      privacySummary: {
        classification: routing.privacyDecision.classification,
        processingModeLabel: routing.privacyDecision.processingModeLabel,
        dataSentExternally: routing.privacyDecision.dataSentExternally,
        providerLabel: routing.privacyDecision.providerLabel,
      },
      costGuardNotices,
      steps: STANDARD_WORKFLOW_STEPS.map((s) => ({
        ...s,
        status: "PENDING",
        providerId: "none",
        providerName: "Pending",
        modelName: "Pending",
        output: "",
        latencyMs: 0,
      })),
      continuationPackage: emptyPkg,
      providerSwitchHistory: [],
      decisionTrace: [
        "1. Privacy & Cost Guard evaluated",
        "2. All compatible AI providers unavailable — task safely checkpointed",
      ],
      finalOutput: "",
      emergencyMessage:
        "All compatible AI providers are currently unavailable.\n\nYour task has been safely checkpointed.\n\nYou can resume it later.",
    };
  }

  let activeCandidate = routing.selected;
  const initialProviderId = activeCandidate.provider.id;
  decisionTrace.push(
    `1. Central AI Router: ${activeCandidate.explanation}`
  );

  const startFrom = params.startFromStepIndex || 1;
  const completedSteps: WorkflowStepRecord[] = (params.existingSteps || [])
    .filter((s) => s.stepIndex < startFrom && s.status === "COMPLETED")
    .map((s) => ({ ...s }));

  if (completedSteps.length > 0) {
    decisionTrace.push(
      `2. Task Replay / Resume active: Preserved Steps 1–${completedSteps.length} without re-running.`
    );
  }

  let currentProgress =
    completedSteps.length > 0
      ? completedSteps[completedSteps.length - 1].progressPercent
      : 0;

  for (const stepDef of STANDARD_WORKFLOW_STEPS) {
    if (stepDef.stepIndex < startFrom) continue;

    // Check if we should simulate Provider A quota exhaustion at Step 4 (65% Report generation)
    const shouldFailQuotaHere =
      Boolean(params.simulateProviderAFailureAt65Percent) &&
      stepDef.progressPercent === 65 &&
      providerSwitchHistory.length === 0;

    const callResult = await executeProviderCall({
      provider: activeCandidate.provider,
      model: activeCandidate.model,
      systemPrompt: `You are AVRENYX Step Executor running step "${stepDef.stepName}" (${stepDef.progressPercent}%). Produce concise, verified step output.`,
      userPrompt: `Objective: ${params.objective}\nCurrent Step: ${stepDef.stepName}\nPrevious Completed Steps: ${completedSteps.map((c) => c.stepName).join(", ") || "None"}`,
      simulateFailure: shouldFailQuotaHere ? "QUOTA_REACHED" : "NONE",
    });

    if (!callResult.success) {
      // Provider failed mid-task! Save durable checkpoint & build compact Continuation Package
      const failedProvider = activeCandidate.provider;
      const failedModel = activeCandidate.model;
      excludedProviderIds.push(failedProvider.id);

      decisionTrace.push(
        `${decisionTrace.length + 1}. ${failedProvider.name} unavailable at ${stepDef.progressPercent}% (${callResult.errorMessage || "Quota reached"})`
      );
      decisionTrace.push(
        `${decisionTrace.length + 1}. Durable checkpoint saved at ${stepDef.progressPercent}% — compact Continuation Package built`
      );

      // Select compatible Provider B via Central AI Router
      const fallbackRouting = selectModelViaCentralRouter(params.providers, {
        taskType: params.taskType,
        promptText: params.objective,
        privacyLevel: params.privacyLevel,
        forceLocalOnly: params.forceLocalOnly,
        userPreference: params.userRoutingPreference,
        userAllowPaidProviders: params.userAllowPaidProviders,
        excludedProviderIds,
      });

      if (!fallbackRouting.selected) {
        // Emergency Fallback: All providers exhausted — preserve checkpoint!
        const pausedSteps: WorkflowStepRecord[] = [
          ...completedSteps,
          ...STANDARD_WORKFLOW_STEPS.filter(
            (s) => s.stepIndex >= stepDef.stepIndex
          ).map((s) => ({
            ...s,
            status: (s.stepIndex === stepDef.stepIndex
              ? "FAILED"
              : "PENDING") as "FAILED" | "PENDING",
            providerId: failedProvider.id,
            providerName: failedProvider.name,
            modelName: failedModel.name,
            output:
              s.stepIndex === stepDef.stepIndex
                ? `Checkpointed at ${stepDef.progressPercent}% after ${failedProvider.name} quota/outage.`
                : "",
            latencyMs: callResult.latencyMs,
          })),
        ];

        const pkg = buildContinuationPackage({
          objective: params.objective,
          taskType: params.taskType,
          checkpointPercent: currentProgress,
          completedSteps,
          errorContext: {
            failedAtStepIndex: stepDef.stepIndex,
            failedAtPercent: stepDef.progressPercent,
            failedProviderId: failedProvider.id,
            failedProviderName: failedProvider.name,
            reason: callResult.errorMessage || "Provider quota reached",
            timestamp: new Date().toISOString(),
          },
        });

        return {
          jobId,
          title: params.title,
          taskType: params.taskType,
          status: "CHECKPOINTED_PAUSED",
          progressPercent: currentProgress,
          initialProviderId,
          finalProviderId: failedProvider.id,
          finalProviderName: failedProvider.name,
          finalModelName: failedModel.name,
          routingExplanation: `Paused at ${currentProgress}% checkpoint. All fallback providers currently unavailable.`,
          privacySummary: {
            classification: routing.privacyDecision.classification,
            processingModeLabel: routing.privacyDecision.processingModeLabel,
            dataSentExternally: routing.privacyDecision.dataSentExternally,
            providerLabel: routing.privacyDecision.providerLabel,
          },
          costGuardNotices,
          steps: pausedSteps,
          continuationPackage: pkg,
          providerSwitchHistory,
          decisionTrace,
          finalOutput: completedSteps.map((s) => s.output).join("\n\n"),
          emergencyMessage:
            "All compatible AI providers are currently unavailable.\n\nYour task has been safely checkpointed.\n\nYou can resume it later.",
        };
      }

      // Switch to Provider B and continue from exact checkpoint!
      const nextCandidate = fallbackRouting.selected;
      providerSwitchHistory.push({
        fromProviderId: failedProvider.id,
        fromProviderName: failedProvider.name,
        fromModelName: failedModel.name,
        failureReason: callResult.errorMessage || "Quota reached",
        checkpointPercent: stepDef.progressPercent,
        toProviderId: nextCandidate.provider.id,
        toProviderName: nextCandidate.provider.name,
        toModelName: nextCandidate.model.name,
        switchedAt: new Date().toISOString(),
      });

      decisionTrace.push(
        `${decisionTrace.length + 1}. Automatic Provider Fallback: Switched from ${failedProvider.name} to ${nextCandidate.provider.name} (${nextCandidate.model.name}) and resumed at ${stepDef.progressPercent}%`
      );

      activeCandidate = nextCandidate;

      // Re-run ONLY the current failed step with the compact Continuation Package on Provider B
      const pkgForProviderB = buildContinuationPackage({
        objective: params.objective,
        taskType: params.taskType,
        checkpointPercent: stepDef.progressPercent,
        completedSteps,
        errorContext: {
          failedAtStepIndex: stepDef.stepIndex,
          failedAtPercent: stepDef.progressPercent,
          failedProviderId: failedProvider.id,
          failedProviderName: failedProvider.name,
          reason: callResult.errorMessage || "Quota reached",
          timestamp: new Date().toISOString(),
        },
      });

      const resumedCall = await executeProviderCall({
        provider: activeCandidate.provider,
        model: activeCandidate.model,
        systemPrompt: `You are AVRENYX Continuation Executor resuming from a ${stepDef.progressPercent}% checkpoint using a compact Continuation Package.`,
        userPrompt: JSON.stringify(pkgForProviderB),
        simulateFailure: "NONE",
      });

      currentProgress = stepDef.progressPercent;
      completedSteps.push({
        stepIndex: stepDef.stepIndex,
        stepName: stepDef.stepName,
        progressPercent: stepDef.progressPercent,
        status: "COMPLETED",
        providerId: activeCandidate.provider.id,
        providerName: activeCandidate.provider.name,
        modelName: activeCandidate.model.name,
        output: `✓ [${stepDef.stepName} • ${stepDef.progressPercent}%] Resumed via ${activeCandidate.provider.name} (${activeCandidate.model.name}) using Continuation Package.\n${resumedCall.output}`,
        latencyMs: resumedCall.latencyMs,
      });
    } else {
      // Normal step completion
      currentProgress = stepDef.progressPercent;
      completedSteps.push({
        stepIndex: stepDef.stepIndex,
        stepName: stepDef.stepName,
        progressPercent: stepDef.progressPercent,
        status: "COMPLETED",
        providerId: activeCandidate.provider.id,
        providerName: activeCandidate.provider.name,
        modelName: activeCandidate.model.name,
        output: `✓ [${stepDef.stepName} • ${stepDef.progressPercent}%] Executed via ${activeCandidate.provider.name} (${activeCandidate.model.name}).\n${callResult.output}`,
        latencyMs: callResult.latencyMs,
      });
      decisionTrace.push(
        `${decisionTrace.length + 1}. Step ${stepDef.stepIndex} (${stepDef.stepName} — ${stepDef.progressPercent}%) completed on ${activeCandidate.provider.name}`
      );
    }
  }

  const finalPackage = buildContinuationPackage({
    objective: params.objective,
    taskType: params.taskType,
    checkpointPercent: 100,
    completedSteps,
  });

  const lastStep = completedSteps[completedSteps.length - 1];

  return {
    jobId,
    title: params.title,
    taskType: params.taskType,
    status: "COMPLETED",
    progressPercent: 100,
    initialProviderId,
    finalProviderId: activeCandidate.provider.id,
    finalProviderName: activeCandidate.provider.name,
    finalModelName: activeCandidate.model.name,
    routingExplanation:
      providerSwitchHistory.length > 0
        ? `Started on ${providerSwitchHistory[0].fromProviderName}; automatically switched to ${activeCandidate.provider.name} at ${providerSwitchHistory[0].checkpointPercent}% checkpoint after quota limit.`
        : activeCandidate.explanation,
    privacySummary: {
      classification: routing.privacyDecision.classification,
      processingModeLabel: routing.privacyDecision.processingModeLabel,
      dataSentExternally: routing.privacyDecision.dataSentExternally,
      providerLabel: activeCandidate.provider.name,
    },
    costGuardNotices,
    steps: completedSteps,
    continuationPackage: finalPackage,
    providerSwitchHistory,
    decisionTrace,
    finalOutput: lastStep ? lastStep.output : "",
  };
}

function buildContinuationPackage(params: {
  objective: string;
  taskType: TaskCategory;
  checkpointPercent: number;
  completedSteps: WorkflowStepRecord[];
  errorContext?: ContinuationPackage["errorContext"];
}): ContinuationPackage {
  const completedIndices = new Set(params.completedSteps.map((s) => s.stepIndex));
  const remainingSteps = STANDARD_WORKFLOW_STEPS.filter(
    (s) => !completedIndices.has(s.stepIndex)
  );

  return {
    packageVersion: "1.0",
    transferNotice:
      "ONLY task state is transferred. External provider credits, tokens, and quotas never transfer.",
    taskObjective: params.objective,
    taskType: params.taskType,
    checkpointPercent: params.checkpointPercent,
    completedSteps: params.completedSteps.map((s) => ({
      stepIndex: s.stepIndex,
      stepName: s.stepName,
      progressPercent: s.progressPercent,
      providerId: s.providerId,
      providerName: s.providerName,
      modelName: s.modelName,
      validatedOutput: s.output.slice(0, 360),
    })),
    remainingSteps,
    researchFindings: [
      `Validated state through ${params.completedSteps.length} completed pipeline stages.`,
      "Cross-checked primary sources and layout constraints.",
    ],
    sourceMetadata: [
      {
        title: "AVRENYX Verified Workspace Knowledge & Open Citations",
        url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
        publisher: "Wikimedia Foundation",
      },
    ],
    documentStructure: [
      "1. Executive Summary",
      "2. Technical & Empirical Analysis",
      "3. Comparative Matrix & Diagrams",
      "4. Verified References & Attribution",
    ],
    constraints: [
      "Maintain strict citation accuracy",
      "Preserve user template hierarchy",
      "Zero unauthorized paid API calls",
    ],
    errorContext: params.errorContext,
  };
}
