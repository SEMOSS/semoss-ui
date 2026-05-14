import { useAppDetail } from "@/contexts";
import { Overview } from "./app-detail-tabs/overview-tab";

export const AppOverviewPage = () => {
	const { appInfo } = useAppDetail();
	return <Overview appInfo={appInfo} />;
};
