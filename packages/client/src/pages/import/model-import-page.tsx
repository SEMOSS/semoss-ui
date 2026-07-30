/** biome-ignore-all lint/a11y/useKeyWithClickEvents: legacy click handlers */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: legacy click handlers */

import { ChevronRight, SearchIcon, UploadIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import type {
	AppendedModelField,
	CategoryTexts,
	FieldDefinition,
	ImportableModels,
	ModelFieldOverride,
	ModelVersionDefinition,
} from "@/components/import/model/model-import.constants";
import {
	IMPORTABLE_MODELS,
	MODEL_VERSIONS,
	UNKNOWN_MODEL_BRAND,
} from "@/components/import/model/model-import.constants";
import {
	ModelEngineIcon,
	ModelTileCard,
} from "@/components/import/model/model-tile-card";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	getOptionLabels,
	MODEL_PROVIDER_OPTIONS,
	SERVING_PROVIDER_OPTIONS,
} from "@/model-metadata.constants";
import { formatToDataTestId } from "@/utility";
import { ModelImportDetailsPage } from "./model-import-details-page";

// Provider labels shown in UI tabs/section headers are display names (e.g. "Google Gemini"),
// while engine subtypes are keys like "VERTEX", so we translate here.
// This mapping is used by ProviderIcon in this file (top provider labels only).
const MODEL_PROVIDER_SUBTYPE_BY_NAME: Record<string, string> = {
	OpenAI: "OPEN_AI",
	"Google Gemini": "VERTEX",
	"Azure OpenAI": "AZURE_OPEN_AI",
	Anthropic: "CLAUDE",
	"AWS Bedrock": "BEDROCK",
	"NVIDIA NIM": "NEMO",
	"Self Hosted": "HUGGINGFACE",
	Perplexity: "PERPLEXITY",
	Embedded: "BRAIN",
};

/**
 * Helper component to display provider icon with fallback to initials
 */
const ProviderIcon: React.FC<{ provider: string }> = ({ provider }) => {
	const subtype = MODEL_PROVIDER_SUBTYPE_BY_NAME[provider];

	const getInitials = (name: string) => {
		return name
			.split(/[\W_]+/)
			.map((t) => t[0])
			.join("")
			.slice(0, 2)
			.toUpperCase();
	};

	if (subtype) {
		return (
			<EngineSubtypeIcon
				engineType="MODEL"
				engineSubtype={subtype}
				alt={`${provider} logo`}
				className="size-5 rounded-[4px] object-contain"
			/>
		);
	}

	return (
		<div
			className="flex size-5 shrink-0 items-center justify-center rounded-[4px] font-semibold text-[10px] text-white"
			style={{ backgroundColor: "var(--muted-foreground)" }}
		>
			{getInitials(provider)}
		</div>
	);
};

const sortProvidersForTabs = (providers: Array<{ name: string }>) => {
	return [...providers].sort((a, b) => {
		if (a.name === "Embedded") return 1;
		if (b.name === "Embedded") return -1;
		return a.name.localeCompare(b.name);
	});
};

const ALL_PROVIDERS_FILTER = "ALL";

const MODEL_MODALITIES = [
	"TEXT",
	"IMAGE",
	"AUDIO",
	"VIDEO",
	"VECTOR",
	"FILE",
	"PDF",
] as const;

type ModelModality = (typeof MODEL_MODALITIES)[number];

interface StaticModelMetadata {
	id?: string;
	capability?: string | null;
	input_modalities?: string[] | null;
	output_modalities?: string[] | null;
	context_length?: number | null;
	max_input_tokens?: number | null;
	max_output_tokens?: number | null;
	family?: string | null;
	attachment?: boolean | null;
	reasoning?: boolean | null;
	tool_call?: boolean | null;
	structured_output?: boolean | null;
	temperature?: boolean | null;
	knowledge_cutoff?: string | null;
	release_date?: string | null;
	benchmarks?: Record<string, unknown>[] | null;
}

interface StaticModelMetadataLookup {
	key: string;
	modelId: string;
}

interface StaticModelMetadataState {
	lookupKey: string | null;
	status: "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";
	data: StaticModelMetadata | null;
}

