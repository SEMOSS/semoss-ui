import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Engine, Role } from "@semoss/shared";
import { Badge, Markdown, Separator, Spinner } from "@semoss/ui/next";
import { CatalogOverview } from "@/components/catalog";
import { useRootStore } from "@/hooks";
import { normalizeTagArray } from "@/utility";
import { formatDateToLocal } from "@/utility/date";
import {
	type ModelMetadata,
	ModelOverviewCards,
	SettingsEntry,
} from "./engine-metadata-display";

interface EngineOverviewProps {
	engine: Engine;
	permission: Role;
	refresh: () => void;
}

type StaticModelMetadata = {
	description?: string | null;
};

export const getModelOverviewDescription = (
	catalogDescription: unknown,
	staticDescription: unknown,
): string => {
	if (
		typeof catalogDescription === "string" &&
		catalogDescription.trim() !== ""
	) {
		return catalogDescription;
	}
	return typeof staticDescription === "string" ? staticDescription : "";
};

export const EngineOverview = ({
	engine,
	permission,
	refresh,
}: EngineOverviewProps) => {
	const { configStore } = useRootStore();
	const isModel = engine.engine_type === "MODEL";

	// Only the editable (non-model) overview offers tag suggestions.
	const getEngineMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(!isModel ? `META | GetDatabaseMetaValues ( metaKeys = ['tag'] ) ;` : "");

	// Models render a read-only overview; the metadata itself is edited on the
	// Settings tab. This fetch also resolves the modelId that keys the static
	// description fallback below.
	const getModelMetadata = usePixel<ModelMetadata>(
		isModel && engine.engine_id
			? `GetModelMetadata(engine=["${engine.engine_id}"]);`
			: "",
	);
	const staticModelId =
		typeof getModelMetadata.data?.modelId === "string"
			? getModelMetadata.data.modelId.trim()
			: "";
	const getStaticModelMetadata = usePixel<StaticModelMetadata>(
		isModel && !engine.description && staticModelId
			? `GetStaticModelMetadata(modelId=${JSON.stringify(staticModelId)});`
			: "",
	);
	const overviewDescription = getModelOverviewDescription(
		engine.description,
		getStaticModelMetadata.data?.description,
	);
	const overviewMetadata = useMemo<Record<string, unknown>>(
		() => ({
			...(engine as unknown as Record<string, unknown>),
			description: overviewDescription,
		}),
		[engine, overviewDescription],
	);

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

	if (isModel) {
		if (getModelMetadata.status === "ERROR") {
			return (
				<p className="p-4 text-destructive text-sm">
					Unable to load model metadata.
				</p>
			);
		}

		if (getModelMetadata.status !== "SUCCESS") {
			return (
				<div className="flex min-h-64 items-center justify-center">
					<Spinner />
				</div>
			);
		}

		const markdown = String(engine.markdown || "");
		const createdOn = engine.engine_date_created
			? formatDateToLocal(engine.engine_date_created)
			: null;
		const updatedOn = engine.engine_date_last_edited
			? formatDateToLocal(engine.engine_date_last_edited)
			: null;

		// Read-only by design: description is edited on Settings > Description,
		// tags on Settings > Tags, and model metadata on Settings > Model Settings.
		return (
			<div className="space-y-6">
				{(overviewDescription.trim() !== "" ||
					staticModelId !== "") && (
					<div className="flex flex-wrap items-start justify-between gap-3">
						{overviewDescription.trim() !== "" && (
							<p className="min-w-0 flex-1 text-lg">
								{overviewDescription}
							</p>
						)}
						{staticModelId !== "" && (
							<Badge
								variant="secondary"
								className="shrink-0 font-mono"
							>
								{staticModelId}
							</Badge>
						)}
					</div>
				)}

				<ModelOverviewCards metadata={getModelMetadata.data} />

				<Separator />

				<SettingsEntry label="Details">
					{markdown.trim() ? (
						<Markdown>{markdown}</Markdown>
					) : (
						<p
							className="text-muted-foreground text-sm"
							data-testid="engine-overview--markdown-empty"
						>
							No markdown write-up has been provided for this
							model.
						</p>
					)}
				</SettingsEntry>

				{(createdOn || updatedOn) && (
					<p className="text-muted-foreground text-xs">
						{[
							createdOn && `Created ${createdOn}`,
							updatedOn && `Updated ${updatedOn}`,
						]
							.filter(Boolean)
							.join(" · ")}
					</p>
				)}
			</div>
		);
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
			description={overviewDescription}
			markdown={engine.markdown || ""}
			tags={normalizeTagArray(engine.tag) || []}
			dataClassification={
				normalizeTagArray(engine["data classification"]) || []
			}
			dataRestrictions={
				normalizeTagArray(engine["data restrictions"]) || []
			}
			metadata={overviewMetadata}
			dateCreated={engine.engine_date_created || ""}
			dateLastEdited={engine.engine_date_last_edited || ""}
			onSave={onSave}
		/>
	);
};
