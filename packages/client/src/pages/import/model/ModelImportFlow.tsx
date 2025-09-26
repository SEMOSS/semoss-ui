import { useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Stack, styled, Tabs } from "@semoss/ui";
import { formatToDataTestId } from "@/utility";
import { IMPORTABLE_MODELS, type ImportableModels } from "./import.constants";

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

	/**
	 * Any initialization logic for the model import flow
	 */
	useEffect(() => {
		getImportableModels();
	}, []);

	const models = useMemo(() => {
		if (!importableModels) return [];
		debugger;
		const provider =
			importableModels.providers.find((p) => p.name === selectedProvider)
				.types || [];

		console.log("prov", provider);

		return provider;
	}, [selectedProvider]);

	/**
	 * Fetch the list of importable models from the backend or a static source
	 */
	const getImportableModels = async () => {
		// TODO: Get importable models from backend
		const { pixelReturn } = await runPixel("1+1");

		setImportableModels(IMPORTABLE_MODELS as ImportableModels);
		setSelectedProvider(IMPORTABLE_MODELS.providers[0].name);
	};

	console.log("models", models);

	return (
		<div>
			<h2>Model Import Flow</h2>
			{/* Add your model import flow components and logic here */}
			{importableModels ? (
				<Stack>
					<Tabs
						value={selectedProvider}
						onChange={(_, newValue) => {
							debugger;
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
				</Stack>
			) : null}
			{models.map((m, i) => {
				return (
					<div key={JSON.stringify(m.model_types)}>
						<p>{JSON.stringify(m.model_types)}</p>
					</div>
				);
			})}
		</div>
	);
};
