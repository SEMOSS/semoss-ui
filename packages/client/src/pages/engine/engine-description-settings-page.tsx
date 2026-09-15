import { EngineDescriptionSettings } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineDescriptionSettingsPage = () => {
	const { engine, permission, refresh } = useEngine();

	return (
		<EngineDescriptionSettings
			engine={engine}
			permission={permission}
			onUpdated={refresh}
		/>
	);
};