const applyFieldOverrides = (
	baseFields: FieldDefinition[],
	overrides?: ModelFieldOverride[],
	appendFields?: AppendedModelField[],
) => {
	const nextFields = [...baseFields];

	(overrides || []).forEach((override) => {
		const fieldIndex = nextFields.findIndex((f) => f.key === override.key);

		if (override.remove) {
			if (fieldIndex !== -1) {
				nextFields.splice(fieldIndex, 1);
			}
			return;
		}

		if (override.replace) {
			if (fieldIndex !== -1) {
				nextFields[fieldIndex] = override.replace;
			} else {
				nextFields.push(override.replace);
			}
			return;
		}

		if (override.patch && fieldIndex !== -1) {
			nextFields[fieldIndex] = {
				...nextFields[fieldIndex],
				...override.patch,
			};
		}
	});

	(appendFields || []).forEach(({ field, insertAfterKey }) => {
		const existingIndex = nextFields.findIndex((f) => f.key === field.key);
		if (existingIndex !== -1) {
			nextFields.splice(existingIndex, 1);
		}

		const afterIndex =
			insertAfterKey !== undefined
				? nextFields.findIndex((f) => f.key === insertAfterKey)
				: -1;
		const insertAt = afterIndex === -1 ? nextFields.length : afterIndex + 1;
		nextFields.splice(insertAt, 0, field);
	});

	return nextFields;
};

const MODEL_PROVIDER_BY_BRAND: Record<string, string> = {
	AZURE_OPEN_AI: "OPENAI",
	CLAUDE: "ANTHROPIC",
	FALCON: "TII",
	FLAN_T5_LARGE: "GOOGLE",
	GEMINI: "GOOGLE",
	HUGGINGFACE: "OTHER",
	META: "META",
	MOSAIC_ML: "DATABRICKS",
	NEMO: "NVIDIA",
	OPEN_AI: "OPENAI",
	ORCA: "MICROSOFT",
	PERPLEXITY: "PERPLEXITY",
	REPLIT_CODE_MODEL: "REPLIT",
	STABLITY_AI: "STABILITY_AI",
};

const SERVING_PROVIDER_BY_NAME: Record<string, string> = {
	Anthropic: "ANTHROPIC",
	"AWS Bedrock": "AWS_BEDROCK",
	"Azure OpenAI": "AZURE_OPENAI",
	Embedded: "LOCAL",
	"Google Gemini": "GOOGLE_VERTEX",
	"NVIDIA NIM": "NVIDIA_NIM",
	OpenAI: "OPENAI",
	Perplexity: "PERPLEXITY",
	"Self Hosted": "SELF_HOSTED",
};

const inferModelProvider = (
	provider: string,
	model: ModelVersionDefinition | null,
) => {
	const brand = model?.modelBrand?.toUpperCase();
	if (brand && brand !== "BEDROCK")
		return MODEL_PROVIDER_BY_BRAND[brand] || "OTHER";

	const modelName = model?.name.toLowerCase() || "";
	if (modelName.includes("anthropic") || modelName.includes("claude"))
		return "ANTHROPIC";
	if (modelName.includes("amazon") || modelName.includes("nova"))
		return "AMAZON";
	if (
		modelName.includes("openai") ||
		modelName.includes("gpt") ||
		modelName.includes("text-embedding-3")
	)
		return "OPENAI";
	if (modelName.includes("gemini") || modelName.includes("veo"))
		return "GOOGLE";
	if (modelName.includes("meta") || modelName.includes("llama"))
		return "META";
	if (provider === "Google Gemini") return "GOOGLE";
	if (provider === "Azure OpenAI") return "OPENAI";
	return "OTHER";
};

const inferCapability = (model: ModelVersionDefinition | null) => {
	const modelName = model?.name.toLowerCase() || "";
	if (model?.embedding) return "EMBEDDING";
	if (modelName.includes("rerank")) return "RERANKING";
	if (modelName.includes("whisper") || modelName.includes("transcribe"))
		return "TRANSCRIPTION";
	if (modelName.includes("tts") || modelName.includes("text-to-speech"))
		return "SPEECH_SYNTHESIS";
	if (
		modelName.includes("veo") ||
		modelName.includes("reel") ||
		modelName.includes("video")
	)
		return "VIDEO_GENERATION";
	if (
		model?.image ||
		modelName.includes("image") ||
		modelName.includes("canvas")
	)
		return "IMAGE_GENERATION";
	return "TEXT_GENERATION";
};

