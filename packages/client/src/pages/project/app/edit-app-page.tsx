import { Navigate } from "react-router";
import { InsightProvider } from "@semoss/sdk/react";
import { ProjectNavbar, ProjectShareButton } from "@/components/project";
import { CodeWorkbench } from "@/components/workbench";
import { Workspace } from "@/components/workspace";
import { WorkbenchProvider } from "@/contexts";
import { usePage, useProject } from "@/hooks";
import { ProjectDependencyWarning } from "./project-dependency-warning";

/**
 * Editable surface for the `/app` catalog. CODE projects render on the
 * workbench shell; BLOCKS and INSIGHT projects share this route and still
 * render on the legacy workspace shell.
 */
export const EditAppPage = () => {
	const { project, permission, catalog, type } = useProject();

	usePage({
		showNavbarLogo: false,
	});

	if (permission === "DISCOVERABLE") {
		return (
			<Navigate to={`${catalog.path}/${project.project_id}`} replace />
		);
	}

	// BLOCKS/INSIGHT have not been migrated to the workbench yet — `Workspace`
	// creates the WorkspaceStore and dispatches on the project type.
	if (type !== "CODE") {
		return (
			<div className="absolute inset-0">
				<InsightProvider>
					<Workspace />
				</InsightProvider>
			</div>
		);
	}

	return (
		<InsightProvider options={{ app: project.project_id }}>
			<WorkbenchProvider id={project.project_id}>
				<ProjectNavbar actions={<ProjectShareButton />} />
				<ProjectDependencyWarning />
				<CodeWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	);
};
