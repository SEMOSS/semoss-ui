import { useMemo } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@semoss/ui/next";
import { BulkAccessManagementCard } from "@/features/bulk-access-management/bulk-access-management-card";
import { useGroupManagersSource } from "@/features/group-managers/use-group-managers-source";
import { useTeamMembersSource } from "@/features/team-members/use-team-members-source";
import { TeamResourceAccessPanel } from "@/features/team-resource-access/team-resource-access-panel";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { useConfig } from "@/hooks/use-config";
import { TeamPeopleCard } from "./team-people-card";

export interface AdminTeamDetailsProps {
	/** The team's name, which is also its id */
	id: string;
	/** CUSTOM, or the login provider whose group the team mirrors */
	type: string;
}

/**
 * One team, for admins, on one page: its members and managers, then the
 * projects and engines it can use. The page header edits and deletes it.
 * Render it only for admins, keyed by the team, so a renamed team starts from
 * fresh lists.
 */
export const AdminTeamDetails = ({ id, type }: AdminTeamDetailsProps) => {
	const group = useMemo(() => ({ id, type }), [id, type]);
	const isCustom = type === CUSTOM_TEAM_TYPE;
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);
	const membersSource = useTeamMembersSource(id, true);
	// only custom teams have managers
	const managersSource = useGroupManagersSource(isCustom ? id : null, true);

	return (
		<div className="flex flex-col gap-6">
			{isCustom ? (
				<>
					<BulkAccessManagementCard
						to="bulk-access-management"
						noun="team"
						description="see its members and managers beside a search of the app and your organization, add many at once, and copy them from another team or an app or engine"
					/>
					<TeamPeopleCard
						title="Managers"
						description="Managers change who is in this team and who manages it."
						source={managersSource}
						adminMode
						isDirectoryAvailable={isDirectoryAvailable}
					/>
					<TeamPeopleCard
						title="Members"
						description="Everyone in this team can use the projects and engines it has been given."
						source={membersSource}
						adminMode
						isDirectoryAvailable={isDirectoryAvailable}
					/>
				</>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Members</CardTitle>
						<CardDescription>
							This team's members are the people in the login
							provider's group of the same name, so they are
							managed there.
						</CardDescription>
					</CardHeader>
				</Card>
			)}
			<TeamResourceAccessPanel kind="PROJECT" group={group} />
			<TeamResourceAccessPanel kind="ENGINE" group={group} />
		</div>
	);
};
