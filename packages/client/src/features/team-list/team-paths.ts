import type { GroupKey } from "@/api/teams";

/** The admin page listing every team */
export const ADMIN_TEAMS_PATH = "/settings/team-permissions";

/** The page listing the teams the signed in user manages */
export const MANAGED_TEAMS_PATH = "/settings/managed-teams";

/**
 * @param team - the team
 * @returns the path of the team's admin page
 */
export const getAdminTeamPath = (team: GroupKey): string =>
	`${ADMIN_TEAMS_PATH}/${encodeURIComponent(team.type)}/${encodeURIComponent(team.id)}`;

/**
 * @param team - the custom team
 * @returns the path of the page its managers use
 */
export const getManagedTeamPath = (team: GroupKey): string =>
	`${MANAGED_TEAMS_PATH}/${encodeURIComponent(team.id)}`;
