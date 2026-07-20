import { SettingsContext } from "@/contexts";
import { useProject } from "@/hooks";
import { SettingsTab } from "./app-detail-tabs/settings-tab";

export const AppSettingsPage = () => {
	const { appId } = useProject();
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<SettingsTab id={appId} />
		</SettingsContext.Provider>
	);
};
