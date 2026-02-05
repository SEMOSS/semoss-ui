/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { FileUploadOutlined } from "@mui/icons-material";
import { ChevronRight, SearchIcon, UploadIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import type { CategoryTexts, FieldDefinition } from "./model-import.constants";
import {
	Custom_Model_Image,
	IMPORTABLE_MODELS,
	type ImportableModels,
	MODEL_VERSIONS,
} from "./model-import.constants";
import { ModelImportForm } from "./model-import-form";
import { ModelTileCard } from "./model-tile-card";

/**
 * Helper component to display provider icon with fallback to initials
 */
const ProviderIcon: React.FC<{ provider: string }> = ({ provider }) => {
	const [imageError, setImageError] = useState(false);

	const providerImage = Custom_Model_Image.find(
		(img) => img.name === provider,
	)?.imgURL;

	// Generate fallback initials
	const getInitials = (name: string) => {
		return name
			.split(/[^A-Za-z0-9]+/)
			.map((t) => t[0])
			.join("")
			.slice(0, 2)
			.toUpperCase();
	};

	// Generate gradient background based on provider name
	const getGradient = (name: string) => {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = (hash << 5) - hash + name.charCodeAt(i);
			hash |= 0;
		}
		const base = Math.abs(hash) % 360;
		const hue2 = (base + 35) % 360;
		return `linear-gradient(135deg, hsl(${base} 45% 70%), hsl(${hue2} 40% 60%))`;
	};

	if (!providerImage || imageError) {
		return (
			<div
				className="flex size-5 shrink-0 items-center justify-center rounded font-semibold text-[10px] text-white"
				style={{ background: getGradient(provider) }}
			>
				{getInitials(provider)}
			</div>
		);
	}

	return (
		<img
			src={providerImage}
			alt={`${provider} logo`}
			className="size-5 shrink-0 rounded object-contain"
			onError={() => setImageError(true)}
		/>
	);
};

export const ModelImport: React.FC = () => {
	const navigate = useNavigate();

	const { monolithStore, configStore } = useRootStore();

	const [search, setSearch] = useState("");
	const [importableModels, setImportableModels] =
		useState<ImportableModels | null>(null);
	const [importableModelsCategory, setimportableModelsCategory] =
		useState<CategoryTexts | null>(null);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
	const [formLoading, setFormLoading] = useState(false);
	const [filedata, setFiledata] = useState(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	/**
	 * Any initialization logic for the model import flow - fetch importable models
	 */
	useEffect(() => {
		const fetch = async () => {
			// TODO: Get importable models from backend
			//await runPixel("1+1");

			setImportableModels(IMPORTABLE_MODELS as ImportableModels);
			setimportableModelsCategory(IMPORTABLE_MODELS.categoryTexts);
			setSelectedProvider(IMPORTABLE_MODELS.providers[0].name);
		};

		fetch();
	}, []);

	// TODO: would be ideal to have a reactor that gets me this ds
	const models = useMemo(() => {
		if (!importableModels || !selectedProvider) return [];

		// TODO: Reactor call
		const llms =
			MODEL_VERSIONS[selectedProvider].filter((m) =>
				m.name.includes(search),
			) || [];

		return llms;
	}, [selectedProvider, importableModels, search]);

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

	const selectedImage = Custom_Model_Image.find(
		(item) => item.name === selectedProvider,
	)?.imgURL;
	/**
	 * Determines view
	 */
	const view = useMemo(() => {
		switch (selectedModel) {
			case null:
				return (
					<div className="flex flex-col">
						{/* Search Bar and Upload Button */}
						<div className="mt-3 mb-4 flex w-full items-start gap-2">
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
								className="rounded-md"
							>
								<UploadIcon className="size-5" />
							</Button>
						</div>

						{/* Add your model import flow components and logic here */}
						{importableModels ? (
							<div className="flex flex-col">
								<Tabs
									value={selectedProvider}
									onValueChange={(newValue) => {
										setSelectedProvider(newValue);
									}}
									className="mt-1"
								>
									<TabsList>
										{importableModels.providers.map(
											(provider) => (
												<TabsTrigger
													key={provider.name}
													value={provider.name}
													data-testid={formatToDataTestId(
														`connect-to-${provider.name}-tab`,
													)}
													className="flex h-[32px] items-center gap-2 px-2 py-1"
												>
													<ProviderIcon
														provider={provider.name}
													/>
													<span className="text-sm leading-none">
														{provider.name}
													</span>
												</TabsTrigger>
											),
										)}
									</TabsList>

									<TabsContent value={selectedProvider}>
										{/* Models Grid */}
										<div className="mt-1 grid grid-cols-6 gap-2">
											<div>
												{(() => {
													const providerDocsLinkMap: Record<
														string,
														string
													> = {
														OpenAI: "https://platform.openai.com/docs/models",
														"Azure OpenAI":
															"https://learn.microsoft.com/azure/ai-services/openai/concepts/models",
														"AWS Bedrock":
															"https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html",
														"Google Vertex AI":
															"https://cloud.google.com/vertex-ai/docs/model-garden",
														"NVIDIA NIM":
															"https://build.nvidia.com/models",
														"OpenAI-Compatible":
															"https://platform.openai.com/docs/models",
													};

													const othersModel = {
														name: "Others",
														display: `Other ${selectedProvider} models`,
														icon: selectedImage,
														description: `Connect to any current or legacy ${selectedProvider} model not listed above by entering its name and credentials.`,
														embedding: false,
														disable: false,
														link:
															providerDocsLinkMap[
																selectedProvider
															] || undefined,
													};

													return (
														<ModelTileCard
															model={othersModel}
															onModelSelect={() => {
																setSelectedModel(
																	"",
																);
															}}
														/>
													);
												})()}
											</div>
											{models.map((model) => (
												<div key={model.name}>
													<ModelTileCard
														model={model}
														onModelSelect={(
															selected,
														) => {
															setSelectedModel(
																selected.name,
															);
														}}
													/>
												</div>
											))}
										</div>
									</TabsContent>
								</Tabs>
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
					const providerModels =
						MODEL_VERSIONS[selectedProvider] || [];
					const modelMeta = providerModels.find(
						(m) => m.display === selectedModel,
					);

					// Default to 'llm' if not found
					const targetType = modelMeta?.embedding
						? "embedding"
						: "llm";

					const typeDef = providerDef.types.find((t) =>
						t.model_types.includes(targetType),
					);

					if (typeDef) {
						fields = typeDef.fields || [];
						advanced = typeDef.advanced || [];
					}
				}

				return (
					<ModelImportForm
						name={selectedModel}
						fields={fields}
						advanced={advanced}
						selectedProvider={selectedProvider}
						importableModelsCategory={importableModelsCategory}
					/>
				);
			}
		}
	}, [selectedModel, importableModels, search, models, selectedProvider]);

	return (
		<div>
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
						className="w-[600px]"
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
										<FileUploadOutlined className="mb-2 h-12 w-12 text-muted-foreground" />
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
							<div className="flex flex-row justify-end gap-2">
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										setIsFileUploadModalOpen(false)
									}
									data-testid="model-upload-close-button"
									className="rounded-xl"
								>
									Close
								</Button>
								<Button
									size="sm"
									variant="default"
									disabled={!filedata || formLoading}
									onClick={() => onSubmit(filedata)}
									data-testid="model-upload-submit-button"
									className="rounded-xl"
								>
									Upload
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<H4 className="mb-2" data-testid="model-import-title">
					{selectedModel?.trim() || "Connect to Model Catalog"}
				</H4>
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
