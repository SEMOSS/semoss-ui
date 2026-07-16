import { useProject } from "@/hooks";
import { CommitsTab } from "./app-detail-tabs/commits-tab";

export const AppCommitsPage = () => {
	const { appId } = useProject();
	return <CommitsTab appId={appId} />;
};
