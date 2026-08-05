import { useProject } from "@/hooks";
import { CommitsTab } from "./app-detail-tabs/commits-tab";

export const AppCommitsPage = () => {
	const { project } = useProject();
	return <CommitsTab appId={project.project_id} />;
};
