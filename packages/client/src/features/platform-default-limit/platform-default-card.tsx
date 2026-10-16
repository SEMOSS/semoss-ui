import { getPlatformDefaultLimit, setPlatformDefaultLimit } from "@semoss/sdk";
import { UsageLimitSettingsCard } from "@/components/settings/usage-limit-settings-card";
import { useStoredUsageLimit } from "@/components/settings/use-stored-usage-limit";

/**
 * The General Platform Limit card of the admin Model Settings: the usage limit,
 * across all models, of everyone with no other limit. Its rules count each
 * person's own use. Render it in admin mode only; the calls are admin only.
 */
export const PlatformDefaultCard = () => {
	const limit = useStoredUsageLimit(
		getPlatformDefaultLimit,
		setPlatformDefaultLimit,
	);

	return (
		<UsageLimitSettingsCard
			title="General Platform Limit"
			description="The usage limit, across all models, of everyone with no Direct Limit, Team Limit, Public Use Limit or User's Total Model Limit. Its rules count each person's own use."
			source="PLATFORM"
			limit={limit}
			savedMessage="The General Platform Limit was saved"
		/>
	);
};
