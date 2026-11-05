import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { Badge, Markdown, Separator, Spinner } from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { CatalogOverview } from "@/components/catalog";
import { useConfig } from "@/hooks";
import { normalizeTagArray } from "@/utility";
import {
	formatServingProviderLabel,
	type ModelMetadata,
	ModelOverviewSections,
	type StaticModelMetadata,
} from "./engine-metadata-display";

interface EngineOverviewProps {
	/** The engine to show */
	engine: Engine;
}

const getModelOverviewDescription = (
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

/**
 * The read-only overview of an engine. Its metadata is edited on the engine's
 * Settings tab.
 */
export const EngineOverview = ({ engine }: EngineOverviewProps) => {
	const databaseMetaKeys = useConfig(
		(state) => state.config.databaseMetaKeys,
	);
	const isModel = engine.engine_type === "MODEL";

	// A model's overview also shows its model metadata. This fetch also resolves
	// the modelId that keys the static description fallback below.
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
			? formatLocalDateTime(engine.engine_date_created)
			: null;
		const updatedOn = engine.engine_date_last_edited
			? formatLocalDateTime(engine.engine_date_last_edited)
			: null;
		const servingProvider =
			typeof getModelMetadata.data?.servingProvider === "string"
				? getModelMetadata.data.servingProvider.trim()
				: "";

		// description is edited on Settings > Description, tags on Settings > Tags,
		// and model metadata on Settings > Model Settings
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

				<ModelOverviewSections metadata={getModelMetadata.data} />

				<Separator />

				<div className="flex flex-col gap-4">
					<h3 className="font-semibold">Details</h3>
					{markdown.trim() ? (
						<Markdown
							className="w-full text-sm leading-relaxed"
							variant="document"
						>
							{markdown}
						</Markdown>
					) : (
						<p
							className="text-muted-foreground text-sm"
							data-testid="engine-overview--markdown-empty"
						>
							No markdown write-up has been provided for this
							model.
						</p>
					)}
				</div>

				{(createdOn || updatedOn || servingProvider !== "") && (
					<p className="text-muted-foreground text-xs">
						{[
							createdOn && `Created ${createdOn}`,
							updatedOn && `Updated ${updatedOn}`,
							servingProvider !== "" &&
								`Served by ${formatServingProviderLabel(
									servingProvider,
								)}`,
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
			metaKeys={databaseMetaKeys}
			description={overviewDescription}
			markdown={engine.markdown || ""}
			markdownVariant="document"
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
		/>
	);
};