const getDefaultModalities = (
	capability: string,
	model: ModelVersionDefinition | null,
) => {
	switch (capability) {
		case "EMBEDDING":
			return { input: ["TEXT"], output: ["VECTOR"] };
		case "IMAGE_GENERATION":
			return { input: ["TEXT", "IMAGE"], output: ["IMAGE"] };
		case "VIDEO_GENERATION":
			return { input: ["TEXT", "IMAGE"], output: ["VIDEO"] };
		case "TRANSCRIPTION":
			return { input: ["AUDIO"], output: ["TEXT"] };
		case "SPEECH_SYNTHESIS":
			return { input: ["TEXT"], output: ["AUDIO"] };
		default:
			return model?.audio
				? { input: ["TEXT", "AUDIO"], output: ["TEXT", "AUDIO"] }
				: { input: ["TEXT"], output: ["TEXT"] };
	}
};

const normalizeStaticModalities = (
	modalities: string[] | null | undefined,
): ModelModality[] => {
	if (!Array.isArray(modalities)) return [];

	return [
		...new Set(
			modalities
				.map((modality) => modality.trim().toUpperCase())
				.filter((modality): modality is ModelModality =>
					MODEL_MODALITIES.includes(modality as ModelModality),
				),
		),
	];
};

const inferStaticCapability = (
	metadata: StaticModelMetadata | null,
	model: ModelVersionDefinition | null,
) => {
	const declaredCapability = metadata?.capability
		?.trim()
		.toLowerCase()
		.replaceAll(/[\s-]+/g, "_");
	const inputModalities = normalizeStaticModalities(
		metadata?.input_modalities,
	);
	const outputModalities = normalizeStaticModalities(
		metadata?.output_modalities,
	);

	if (outputModalities.includes("VECTOR")) return "EMBEDDING";
	if (outputModalities.includes("VIDEO")) return "VIDEO_GENERATION";
	if (outputModalities.includes("IMAGE")) return "IMAGE_GENERATION";
	if (outputModalities.includes("AUDIO") && inputModalities.includes("TEXT"))
		return "SPEECH_SYNTHESIS";
	if (declaredCapability === "embedding") return "EMBEDDING";
	if (declaredCapability === "reranking") return "RERANKING";
	if (declaredCapability === "moderation") return "MODERATION";
	if (declaredCapability === "transcription") return "TRANSCRIPTION";
	if (declaredCapability === "speech_synthesis") return "SPEECH_SYNTHESIS";

	return inferCapability(model);
};

export const getStaticModelMetadataLookup = (
	model: ModelVersionDefinition | null,
): StaticModelMetadataLookup | null => {
	const modelId = model?.name.trim();

	if (!modelId || modelId.startsWith("other-")) {
		return null;
	}

	return {
		key: modelId,
		modelId,
	};
};

