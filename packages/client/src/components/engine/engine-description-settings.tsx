import type { Role } from "@semoss/sdk";
import type { Engine } from "@semoss/shared";
import { CatalogDescriptionSettings } from "@/components/catalog";
import { useSession } from "@/hooks";

interface EngineDescriptionSettingsProps {
	/** Current engine */
	engine: Engine;

	/** User's permission for the engine */
	permission: Role;

	/** Called after a successful save so the parent can refresh engine data */
	onUpdated?: () => void;
}

/**
 * Editable card for the engine's descriptive content: the short catalog
 * description and the long-form About markdown shown on the Overview page.
 */
export const EngineDescriptionSettings = ({
	engine,
	permission,
	onUpdated,
}: EngineDescriptionSettingsProps) => {
	const runPixel = useSession((state) => state.runPixel);

	return (
		<CatalogDescriptionSettings
			metadata={engine as unknown as Record<string, unknown>}
			permission={permission}
			onSave={async (meta) => {
				const response = await runPixel(
					`SetEngineMetadata(engine=["${engine.engine_id}"], meta=[${JSON.stringify(
						meta,
					)}])`,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join(""));
				}
			}}
			onUpdated={onUpdated}
			description="The summary and About content shown on the Overview page."
			descriptionHelp="A short summary shown in the catalog and on the Overview page."
			aboutHelp="Long-form markdown rendered on the Overview page."
			testIdPrefix="engine-description-settings"
		/>
	);
};
