import { UpdateSMSS } from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useProject } from "@/hooks";

export const AppSmssPage = () => {
	const { appId } = useProject();
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<UpdateSMSS type="PROJECT" id={appId} />
		</SettingsContext.Provider>
	);
};
