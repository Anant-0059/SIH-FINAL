import os from "os";
import {
  ProviderRegistryRecord,
  ModelCapabilityEntry,
} from "../capabilities/registry";
import { evaluateSmartCostGuard, CostGuardVerdict } from "../cost-guard";
import {
  classifyContentPrivacy,
  PrivacyClassification,
  PrivacyDecision,
} from "../../privacy/privacy-router";

/**
 * AVRENYX Central AI Router (Rules 4, 16, 58, 81, 83, 84, 87, 88)
 * - Capability-based selection (never hardcoded to one model)
 * - Considers: task type, required capabilities (vision, files, structured output, reasoning, coding, research),
 *   context window, latency, provider health, circuit breaker state, Smart Cost Guard, Privacy Router,
 *   and hardware RAM availability for local models.
 * - Produces Explainable AI Routing rationale.
 */

export type TaskCategory =
  | "research"
  | "document"
  | "presentation"
  | "spreadsheet"
  | "coding"
  | "vision"
  | "council"
  | "workflow"
  | "study"
  | "resume";

export type UserRoutingPreference =
  | "local-first"
  | "free-first"
  | "privacy-first"
  | "quality-first"
  | "speed-first";

export interface RoutingRequest {
  taskType: TaskCategory;
  promptText: string;
  requiredContextTokens?: number;
  requiresVision?: boolean;
  requiresFiles?: boolean;
  requiresStructuredOutput?: boolean;
  privacyLevel?: PrivacyClassification;
  forceLocalOnly?: boolean;
  userPreference?: UserRoutingPreference;
  userAllowPaidProviders?: boolean;
  preferredModelOverrideId?: string;
  excludedProviderIds?: string[];
}

export interface RoutingCandidateDecision {
  provider: ProviderRegistryRecord;
  model: ModelCapabilityEntry;
  score: number;
  explanation: string;
}

export interface CentralRoutingResult {
  selected: RoutingCandidateDecision | null;
  fallbackChain: RoutingCandidateDecision[];
  privacyDecision: PrivacyDecision;
  costGuardBlocked: CostGuardVerdict[];
  hardwareResourceSnapshot: {
    freeRamGb: number;
    totalRamGb: number;
    cpuCores: number;
    canRun8BLocalModel: boolean;
  };
  emergencyFallbackMessage?: string;
}

export function getHardwareResourceSnapshot() {
  const freeRamGb = Number((os.freemem() / (1024 * 1024 * 1024)).toFixed(2));
  const totalRamGb = Number((os.totalmem() / (1024 * 1024 * 1024)).toFixed(2));
  const cpuCores = os.cpus()?.length || 4;
  return {
    freeRamGb,
    totalRamGb,
    cpuCores,
    canRun8BLocalModel: totalRamGb >= 6,
  };
}

