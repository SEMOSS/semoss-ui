import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import { Workspace } from "@/components/workspace";
import { usePage } from "@/hooks";

interface ProjectEditProps {
	type: Project["project_type"];
}

export const ProjectEdit = observer(({ type: _type }: ProjectEditProps) => {
	const { appId } = useParams();

	usePage({
		showNavbarLogo: false,
	});

	return (
		<div className="absolute inset-0">
			<InsightProvider>
				<Workspace app={appId as string} />
			</InsightProvider>
		</div>
	);
});
