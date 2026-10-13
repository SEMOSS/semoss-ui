import { Navigate } from "react-router";
import { ResourceAuditTrails } from "@/features/audit-trails/resource-audit-trails";
import { useSession } from "@/hooks/use-session";
import { useEngine } from "@/hooks/useEngine";

export function EngineAuditPage() {
	const { engine, permission } = useEngine();
	const isAdmin = useSession((state) => state.user.admin);
	if (permission !== "OWNER" && !isAdmin) return <Navigate to=".." replace />;
	return (
		<ResourceAuditTrails
			key={engine.engine_id}
			scope="ENGINE"
			resourceId={engine.engine_id}
		/>
	);
}
