import { useProject } from "@/hooks";
import { AppFileManagerPage } from "./app-file-manager-page";

export const AppFilesPage = () => {
	const { appId } = useProject();
	return <AppFileManagerPage appId={appId} />;
};
