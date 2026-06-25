import { useAppDetail } from "@/contexts";
import { AppProfiles } from "./app-detail-tabs/profiles";

export const AppProfilesPage = () => {
	const { appId } = useAppDetail();
	return <AppProfiles appId={appId} />;
};
