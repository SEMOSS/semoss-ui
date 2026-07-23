import { usePixel } from "@semoss/sdk/react";
import type { Engine, Role } from "@semoss/shared";
import { CatalogOverview } from "@/components/catalog";
import { useRootStore } from "@/hooks";
import { normalizeTagArray } from "@/utility";

interface EngineOverviewProps {
	engine: Engine;
	permission: Role;
	refresh: () => void;
}

export const EngineOverview = ({
	engine,
	permission,
	refresh,
}: EngineOverviewProps) => {
	const { configStore } = useRootStore();

	const getEngineMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(`META | GetDatabaseMetaValues ( metaKeys = ['tag'] ) ;`);

	/**
	 * Persist edited metadata to the backend and refresh project details.
	 *
	 * @returns Promise that resolves after save flow completes.
	 */
	const onSave = async (id: string, metadata: Record<string, unknown>) => {
		await configStore.runPixel(
			`SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(
				metadata,
			)}])`,
		);

		refresh();
	};

	if (!engine) {
		return <div className="text-muted-foreground">No details found</div>;
	}

	return (
		<CatalogOverview
			id={engine.engine_id}
			permission={permission}
			metaKeys={configStore.store.config.databaseMetaKeys}
			metaValues={
				getEngineMetaValues.status === "SUCCESS"
					? getEngineMetaValues.data
					: []
			}
			description={engine.description || ""}
			markdown={engine.markdown || ""}
			tags={normalizeTagArray(engine.tag) || []}
			dataClassification={
				normalizeTagArray(engine["data classification"]) || []
			}
			dataRestrictions={
				normalizeTagArray(engine["data restrictions"]) || []
			}
			metadata={engine as unknown as Record<string, unknown>}
			dateCreated={engine.engine_date_created || ""}
			dateLastEdited={engine.engine_date_last_edited || ""}
			onSave={onSave}
		/>
	);
};
