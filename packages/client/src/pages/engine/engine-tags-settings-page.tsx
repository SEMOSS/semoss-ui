import { EngineTagsSettings } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineTagsSettingsPage = () => {
	const { engine, permission, refresh } = useEngine();

	return (
		<EngineTagsSettings
			engine={engine}
			permission={permission}
			onUpdated={refresh}
		/>
	);
};
