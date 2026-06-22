import { AuditLogsDashboard } from "../audit-logs-dashboard";

/**
 * The "Activity" tab of the app detail layout — renders the audit logs dashboard
 * embedded (no standalone page chrome). The app id comes from the route params.
 */
export const AppActivityPage = () => {
	return <AuditLogsDashboard catalogName="Apps" embedded />;
};
