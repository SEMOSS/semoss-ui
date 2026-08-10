import { observer } from "mobx-react-lite";
import { Navigate } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { Workspace } from "@/components/workspace";
import { usePage, useProject } from "@/hooks";

export const ProjectEdit = observer(() => {
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
		<div className="absolute inset-0">
			<InsightProvider>
				<Workspace app={project.project_id} />
			</InsightProvider>
		</div>
	);
});
