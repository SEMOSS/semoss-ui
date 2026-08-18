import { Navigate } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { ProjectNavbar, ProjectShareButton } from "@/components/project";
import { AgentWorkbench } from "@/components/workbench";
import { WorkbenchProvider } from "@/contexts";
import { usePage, useProject } from "@/hooks";
import { ProjectDependencyWarning } from "../app/project-dependency-warning";

/**
 * Editable surface for a WORKSPACE project. Owns the insight (bound to the
 * project so pixels run in its context) and the workbench store, then renders
 * the workbench.
 */
export const EditAgentPage = () => {
	const { project, permission, catalog } = useProject();

	usePage({
		showNavbarLogo: false,
	});

	if (permission === "DISCOVERABLE") {
		return (
			<Navigate to={`${catalog.path}/${project.project_id}`} replace />
		);
	}

	return (
		<InsightProvider options={{ app: project.project_id }}>
			<WorkbenchProvider id={project.project_id}>
				<ProjectNavbar actions={<ProjectShareButton />} />
				<ProjectDependencyWarning />
				<AgentWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	);
};