export const buildModelMetadataFields = (
	provider: string,
	model: ModelVersionDefinition | null,
	staticMetadata: StaticModelMetadata | null,
): FieldDefinition[] => {
	const capability = inferStaticCapability(staticMetadata, model);
	const inferredModalities = getDefaultModalities(capability, model);
	const staticInputModalities = normalizeStaticModalities(
		staticMetadata?.input_modalities,
	);
	const staticOutputModalities = normalizeStaticModalities(
		staticMetadata?.output_modalities,
	);
	const disabledInputModalities =
		staticInputModalities.length > 0
			? MODEL_MODALITIES.filter(
					(modality) => !staticInputModalities.includes(modality),
				)
			: undefined;
	const disabledOutputModalities =
		staticOutputModalities.length > 0
			? MODEL_MODALITIES.filter(
					(modality) => !staticOutputModalities.includes(modality),
				)
			: undefined;
	const metadataFields: FieldDefinition[] = [
		{
			key: "MODEL_PROVIDER",
			label: "Model Provider",
			type: "select",
			required: true,
			category: "Settings",
			default: inferModelProvider(provider, model),
			options: MODEL_PROVIDER_OPTIONS.map(({ value }) => value),
			optionLabels: getOptionLabels(MODEL_PROVIDER_OPTIONS),
			helperText:
				"Organization that created the model, such as OPENAI or ANTHROPIC.",
		},
		{
			key: "SERVING_PROVIDER",
			label: "Serving Provider",
			type: "select",
			required: true,
			category: "Settings",
			default:
				SERVING_PROVIDER_BY_NAME[provider] ||
				provider.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_"),
			options: SERVING_PROVIDER_OPTIONS.map(({ value }) => value),
			optionLabels: getOptionLabels(SERVING_PROVIDER_OPTIONS),
			helperText:
				"Platform serving the model, such as AWS_BEDROCK or GOOGLE_VERTEX.",
		},
		{
			key: "CAPABILITY",
			label: "Primary Capability",
			type: "select",
			required: true,
			category: "Settings",
			default: capability,
			options: [
				"TEXT_GENERATION",
				"IMAGE_GENERATION",
				"VIDEO_GENERATION",
				"EMBEDDING",
				"TRANSCRIPTION",
				"SPEECH_SYNTHESIS",
				"RERANKING",
				"MODERATION",
			],
		},
		{
			key: "INPUT_MODALITIES",
			label: "Input Modalities",
			type: "multiselect",
			required: true,
			category: "Settings",
			default:
				staticInputModalities.length > 0
					? staticInputModalities
					: inferredModalities.input,
			options: [...MODEL_MODALITIES],
			disabledOptions: disabledInputModalities,
		},
		{
			key: "OUTPUT_MODALITIES",
			label: "Output Modalities",
			type: "multiselect",
			required: true,
			category: "Settings",
			default:
				staticOutputModalities.length > 0
					? staticOutputModalities
					: inferredModalities.output,
			options: [...MODEL_MODALITIES],
			disabledOptions: disabledOutputModalities,
		},
		{
			key: "BUILTIN_TOOLS",
			label: "Built-in Tools",
			type: "text",
			required: false,
			category: "Settings",
			default: "",
			helperText:
				"Optional comma-separated canonical names, such as web_search, image_generation.",
		},
	];

	if (
		typeof staticMetadata?.context_length === "number" &&
		Number.isSafeInteger(staticMetadata.context_length) &&
		staticMetadata.context_length > 0
	) {
		metadataFields.push({
			key: "CONTEXT_WINDOW",
			label: "Context Window",
			type: "number",
			required: true,
			category: "Settings",
			default: staticMetadata.context_length,
		});
	}

	if (
		typeof staticMetadata?.max_output_tokens === "number" &&
		Number.isSafeInteger(staticMetadata.max_output_tokens) &&
		staticMetadata.max_output_tokens > 0
	) {
		metadataFields.push({
			key: "MAX_TOKENS",
			label: "Max Tokens (Max Completion Tokens)",
			type: "number",
			required: true,
			category: "Settings",
			default: staticMetadata.max_output_tokens,
		});
	}

	const addHiddenMetadataField = (
		key: string,
		label: string,
		value: FieldDefinition["default"],
	) => {
		metadataFields.push({
			key,
			label,
			type: "hidden",
			required: false,
			category: "Settings",
			default: value,
		});
	};

	if (
		typeof staticMetadata?.max_input_tokens === "number" &&
		Number.isSafeInteger(staticMetadata.max_input_tokens) &&
		staticMetadata.max_input_tokens > 0
	) {
		addHiddenMetadataField(
			"MAX_INPUT_TOKENS",
			"Max Input Tokens",
			staticMetadata.max_input_tokens,
		);
	}

	if (staticMetadata?.family) {
		addHiddenMetadataField("FAMILY", "Model Family", staticMetadata.family);
	}

	for (const [key, label, value] of [
		["ATTACHMENT", "Attachment Support", staticMetadata?.attachment],
		["REASONING", "Reasoning Support", staticMetadata?.reasoning],
		["TOOL_CALL", "Tool Call Support", staticMetadata?.tool_call],
		[
			"STRUCTURED_OUTPUT",
			"Structured Output Support",
			staticMetadata?.structured_output,
		],
		["TEMPERATURE", "Temperature Support", staticMetadata?.temperature],
	] as const) {
		if (typeof value === "boolean") {
			addHiddenMetadataField(key, label, value);
		}
	}

	for (const [key, label, value] of [
		[
			"KNOWLEDGE_CUTOFF",
			"Knowledge Cutoff",
			staticMetadata?.knowledge_cutoff,
		],
		["RELEASE_DATE", "Release Date", staticMetadata?.release_date],
	] as const) {
		if (value) {
			addHiddenMetadataField(key, label, value);
		}
	}

	if (
		Array.isArray(staticMetadata?.benchmarks) &&
		staticMetadata.benchmarks.length > 0
	) {
		addHiddenMetadataField(
			"BENCHMARKS",
			"Benchmarks",
			JSON.stringify(staticMetadata.benchmarks),
		);
	}

	return metadataFields;
};

