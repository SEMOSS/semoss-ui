import { useAppDetail } from "@/contexts";
import { CommitsTab } from "./app-detail-tabs/commits-tab";

export const AppCommitsPage = () => {
	const { appId } = useAppDetail();
	return <CommitsTab appId={appId} />;
};
