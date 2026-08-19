import { EngineGuardrailSettings } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineGuardrailSettingsPage = () => {
	const { engine, permission, refresh } = useEngine();

	return (
		<EngineGuardrailSettings
			engineId={engine.engine_id}
			permission={permission}
			onUpdated={refresh}
		/>
	);
};
