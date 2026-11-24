import { Navigate } from "react-router";
import { GrantedAccess } from "@/features/granted-access/granted-access";
import { useSettings } from "@/hooks/useSettings";

/**
 * The All Resource Delegated Access page: every permission any engine or project
 * gives an app, an agent or an engine, read and changed through the admin
 * endpoints. Mounted only while Settings is in admin mode.
 */
export const AllResourceDelegatedAccessPage = () => {
	const { adminMode } = useSettings();
	return adminMode ? (
		<GrantedAccess admin />
	) : (
		<Navigate to="/settings" replace />
	);
};
