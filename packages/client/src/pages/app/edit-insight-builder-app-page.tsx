import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { SerializedState } from "@semoss/renderer";
import type { FlexLayout } from "@semoss/shared";
import { LoadingScreen, toast } from "@semoss/ui/next";
import { NewAppStep } from "@/components/app";
import { InsightBuilder } from "@/components/insight";
import type {
	FilterParameter,
	SavedComponent,
	SavedQuery,
} from "@/components/insight/insight.types";
import { useRootStore } from "@/hooks";
import { NavbarHeader, NavbarLeft } from "../../components/shared";

// Type definitions for app data structures
interface AppInfoOutput {
	project_name?: string;
	description?: string;
	tag?: string | string[];
}

interface NotebookCell {
	id: string;
	parameters?: {
		code?: string;
	};
}

interface QueriesNotebook {
	cells?: NotebookCell[];
}

interface BlockData {
	id: string;
	widget: string;
	parent?: {
		id: string;
		slot: string;
	} | null;
	data: Record<string, unknown>;
	listeners: Record<
		string,
		{
			order: unknown[];
			type: "async" | "sync";
		}
	>;
	slots: Record<
		string,
		{
			name: string;
			children: string[];
		}
	>;
	communityBlockMapping?: Record<string, string>;
}

interface BlocksOutput {
	version?: string;
	queries?: Record<string, QueriesNotebook>;
	blocks?: Record<string, BlockData>;
}

