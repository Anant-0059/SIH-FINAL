import { ProviderRegistryRecord } from "./capabilities/registry";

/**
 * AVRENYX Smart Cost Guard (Rules 1, 2, 9, 81)
 * - Enforces non-negotiable free-first rules
 * - Checks whether a provider is marked as paid
 * - Checks whether the user has explicitly authorized paid usage globally and for this provider
 * - If not authorized, blocks that provider and emits transparent UI banner message:
 *   "Paid provider blocked by your settings. Searching for an available free/local alternative."
 */

export interface CostGuardVerdict {
  allowed: boolean;
  providerId: string;
  providerName: string;
  billingTier: string;
  blockedReason?: string;
  uiNotice?: string;
}

export function evaluateSmartCostGuard(
  provider: ProviderRegistryRecord,
  userGlobalAllowPaid: boolean
): CostGuardVerdict {
  if (!provider.isPaidProvider || provider.billingTier === "LOCAL" || provider.billingTier === "FREE_TIER") {
    return {
      allowed: true,
      providerId: provider.id,
      providerName: provider.name,
      billingTier: provider.billingTier,
    };
  }

  const isAuthorized = userGlobalAllowPaid && provider.userAuthorizedPaid;

  if (!isAuthorized) {
    return {
      allowed: false,
      providerId: provider.id,
      providerName: provider.name,
      billingTier: provider.billingTier,
      blockedReason: `Provider "${provider.name}" is marked as paid (${provider.billingTier}) and paid usage is not explicitly authorized.`,
      uiNotice:
        "Paid provider blocked by your settings. Searching for an available free/local alternative.",
    };
  }

  return {
    allowed: true,
    providerId: provider.id,
    providerName: provider.name,
    billingTier: provider.billingTier,
  };
}
