import { FileUploadOutlined } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel } from "@semoss/sdk";
import {
	Box,
	Breadcrumbs,
	Button,
	Grid,
	IconButton,
	Link,
	Search,
	Stack,
	styled,
	Tabs,
	Typography,
} from "@semoss/ui";
import { formatToDataTestId } from "@/utility";
import { ModelImportForm } from "./ModelImportForm";
import { ModelTileCard } from "./ModelTileCard";
import type { FieldDefinition } from "./model-import.constants";
import {
	IMPORTABLE_MODELS,
	type ImportableModels,
	MODEL_VERSIONS,
} from "./model-import.constants";

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	gap: theme.spacing(3),
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
	padding: theme.spacing(1.25, 2),
	alignSelf: "flex-start",
}));

const StyledTab = styled(Tabs.Item)({
	fontSize: "14px",
	fontWeight: "500",
	letterSpacing: "0.4px",
	color: "rgba(0, 0, 0, 0.60)",
});

export const ModelImport: React.FC = () => {
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [importableModels, setImportableModels] =
		useState<ImportableModels | null>(null);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [selectedModel, setSelectedModel] = useState<string | null>(null);

	/**
	 * Any initialization logic for the model import flow - fetch importable models
	 */
	useEffect(() => {
		const fetch = async () => {
			// TODO: Get importable models from backend
			await runPixel("1+1");

			setImportableModels(IMPORTABLE_MODELS as ImportableModels);
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
							/>
							<UploadButton size="small" variant="outlined">
								<FileUploadOutlined fontSize="small" />
							</UploadButton>
						</StyledSearchbarContainer>

						{/* Add your model import flow components and logic here */}
						{importableModels ? (
							<Stack>
								<Tabs
									value={selectedProvider}
									onChange={(_, newValue) => {
										setSelectedProvider(newValue);
									}}
									variant="scrollable"
									sx={{
										mt: 2,
										borderBottom: "2px solid #E0E0E0",
									}}
								>
									{importableModels.providers.map(
										(provider) => (
											<StyledTab
												key={provider.name}
												label={provider.name}
												value={provider.name}
												data-tesId={formatToDataTestId(
													`connect-to-${provider.name}-tab`,
												)}
											/>
										),
									)}
								</Tabs>

								{/* Models Grid */}
								<Box sx={{ mt: 4 }}>
									<Grid
										container
										columns={6}
										columnSpacing={2}
										rowSpacing={2}
									>
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
													onModelSelect={(m) => {
														setSelectedModel(
															m.name,
														);
													}}
												/>
											</Grid>
										))}
										<Grid
											key={""}
											item
											lg={1}
											md={1}
											xs={1}
											xl={1}
											sm={1}
										>
											<ModelTileCard
												model={{
													name: "custom",
													display: "Custom",
													icon: "/src/assets/img/SEMOSS_BLACK_LOGO.png",
													embedding: false,
													disable: false,
												}}
												onModelSelect={(m) => {
													setSelectedModel("");
												}}
											/>
										</Grid>
									</Grid>
								</Box>
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
						(m) => m.name === selectedModel,
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

				<Typography
					variant="h4"
					// sx={isModelPage ? { fontWeight: 500 } : undefined}
				>
					Connect to Model
				</Typography>
				<Typography
					variant="body1"
					// color={isModelPage ? "secondary" : "inherit"}
				>
					In an era fueled by information, the seamless interlinking
					of various databases stands as a cornerstone for unlocking
					the untapped potential of LLM applications. Whether you're a
					seasoned AI practitioner, a language aficionado, or an
					industry visionary, this page serves as your guiding star to
					grasp the spectrum of database options available within the
					LLM landscape.
				</Typography>
			</StyledStack>
			{view}
		</div>
	);
};
