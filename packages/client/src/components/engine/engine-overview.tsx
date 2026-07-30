import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Engine, Role } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import {
	CatalogOverview,
	type CatalogOverviewProps,
} from "@/components/catalog";
import { useRootStore } from "@/hooks";
import { normalizeTagArray } from "@/utility";

interface EngineOverviewProps {
	engine: Engine;
	permission: Role;
	refresh: () => void;
}

type ModelMetadata = {
	engineId?: string;
	modelId?: string | null;
	capability?: string | null;
	inputModalities?: string[] | null;
	outputModalities?: string[] | null;
	contextWindow?: number | null;
	maxInputTokens?: number | null;
	maxOutputTokens?: number | null;
	builtinTools?: string[] | null;
	family?: string | null;
	attachment?: boolean | null;
	reasoning?: boolean | null;
	toolCall?: boolean | null;
	structuredOutput?: boolean | null;
	temperature?: boolean | null;
	knowledgeCutoff?: string | null;
	releaseDate?: string | null;
	benchmarks?: Record<string, unknown>[] | null;
};

const CAPABILITIES = [
	"TEXT_GENERATION",
	"IMAGE_GENERATION",
	"VIDEO_GENERATION",
	"EMBEDDING",
	"TRANSCRIPTION",
	"SPEECH_SYNTHESIS",
	"RERANKING",
	"MODERATION",
] as const;

const MODALITIES = [
	"TEXT",
	"IMAGE",
	"AUDIO",
	"VIDEO",
	"VECTOR",
	"FILE",
	"PDF",
] as const;

const MODEL_METADATA_KEYS = new Set([
	"modelId",
	"capability",
	"inputModalities",
	"outputModalities",
	"contextWindow",
	"maxInputTokens",
	"maxOutputTokens",
	"builtinTools",
	"family",
	"attachment",
	"reasoning",
	"toolCall",
	"structuredOutput",
	"temperature",
	"knowledgeCutoff",
	"releaseDate",
	"benchmarks",
]);

const MODEL_METADATA_META_KEYS: CatalogOverviewProps["metaKeys"] = [
	{
		metakey: "modelId",
		display_label: "Model ID",
		display_options: "input",
		display_order: 1000,
		single_multi: "single",
		read_only: true,
	},
	{
		metakey: "capability",
		display_label: "Capability",
		display_options: "single-select",
		display_order: 1010,
		single_multi: "single",
		display_values: CAPABILITIES.join(","),
	},
	{
		metakey: "inputModalities",
		display_label: "Input modalities",
		display_options: "select-box",
		display_order: 1020,
		single_multi: "multi",
		display_values: MODALITIES.join(","),
	},
	{
		metakey: "outputModalities",
		display_label: "Output modalities",
		display_options: "select-box",
		display_order: 1030,
		single_multi: "multi",
		display_values: MODALITIES.join(","),
	},
	{
		metakey: "contextWindow",
		display_label: "Context window",
		display_options: "input",
		display_order: 1040,
		single_multi: "single",
		input_type: "number",
	},
	{
		metakey: "maxOutputTokens",
		display_label: "Max output tokens",
		display_options: "input",
		display_order: 1050,
		single_multi: "single",
		input_type: "number",
	},
	{
		metakey: "builtinTools",
		display_label: "Built-in tools",
		display_options: "multi-typeahead",
		display_order: 1060,
		single_multi: "multi",
	},
];

const normalizeStringArray = (value: unknown): string[] => {
	const values = Array.isArray(value)
		? value
		: typeof value === "string"
			? value.split(",")
			: [];

	return [
		...new Set(
			values
				.map((item) => String(item).trim())
				.filter((item) => item !== ""),
		),
	];
};

const parseOptionalPositiveInteger = (label: string, value: unknown) => {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	const text = String(value).trim();
	if (!/^\d+$/.test(text) || Number(text) <= 0) {
		throw new Error(`${label} must be a positive whole number.`);
	}

	const parsed = Number(text);
	if (!Number.isSafeInteger(parsed)) {
		throw new Error(`${label} is too large.`);
	}

	return parsed;
};

export const EngineOverview = ({
	engine,
	permission,
	refresh,
}: EngineOverviewProps) => {
	const { configStore } = useRootStore();
	const isModel = engine.engine_type === "MODEL";

	const getEngineMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(`META | GetDatabaseMetaValues ( metaKeys = ['tag'] ) ;`);

	const getModelMetadata = usePixel<ModelMetadata>(
		isModel && engine.engine_id
			? `GetModelMetadata(engine=["${engine.engine_id}"]);`
			: "",
	);
	const overviewMetadata = useMemo<Record<string, unknown>>(
		() => ({
			...(engine as unknown as Record<string, unknown>),
			...(isModel ? getModelMetadata.data : {}),
		}),
		[engine, isModel, getModelMetadata.data],
	);

	/**
	 * Persist edited metadata to the backend and refresh project details.
	 *
	 * @returns Promise that resolves after save flow completes.
	 */
	const onSave = async (id: string, metadata: Record<string, unknown>) => {
		const engineMetadata = Object.fromEntries(
			Object.entries(metadata).filter(
				([key]) => !MODEL_METADATA_KEYS.has(key),
			),
		);
		const modelMetadata = isModel
			? {
					CAPABILITY:
						typeof metadata.capability === "string" &&
						metadata.capability.trim() !== ""
							? metadata.capability
							: null,
					INPUT_MODALITIES: normalizeStringArray(
						metadata.inputModalities,
					),
					OUTPUT_MODALITIES: normalizeStringArray(
						metadata.outputModalities,
					),
					CONTEXT_WINDOW: parseOptionalPositiveInteger(
						"Context window",
						metadata.contextWindow,
					),
					MAX_TOKENS: parseOptionalPositiveInteger(
						"Max output tokens",
						metadata.maxOutputTokens,
					),
					BUILTIN_TOOLS: normalizeStringArray(metadata.builtinTools),
				}
			: null;

		await configStore.runPixel(
			`SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(
				engineMetadata,
			)}])`,
		);

		if (modelMetadata) {
			const response = await configStore.runPixel(
				`UpdateModelMetadata(engine=["${id}"], map=[${JSON.stringify(modelMetadata)}]);`,
			);
			const result = response.pixelReturn?.[0];

			if (
				response.errors.length > 0 ||
				String(result?.operationType || "").includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") ||
						String(
							result?.output ||
								"Unable to update model capabilities.",
						),
				);
			}

			getModelMetadata.refresh();
		}

		refresh();
	};

	if (!engine) {
		return <div className="text-muted-foreground">No details found</div>;
	}

	if (isModel && getModelMetadata.status !== "SUCCESS") {
		if (getModelMetadata.status === "ERROR") {
			return (
				<p className="p-4 text-destructive text-sm">
					Unable to load model metadata.
				</p>
			);
		}

		return (
			<div className="flex min-h-64 items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const overviewMetaKeys = isModel
		? [
				...configStore.store.config.databaseMetaKeys.filter(
					(meta) => !MODEL_METADATA_KEYS.has(meta.metakey),
				),
				...MODEL_METADATA_META_KEYS,
			]
		: configStore.store.config.databaseMetaKeys;
	return (
		<CatalogOverview
			id={engine.engine_id}
			permission={permission}
			metaKeys={overviewMetaKeys}
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
			metadata={overviewMetadata}
			dateCreated={engine.engine_date_created || ""}
			dateLastEdited={engine.engine_date_last_edited || ""}
			onSave={onSave}
		/>
	);
};
