import { FileUploadOutlined } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk";
import {
	Box,
	Breadcrumbs,
	Button,
	FileDropzone,
	Grid,
	Link,
	Modal,
	Search,
	Stack,
	styled,
	Tabs,
	Typography,
	useNotification,
} from "@semoss/ui";
import { uploadFile } from "@/api";
import { useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { ModelImportForm } from "./ModelImportForm";
import { ModelTileCard } from "./ModelTileCard";
import type { CategoryTexts, FieldDefinition } from "./model-import.constants";
import {
	Custom_Model_Image,
	IMPORTABLE_MODELS,
	type ImportableModels,
	MODEL_VERSIONS,
} from "./model-import.constants";

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	gap: theme.spacing(2),
	marginTop: theme.spacing(3),
}));

const StyledStack = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const UploadButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.text.primary,
	borderRadius: "12px",
	alignSelf: "flex-start",
}));

const SubmitUploadButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.background.default,
	borderRadius: "12px",
	alignSelf: "flex-start",
}));

const CloseButton = styled(Button)(({ theme }) => ({
	borderColor: theme.palette.action.disabled,
	color: theme.palette.secondary.dark,
	borderRadius: "12px",
	alignSelf: "flex-start",
}));

const StyledTab = styled(Tabs.Item)({
	fontSize: "14px",
	fontWeight: "500",
	letterSpacing: "0.4px",
	color: "rgba(0, 0, 0, 0.60)",
});

const StyledDropzoneField = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	width: "100%",
	height: "100%",
}));

const StyledTypographyDescription = styled(Typography)(({ theme }) => ({
	marginBottom: theme.spacing(3),
}));

const StyledModelGrid = styled(Grid)(({ theme }) => ({
	marginTop: theme.spacing(1),
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
	marginTop: theme.spacing(1),
}));

