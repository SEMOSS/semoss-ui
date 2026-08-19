import { EngineModelSettings, EngineRouterSettings } from "@/components/engine";
import { useEngine } from "@/hooks";

export const EngineModelSettingsPage = () => {
	const { engine, permission, refresh } = useEngine();

	if (engine.engine_subtype === "MODEL_ROUTER") {
		return (
			<div className="flex w-full flex-col gap-4">
				<p className="text-muted-foreground text-sm">
					This engine is a model router. Context window, token limits,
					reasoning and built-in tools come from the engines it routes
					to - edit how requests are routed below. Changes apply to
					the running engine immediately.
				</p>
				<EngineRouterSettings
					engineId={engine.engine_id}
					permission={permission}
					onUpdated={refresh}
				/>
			</div>
		);
	}

	return (
		<EngineModelSettings
			engineId={engine.engine_id}
			permission={permission}
			onUpdated={refresh}
		/>
	);
};
