import { Navigate } from "react-router";
import { InsightProvider } from "@semoss/sdk/react";
import { ProjectNavbar, ProjectShareButton } from "@/components/project";
import {
	BLOCKS_WORKBENCH_COMPONENTS,
	CODE_WORKBENCH_COMPONENTS,
	CodeWorkbench,
} from "@/components/workbench";
import { Workspace } from "@/components/workspace";
import { WorkbenchProvider } from "@/contexts";
import { usePage, useProject } from "@/hooks";
import { ProjectDependencyWarning } from "./project-dependency-warning";

/**
 * Editable surface for the `/app` catalog. CODE and BLOCKS projects each
 * render on the workbench shell with their own panel set; BLOCKS goes through
 * `Workspace`, which binds the project's insight and owns the store its panels
 * read.
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

	// A plain InsightProvider, unlike CODE below: `Workspace` binds the
	// project with its own `SetContext` call before building the store, and
	// the blocks state is loaded through that same insight.
	if (type !== "CODE") {
		return (
			<div className="absolute inset-0">
				<InsightProvider>
					<WorkbenchProvider components={BLOCKS_WORKBENCH_COMPONENTS}>
						<Workspace />
					</WorkbenchProvider>
				</InsightProvider>
			</div>
		);
	}

	return (
		<InsightProvider options={{ app: project.project_id }}>
			<WorkbenchProvider components={CODE_WORKBENCH_COMPONENTS}>
				<ProjectNavbar actions={<ProjectShareButton />} />
				<ProjectDependencyWarning />
				<CodeWorkbench />
			</WorkbenchProvider>
		</InsightProvider>
	);
};
