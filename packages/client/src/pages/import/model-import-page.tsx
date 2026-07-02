/** biome-ignore-all lint/a11y/useKeyWithClickEvents: legacy click handlers */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: legacy click handlers */

import { ChevronRight, SearchIcon, UploadIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
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

		navigate(`/engine/model/${output.database_id}`);
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
	]);

	return (
		<div ref={pageTopRef}>
			<div className="flex flex-col gap-1">
				<Breadcrumb className="mb-4">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink
								className="cursor-pointer"
								onClick={() => {
									if (window.history.length > 1) {
										navigate(-1);
									} else {
										navigate("/");
									}
								}}
							>
								Model Catalog
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
