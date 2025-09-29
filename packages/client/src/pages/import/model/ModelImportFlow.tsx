import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Box,
	Breadcrumbs,
	Grid,
	Link,
	Search,
	Stack,
	styled,
	Tabs,
	Typography,
} from "@semoss/ui";
import { formatToDataTestId } from "@/utility";
import { ModelTileCard } from "./ModelTileCard";
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

const StyledTab = styled(Tabs.Item)({
	fontSize: "14px",
	fontWeight: "500",
	letterSpacing: "0.4px",
	color: "rgba(0, 0, 0, 0.60)",
});

export const ModelImportFlow: React.FC = () => {
	const [importableModels, setImportableModels] =
		useState<ImportableModels | null>(null);
	const [selectedProvider, setSelectedProvider] = useState("");
	const [search, setSearch] = useState("");

	/**
	 * Any initialization logic for the model import flow
	 */
	useEffect(() => {
		getImportableModels();
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
	 * Fetch the list of importable models from the backend or a static source
	 */
	const getImportableModels = async () => {
		// TODO: Get importable models from backend
		const { pixelReturn } = await runPixel("1+1");

		setImportableModels(IMPORTABLE_MODELS as ImportableModels);
		setSelectedProvider(IMPORTABLE_MODELS.providers[0].name);
	};

	const handleModelSelect = (model: any) => {
		console.log("Model selected:", model);
		// TODO: Implement model selection logic
	};

	return (
		<div>
			<StyledStack>
				<Breadcrumbs separator="/">
					<Breadcrumbs.Item
						//@ts-expect-error: TODO FIX Type
						as={Link}
						underline="none"
						color="inherit"
						variant="body1"
						onClick={() => {
							// setSteps([], -1);
							// if (window.history.length > 1) {
							// 	navigate(-1);
							// } else {
							// 	navigate("/");
							// }
						}}
					>
						Model Catalog
					</Breadcrumbs.Item>
					<Breadcrumbs.Item
						//@ts-expect-error: TODO FIX Type
						as={Link}
						underline="none"
						color="inherit"
						variant="body1"
						onClick={() => {
							// setSteps([], -1);
							// if (window.history.length > 1) {
							// 	navigate(-1);
							// } else {
							// 	navigate("/");
							// }
						}}
					>
						Connect to Model
					</Breadcrumbs.Item>
				</Breadcrumbs>

				<Typography
					variant="h4"
					// sx={isModelPage ? { fontWeight: 500 } : undefined}
				>
					{/* {steps.length && steps[steps.length - 1].title} */}
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

			<StyledSearchbarContainer>
				<Search
					size="small"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
					}}
					fullWidth
				/>
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
						sx={{ mt: 2, borderBottom: "2px solid #E0E0E0" }}
					>
						{importableModels.providers.map((provider, i) => {
							return (
								<StyledTab
									key={provider.name}
									label={provider.name}
									value={provider.name}
									data-tesId={formatToDataTestId(
										`connect-to-${provider.name}-tab`,
									)}
								/>
							);
						})}
					</Tabs>

					{/* Models Grid */}
					<Box sx={{ mt: 4 }}>
						<Grid
							container
							columns={6}
							columnSpacing={2}
							rowSpacing={2}
						>
							{models.map((model, idx) => (
								<Grid
									key={idx}
									item
									lg={1}
									md={1}
									xs={1}
									xl={1}
									sm={1}
								>
									<ModelTileCard
										model={model}
										onModelSelect={handleModelSelect}
									/>
								</Grid>
							))}
						</Grid>
					</Box>
				</Stack>
			) : null}
		</div>
	);
};
