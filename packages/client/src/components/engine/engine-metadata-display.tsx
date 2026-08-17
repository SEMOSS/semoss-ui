import dayjs from "dayjs";
import { CheckIcon, Pencil, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	cn,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import { useEngine } from "@/hooks";

/**
 * One configurable parameter of a provider built-in tool, as written in the
 * meta/builtin-tools.json catalog. Unknown keys pass through untouched.
 */
export interface BuiltinToolParam {
	alias: string;
	display_name?: string;
	type?: "required" | "optional";
	input?: "string" | "number" | "boolean" | "list" | "map";
	options?: (string | number | boolean)[];
	default?: unknown;
	show_in_ui?: boolean;
	/** The user's chosen value; the catalog `default` applies when absent. */
	value?: unknown;
	[key: string]: unknown;
}

/**
 * One provider built-in tool from the meta/builtin-tools.json catalog.
 * Unknown keys pass through untouched, which also makes a definition
 * directly storable as a {@link BuiltinToolSelection}.
 */
export interface BuiltinToolDefinition {
	alias: string;
	display_name?: string;
	description?: string;
	params?: BuiltinToolParam[];
	constraints?: { api?: string; models?: string[]; regions?: string[] };
	[key: string]: unknown;
}

/**
 * Stored selection for one provider built-in tool: the catalog definition
 * copied as-is, with a `value` on any parameter the user changed from its
 * default. Kept catalog-shaped on purpose, so whatever reads the stored
 * JSON can render the tool's options without a second catalog lookup.
 */
export interface BuiltinToolSelection {
	alias?: string;
	display_name?: string;
	description?: string;
	params?: BuiltinToolParam[];
	[key: string]: unknown;
}

/** Shape returned by the GetModelMetadata pixel. */
export type ModelMetadata = {
	engineId?: string;
	modelId?: string | null;
	capability?: string | null;
	inputModalities?: string[] | null;
	outputModalities?: string[] | null;
	contextWindow?: number | null;
	maxInputTokens?: number | null;
	maxOutputTokens?: number | null;
	/** Selected built-in tools, keyed by canonical tool name. */
	builtinTools?: Record<string, BuiltinToolSelection> | null;
	family?: string | null;
	attachment?: boolean | null;
	reasoning?: boolean | null;
	toolCall?: boolean | null;
	structuredOutput?: boolean | null;
	temperature?: boolean | null;
	knowledgeCutoff?: string | null;
	releaseDate?: string | null;
	supportedParameters?: string[] | null;
	reasoningConfig?: Record<string, unknown> | null;
	benchmarks?: Record<string, unknown>[] | null;
	inputTokenCredit?: number | null;
	outputTokenCredit?: number | null;
	cacheReadMultiplier?: number | null;
	cacheWriteMultiplier?: number | null;
};

/**
 * A single published benchmark result. Only `name` and `score` are guaranteed;
 * every qualifier below is optional and frequently missing.
 */
export interface ModelBenchmark {
	name: string;
	score: number;
	metric?: string;
	harness?: string;
	variant?: string;
	version?: string;
	dataset?: string;
}

export const CAPABILITIES = [
	"TEXT_GENERATION",
	"IMAGE_GENERATION",
	"VIDEO_GENERATION",
	"EMBEDDING",
	"TRANSCRIPTION",
	"SPEECH_SYNTHESIS",
	"RERANKING",
	"MODERATION",
] as const;

export const MODALITIES = [
	"TEXT",
	"IMAGE",
	"AUDIO",
	"VIDEO",
	"VECTOR",
	"FILE",
	"PDF",
] as const;

/**
 * Display labels only. The selectable efforts come from the model's stored
 * config, never from this list - providers disagree on the scale, so offering
 * levels the config does not list would invent support that may not exist.
 */
const REASONING_EFFORT_LABELS: Record<string, string> = {
	none: "None",
	minimal: "Minimal",
	low: "Low",
	medium: "Medium",
	high: "High",
	xhigh: "X-High",
	max: "Max",
};

const MODALITY_LABELS: Record<string, string> = {
	TEXT: "Text",
	IMAGE: "Image",
	AUDIO: "Audio",
	VIDEO: "Video",
	VECTOR: "Vector",
	FILE: "File",
	PDF: "PDF",
};

/**
 * Convert an UPPER_SNAKE enum value into a human friendly label.
 *
 * @param value Enum value, e.g. "TEXT_GENERATION".
 * @returns Title-cased label, e.g. "Text Generation".
 */
export const formatEnumLabel = (value: string) =>
	value
		.toLowerCase()
		.split("_")
		.filter((word) => word !== "")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

/**
 * Resolve the display label for a modality, falling back to title case for
 * values outside the known list.
 */
export const formatModalityLabel = (value: string) =>
	MODALITY_LABELS[value] || formatEnumLabel(value);

/** Display label for a reasoning effort, title cased for unknown values. */
export const formatEffortLabel = (value: string) =>
	REASONING_EFFORT_LABELS[value] || formatEnumLabel(value);

/** Lowercase, deduped effort values - the stored config is provider-supplied. */
export const normalizeEfforts = (value: unknown): string[] => [
	...new Set(
		normalizeStringArray(value).map((effort) => effort.toLowerCase()),
	),
];

/**
 * Weakest to strongest, for display order only. Configs list their efforts in
 * whatever order the provider used - usually strongest first, which reads
 * backwards next to every other scale in the UI.
 */
const EFFORT_ORDER = [
	"none",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max",
];

/**
 * Order efforts weakest to strongest. Values outside the known scale keep their
 * relative order and go last, since there is no sensible rank for them.
 */
export const sortEfforts = (efforts: string[]): string[] =>
	[...efforts].sort((a, b) => {
		const rankA = EFFORT_ORDER.indexOf(a);
		const rankB = EFFORT_ORDER.indexOf(b);

		if (rankA === -1 || rankB === -1) {
			return rankA === rankB ? 0 : rankA === -1 ? 1 : -1;
		}

		return rankA - rankB;
	});

/**
 * The selectable efforts, deduped across the given stored lists and ordered for
 * display. Nothing is added: only what the model's own config named is ever
 * offered.
 */
export const getEffortOptions = (...stored: string[][]): string[] =>
	sortEfforts([...new Set(stored.flat().filter((effort) => effort !== ""))]);

/**
 * Keep the default effort on something selectable: the previous value when it
 * survives, otherwise the closest remaining effort by rank, preferring the
 * weaker side on a tie. An unset default stays unset - the form should never
 * invent one - and no options at all clears it.
 */
export const pickNearestEffort = (
	previous: string,
	options: string[],
): string => {
	if (previous === "" || options.length === 0) {
		return "";
	}

	if (options.includes(previous)) {
		return previous;
	}

	// Unknown values sort past the end of the scale, so they read as strongest.
	const rankOf = (effort: string) => {
		const rank = EFFORT_ORDER.indexOf(effort);
		return rank === -1 ? EFFORT_ORDER.length : rank;
	};
	const target = rankOf(previous);

	return sortEfforts(options).reduce((best, option) =>
		Math.abs(rankOf(option) - target) < Math.abs(rankOf(best) - target)
			? option
			: best,
	);
};

/** Shape returned by the GetStaticModelMetadata pixel (meta/model.json). */
export type StaticModelMetadata = {
	id?: string;
	description?: string | null;
	input_modalities?: string[] | null;
	output_modalities?: string[] | null;
	context_length?: number | null;
	max_output_tokens?: number | null;
	reasoning?: boolean | null;
};

/**
 * Whether the catalog actually knows this model. The pixel answers with an
 * empty map for a model it has never heard of, which is the signal that none
 * of the advisory checks below can say anything.
 */
export const hasCatalogEntry = (
	metadata: StaticModelMetadata | undefined,
): boolean =>
	!!metadata &&
	typeof metadata === "object" &&
	Object.keys(metadata).length > 0;

/**
 * Modalities the curated catalog is capable of expressing. VECTOR and FILE
 * never appear in meta/model.json - embedding models are recorded there with a
 * text output - so the catalog staying silent about them says nothing about
 * support and must never produce a warning.
 */
/**
 * Modalities the catalog can actually list. VECTOR and FILE never appear there,
 * so their absence says nothing and selecting them is never flagged.
 */
export const CATALOG_MODALITIES = ["TEXT", "IMAGE", "AUDIO", "VIDEO", "PDF"];

/**
 * Normalize the catalog's lowercase modality values ("text", "pdf") into the
 * uppercase vocabulary the settings form uses, dropping anything unrecognized.
 */
export const normalizeCatalogModalities = (value: unknown): string[] => [
	...new Set(
		normalizeStringArray(value)
			.map((modality) => modality.toUpperCase())
			.filter((modality) =>
				(MODALITIES as readonly string[]).includes(modality),
			),
	),
];

/**
 * Selected modalities the catalog entry does not list for this model.
 *
 * Deliberately conservative: an empty catalog list (unknown model, or a
 * direction the entry says nothing about) reports nothing, and only values the
 * catalog could have listed are ever flagged. Clearing a modality is always
 * silent, since this only looks at what is currently selected.
 */
export const getUnlistedModalities = (
	selected: string[],
	catalogModalities: string[],
): string[] => {
	if (catalogModalities.length === 0) {
		return [];
	}

	return normalizeCatalogModalities(selected).filter(
		(modality) =>
			CATALOG_MODALITIES.includes(modality) &&
			!catalogModalities.includes(modality),
	);
};

/** Join modality labels into "Image", "Image or PDF", "Image, Audio or PDF". */
const formatModalityList = (modalities: string[]) => {
	const labels = modalities.map(formatModalityLabel);

	if (labels.length < 2) {
		return labels.join("");
	}

	return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
};

/**
 * Advisory copy for modalities the catalog does not list. Returns "" when there
 * is nothing to say - the catalog is sparse and hand-maintained, so this warns
 * rather than blocks and the save path never consults it.
 */
export const getModalityWarning = (
	direction: "input" | "output",
	selected: string[],
	catalogModalities: string[],
): string => {
	const unlisted = getUnlistedModalities(selected, catalogModalities);

	if (unlisted.length === 0) {
		return "";
	}

	const pronoun = unlisted.length > 1 ? "them" : "it";
	return `The model catalog does not list ${formatModalityList(unlisted)} as ${direction} for this model. You can still keep ${pronoun} enabled, but the provider may reject requests that use ${pronoun}.`;
};

/**
 * A usable token limit from the catalog, or null when there is none to compare
 * against. `minimum` exists for the output limit: the catalog records 0 or 1
 * there to mean "not a text completion model", and treating that placeholder
 * as a real ceiling would flag every sane value as too high.
 */
export const normalizeCatalogTokenLimit = (
	value: unknown,
	minimum = 1,
): number | null => {
	const parsed = typeof value === "number" ? value : Number(value);

	if (!Number.isInteger(parsed) || parsed < minimum) {
		return null;
	}

	return parsed;
};

/**
 * Advisory copy for a token limit set above what the catalog lists. Only ever
 * fires on values that exceed the catalog - lowering a limit is always a valid
 * thing to want, and nothing here blocks the save.
 */
export const getTokenLimitWarning = (
	label: string,
	value: string,
	catalogLimit: number | null,
): string => {
	if (catalogLimit === null || !/^\d+$/.test(value)) {
		return "";
	}

	if (Number(value) <= catalogLimit) {
		return "";
	}

	return `The model catalog lists a ${label} of ${catalogLimit.toLocaleString()} tokens for this model. You can still save a higher value, but the provider may reject requests that exceed its own limit.`;
};

/**
 * The stored REASONINGCONFIG object, e.g.
 * `{"default_effort":"medium","mandatory":true,"supported_efforts":["low"]}`.
 * Providers add keys beyond these (default_enabled, supports_max_tokens), so
 * the raw object is kept around and only the edited keys are ever rewritten.
 */
export interface ReasoningConfig {
	default_effort?: string | null;
	mandatory?: boolean | null;
	supported_efforts?: string[] | null;
	[key: string]: unknown;
}

/** The stored config, or null when the column is empty. */
export const toReasoningConfig = (value: unknown): ReasoningConfig | null => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	const config = value as ReasoningConfig;
	return Object.keys(config).length > 0 ? config : null;
};

