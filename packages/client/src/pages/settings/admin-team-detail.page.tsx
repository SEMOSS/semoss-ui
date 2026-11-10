import { Navigate, useParams } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { AdminTeamDetails } from "@/features/team-details/admin-team-details";
import { MANAGED_TEAMS_PATH } from "@/features/team-list/team-paths";

/**
 * One team, for admins. Anyone else goes to the teams they manage, before any
 * of the team is read.
 */
export const AdminTeamDetailPage = () => {
	// the signed in role, not the admin mode preference, decides who sees this page
	const isAdmin = useSession((state) => state.user?.isAdmin === true);
	// the router decodes the params
	const { type, id } = useParams<{ type: string; id: string }>();

	if (!isAdmin) {
		return <Navigate to={MANAGED_TEAMS_PATH} replace />;
	}
	if (!id || !type) {
		return null;
	}
	return <AdminTeamDetails key={`${type}:${id}`} id={id} type={type} />;
};
