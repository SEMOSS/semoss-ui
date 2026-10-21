import { useCallback } from "react";
import {
	getTeamTotalLimit,
	type ModelUsageLimit,
	setTeamTotalLimit,
} from "@semoss/sdk";
import { UsageLimitSettingsCard } from "@/components/settings/usage-limit-settings-card";
import { useStoredUsageLimit } from "@/components/settings/use-stored-usage-limit";

export interface TeamTotalCardProps {
	/** The team's name, which is also its id */
	id: string;
	/** CUSTOM, or the login provider whose group the team mirrors */
	type: string;
}

/**
 * A team's total, for admins: a ceiling on the calls its team limits apply to, on
 * any model. When it is reached, members' calls move on to their next team.
 * Its rules are shared by the whole team. Render it for admins only; the calls
 * are admin only.
 */
export const TeamTotalCard = ({ id, type }: TeamTotalCardProps) => {
	const read = useCallback(() => getTeamTotalLimit(id, type), [id, type]);
	const write = useCallback(
		(usageLimit: ModelUsageLimit | null) =>
			setTeamTotalLimit(id, type, usageLimit),
		[id, type],
	);
	const limit = useStoredUsageLimit(read, write);

	return (
		<UsageLimitSettingsCard
			title="Team Total"
			description="A ceiling on the calls this team's limits apply to, on any model, checked on top of its Team Limit on each model. When it is reached, members' calls move on to their next team. Calls a member's Direct Limit applies to do not count."
			source="TEAM_TOTAL"
			limit={limit}
			savedMessage={`The total for ${id} was saved`}
		/>
	);
};
