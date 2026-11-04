import { Navigate } from "react-router";
import { ResourceGovernance } from "@/features/resource-governance/resource-governance";
import { useSettings } from "@/hooks";

/** Resource Governance, for admins in admin mode; anyone else goes back to Settings. */
export const ResourceGovernancePage = () => {
	const { adminMode } = useSettings();
	if (!adminMode) {
		return <Navigate to="/settings" replace />;
	}
	return <ResourceGovernance />;
};