export const mergeModelMetadataFields = (
	fields: FieldDefinition[],
	advanced: FieldDefinition[],
	metadataFields: FieldDefinition[],
) => {
	for (const metadataField of metadataFields) {
		const fieldIndex = fields.findIndex(
			(field) => field.key === metadataField.key,
		);
		if (fieldIndex !== -1) {
			fields[fieldIndex] = {
				...fields[fieldIndex],
				default: metadataField.default,
				disabledOptions: metadataField.disabledOptions,
			};
			continue;
		}

		const advancedIndex = advanced.findIndex(
			(field) => field.key === metadataField.key,
		);
		if (advancedIndex !== -1) {
			advanced[advancedIndex] = {
				...advanced[advancedIndex],
				default: metadataField.default,
				disabledOptions: metadataField.disabledOptions,
			};
			continue;
		}

		fields.push(metadataField);
	}
};

export const ModelImportPage: React.FC = () => {
	const navigate = useNavigate();

	const { monolithStore, configStore } = useRootStore();

	const [search, setSearch] = useState("");
	const [importableModels, setImportableModels] =
		useState<ImportableModels | null>(null);
	const [importableModelsCategory, setimportableModelsCategory] =
		useState<CategoryTexts | null>(null);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [providerFilter, setProviderFilter] =
		useState<string>(ALL_PROVIDERS_FILTER);
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [staticModelMetadata, setStaticModelMetadata] =
		useState<StaticModelMetadataState>({
			lookupKey: null,
			status: "INITIAL",
			data: null,
		});
	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [formLoading, setFormLoading] = useState(false);
	const [filedata, setFiledata] = useState(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const pageTopRef = useRef<HTMLDivElement>(null);

	/**
	 * Any initialization logic for the model import flow - fetch importable models
	 */
	useEffect(() => {
		const fetch = async () => {
			setImportableModels(IMPORTABLE_MODELS as ImportableModels);
			setimportableModelsCategory(IMPORTABLE_MODELS.categoryTexts);
			const sorted = sortProvidersForTabs(IMPORTABLE_MODELS.providers);
			const defaultProvider =
				sorted.find((provider) =>
					Array.isArray(MODEL_VERSIONS[provider.name]),
				)?.name ||
				sorted[0]?.name ||
				"";
			setSelectedProvider(defaultProvider);
			setProviderFilter(ALL_PROVIDERS_FILTER);
		};

		fetch();
	}, []);

	useEffect(() => {
		if (selectedModel === null) return;

		const resetScrollPosition = () => {
			const topElement = pageTopRef.current;
			if (!topElement) return;

			topElement.scrollIntoView({
				block: "start",
				inline: "nearest",
				behavior: "auto",
			});

			let parent = topElement.parentElement;
			while (parent) {
				const style = window.getComputedStyle(parent);
				const overflowY = style.overflowY;
				const isScrollable =
					(overflowY === "auto" || overflowY === "scroll") &&
					parent.scrollHeight > parent.clientHeight;

				if (isScrollable) {
					parent.scrollTop = 0;
				}

				parent = parent.parentElement;
			}

			window.scrollTo({ top: 0, behavior: "auto" });
		};

		requestAnimationFrame(resetScrollPosition);
	}, [selectedModel]);

	const sortedProviders = useMemo(() => {
		if (!importableModels?.providers) return [];
		return sortProvidersForTabs(importableModels.providers);
	}, [importableModels]);

	const providerSections = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return sortedProviders.map((provider) => {
			const models = (MODEL_VERSIONS[provider.name] || []).filter(
				(model) => {
					if (!normalizedSearch) return true;

					return (
						model.name.toLowerCase().includes(normalizedSearch) ||
						model.display
							.toLowerCase()
							.includes(normalizedSearch) ||
						(model.description || "")
							.toLowerCase()
							.includes(normalizedSearch)
					);
				},
			);

			return {
				provider: provider.name,
				models,
			};
		});
	}, [sortedProviders, search]);

	const visibleProviderSections = useMemo(() => {
		if (providerFilter === ALL_PROVIDERS_FILTER) {
			return providerSections;
		}

		return providerSections.filter(
			(section) => section.provider === providerFilter,
		);
	}, [providerSections, providerFilter]);

	const selectedModelMetadata = useMemo(() => {
		if (!selectedProvider || selectedModel === null) return null;

		const providerModels = MODEL_VERSIONS[selectedProvider] || [];
		return (
			providerModels.find(
				(m) => m.name === selectedModel || m.display === selectedModel,
			) || null
		);
	}, [selectedProvider, selectedModel]);

	const staticMetadataLookup = useMemo(
		() => getStaticModelMetadataLookup(selectedModelMetadata),
		[selectedModelMetadata],
	);

	useEffect(() => {
		if (!staticMetadataLookup) {
			setStaticModelMetadata({
				lookupKey: null,
				status: "INITIAL",
				data: null,
			});
			return;
		}

		let isCancelled = false;
		setStaticModelMetadata({
			lookupKey: staticMetadataLookup.key,
			status: "LOADING",
			data: null,
		});

		const pixel = `GetStaticModelMetadata(modelId=${JSON.stringify(
			staticMetadataLookup.modelId,
		)});`;

		monolithStore
			.runQuery(pixel)
			.then((response) => {
				if (isCancelled) return;

				const result = response.pixelReturn?.[0];
				if (!result || result.operationType.indexOf("ERROR") > -1) {
					throw new Error(
						String(
							result?.output ||
								"Unable to retrieve static model metadata.",
						),
					);
				}

				const output = result.output;
				if (
					typeof output !== "object" ||
					output === null ||
					Array.isArray(output)
				) {
					throw new Error("Static model metadata must be an object.");
				}

				setStaticModelMetadata({
					lookupKey: staticMetadataLookup.key,
					status: "SUCCESS",
					data: output as StaticModelMetadata,
				});
			})
			.catch(() => {
				if (isCancelled) return;
				setStaticModelMetadata({
					lookupKey: staticMetadataLookup.key,
					status: "ERROR",
					data: null,
				});
			});

		return () => {
			isCancelled = true;
		};
	}, [monolithStore, staticMetadataLookup]);

	const isStaticMetadataLoading =
		staticMetadataLookup !== null &&
		(staticModelMetadata.lookupKey !== staticMetadataLookup.key ||
			staticModelMetadata.status === "LOADING");
	const selectedStaticMetadata =
		staticMetadataLookup !== null &&
		staticModelMetadata.lookupKey === staticMetadataLookup.key &&
		staticModelMetadata.status === "SUCCESS"
			? staticModelMetadata.data
			: null;

	const handleFileUpload = (flag: boolean) => {
		// Open or close the file upload modal based on the provided flag
		setIsFileUploadModalOpen(flag);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.name.endsWith(".zip")) {
				setFiledata(file);
			} else {
				toast.error("Please upload a ZIP file");
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			setFiledata(files[0]);
		}
	};

	const onSubmit = async (data) => {
		setFormLoading(true);
		const upload = await uploadFile([data], configStore.store.insightID);

		const pixelString = `UploadEngine(filePath=["${upload[0].fileLocation}"], engineTypes=["MODEL"])`;

		const response = await monolithStore.runQuery(pixelString);
		const output = response.pixelReturn[0].output,
			operationType = response.pixelReturn[0].operationType;

		if (operationType.indexOf("ERROR") > -1) {
			toast.error(String(output));
			setFormLoading(false);
			return;
		}

		toast.success("Model uploaded successfully!");

		navigate(`/model/${output.database_id}`);
		setFormLoading(false);
		return;
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - deps cover all needed values
	const view = useMemo(() => {
		switch (selectedModel) {
			case null:
				return (
					<div className="flex flex-col">
						{/* Search Bar and Upload Button */}
						<div className="mt-3 mb-4 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-start">
							<InputGroup className="flex-1 border-b-2 border-none">
								<InputGroupAddon>
									<SearchIcon className="size-4 text-muted-foreground" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
									}}
									data-testid="model-search-bar"
								/>
							</InputGroup>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleFileUpload(true)}
								data-testid="model-upload-file-button"
								className="w-full rounded-md sm:w-auto"
							>
								<UploadIcon className="size-5" />
							</Button>
						</div>

						{/* Add your model import flow components and logic here */}
						{importableModels ? (
							<div className="flex flex-col">
								<Tabs
									value={providerFilter}
									onValueChange={(newValue) => {
										setProviderFilter(newValue);
									}}
									className="mt-1"
								>
									<TabsList className="h-auto w-full flex-nowrap justify-start gap-2.5 overflow-x-auto overflow-y-hidden bg-transparent p-1.5">
										<TabsTrigger
											value={ALL_PROVIDERS_FILTER}
											data-testid={formatToDataTestId(
												"connect-to-all-providers-tab",
											)}
											className="h-auto shrink-0 rounded-xl border border-border bg-background px-4 py-2.5 font-medium text-sm transition-colors hover:bg-muted/70 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
										>
											<span className="text-sm leading-none">
												All Providers
											</span>
										</TabsTrigger>
										{sortedProviders.map((provider) => (
											<TabsTrigger
												key={provider.name}
												value={provider.name}
												data-testid={formatToDataTestId(
													`connect-to-${provider.name}-tab`,
												)}
												className="h-auto shrink-0 rounded-xl border border-border bg-background px-4 py-2.5 font-medium text-sm transition-colors hover:bg-muted/70 data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
											>
												<ProviderIcon
													provider={provider.name}
												/>
												<span className="text-sm leading-none">
													{provider.name}
												</span>
											</TabsTrigger>
										))}
									</TabsList>
									<TabsContent value={providerFilter} />
								</Tabs>

								<div className="mt-3 flex flex-col gap-5 pb-10">
									{visibleProviderSections.map((section) => (
										<div
											key={section.provider}
											className="flex flex-col gap-2"
										>
											<div className="flex items-center gap-2">
												<ProviderIcon
													provider={section.provider}
												/>
												<H4>{section.provider}</H4>
											</div>

											{section.models.length ? (
												<div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
													{section.models.map(
														(model) => (
															<ModelTileCard
																key={`${section.provider}-${model.name}`}
																model={model}
																provider={
																	section.provider
																}
																onModelSelect={(
																	selected,
																) => {
																	setSelectedProvider(
																		section.provider,
																	);
																	setSelectedModel(
																		selected.name,
																	);
																}}
															/>
														),
													)}
												</div>
											) : (
												<P className="text-muted-foreground text-sm">
													No models found for this
													provider.
												</P>
											)}
										</div>
									))}
								</div>
							</div>
						) : null}
					</div>
				);
			default: {
				if (isStaticMetadataLoading) {
					return (
						<div className="flex min-h-64 items-center justify-center">
							<Spinner />
						</div>
					);
				}

				// Find the provider definition for the selected provider
				const providerDef = importableModels?.providers.find(
					(p) => p.name === selectedProvider,
				);

				// selectedModel is the model name from MODEL_VERSIONS; we need to map that to a model_types entry
				// Find a type entry whose 'model_types' matches the model metadata (embedding vs llm)
				let fields: FieldDefinition[] = [];
				let advanced: FieldDefinition[] = [];

				if (providerDef) {
					// Try to determine whether the selected model is an embedding or llm by checking MODEL_VERSIONS

					// Default to 'llm' if not found
					const targetType = selectedModelMetadata?.embedding
						? "embedding"
						: "llm";

					const typeDef = providerDef.types.find((t) =>
						t.model_types.includes(targetType),
					);

					if (typeDef) {
						fields = (typeDef.fields || []).map((field) => ({
							...field,
						}));
						advanced = (typeDef.advanced || []).map((field) => ({
							...field,
						}));

						if (selectedModelMetadata?.formConfig) {
							fields = applyFieldOverrides(
								fields,
								selectedModelMetadata.formConfig.fieldOverrides,
								selectedModelMetadata.formConfig.appendFields,
							);

							advanced = applyFieldOverrides(
								advanced,
								selectedModelMetadata.formConfig
									.advancedFieldOverrides,
								selectedModelMetadata.formConfig
									.appendAdvancedFields,
							);
						}

						const modelFieldIndex = fields.findIndex(
							(field) => field.key === "MODEL",
						);

						if (
							modelFieldIndex !== -1 &&
							selectedModelMetadata?.name
						) {
							const existingModelField = fields[modelFieldIndex];
							const hasExplicitModelValue =
								existingModelField.default !== undefined ||
								existingModelField.value !== undefined;
							const shouldDefaultToSelectedModelName =
								!hasExplicitModelValue &&
								existingModelField.disabled !== false;

							if (shouldDefaultToSelectedModelName) {
								fields[modelFieldIndex] = {
									...existingModelField,
									default: selectedModelMetadata.name,
									value: selectedModelMetadata.name,
								};
							}
						}

						const existingIndex = fields.findIndex(
							(field) => field.key === "MODEL_BRAND",
						);

						if (existingIndex !== -1) {
							const fieldDefaultBrand = String(
								fields[existingIndex].value ??
									fields[existingIndex].default ??
									UNKNOWN_MODEL_BRAND,
							);
							const modelBrand =
								selectedModelMetadata?.modelBrand ||
								fieldDefaultBrand;

							fields[existingIndex] = {
								...fields[existingIndex],
								default: modelBrand,
								value: modelBrand,
								disabled: true,
							};
						}

						mergeModelMetadataFields(
							fields,
							advanced,
							buildModelMetadataFields(
								selectedProvider,
								selectedModelMetadata,
								selectedStaticMetadata,
							),
						);
					}
				}

				return (
					<ModelImportDetailsPage
						fields={fields}
						advanced={advanced}
						selectedProvider={selectedProvider}
						importableModelsCategory={importableModelsCategory}
					/>
				);
			}
		}
	}, [
		selectedModel,
		importableModels,
		search,
		selectedProvider,
		providerFilter,
		sortedProviders,
		visibleProviderSections,
		selectedModelMetadata,
		isStaticMetadataLoading,
		selectedStaticMetadata,
	]);

	return (
		<div ref={pageTopRef}>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../" className="text-inherit">
									Model Catalog
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							{selectedModel === null ? (
								<BreadcrumbPage>
									Connect to Model
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									className="cursor-pointer"
									onClick={() => {
										setSelectedModel(null);
									}}
								>
									Connect to Model
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{selectedModel !== null && (
							<>
								<BreadcrumbSeparator>
									<ChevronRight />
								</BreadcrumbSeparator>
								<BreadcrumbItem>
									<BreadcrumbPage>
										{selectedModel
											? selectedModel.toUpperCase()
											: `Custom ${selectedProvider} Model`}
									</BreadcrumbPage>
								</BreadcrumbItem>
							</>
						)}
					</BreadcrumbList>
				</Breadcrumb>
			</NavbarLeft>
			<div className="flex flex-col gap-1">
				{/* File Upload Modal */}
				<Dialog
					open={isFileUploadModalOpen}
					onOpenChange={setIsFileUploadModalOpen}
				>
					<DialogContent
						className="w-[calc(100vw-2rem)] max-w-[600px] sm:w-[600px]"
						data-testid="model-zip-upload-modal"
					>
						<div className="flex h-full w-full flex-col gap-4">
							<P
								className="text-base"
								data-testid="model-zip-upload-title"
							>
								Zip File
							</P>
							<div
								className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
								onClick={() => fileInputRef.current?.click()}
								onDragOver={handleDragOver}
								onDrop={handleDrop}
							>
								<input
									ref={fileInputRef}
									type="file"
									accept=".zip"
									className="hidden"
									onChange={handleFileChange}
									multiple={false}
								/>
								{filedata ? (
									<div className="text-center">
										<P className="font-medium text-foreground">
											{filedata.name}
										</P>
										<P className="text-muted-foreground text-sm">
											Click or drag to replace
										</P>
									</div>
								) : (
									<div className="text-center">
										<UploadIcon className="mb-2 h-12 w-12 text-muted-foreground" />
										<P className="font-medium text-foreground">
											Drop your file here or click to
											browse
										</P>
										<P className="text-muted-foreground text-sm">
											Supports ZIP files only
										</P>
									</div>
								)}
							</div>
							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										setIsFileUploadModalOpen(false)
									}
									data-testid="model-upload-close-button"
									className="w-full rounded-xl sm:w-auto"
								>
									Close
								</Button>
								<Button
									size="sm"
									variant="default"
									disabled={!filedata || formLoading}
									onClick={() => onSubmit(filedata)}
									data-testid="model-upload-submit-button"
									className="w-full rounded-xl sm:w-auto"
								>
									Upload
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<div className="mb-2 flex items-center gap-2">
					{selectedModel?.trim() && selectedModelMetadata && (
						<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
							<ModelEngineIcon
								model={selectedModelMetadata}
								provider={selectedProvider}
								alt={
									selectedModelMetadata.display ||
									selectedModelMetadata.name
								}
							/>
						</div>
					)}
					<H4 data-testid="model-import-title">
						{selectedModel?.trim() || "Connect to Model Catalog"}
					</H4>
				</div>
				<P
					className="mb-3 text-muted-foreground"
					data-testid="model-import-description"
				>
					{selectedModel?.trim()
						? "Fill out all the model details in order to add the model to the catalog."
						: "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape."}
				</P>
			</div>
			{view}
		</div>
	);
};
