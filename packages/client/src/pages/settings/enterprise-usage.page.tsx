import { Navigate } from "react-router";
import { InsightProvider, useSession } from "@semoss/sdk/react";
import { EnterpriseUsageSession } from "./enterprise-usage-session";

/**
 * Enterprise usage, for admins, in an insight of its own. Uses the
 * authenticated role, independent of the persisted admin-mode preference.
 */
export function EnterpriseUsagePage() {
	const isAdmin = useSession((state) => state.user?.isAdmin === true);
	return isAdmin ? (
		<InsightProvider options={{ disableRoom: true }}>
			<EnterpriseUsageSession />
		</InsightProvider>
	) : (
		<Navigate to="/settings" replace />
	);
}
