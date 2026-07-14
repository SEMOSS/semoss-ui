import { EngineSelect } from "@semoss/chat/components";
import { useEngineConnect } from "./engine-connect-context";

/**
 * Nicely self-referential: the docs site's "pick a real engine" control is
 * built on the very EngineSelect it's about to document. Persists at the top
 * of the layout so a visitor connects once, then every backend-reaching demo
 * further down (ChatPanel, PromptOptimizer, McpMenuButton) uses it live.
 */
export const EngineConnectBar = () => {
	const { engine, setEngine } = useEngineConnect();

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center">
			<div className="flex flex-col gap-0.5">
				<span className="font-medium text-foreground text-sm">
					Live demo engine
				</span>
				<span className="text-muted-foreground text-xs">
					Pick a real engine you have access to — every
					backend-connected demo on this page will run against it
					live.
				</span>
			</div>
			<div className="sm:ml-auto">
				<EngineSelect
					name={engine?.engineName || "Select engine"}
					value={engine?.engineId || ""}
					onChange={(nextEngine) =>
						setEngine({
							engineId: nextEngine.engine_id,
							engineName:
								nextEngine.engine_display_name ||
								nextEngine.engine_name,
						})
					}
				/>
			</div>
		</div>
	);
};
