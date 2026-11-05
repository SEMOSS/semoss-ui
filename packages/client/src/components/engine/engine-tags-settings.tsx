import { type Role, runPixel } from "@semoss/sdk";
import { useConfig } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { CatalogTagsSettings } from "@/components/catalog";

interface EngineTagsSettingsProps {
	/** Current engine */
	engine: Engine;

	/** User's permission for the engine */
	permission: Role;

	/** What the catalog calls this kind of engine, such as "Database" */
	catalogName: string;

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
	catalogName,
	onUpdated,
}: EngineTagsSettingsProps) => {
	const databaseMetaKeys = useConfig(
		(state) => state.config?.databaseMetaKeys ?? [],
	);

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
			description={`Organize and classify this ${catalogName.toLowerCase()} across the catalog.`}
			testIdPrefix="engine-tags-settings"
		/>
	);
};
