import { Navigate } from "react-router";
import { AuditTrails } from "@/features/audit-trails/audit-trails";
import { useSettings } from "@/hooks/useSettings";

/** Mount the audit reader only while Settings is in admin mode. */
export const AuditTrailsPage = () => {
	const { adminMode } = useSettings();
	return adminMode ? <AuditTrails /> : <Navigate to="/settings" replace />;
};