/** Whether the stored config marks reasoning as required for the model. */
export const isReasoningMandatory = (config: ReasoningConfig | null): boolean =>
	config?.mandatory === true;

/**
 * Advisory copy for enabling reasoning on a model not known to support it.
 * Both the saved metadata and the catalog get a say: either one claiming
 * support is enough to stay quiet, so the note only appears when nothing on
 * record backs the choice.
 */
export const getReasoningSupportWarning = (
	enabled: boolean,
	savedReasoning: boolean | null | undefined,
	catalogReasoning: boolean | null | undefined,
): string => {
	if (!enabled || savedReasoning === true || catalogReasoning === true) {
		return "";
	}

	return "This model is not on record as supporting reasoning. You can still enable it, but the provider may reject or ignore reasoning requests.";
};

/**
 * Copy for switching reasoning off on a model whose config marks it mandatory.
 * Rendered in the destructive tone - it is a stronger claim than the advisory
 * notes - but it still only warns, since a deployment can override this.
 */
export const getMandatoryReasoningWarning = (
	enabled: boolean,
	mandatory: boolean,
): string => {
	if (enabled || !mandatory) {
		return "";
	}

	return "Reasoning is mandatory for this model. Turning it off is expected to make requests fail unless the provider has since made it optional.";
};

/**
 * Advisory copy for a default effort missing from the supported list. Silent
 * when either side is unset, since an empty supported list says nothing.
 */
