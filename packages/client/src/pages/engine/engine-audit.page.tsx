import { Navigate } from "react-router";
import { ResourceAuditTrail } from "@/features/audit-trail/resource-audit-trail";
import { useSession } from "@/hooks/use-session";
import { useEngine } from "@/hooks/useEngine";

export function EngineAuditPage() {
	const { engine, permission } = useEngine();
	const isAdmin = useSession((state) => state.user.admin);
	if (permission !== "OWNER" && !isAdmin) return <Navigate to=".." replace />;
	return (
		<ResourceAuditTrail
			key={engine.engine_id}
			scope="ENGINE"
			resourceId={engine.engine_id}
		/>
	);
}
