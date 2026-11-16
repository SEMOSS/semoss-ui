import { Navigate } from "react-router";
import { ResourceAuditTrail } from "@/features/audit-trail/resource-audit-trail";
import { useProject } from "@/hooks/use-project";

/**
 * A project's Audit tab: its audit trail, for its owners, admins included only
 * when they own it. Anyone else goes back to the project.
 */
export function ProjectAuditPage() {
	const { project, permission } = useProject();
	if (permission !== "OWNER") return <Navigate to=".." replace />;
	return (
		<ResourceAuditTrail
			key={project.project_id}
			scope="PROJECT"
			resourceId={project.project_id}
		/>
	);
}
