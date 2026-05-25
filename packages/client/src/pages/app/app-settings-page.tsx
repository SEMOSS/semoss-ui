import { SettingsContext, useAppDetail } from "@/contexts";
import { SettingsTab } from "./app-detail-tabs/settings-tab";

export const AppSettingsPage = () => {
	const { appId } = useAppDetail();
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<SettingsTab id={appId} />
		</SettingsContext.Provider>
	);
};
