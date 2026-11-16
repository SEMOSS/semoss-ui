import { Navigate } from "react-router";
import { ResourceAuditTrail } from "@/features/audit-trail/resource-audit-trail";
import { useEngine } from "@/hooks/useEngine";

/**
 * An engine's Audit tab: its audit trail, for its owners, admins included only
 * when they own it. Anyone else goes back to the engine.
 */
export function EngineAuditPage() {
	const { engine, permission } = useEngine();
	if (permission !== "OWNER") return <Navigate to=".." replace />;
	return (
		<ResourceAuditTrail
			key={engine.engine_id}
			scope="ENGINE"
			resourceId={engine.engine_id}
		/>
	);
}
