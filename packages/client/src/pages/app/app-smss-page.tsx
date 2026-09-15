import { UpdateSMSS } from "@/components/settings";
import { SettingsContext } from "@/contexts";
import { useProject } from "@/hooks";

export const AppSmssPage = () => {
	const { project } = useProject();
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<UpdateSMSS type="PROJECT" id={project.project_id} />
		</SettingsContext.Provider>
	);
};