export const getDefaultEffortWarning = (
	defaultEffort: string,
	supportedEfforts: string[],
): string => {
	if (
		defaultEffort === "" ||
		supportedEfforts.length === 0 ||
		supportedEfforts.includes(defaultEffort)
	) {
		return "";
	}

	return `${formatEffortLabel(defaultEffort)} is not one of the supported efforts, so the provider may fall back to its own default.`;
};

/**
 * Format a digits-only string with locale thousands separators.
 *
 * @param digits Raw digit string.
 * @returns Formatted number, or the raw text when it is not a clean number.
 */
export const formatDigits = (digits: string) => {
	if (digits === "" || !/^\d+$/.test(digits)) {
		return digits;
	}

	const parsed = Number(digits);
	return Number.isFinite(parsed) ? parsed.toLocaleString() : digits;
};

export const normalizeStringArray = (value: unknown): string[] => {
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

/**
 * Format a catalog date ("2026-04-23") for display. Parsed in local time on
 * purpose: these are calendar dates, not instants, so a UTC->local conversion
 * would shift them a day backwards for western timezones.
 *
 * @returns Formatted date, or "" when the value is missing or unparseable.
 */
export const formatMetadataDate = (value: unknown): string => {
	if (typeof value !== "string") {
		return "";
	}

	const trimmed = value.trim();
	if (trimmed === "" || !dayjs(trimmed).isValid()) {
		return "";
	}

	return dayjs(trimmed).format("MMM D, YYYY");
};

/** Boolean model traits, in the order they are displayed. */
const CAPABILITY_FLAGS = [
	{ key: "reasoning", label: "Reasoning" },
	{ key: "toolCall", label: "Tool calling" },
	{ key: "structuredOutput", label: "Structured output" },
	{ key: "attachment", label: "Attachments" },
	{ key: "temperature", label: "Temperature" },
] as const satisfies readonly { key: keyof ModelMetadata; label: string }[];

/**
 * Collect the trait flags the provider actually reported. A missing flag means
 * "unknown" and is dropped entirely rather than rendered as a false.
 */
export const getCapabilityFlags = (metadata: ModelMetadata | undefined) =>
	CAPABILITY_FLAGS.filter(
		(flag) => typeof metadata?.[flag.key] === "boolean",
	).map((flag) => ({
		key: flag.key,
		label: flag.label,
		enabled: metadata?.[flag.key] === true,
	}));

/**
 * Coerce the loosely-typed benchmark payload into usable entries, discarding
 * anything without a name and a numeric score.
 */
export const normalizeBenchmarks = (value: unknown): ModelBenchmark[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	const optionalText = (raw: unknown) => {
		const text = typeof raw === "string" ? raw.trim() : "";
		return text !== "" ? text : undefined;
	};

	return value.flatMap((entry) => {
		if (!entry || typeof entry !== "object") {
			return [];
		}

		const record = entry as Record<string, unknown>;
		const name = optionalText(record.name);
		const score = Number(record.score);

		if (!name || !Number.isFinite(score)) {
			return [];
		}

		return [
			{
				name,
				score,
				metric: optionalText(record.metric),
				harness: optionalText(record.harness),
				variant: optionalText(record.variant),
				version: optionalText(record.version),
				dataset: optionalText(record.dataset),
			},
		];
	});
};

/**
 * Order benchmarks so vendor-reported headline numbers (no third-party
 * harness) come first, keeping the payload order within each group.
 */
export const rankBenchmarks = (benchmarks: ModelBenchmark[]) => [
	...benchmarks.filter((benchmark) => !benchmark.harness),
	...benchmarks.filter((benchmark) => benchmark.harness),
];

/**
 * Pick the collapsed-state preview: the first `limit` benchmarks with distinct
 * names, so the summary shows variety instead of one benchmark's variants.
 */
export const selectPreviewBenchmarks = (
	benchmarks: ModelBenchmark[],
	limit: number,
) => {
	const seen = new Set<string>();
	const preview: ModelBenchmark[] = [];

	for (const benchmark of benchmarks) {
		const key = benchmark.name.toLowerCase();
		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		preview.push(benchmark);

		if (preview.length === limit) {
			break;
		}
	}

	return preview;
};

/** Qualifiers rendered under a benchmark name, e.g. "accuracy - with tools". */
export const formatBenchmarkDetail = (benchmark: ModelBenchmark) =>
	[
		benchmark.metric,
		benchmark.variant,
		benchmark.dataset,
		benchmark.harness,
		benchmark.version ? `v${benchmark.version}` : undefined,
	]
		.filter(Boolean)
		.join(" · ");

/** Normalized, display/edit-ready view of the editable model metadata. */
export interface ModelSettingsValues {
	capability: string;
	inputModalities: string[];
	outputModalities: string[];
	/**
	 * Tri-state, because REASONING is a nullable column: "" means the metadata
	 * has no opinion, which is distinct from an explicit "false".
	 */
	reasoning: "" | "true" | "false";
	reasoningMandatory: boolean;
	reasoningDefaultEffort: string;
	reasoningSupportedEfforts: string[];
	/** Digits only; formatted with separators at render time. */
	contextWindow: string;
	maxOutputTokens: string;
	builtinTools: string[];
	/**
	 * Keyed tool selection when the stored value carries configurations;
	 * null for the legacy name list, which keeps `builtinTools` above
	 * authoritative for display.
	 */
	builtinToolsConfig: Record<string, BuiltinToolSelection> | null;
}

/**
 * Normalize fetched model metadata into display/edit-ready values.
 */
export const toModelSettingsValues = (
	metadata: ModelMetadata | undefined,
): ModelSettingsValues => {
	const reasoningConfig = toReasoningConfig(metadata?.reasoningConfig);

	return {
		capability:
			typeof metadata?.capability === "string"
				? metadata.capability.trim()
				: "",
		inputModalities: normalizeStringArray(metadata?.inputModalities),
		outputModalities: normalizeStringArray(metadata?.outputModalities),
		reasoning:
			typeof metadata?.reasoning === "boolean"
				? metadata.reasoning
					? "true"
					: "false"
				: "",
		reasoningMandatory: isReasoningMandatory(reasoningConfig),
		reasoningDefaultEffort:
			typeof reasoningConfig?.default_effort === "string"
				? reasoningConfig.default_effort.trim().toLowerCase()
				: "",
		reasoningSupportedEfforts: normalizeEfforts(
			reasoningConfig?.supported_efforts,
		),
		contextWindow:
			metadata?.contextWindow !== null &&
			metadata?.contextWindow !== undefined
				? String(metadata.contextWindow)
				: "",
		maxOutputTokens:
			metadata?.maxOutputTokens !== null &&
			metadata?.maxOutputTokens !== undefined
				? String(metadata.maxOutputTokens)
				: "",
		builtinTools: Object.keys(metadata?.builtinTools ?? {}),
		builtinToolsConfig: metadata?.builtinTools ?? null,
	};
};

/**
 * Rewrite only the keys this form edits, so provider keys it does not surface
 * (mandatory, default_enabled, supports_max_tokens) survive the round trip.
 * Returns null when the model has no stored config, in which case the caller
 * leaves the column alone rather than inventing one.
 */
export const buildReasoningConfigPayload = (
	config: ReasoningConfig | null,
	values: ModelSettingsValues,
): ReasoningConfig | null => {
	if (config === null) {
		return null;
	}

	return {
		...config,
		default_effort:
			values.reasoningDefaultEffort !== ""
				? values.reasoningDefaultEffort
				: null,
		supported_efforts: values.reasoningSupportedEfforts,
	};
};

/** Shared placeholder for read-mode fields without a value. */
export const EmptyValue = () => (
	<span className="text-muted-foreground text-sm">Not set</span>
);

/**
 * Read-mode entry: a small muted label above the rendered value.
 */
export const SettingsEntry = ({
	label,
	children,
	className,
}: React.PropsWithChildren<{ label: string; className?: string }>) => (
	<div className={`flex flex-col gap-1.5 ${className || ""}`}>
		<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
			{label}
		</span>
		<div>{children}</div>
	</div>
);

/**
 * Tinted outline-badge palettes. Kept to a short list on purpose: each one is
 * a low-alpha fill plus a readable text colour picked per theme, since the
 * mid-tone hues fail contrast against the dark card background.
 */
export const BADGE_TONES = {
	blue: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300",
	violet: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:border-violet-400/40 dark:bg-violet-400/10 dark:text-violet-300",
	teal: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:border-teal-400/40 dark:bg-teal-400/10 dark:text-teal-300",
	emerald:
		"border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

/**
 * Render a list of values as outline badges, or the shared empty state.
 * Without a `tone` the badges stay neutral, which is what the Settings tab's
 * read mode uses.
 */
export const BadgeList = ({
	values,
	format,
	mono,
	tone,
}: {
	values: string[];
	format?: (value: string) => string;
	mono?: boolean;
	tone?: BadgeTone;
}) => {
	if (values.length === 0) {
		return <EmptyValue />;
	}

	return (
		<div className="flex flex-wrap gap-1.5">
			{values.map((value) => (
				<Badge
					key={value}
					variant="outline"
					className={cn(
						mono && "font-mono text-xs",
						tone && BADGE_TONES[tone],
					)}
				>
					{format ? format(value) : value}
				</Badge>
			))}
		</div>
	);
};

/** Token count with a muted unit suffix, or the shared empty state. */
const TokenValue = ({ value }: { value: string }) =>
	value !== "" ? (
		<span className="text-sm">
			{formatDigits(value)}{" "}
			<span className="text-muted-foreground text-xs">tokens</span>
		</span>
	) : (
		<EmptyValue />
	);

/**
 * Read-only rendering of the model settings fields. Shared between the
 * Overview page (always read-only) and the Model Settings card (read mode)
 * so the two never drift apart.
 */
export const ModelMetadataFields = ({
	modelId,
	values,
}: {
	modelId: string;
	values: ModelSettingsValues;
}) => (
	<>
		<SettingsEntry label="Model ID" className="sm:col-span-2">
			{modelId ? (
				<span className="break-all font-mono text-sm">{modelId}</span>
			) : (
				<EmptyValue />
			)}
		</SettingsEntry>

		<SettingsEntry label="Capability">
			{values.capability !== "" ? (
				<Badge variant="secondary">
					{formatEnumLabel(values.capability)}
				</Badge>
			) : (
				<EmptyValue />
			)}
		</SettingsEntry>

		<SettingsEntry label="Built-in tools">
			<BadgeList values={values.builtinTools} mono />
		</SettingsEntry>

		<SettingsEntry label="Input modalities">
			<BadgeList
				values={values.inputModalities}
				format={formatModalityLabel}
			/>
		</SettingsEntry>

		<SettingsEntry label="Output modalities">
			<BadgeList
				values={values.outputModalities}
				format={formatModalityLabel}
			/>
		</SettingsEntry>

		<SettingsEntry label="Reasoning">
			{values.reasoning !== "" ? (
				<div className="flex flex-wrap gap-1.5">
					<Badge variant="secondary">
						{values.reasoning === "true" ? "Enabled" : "Disabled"}
					</Badge>
					{values.reasoningMandatory && (
						<Badge variant="outline">Required</Badge>
					)}
				</div>
			) : (
				<EmptyValue />
			)}
		</SettingsEntry>

		<SettingsEntry label="Reasoning effort">
			{values.reasoningDefaultEffort !== "" ||
			values.reasoningSupportedEfforts.length > 0 ? (
				<div className="flex flex-wrap items-center gap-1.5">
					{values.reasoningDefaultEffort !== "" && (
						<Badge variant="secondary">
							{formatEffortLabel(values.reasoningDefaultEffort)}{" "}
							by default
						</Badge>
					)}
					{values.reasoningSupportedEfforts.length > 0 && (
						<BadgeList
							values={sortEfforts(
								values.reasoningSupportedEfforts,
							)}
							format={formatEffortLabel}
						/>
					)}
				</div>
			) : (
				<EmptyValue />
			)}
		</SettingsEntry>

		<SettingsEntry label="Context window">
			<TokenValue value={values.contextWindow} />
		</SettingsEntry>

		<SettingsEntry label="Max output tokens">
			<TokenValue value={values.maxOutputTokens} />
		</SettingsEntry>
	</>
);

/** How many benchmark rows show before the table has to be expanded. */
const BENCHMARK_PREVIEW_COUNT = 5;

/**
 * Card shell for the overview panels. Cards flex to fill the row, so a model
 * with only one populated panel still spans the full width.
 */
const OverviewCard = ({
	title,
	className,
	headerAction,
	children,
}: React.PropsWithChildren<{
	title: string;
	className?: string;
	headerAction?: React.ReactNode;
}>) => (
	<Card className={cn("min-w-72 flex-1 gap-4 py-5", className)}>
		<CardHeader className="px-5">
			<div className="flex items-center justify-between gap-2">
				<CardTitle>{title}</CardTitle>
				{headerAction}
			</div>
		</CardHeader>
		<CardContent className="px-5">{children}</CardContent>
	</Card>
);

/** A headline number with its unit, e.g. the context window. */
const StatValue = ({ label, value }: { label: string; value: string }) => (
	<div className="flex flex-col gap-1">
		<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
			{label}
		</span>
		<span className="font-semibold text-2xl tabular-nums">
			{formatDigits(value)}
		</span>
		<span className="text-muted-foreground text-xs">tokens</span>
	</div>
);

/** A date value under a small muted label. */
const DateValue = ({ label, value }: { label: string; value: string }) => (
	<div className="flex flex-col gap-1">
		<span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
			{label}
		</span>
		<span className="text-base">{value}</span>
	</div>
);

/**
 * Capability, modalities, and the boolean trait flags. Each block is dropped
 * when the provider reported nothing for it.
 */
const SpecificationCard = ({
	values,
	capabilityFlags,
}: {
	values: ModelSettingsValues;
	capabilityFlags: ReturnType<typeof getCapabilityFlags>;
}) => (
	<OverviewCard title="Specification">
		<div className="flex flex-col gap-5">
			{values.capability !== "" && (
				<SettingsEntry label="Capability">
					<Badge variant="outline" className={BADGE_TONES.blue}>
						{formatEnumLabel(values.capability)}
					</Badge>
				</SettingsEntry>
			)}

			{values.inputModalities.length > 0 && (
				<SettingsEntry label="Input modalities">
					<BadgeList
						values={values.inputModalities}
						format={formatModalityLabel}
						tone="violet"
					/>
				</SettingsEntry>
			)}

			{values.outputModalities.length > 0 && (
				<SettingsEntry label="Output modalities">
					<BadgeList
						values={values.outputModalities}
						format={formatModalityLabel}
						tone="teal"
					/>
				</SettingsEntry>
			)}

			{values.builtinTools.length > 0 && (
				<SettingsEntry label="Built-in tools">
					<BadgeList values={values.builtinTools} mono />
				</SettingsEntry>
			)}

			{capabilityFlags.length > 0 && (
				<SettingsEntry label="Supports">
					<div className="flex flex-wrap gap-1.5">
						{capabilityFlags.map((flag) => (
							<Badge
								key={flag.key}
								variant="outline"
								className={
									flag.enabled
										? BADGE_TONES.emerald
										: "text-muted-foreground"
								}
							>
								{flag.enabled ? (
									<CheckIcon className="size-3" />
								) : (
									<XIcon className="size-3" />
								)}
								{flag.label}
							</Badge>
						))}
					</div>
				</SettingsEntry>
			)}
		</div>
	</OverviewCard>
);

/** Token limits alongside the release and knowledge-cutoff dates. */
const LimitsCard = ({
	contextWindow,
	maxOutputTokens,
	releaseDate,
	knowledgeCutoff,
}: {
	contextWindow: string;
	maxOutputTokens: string;
	releaseDate: string;
	knowledgeCutoff: string;
}) => {
	const hasLimits = contextWindow !== "" || maxOutputTokens !== "";
	const hasDates = releaseDate !== "" || knowledgeCutoff !== "";

	return (
		<OverviewCard
			title={
				hasLimits && hasDates
					? "Limits & dates"
					: hasLimits
						? "Limits"
						: "Dates"
			}
		>
			<div className="flex flex-col gap-5">
				{hasLimits && (
					<div className="grid grid-cols-2 gap-4">
						{contextWindow !== "" && (
							<StatValue
								label="Context window"
								value={contextWindow}
							/>
						)}
						{maxOutputTokens !== "" && (
							<StatValue
								label="Max output"
								value={maxOutputTokens}
							/>
						)}
					</div>
				)}

				{hasDates && (
					<div className="grid grid-cols-2 gap-4">
						{releaseDate !== "" && (
							<DateValue label="Released" value={releaseDate} />
						)}
						{knowledgeCutoff !== "" && (
							<DateValue
								label="Knowledge cutoff"
								value={knowledgeCutoff}
							/>
						)}
					</div>
				)}
			</div>
		</OverviewCard>
	);
};

/**
 * Published benchmark scores, collapsed to a short preview when the provider
 * reported a long list.
 */
const BenchmarksCard = ({ benchmarks }: { benchmarks: ModelBenchmark[] }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const ranked = useMemo(() => rankBenchmarks(benchmarks), [benchmarks]);
	const preview = useMemo(
		() => selectPreviewBenchmarks(ranked, BENCHMARK_PREVIEW_COUNT),
		[ranked],
	);
	const visible = isExpanded ? ranked : preview;

	return (
		<OverviewCard title="Benchmarks">
			<div className="flex flex-col gap-3">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="h-auto px-0 pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Benchmark
							</TableHead>
							<TableHead className="h-auto px-2 pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Metric
							</TableHead>
							<TableHead className="h-auto px-0 pb-2 text-end font-medium text-muted-foreground text-xs uppercase tracking-wide">
								Score
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{visible.map((benchmark, index) => {
							const detail = formatBenchmarkDetail(benchmark);

							return (
								<TableRow
									// Benchmarks have no id and the same name
									// repeats across harnesses, so the rendered
									// position is part of the key.
									key={`${benchmark.name}-${detail}-${index}`}
									className="hover:bg-transparent"
								>
									<TableCell className="whitespace-normal px-0">
										{benchmark.name}
									</TableCell>
									<TableCell className="whitespace-normal px-2 text-muted-foreground text-xs">
										{detail}
									</TableCell>
									<TableCell className="px-0 text-end font-semibold tabular-nums">
										{benchmark.score.toLocaleString(
											undefined,
											{ maximumFractionDigits: 2 },
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>

				{ranked.length > preview.length && (
					<Button
						variant="link"
						size="sm"
						className="h-auto justify-start self-start p-0 text-xs"
						onClick={() => setIsExpanded((prev) => !prev)}
						data-testid="engine-overview--benchmarks-toggle"
					>
						{isExpanded
							? "Show fewer"
							: `Show all ${ranked.length}`}
					</Button>
				)}
			</div>
		</OverviewCard>
	);
};

const CREDIT_RATES_CARD_CLASS = "flex-none max-w-sm";

const CreditRatesCard = ({
	inputTokenCredit,
	outputTokenCredit,
	cacheReadMultiplier,
	cacheWriteMultiplier,
}: {
	inputTokenCredit: number | null | undefined;
	outputTokenCredit: number | null | undefined;
	cacheReadMultiplier: number | null | undefined;
	cacheWriteMultiplier: number | null | undefined;
}) => {
	const { engine, permission, refresh } = useEngine();
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [perMillion, setPerMillion] = useState(false);
	const [form, setForm] = useState({
		inputTokenCredit:
			inputTokenCredit != null ? String(inputTokenCredit) : "",
		outputTokenCredit:
			outputTokenCredit != null ? String(outputTokenCredit) : "",
		cacheReadMultiplier:
			cacheReadMultiplier != null ? String(cacheReadMultiplier) : "",
		cacheWriteMultiplier:
			cacheWriteMultiplier != null ? String(cacheWriteMultiplier) : "",
	});

	const isEditor = permission === "OWNER" || permission === "EDIT";

	const scaleToDisplay = (storedPerToken: number) =>
		parseFloat((storedPerToken * 1_000_000).toPrecision(10));

	const displayVal = (v: number | null | undefined): string => {
		if (v == null) return "—";
		const n = perMillion ? scaleToDisplay(v) : v;
		return String(n);
	};

	const handleUnitToggle = (newPerMillion: boolean) => {
		if (newPerMillion === perMillion) return;
		const factor = newPerMillion ? 1_000_000 : 1 / 1_000_000;
		const convert = (v: string) => {
			if (v === "") return v;
			const n = Number(v);
			return isNaN(n)
				? v
				: String(parseFloat((n * factor).toPrecision(10)));
		};
		setForm((f) => ({
			...f,
			inputTokenCredit: convert(f.inputTokenCredit),
			outputTokenCredit: convert(f.outputTokenCredit),
		}));
		setPerMillion(newPerMillion);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const parseStored = (v: string) => {
				if (v.trim() === "") return null;
				const n = Number(v);
				if (isNaN(n)) return null;
				return perMillion ? n / 1_000_000 : n;
			};
			const vals = {
				inputTokenCredit: parseStored(form.inputTokenCredit),
				outputTokenCredit: parseStored(form.outputTokenCredit),
				cacheReadMultiplier:
					form.cacheReadMultiplier.trim() !== ""
						? Number(form.cacheReadMultiplier)
						: null,
				cacheWriteMultiplier:
					form.cacheWriteMultiplier.trim() !== ""
						? Number(form.cacheWriteMultiplier)
						: null,
			};
			const mapStr = Object.entries(vals)
				.map(([k, v]) => `"${k}": ${v ?? "null"}`)
				.join(", ");
			await runPixel(
				`UpdateModelMetadata(engine=["${engine.engine_id}"], map=[{${mapStr}}])`,
			);
			setIsEditing(false);
			refresh();
			toast.success("Credit rates updated");
		} catch {
			toast.error("Failed to save credit rates");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setForm({
			inputTokenCredit:
				inputTokenCredit != null ? String(inputTokenCredit) : "",
			outputTokenCredit:
				outputTokenCredit != null ? String(outputTokenCredit) : "",
			cacheReadMultiplier:
				cacheReadMultiplier != null ? String(cacheReadMultiplier) : "",
			cacheWriteMultiplier:
				cacheWriteMultiplier != null
					? String(cacheWriteMultiplier)
					: "",
		});
		setPerMillion(false);
		setIsEditing(false);
	};

	const inputLabel = perMillion
		? "Credits per million input tokens"
		: "Credits per input token";
	const outputLabel = perMillion
		? "Credits per million output tokens"
		: "Credits per output token";

	const unitToggle = (
		<ToggleGroup
			type="single"
			variant="outline"
			value={perMillion ? "million" : "token"}
			onValueChange={(v) => v && handleUnitToggle(v === "million")}
			className="h-7 text-xs"
		>
			<ToggleGroupItem value="token" className="h-7 px-2 text-xs">
				Per Token
			</ToggleGroupItem>
			<ToggleGroupItem value="million" className="h-7 px-2 text-xs">
				Per 1M Tokens
			</ToggleGroupItem>
		</ToggleGroup>
	);

	const rateRows = (
		<div className="flex flex-col gap-3">
			<p className="text-muted-foreground text-xs">
				Credits are a normalized usage unit across models. Each token
				consumed is multiplied by the rates below to compute credit
				spend.
			</p>
			{unitToggle}
			<div className="text-sm">
				<span className="text-muted-foreground">{inputLabel}: </span>
				<span className="font-mono tabular-nums">
					{displayVal(inputTokenCredit)}
				</span>
			</div>
			<div className="text-sm">
				<span className="text-muted-foreground">{outputLabel}: </span>
				<span className="font-mono tabular-nums">
					{displayVal(outputTokenCredit)}
				</span>
			</div>
			{(cacheReadMultiplier != null || isEditor) && (
				<div className="text-sm">
					<span className="text-muted-foreground">
						Cache read multiplier:{" "}
					</span>
					<span className="font-mono tabular-nums">
						{cacheReadMultiplier != null
							? `×${cacheReadMultiplier}`
							: "—"}
					</span>
				</div>
			)}
			{(cacheWriteMultiplier != null || isEditor) && (
				<div className="text-sm">
					<span className="text-muted-foreground">
						Cache write multiplier:{" "}
					</span>
					<span className="font-mono tabular-nums">
						{cacheWriteMultiplier != null
							? `×${cacheWriteMultiplier}`
							: "—"}
					</span>
				</div>
			)}
		</div>
	);

	if (!isEditor) {
		if (inputTokenCredit == null && outputTokenCredit == null) return null;
		return (
			<OverviewCard
				title="Credit rates"
				className={CREDIT_RATES_CARD_CLASS}
			>
				{rateRows}
			</OverviewCard>
		);
	}

	return (
		<OverviewCard
			title="Credit rates"
			className={CREDIT_RATES_CARD_CLASS}
			headerAction={
				!isEditing && (
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setIsEditing(true)}
					>
						<Pencil className="h-3.5 w-3.5" />
					</Button>
				)
			}
		>
			{isEditing ? (
				<div className="flex flex-col gap-3">
					{unitToggle}
					<div className="grid grid-cols-[1fr_auto] items-center gap-2">
						<span className="text-muted-foreground text-sm">
							{inputLabel}
						</span>
						<Input
							type="number"
							step="any"
							min="0"
							className="h-7 w-28 font-mono text-sm"
							value={form.inputTokenCredit}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									inputTokenCredit: e.target.value,
								}))
							}
							placeholder="e.g. 2"
						/>
					</div>
					<div className="grid grid-cols-[1fr_auto] items-center gap-2">
						<span className="text-muted-foreground text-sm">
							{outputLabel}
						</span>
						<Input
							type="number"
							step="any"
							min="0"
							className="h-7 w-28 font-mono text-sm"
							value={form.outputTokenCredit}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									outputTokenCredit: e.target.value,
								}))
							}
							placeholder="e.g. 8"
						/>
					</div>
					<div className="grid grid-cols-[1fr_auto] items-center gap-2">
						<span className="text-muted-foreground text-sm">
							Cache read multiplier
						</span>
						<Input
							type="number"
							step="any"
							min="0"
							className="h-7 w-28 font-mono text-sm"
							value={form.cacheReadMultiplier}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									cacheReadMultiplier: e.target.value,
								}))
							}
							placeholder="e.g. 0.1"
						/>
					</div>
					<div className="grid grid-cols-[1fr_auto] items-center gap-2">
						<span className="text-muted-foreground text-sm">
							Cache write multiplier
						</span>
						<Input
							type="number"
							step="any"
							min="0"
							className="h-7 w-28 font-mono text-sm"
							value={form.cacheWriteMultiplier}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									cacheWriteMultiplier: e.target.value,
								}))
							}
							placeholder="e.g. 1.25"
						/>
					</div>
					<div className="flex justify-end gap-2 pt-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCancel}
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
						>
							Save
						</Button>
					</div>
				</div>
			) : (
				rateRows
			)}
		</OverviewCard>
	);
};