export const ModelImport: React.FC = () => {
	const navigate = useNavigate();

	const { monolithStore, configStore } = useRootStore();
	const notification = useNotification();

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

	/**
	 * Any initialization logic for the model import flow - fetch importable models
	 */
	useEffect(() => {
		const fetch = async () => {
			// TODO: Get importable models from backend
			await runPixel("1+1");

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

	const onSubmit = async (data) => {
		setFormLoading(true);
		const upload = await uploadFile([data], configStore.store.insightID);

		const pixelString = `UploadEngine(filePath=["${upload[0].fileLocation}"], engineTypes=["MODEL"])`;

		const response = await monolithStore.runQuery(pixelString);
		const output = response.pixelReturn[0].output,
			operationType = response.pixelReturn[0].operationType;

		if (operationType.indexOf("ERROR") > -1) {
			notification.add({
				color: "error",
				message: output,
			});
			setFormLoading(false);
			return;
		}

		notification.add({
			color: "success",
			message: `ZIP uploaded successfully`,
		});

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
					<Stack>
						<StyledSearchbarContainer>
							<Search
								size="small"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
								}}
								fullWidth
								data-testid={"model-search-bar"}
							/>
							<UploadButton
								sx={{ lineHeight: 0.75 }}
								size="large"
								variant="outlined"
								onClick={() => handleFileUpload(true)}
								data-testid={"model-upload-file-button"}
							>
								<FileUploadOutlined fontSize="medium" />
							</UploadButton>
						</StyledSearchbarContainer>

						{/* Add your model import flow components and logic here */}
						{importableModels ? (
							<Stack>
								<StyledTabs
									value={selectedProvider}
									onChange={(_, newValue) => {
										setSelectedProvider(
											newValue.toString(),
										);
									}}
									variant="scrollable"
									sx={{
										borderBottom: "2px solid #E0E0E0",
										mb: 1,
									}}
								>
									{importableModels.providers.map(
										(provider) => (
											<StyledTab
												key={provider.name}
												label={(() => {
													const providerImage =
														Custom_Model_Image.find(
															(img) =>
																img.name ===
																provider.name,
														)?.imgURL;
													return (
														<Box
															sx={{
																display: "flex",
																alignItems:
																	"center",
																gap: 0.75,
															}}
														>
															{providerImage && (
																<>
																	<img
																		src={
																			providerImage
																		}
																		alt={`${provider.name} logo`}
																		style={{
																			width: 20,
																			height: 20,
																			objectFit:
																				"contain",
																			borderRadius: 4,
																			display:
																				"block",
																		}}
																		onError={(
																			e,
																		) => {
																			const target =
																				e.currentTarget;
																			target.onerror =
																				null;
																			target.style.display =
																				"none";
																			const fallback =
																				document.createElement(
																					"div",
																				);
																			fallback.textContent =
																				(
																					provider.name ||
																					""
																				)
																					.split(
																						/[^A-Za-z0-9]+/,
																					)
																					.map(
																						(
																							t,
																						) =>
																							t[0],
																					)
																					.join(
																						"",
																					)
																					.slice(
																						0,
																						2,
																					)
																					.toUpperCase();
																			fallback.style.width =
																				"20px";
																			fallback.style.height =
																				"20px";
																			fallback.style.display =
																				"flex";
																			fallback.style.alignItems =
																				"center";
																			fallback.style.justifyContent =
																				"center";
																			fallback.style.fontWeight =
																				"600";
																			fallback.style.fontSize =
																				"12px";
																			fallback.style.color =
																				"#fff";
																			fallback.style.borderRadius =
																				"4px";
																			// Simple pastel gradient based on hash
																			let h = 0;
																			for (
																				let i = 0;
																				i <
																				provider
																					.name
																					.length;
																				i++
																			) {
																				h =
																					(h <<
																						5) -
																					h +
																					provider.name.charCodeAt(
																						i,
																					);
																				h |= 0;
																			}
																			const base =
																				Math.abs(
																					h,
																				) %
																				360;
																			const hue2 =
																				(base +
																					35) %
																				360;
																			fallback.style.background = `linear-gradient(135deg, hsl(${base} 45% 70%), hsl(${hue2} 40% 60%))`;
																			target.parentNode.insertBefore(
																				fallback,
																				target.nextSibling,
																			);
																		}}
																	/>
																</>
															)}
															<Typography
																component="span"
																variant="body2"
																sx={{
																	lineHeight: 1,
																}}
															>
																{provider.name}
															</Typography>
														</Box>
													);
												})()}
												value={provider.name}
												data-testid={formatToDataTestId(
													`connect-to-${provider.name}-tab`,
												)}
											/>
										),
									)}
								</StyledTabs>

								{/* Models Grid */}
								<StyledModelGrid
									container
									columns={6}
									columnSpacing={1}
									rowSpacing={2}
								>
									<Grid
										key={""}
										item
										lg={1}
										md={1}
										xs={1}
										xl={1}
										sm={1}
									>
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
														setSelectedModel("");
													}}
												/>
											);
										})()}
									</Grid>
									{models.map((model) => (
										<Grid
											key={model.name}
											item
											lg={1}
											md={1}
											xs={1}
											xl={1}
											sm={1}
										>
											<ModelTileCard
												model={model}
												onModelSelect={(selected) => {
													setSelectedModel(
														selected.name,
													);
												}}
											/>
										</Grid>
									))}
								</StyledModelGrid>
							</Stack>
						) : null}
					</Stack>
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
			<StyledStack>
				<Breadcrumbs separator="/">
					<Breadcrumbs.Item
						//@ts-expect-error:
						as={Link}
						underline="none"
						color="inherit"
						variant="body1"
						onClick={() => {
							if (window.history.length > 1) {
								navigate(-1);
							} else {
								navigate("/");
							}
						}}
					>
						Model Catalog
					</Breadcrumbs.Item>
					<Breadcrumbs.Item
						//@ts-expect-error:
						as={Link}
						underline="none"
						color="inherit"
						variant="body1"
						onClick={() => {
							setSelectedModel(null);
						}}
					>
						Connect to Model
					</Breadcrumbs.Item>
					{selectedModel !== null && (
						<Breadcrumbs.Item
							//@ts-expect-error:
							as={Link}
							underline="none"
							color="inherit"
							variant="body1"
							onClick={() => {}}
						>
							{selectedModel
								? selectedModel.toUpperCase()
								: `Custom ${selectedProvider} Model`}
						</Breadcrumbs.Item>
					)}
				</Breadcrumbs>
				<Modal
					open={isFileUploadModalOpen}
					maxWidth="xl"
					onClose={() => setIsFileUploadModalOpen(false)}
					data-testid="model-zip-upload-modal"
				>
					<Modal.Content sx={{ width: "600px" }}>
						<StyledDropzoneField>
							<Typography
								variant={"body1"}
								data-testid="model-zip-upload-title"
							>
								Zip File
							</Typography>
							<FileDropzone
								multiple={false}
								onChange={(newValues) => {
									setFiledata(newValues);
								}}
							/>
							<Stack
								spacing={2}
								direction="row"
								justifyContent="flex-end"
							>
								<CloseButton
									size="small"
									variant="text"
									onClick={() =>
										setIsFileUploadModalOpen(false)
									}
									data-testid="model-upload-close-button"
								>
									Close
								</CloseButton>
								<SubmitUploadButton
									size="small"
									variant="contained"
									disabled={!filedata || formLoading}
									onClick={() => onSubmit(filedata)}
									data-testid="model-upload-submit-button"
								>
									Upload
								</SubmitUploadButton>
							</Stack>
						</StyledDropzoneField>
					</Modal.Content>
				</Modal>
				<Typography variant="h4" data-testid="model-import-title">
					{selectedModel?.trim() || "Connect to Model Catalog"}
				</Typography>
				<StyledTypographyDescription
					variant="body1"
					color="textSecondary"
					data-testid="model-import-description"
				>
					{selectedModel?.trim()
						? "Fill out all the model details in order to add the model to the catalog."
						: "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape."}
				</StyledTypographyDescription>
			</StyledStack>
			{view}
		</div>
	);
};
