import type { Role } from "@semoss/sdk";
import type { Engine } from "@semoss/shared";
import { CatalogTagsSettings } from "@/components/catalog";
import { useConfig, useSession } from "@/hooks";

interface EngineTagsSettingsProps {
	/** Current engine */
	engine: Engine;

	/** User's permission for the engine */
	permission: Role;

	/** Called after a successful save so the parent can refresh engine data */
	onUpdated?: () => void;
}

/**
 * Editable card for the engine's organizational metadata (tags, data
 * classification, data restrictions, and domain), saved via
 * SetEngineMetadata.
 */
export const EngineTagsSettings = ({
	engine,
	permission,
	onUpdated,
}: EngineTagsSettingsProps) => {
	const databaseMetaKeys = useConfig(
		(state) => state.config.databaseMetaKeys,
	);
	const runPixel = useSession((state) => state.runPixel);

	return (
		<CatalogTagsSettings
			metadata={engine as unknown as Record<string, unknown>}
			permission={permission}
			buildMetaValuesPixel={(metaKeys) =>
				`META | GetDatabaseMetaValues ( metaKeys = [${metaKeys
					.map((key) => `'${key}'`)
					.join(",")}] ) ;`
			}
			metaKeysConfig={databaseMetaKeys}
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
			description="Organize and classify this model across the catalog."
			testIdPrefix="engine-tags-settings"
		/>
	);
};
