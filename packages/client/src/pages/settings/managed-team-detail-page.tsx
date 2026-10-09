import { useMemo } from "react";
import { useParams } from "react-router";
import { useGroupManagersSource } from "@/features/group-managers/use-group-managers-source";
import { TeamPeopleCard } from "@/features/team-details/team-people-card";
import { useTeamMembersSource } from "@/features/team-members/use-team-members-source";
import { TeamResourceAccessPanel } from "@/features/team-resource-access/team-resource-access-panel";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { useConfig } from "@/hooks";

/**
 * One custom team, for its managers, on one page: add and remove its members
 * and its other managers, and see the projects and engines the team can use, so
 * they know what the people they add get. The page header shows the team's
 * name and description.
 */
export const ManagedTeamDetailPage = () => {
	// the router decodes the params
	const { id = "" } = useParams<{ id: string }>();
	const group = useMemo(() => ({ id, type: CUSTOM_TEAM_TYPE }), [id]);
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);
	const membersSource = useTeamMembersSource(id, false);
	const managersSource = useGroupManagersSource(id || null, false);

	if (!id) {
		return null;
	}

	return (
		<div className="flex flex-col gap-6">
			<TeamPeopleCard
				title="Managers"
				description="User's who can manage this team's members."
				source={managersSource}
				isDirectoryAvailable={isDirectoryAvailable}
			/>
			<TeamPeopleCard
				title="Members"
				description="Everyone in this team can use the projects and engines it has been given."
				source={membersSource}
				isDirectoryAvailable={isDirectoryAvailable}
			/>
			<TeamResourceAccessPanel kind="PROJECT" group={group} readOnly />
			<TeamResourceAccessPanel kind="ENGINE" group={group} readOnly />
		</div>
	);
};
