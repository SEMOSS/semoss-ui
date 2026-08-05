import { useProject } from "@/hooks";
import { AppFileManagerPage } from "./app-file-manager-page";

export const AppFilesPage = () => {
	const { project } = useProject();
	return <AppFileManagerPage appId={project.project_id} />;
};