export function selectModelViaCentralRouter(
  providers: ProviderRegistryRecord[],
  req: RoutingRequest
): CentralRoutingResult {
  const hardware = getHardwareResourceSnapshot();
  const excluded = new Set(req.excludedProviderIds || []);
  const costGuardBlocked: CostGuardVerdict[] = [];

  // Step 1: Evaluate Privacy Router
  const initialPrivacy = classifyContentPrivacy(
    req.promptText,
    req.privacyLevel,
    req.forceLocalOnly || req.userPreference === "privacy-first"
  );

  const candidates: RoutingCandidateDecision[] = [];

  for (const provider of providers) {
    if (!provider.enabled || excluded.has(provider.id)) continue;

    // Respect Provider Health & Circuit Breaker
    if (
      provider.healthStatus === "UNAVAILABLE" ||
      provider.healthStatus === "QUOTA_REACHED" ||
      provider.healthStatus === "CIRCUIT_OPEN"
    ) {
      continue;
    }

    // Enforce Privacy Router (if requireLocalOnly, block all external providers)
    if (initialPrivacy.requireLocalOnly && provider.billingTier !== "LOCAL") {
      continue;
    }

    // Enforce Smart Cost Guard
    const costVerdict = evaluateSmartCostGuard(
      provider,
      Boolean(req.userAllowPaidProviders)
    );
    if (!costVerdict.allowed) {
      costGuardBlocked.push(costVerdict);
      continue;
    }

    for (const model of provider.models) {
      if (!model.enabled) continue;

      // Check local model hardware resource limits (Rule 84)
      if (
        model.isLocal &&
        model.ramRequiredGb &&
        model.ramRequiredGb > hardware.totalRamGb + 2
      ) {
        continue;
      }

      // Check required capabilities
      if (req.requiresVision && !model.vision) continue;
      if (req.requiresFiles && !model.files) continue;
      if (req.requiresStructuredOutput && !model.structuredOutput) continue;
      if (
        req.requiredContextTokens &&
        model.contextWindow < req.requiredContextTokens
      ) {
        continue;
      }

      // Calculate capability & policy score
      let score = provider.priority;
      const reasons: string[] = [];

      // User override
      if (
        req.preferredModelOverrideId &&
        model.id === req.preferredModelOverrideId
      ) {
        score += 500;
        reasons.push("user explicit model override");
      }

      // Default AI Routing Policy (Rule 81): Local -> Free/BYOK -> Authorized Paid
      const pref = req.userPreference || "free-first";
      if (pref === "local-first" || pref === "privacy-first") {
        if (model.isLocal) {
          score += 120;
          reasons.push("local-first / privacy-isolated execution");
        }
      } else if (pref === "free-first") {
        if (model.billingTier === "LOCAL") {
          score += 95;
          reasons.push("free local hardware execution");
        } else if (model.billingTier === "FREE_TIER") {
          score += 90;
          reasons.push("free API tier priority");
        } else if (model.billingTier === "BYOK") {
          score += 75;
          reasons.push("user BYOK key");
        }
      } else if (pref === "speed-first") {
        score += Math.max(0, 60 - Math.floor(model.latencyEstimateMs / 10));
        reasons.push(`ultra-low latency (~${model.latencyEstimateMs}ms)`);
      } else if (pref === "quality-first") {
        score += model.reliabilityScore;
        reasons.push(`high reasoning & reliability (${model.reliabilityScore}%)`);
      }

      // Task-specific capability matching (Rule 16)
      if (req.taskType === "coding" && model.coding) {
        score += 35;
        reasons.push("coding-capable model");
      }
      if (
        (req.taskType === "research" || req.taskType === "council") &&
        model.research
      ) {
        score += 35;
        reasons.push("deep research + structured synthesis support");
      }
      if (
        (req.taskType === "document" ||
          req.taskType === "presentation" ||
          req.taskType === "spreadsheet" ||
          req.taskType === "resume") &&
        model.documentGeneration
      ) {
        score += 30;
        reasons.push("structured document & layout generation capability");
      }
      if (req.requiresVision && model.vision) {
        score += 45;
        reasons.push("multimodal vision understanding");
      }
      if (model.contextWindow >= 128000) {
        score += 15;
        reasons.push(`${Math.round(model.contextWindow / 1000)}k context window`);
      }

      const explanation = `Selected ${model.name} (${provider.name} • ${model.billingTier}) because this ${req.taskType} task benefits from ${reasons.slice(0, 3).join(", ")}.`;

      candidates.push({
        provider,
        model,
        score,
        explanation,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const selected = candidates[0] || null;
  const finalPrivacy = classifyContentPrivacy(
    req.promptText,
    req.privacyLevel,
    initialPrivacy.requireLocalOnly,
    selected?.provider.name || "Unavailable"
  );

  if (!selected) {
    return {
      selected: null,
      fallbackChain: [],
      privacyDecision: finalPrivacy,
      costGuardBlocked,
      hardwareResourceSnapshot: hardware,
      emergencyFallbackMessage:
        "All compatible AI providers are currently unavailable. Your task has been safely checkpointed. You can resume it later.",
    };
  }

  return {
    selected,
    fallbackChain: candidates.slice(1),
    privacyDecision: finalPrivacy,
    costGuardBlocked,
    hardwareResourceSnapshot: hardware,
  };
}
