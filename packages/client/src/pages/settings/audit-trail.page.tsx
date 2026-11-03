import { Navigate } from "react-router";
import { AuditTrail } from "@/features/audit-trail/audit-trail";
import { useSettings } from "@/hooks/useSettings";

/** Mount the audit reader only while Settings is in admin mode. */
export const AuditTrailPage = () => {
	const { adminMode } = useSettings();
	return adminMode ? <AuditTrail /> : <Navigate to="/settings" replace />;
};
