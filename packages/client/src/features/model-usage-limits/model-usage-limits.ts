import type { ModelUsageLimit, PermissionBatch } from "@semoss/sdk";
import type { ModelLimitCategory } from "@/features/bulk-access-management/permission-batch";

/** What the model total is, said where it is edited */
export const MODEL_TOTAL_DESCRIPTION =
	"A ceiling on every call to this model, by anyone, whatever limit applies to the call. Once it is reached, everyone is refused until it resets, people with Unlimited included.";

/** What the public use limit is, on a public model */
export const PUBLIC_USE_DESCRIPTION =
	"The limit of everyone using this model with no limit defined anywhere more specific: their own grant or a team's.";

/** What the public use limit is, on a model that is not public */
export const PUBLIC_USE_NOT_PUBLIC_DESCRIPTION =
	"Applies while this model is public. This model is not public now.";

/** What each model-wide limit is called */
export const MODEL_LIMIT_NAMES: Readonly<Record<ModelLimitCategory, string>> = {
	MODEL: "Model Total",
	PUBLIC: "Public Use Limit",
};

/**
 * The permission batch that changes a model's total or its public use limit.
 *
 * @param engineId - the model
 * @param category - MODEL for the model total, PUBLIC for the public use limit
 * @param usageLimit - the new limit, or null for no limit defined
 * @returns the batch to save
 */
export const toModelLimitBatch = (
	engineId: string,
	category: ModelLimitCategory,
	usageLimit: ModelUsageLimit | null,
): PermissionBatch => ({
	target: { resourceType: "ENGINE", id: engineId },
	changes: [{ action: "CHANGE", subject: { category }, to: { usageLimit } }],
});
