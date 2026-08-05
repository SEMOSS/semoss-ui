import { SettingsContext } from "@/contexts";
import { useProject } from "@/hooks";
import { SettingsTab } from "./app-detail-tabs/settings-tab";

export const AppSettingsPage = () => {
	const { project } = useProject();
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<SettingsTab project={project} />
		</SettingsContext.Provider>
	);
};
