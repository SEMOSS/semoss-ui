import { useProject } from "@/hooks";
import { Overview } from "./app-detail-tabs/overview-tab";

export const AppOverviewPage = () => {
	const { project } = useProject();
	return <Overview project={project} />;
};
