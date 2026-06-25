import { useAppDetail } from "@/contexts";
import { AppProfiles } from "./app-detail-tabs/profiles";

export const AppProfilesPage = () => {
	const { appId, permission } = useAppDetail();
	return <AppProfiles appId={appId} permission={permission} />;
};
