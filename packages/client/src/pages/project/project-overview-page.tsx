import { ProjectOverview } from "@/components/project";
import { useProject } from "@/hooks";

export const ProjectOverviewPage = () => {
	const { project } = useProject();

	return <ProjectOverview project={project} />;
};
