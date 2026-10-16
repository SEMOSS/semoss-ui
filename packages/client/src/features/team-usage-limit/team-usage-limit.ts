import type {
	ModelUsageLimit,
	PermissionBatch,
	PermissionGrant,
} from "@semoss/sdk";
import { toSentGrant } from "@/features/bulk-access-management/permission-batch";

/** What a team with no limit defined uses on a public model */
export const PUBLIC_TEAM_HINT = "Members use the public use limit.";

/** What a team limit counts, said where a team's limit is edited */
export const TEAM_LIMIT_DESCRIPTION =
	"The team limit on this model. Shared rules count every call the team limit applies to, together; rules for each member count each member's own calls.";

/** A team, by its name and type */
export interface TeamLimitKey {
	/** The team's name */
	id: string;
	/** The team's type, such as CUSTOM */
	type: string;
}

/**
 * @param team - a team
 * @returns its key, the same for the team in the Teams table and in the
 * model's permissions
 */
export const getTeamLimitKey = (team: TeamLimitKey): string =>
	`${team.type}:${team.id}`;

/**
 * The permission batch that changes one team's limit on a model. A change sets
 * the whole access, so it carries the team's level and end date as they are;
 * no limit defined leaves the limit out.
 *
 * @param engineId - the model
 * @param team - the team
 * @param grant - the team's access now, from the model's permissions
 * @param usageLimit - the new limit, or null for no limit defined
 * @returns the batch to save
 */
export const toTeamLimitBatch = (
	engineId: string,
	team: TeamLimitKey,
	grant: PermissionGrant,
	usageLimit: ModelUsageLimit | null,
): PermissionBatch => ({
	target: { resourceType: "ENGINE", id: engineId },
	changes: [
		{
			action: "CHANGE",
			subject: { category: "TEAM", id: team.id, type: team.type },
			to: toSentGrant({ ...grant, usageLimit }),
		},
	],
});
