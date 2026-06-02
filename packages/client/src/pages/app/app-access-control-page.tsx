import { useAppDetail } from "@/contexts";
import { AccessControl } from "./app-detail-tabs/access-control";

export const AppAccessControlPage = () => {
	const { appId, appInfo, permission, fetchUserSpecificData } =
		useAppDetail();
	return (
		<AccessControl
			appInfo={appInfo}
			appId={appId}
			fetchUserSpecificData={fetchUserSpecificData}
			permission={permission}
		/>
	);
};