export const EditInsightBuilderAppPage = () => {
	const { appId } = useParams<{ appId: string }>();
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [initialQueries, setInitialQueries] = useState<SavedQuery[]>([]);
	const [initialComponents, setInitialComponents] = useState<
		SavedComponent[]
	>([]);
	const [initialParameters, setInitialParameters] = useState<
		FilterParameter[]
	>([]);
	const [initialLayout, setInitialLayout] =
		useState<FlexLayout.IJsonModel | null>(null);
	const [appName, setAppName] = useState<string>("");
	const [appDescription, setAppDescription] = useState<string>("");
	const [appTags, setAppTags] = useState<string[]>([]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: monolithStore and navigate are stable references
	useEffect(() => {
		const loadInsightData = async () => {
			if (!appId) {
				toast.error("No app ID provided");
				navigate("/app/new/insight");
				return;
			}

			try {
				setLoading(true);

				// Fetch app information first to get the app name, description, and tags for pre-filling the app creation step
				const appNameResponse = await monolithStore.runQuery(
					`ProjectInfo(project="${appId}")`,
				);
				const appNameOutput = appNameResponse.pixelReturn[0]
					.output as AppInfoOutput;
				setAppName(appNameOutput.project_name || "");
				setAppDescription(appNameOutput.description || "");
				// Ensure tags is always an array
				setAppTags(
					Array.isArray(appNameOutput.tag)
						? appNameOutput.tag
						: appNameOutput.tag
							? [appNameOutput.tag]
							: [],
				);

				// Fetch and parse from app blocks JSON
				const blocksResponse = await monolithStore.runQuery(
					`GetAppBlocksJson(project=["${appId}"]);`,
				);

				const blocksType = blocksResponse.pixelReturn[0].operationType;
				const blocksOutput = blocksResponse.pixelReturn[0]
					.output as BlocksOutput;

				if (blocksType.indexOf("ERROR") > -1) {
					throw new Error(String(blocksOutput));
				}

				const layoutResponse = await monolithStore.runQuery<[string]>(
					`GetAppAssets(filePath=["/portals/default-layout.json"], project=["${appId}"]);`,
				);

				if (layoutResponse?.pixelReturn?.[0]?.output) {
					const output = layoutResponse.pixelReturn[0].output;
					const existingLayout =
						typeof output === "string"
							? JSON.parse(output)
							: output;
					setInitialLayout(existingLayout);
				}

				// Parse queries from the notebook cells
				const parsedQueries: SavedQuery[] = [];
				// Find the main queries notebook (not parameter options notebooks)
				const queriesNotebook = Object.entries(
					blocksOutput.queries || {},
				).find(
					([notebookId]) => !notebookId.endsWith("-options-list"),
				)?.[1] as QueriesNotebook | undefined;

				if (queriesNotebook?.cells) {
					for (const cell of queriesNotebook.cells) {
						// Parse the pixel code to extract query info
						const code = cell.parameters?.code || "";

						// Extract database ID
						const dbMatch = code.match(
							/Database\(database=\["([^"]+)"\]\)/,
						);
						const databaseId = dbMatch ? dbMatch[1] : "";

						// Extract SQL query (use [\s\S] to match any character including < and >)
						const sqlMatch = code.match(
							/Query\("<encode>([\s\S]+?)<\/encode>"\)/,
						);
						const sqlQuery = sqlMatch ? sqlMatch[1] : "";
						// Extract frame info
						const frameTypeMatch = code.match(
							/frameType=\["([^"]+)"\]/,
						);
						const frameType = frameTypeMatch
							? frameTypeMatch[1]
							: "GRID";

						const frameNameMatch = code.match(
							/\.as\(\["([^"]+)"\]\)/,
						);
						const frameVariableName = frameNameMatch
							? frameNameMatch[1]
							: "";

						// Extract database name from cell ID (format: "cell-query-{databaseName}-{frameName}")
						const dbNameMatch =
							cell.id.match(/^cell-query-([^-]+)-/);
						const databaseName = dbNameMatch
							? dbNameMatch[1]
							: "Database";

						if (databaseId && sqlQuery && frameVariableName) {
							parsedQueries.push({
								id: cell.id.replace("cell-", ""),
								databaseId,
								databaseName,
								sqlQuery,
								frameType,
								frameVariableName,
							});
						}
					}
				}

				// Parse parameters from blocks
				const parsedParameters: FilterParameter[] = [];

				// Look for parameter page (page-1) and its parameter blocks
				if (blocksOutput.blocks?.["page-1"]) {
					const variables =
						(
							blocksOutput as unknown as {
								variables?: Record<
									string,
									{ type: string; to: string }
								>;
							}
						).variables || {};

					// Find all parameter variables (type: "block")
					for (const [paramName, variable] of Object.entries(
						variables,
					)) {
						if (variable.type === "block" && variable.to) {
							const blockId = variable.to;

							// Blocks are stored flat in the blocks object, not nested in page-1
							const block = blocksOutput.blocks[blockId] as
								| BlockData
								| undefined;
							// If block is not found, skip this
							if (!block) {
								continue;
							}

							// Map widget type to parameter input type
							let inputType: FilterParameter["inputType"] =
								"text";
							if (block.widget === "input") {
								const type = block.data.type as string;
								inputType =
									type === "number"
										? "number"
										: type === "date"
											? "date"
											: "text";
							} else if (block.widget === "radio") {
								inputType = "radio";
							} else if (block.widget === "select") {
								inputType = "select";
							} else if (block.widget === "switch") {
								inputType = "toggle";
							}

							// Extract parameter configuration
							const parameter: FilterParameter = {
								id: blockId,
								name: paramName,
								label: block.data.label as string | undefined,
								inputType,
								required:
									block.data.required === "true" ||
									block.data.required === true,
								defaultValue: block.data.value as
									| string
									| number
									| boolean
									| string[]
									| undefined,
								hint: block.data.hint as string | undefined,
							};

							// Add type-specific properties
							if (inputType === "radio") {
								parameter.options = block.data.options as
									| Array<{ label: string; value: string }>
									| undefined;
								parameter.direction =
									(block.data.direction as
										| "row"
										| "column") || "column";
							}

							if (inputType === "select") {
								parameter.multiple = block.data.multiple as
									| boolean
									| undefined;

								// Check if this select parameter has a SQL query notebook
								const paramNotebookId = `${paramName}-options-list`;
								const paramNotebook =
									blocksOutput.queries?.[paramNotebookId];

								if (paramNotebook?.cells?.[0]) {
									// Extract SQL configuration from the parameter notebook
									const cell1Code =
										paramNotebook.cells[0].parameters
											?.code || "";

									// Extract database ID
									const dbMatch = cell1Code.match(
										/Database\(database=\["([^"]+)"\]\)/,
									);
									if (dbMatch) {
										parameter.parameterDatabaseId =
											dbMatch[1];
									}

									// Extract SQL query
									const sqlMatch = cell1Code.match(
										/Query\("<encode>([\s\S]+?)<\/encode>"\)/,
									);
									if (sqlMatch) {
										parameter.parameterSqlQuery =
											sqlMatch[1];
									}

									// Extract column mappings from block data
									if (block.data.optionLabel) {
										parameter.optionLabel = block.data
											.optionLabel as string;
									}
									if (block.data.optionValue) {
										parameter.optionValue = block.data
											.optionValue as string;
									}
									if (block.data.optionSublabel) {
										parameter.optionSublabel = block.data
											.optionSublabel as string;
									}
								} else {
									// No SQL query - use manual options
									parameter.selectOptions = block.data
										.options as string[] | undefined;
								}
							}

							parsedParameters.push(parameter);
						}
					}
				}

				// Parse components from blocks
				const parsedComponents: SavedComponent[] = [];

				// Map widget names to component types
				const widgetToComponentType: Record<string, string> = {
					grid: "grid-block",
					"e-chart": "visualization-block",
					"visualization-filter": "visualization-filter-block",
					html: "html-block",
					// TODO: Visulizations: KPI, Multi-Line, Pivot Table
					// TODO: Export Button without using frame ?
				};

				// Find all blocks with parent: null (these are the components rendered by flex-layout)
				if (blocksOutput.blocks) {
					for (const [blockId, blockData] of Object.entries(
						blocksOutput.blocks,
					)) {
						const block = blockData as BlockData;

						// Skip if block has a parent (not a flex-layout component)
						if (
							block.parent !== null &&
							block.parent !== undefined
						) {
							continue;
						}

						// Check if it's a supported widget type
						const widgetType = block.widget;
						const componentType = widgetType
							? widgetToComponentType[widgetType]
							: undefined;

						if (componentType) {
							// Determine frame name based on block type
							// - grid/e-chart: data.frame.name (object)
							// - visualization-filter: data.frame (string)
							// - html: no frame needed
							let frameName = "";
							if (block.data?.frame) {
								if (typeof block.data.frame === "string") {
									frameName = block.data.frame;
								} else if (
									typeof block.data.frame === "object" &&
									block.data.frame !== null &&
									"name" in block.data.frame &&
									typeof block.data.frame.name === "string"
								) {
									frameName = block.data.frame.name;
								}
							}

							// HTML and filter blocks don't require queries
							// - HTML blocks are static content
							// - Filter blocks can exist without a frame selected (user selects in filter menu on app / edit page)
							const needsQuery =
								componentType !== "html-block" &&
								componentType !== "visualization-filter-block";

							const query =
								needsQuery && frameName
									? parsedQueries.find(
											(q) =>
												q.frameVariableName ===
												frameName,
										)
									: null;

							if (query || !needsQuery) {
								// Create a minimal block state for this component
								const componentBlockState: SerializedState = {
									version: String(
										blocksOutput.version || "1.0.0-alpha.3",
									),
									executionOrder: [],
									variables: {},
									queries: {},
									blocks: {
										[blockId]: block,
									},
								} as SerializedState;

								const component = {
									id: blockId,
									queryId: query?.id || "", // Empty for HTML blocks
									componentType: componentType,
									frameVariableName: frameName,
									blockState: componentBlockState,
									blockId: blockId,
								};
								parsedComponents.push(component);
							}
						}
					}
				}

				setInitialQueries(parsedQueries);
				setInitialComponents(parsedComponents);
				setInitialParameters(parsedParameters);
			} catch (error) {
				console.error("Error loading insight data:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to load insight data",
				);
				navigate("#/app");
			} finally {
				setLoading(false);
			}
		};

		loadInsightData();
	}, [appId]);

	if (loading) {
		return <LoadingScreen.Trigger description="Loading insight data..." />;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<NewAppStep tool="Insight">
				<InsightBuilder
					initialQueries={initialQueries}
					initialComponents={initialComponents}
					initialParameters={initialParameters}
					initialLayout={initialLayout}
					editMode={true}
					appMetadata={{
						existingAppId: appId,
						appName,
						appDescription,
						appTags,
					}}
				/>
			</NewAppStep>
		</>
	);
};
