import { Navigate } from "react-router";
import { InsightProvider } from "@semoss/sdk/react";
import { ProjectNavbar, ProjectShareButton } from "@/components/project";
import {
	AGENT_WORKBENCH_COMPONENTS,
	AgentWorkbench,
} from "@/components/workbench";
import { WorkbenchProvider } from "@/contexts";
import { CatalogDependencyWarning } from "@/features/catalog/dependencies/catalog-dependency-warning";
import { usePage, useProject } from "@/hooks";

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
			<WorkbenchProvider components={AGENT_WORKBENCH_COMPONENTS}>
				<ProjectNavbar actions={<ProjectShareButton />} />
				<CatalogDependencyWarning
					catalogId={project.project_id}
					catalogType={project.project_type}
				/>
				<AgentWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	);
};
