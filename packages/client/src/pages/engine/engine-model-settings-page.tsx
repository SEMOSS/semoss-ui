import { useState } from "react";
import { EngineModelSettings, EngineRouterSettings } from "@/components/engine";
import { EngineModelPrices } from "@/components/engine/engine-model-prices";
import { useEngine } from "@/hooks";

export const EngineModelSettingsPage = () => {
	const { engine, permission, refresh } = useEngine();
	// counts the saves of Model Settings, a catalog entry applied included, which
	// can change the prices and the serving provider the Prices card shows
	const [metadataRevision, setMetadataRevision] = useState(0);

	const handleModelSettingsUpdated = () => {
		setMetadataRevision((revision) => revision + 1);
		refresh();
	};

	if (engine.engine_subtype === "MODEL_ROUTER") {
		return (
			<EngineRouterSettings
				engineId={engine.engine_id}
				permission={permission}
				onUpdated={refresh}
			/>
		);
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<EngineModelSettings
				engineId={engine.engine_id}
				permission={permission}
				onUpdated={handleModelSettingsUpdated}
			/>
			{/* a router has no price of its own; calls cost what the model answering costs.
			A new key after a Model Settings save reads the prices again and drops
			edits made to the prices read before it, so they cannot be saved over it */}
			<EngineModelPrices
				key={metadataRevision}
				engineId={engine.engine_id}
				permission={permission}
				onUpdated={refresh}
			/>
		</div>
	);
};
