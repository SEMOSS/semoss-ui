import { useEngine } from "@/hooks/useEngine";
import { AuditLogsDashboard } from "../audit-logs-dashboard";

/**
 * The "Activity" tab of the engine detail layout — renders the audit logs
 * dashboard embedded (no standalone page chrome). The engine id comes from the
 * route params; the engine-type display name comes from the engine context.
 */
export const EngineActivityPage = () => {
	const { catalog } = useEngine();
	return <AuditLogsDashboard catalogName={catalog.name} embedded />;
};
