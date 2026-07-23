import { ProjectOverview } from "@/components/project";
import { useProject } from "@/hooks";

export const ProjectOverviewPage = () => {
	const { project, permission, refresh } = useProject();

	return (
		<ProjectOverview
			project={project}
			permission={permission}
			refresh={refresh}
		/>
	);
};
