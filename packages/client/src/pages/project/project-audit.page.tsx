import { Navigate } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { ResourceAuditTrail } from "@/features/audit-trail/resource-audit-trail";
import { useProject } from "@/hooks/use-project";

export function ProjectAuditPage() {
	const { project, permission } = useProject();
	const isAdmin = useSession((state) => state.user?.isAdmin === true);
	if (permission !== "OWNER" && !isAdmin) return <Navigate to=".." replace />;
	return (
		<ResourceAuditTrail
			key={project.project_id}
			scope="PROJECT"
			resourceId={project.project_id}
		/>
	);
}
