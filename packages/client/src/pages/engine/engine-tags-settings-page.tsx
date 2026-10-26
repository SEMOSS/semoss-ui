import { EngineTagsSettings } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineTagsSettingsPage = () => {
	const { catalog, engine, permission, refresh } = useEngine();

	return (
		<EngineTagsSettings
			engine={engine}
			permission={permission}
			catalogName={catalog.name}
			onUpdated={refresh}
		/>
	);
};