/**
 * The overview's card row. Every card - and every field inside a card - is
 * omitted when the provider did not report it, so a sparse model renders a
 * short row instead of a wall of "Not set". Renders nothing at all when the
 * catalog knows none of these fields.
 */
export const ModelOverviewCards = ({
	metadata,
}: {
	metadata: ModelMetadata | undefined;
}) => {
	const values = toModelSettingsValues(metadata);
	const capabilityFlags = getCapabilityFlags(metadata);
	const releaseDate = formatMetadataDate(metadata?.releaseDate);
	const knowledgeCutoff = formatMetadataDate(metadata?.knowledgeCutoff);
	const benchmarks = normalizeBenchmarks(metadata?.benchmarks);

	const hasSpecification =
		values.capability !== "" ||
		values.inputModalities.length > 0 ||
		values.outputModalities.length > 0 ||
		values.builtinTools.length > 0 ||
		capabilityFlags.length > 0;
	const hasLimits =
		values.contextWindow !== "" ||
		values.maxOutputTokens !== "" ||
		releaseDate !== "" ||
		knowledgeCutoff !== "";

	if (!hasSpecification && !hasLimits && benchmarks.length === 0) {
		// Still render for editors who need to configure credit rates
		return (
			<div className="flex flex-col gap-4">
				<CreditRatesCard
					inputTokenCredit={metadata?.inputTokenCredit}
					outputTokenCredit={metadata?.outputTokenCredit}
					cacheReadMultiplier={metadata?.cacheReadMultiplier}
					cacheWriteMultiplier={metadata?.cacheWriteMultiplier}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{(hasSpecification || hasLimits || benchmarks.length > 0) && (
				<div className="flex flex-wrap items-start gap-4">
					{hasSpecification && (
						<SpecificationCard
							values={values}
							capabilityFlags={capabilityFlags}
						/>
					)}
					{hasLimits && (
						<LimitsCard
							contextWindow={values.contextWindow}
							maxOutputTokens={values.maxOutputTokens}
							releaseDate={releaseDate}
							knowledgeCutoff={knowledgeCutoff}
						/>
					)}
					{benchmarks.length > 0 && (
						<BenchmarksCard benchmarks={benchmarks} />
					)}
				</div>
			)}
			<CreditRatesCard
				inputTokenCredit={metadata?.inputTokenCredit}
				outputTokenCredit={metadata?.outputTokenCredit}
				cacheReadMultiplier={metadata?.cacheReadMultiplier}
				cacheWriteMultiplier={metadata?.cacheWriteMultiplier}
			/>
		</div>
	);
};
