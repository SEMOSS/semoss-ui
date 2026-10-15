import { useCallback } from "react";
import { getTeams, getTeamsCount, toTeamSummaries } from "@/api/teams";
import { TeamList } from "@/features/team-list/team-list";
import { getManagedTeamPath } from "@/features/team-list/team-paths";

/**
 * The custom teams the signed in user manages. Opening one lets them add and
 * remove its members.
 */
export const ManagedTeamsPage = () => {
	const loadTeams = useCallback(
		async (searchTerm: string, limit: number, offset: number) =>
			toTeamSummaries(await getTeams(false, searchTerm, limit, offset)),
		[],
	);
	const countTeams = useCallback(
		async (searchTerm: string) =>
			Number(await getTeamsCount(false, searchTerm)),
		[],
	);

	return (
		<TeamList
			loadTeams={loadTeams}
			countTeams={countTeams}
			getTeamPath={getManagedTeamPath}
			columns={["members", "created", "managerSince"]}
			emptyTitle="You don't manage any teams"
			emptyDescription="An admin can make you a manager of a team so you can add and remove its members."
		/>
	);
};
