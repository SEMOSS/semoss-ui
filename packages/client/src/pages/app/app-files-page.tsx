import { useAppDetail } from "@/contexts";
import { AppFileManagerPage } from "./app-file-manager-page";

export const AppFilesPage = () => {
	const { appId } = useAppDetail();
	return <AppFileManagerPage appId={appId} />;
};
