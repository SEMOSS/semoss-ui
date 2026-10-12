import { Navigate, useParams } from "react-router";
import { TeamAccessManagement } from "@/features/team-access-management/team-access-management";
import { MANAGED_TEAMS_PATH } from "@/features/team-list/team-paths";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { useConfig, useSession } from "@/hooks";

export interface TeamAccessManagementPageProps {
	/**
	 * Whether this is the admin mode view, from Team Permissions, where an
	 * admin can change any custom team; My Teams uses the user's own permissions
	 */
	admin?: boolean;
}

/**
 * Bulk Access Management for a custom team: in admin mode from Team Permissions,
 * for admins, or from My Teams for the team's managers. The backend checks who
 * may make each change.
 */
export const TeamAccessManagementPage = ({
	admin = false,
}: TeamAccessManagementPageProps) => {
	// the router decodes the params; the admin page's path also has the type
	const { id = "", type = CUSTOM_TEAM_TYPE } = useParams<{
		id: string;
		type: string;
	}>();
	// the signed in role, not the admin mode preference, decides who sees the admin page
	const isAdmin = useSession((state) => state.user.admin);
	const isDirectoryAvailable = useConfig(
		(state) => state.config.msGraphLookup === true,
	);

	if (admin && !isAdmin) {
		return <Navigate to={MANAGED_TEAMS_PATH} replace />;
	}
	if (!id) {
		return null;
	}
	if (type !== CUSTOM_TEAM_TYPE) {
		return (
			<p className="text-muted-foreground text-sm">
				This team's members come from its login provider, so they cannot
				be changed here.
			</p>
		);
	}
	return (
		<TeamAccessManagement
			key={id}
			groupId={id}
			backTo=".."
			admin={admin}
			isDirectoryAvailable={isDirectoryAvailable}
		/>
	);
};
