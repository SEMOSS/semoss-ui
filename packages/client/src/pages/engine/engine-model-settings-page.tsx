import { EngineModelSettings } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineModelSettingsPage = () => {
	const { engine, permission, refresh } = useEngine();

	return (
		<EngineModelSettings
			engineId={engine.engine_id}
			permission={permission}
			onUpdated={refresh}
		/>
	);
};
