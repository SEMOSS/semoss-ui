import { UpdateSMSS } from "@/components/settings";
import { SettingsContext, useAppDetail } from "@/contexts";

export const AppSmssPage = () => {
	const { appId } = useAppDetail();
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<UpdateSMSS type="PROJECT" id={appId} />
		</SettingsContext.Provider>
	);
};
