import { Navigate } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { ResourceAuditTrail } from "@/features/audit-trail/resource-audit-trail";
import { useEngine } from "@/hooks/useEngine";

export function EngineAuditPage() {
	const { engine, permission } = useEngine();
	const isAdmin = useSession((state) => state.user?.isAdmin === true);
	if (permission !== "OWNER" && !isAdmin) return <Navigate to=".." replace />;
	return (
		<ResourceAuditTrail
			key={engine.engine_id}
			scope="ENGINE"
			resourceId={engine.engine_id}
		/>
	);
}
