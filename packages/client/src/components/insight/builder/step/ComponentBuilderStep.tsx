import { PieChart } from "lucide-react";
import { autorun } from "mobx";
import { useEffect, useRef, useState } from "react";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	type SerializedState,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import type {
	CellConfig,
	CellDef,
} from "../../../../../../../libs/renderer/dist/types/store/state/state.types";
import { VisualizationBlockMenu } from "../../../blocks-workspace/blocks/settings/custom/e-charts/VisualizationBlockMenu";
import { GridBlockMenu } from "../../../blocks-workspace/blocks/settings/custom/grid-two/GridBlockMenu";
import { HTMLBlockMenu } from "../../../blocks-workspace/blocks/settings/custom/html/HTMLBlockMenu";
import { VisualizationFilterMenu } from "../../../blocks-workspace/blocks/settings/custom/visualization-filter/VisualizationFilterMenu";
import type {
	ColumnHeaderInfo,
	FilterParameter,
	SavedComponent,
	SavedQuery,
} from "../../insight.types";
import { PreviewPanel } from "../shared";
import {
	COMPONENT_TYPES,
	getComponentType,
} from "../types/insight.component-types";

interface ComponentBuilderStepProps {
	savedQueries: SavedQuery[];
	savedComponents: SavedComponent[];
	showBuilder: boolean;
	onShowBuilderChange: (show: boolean) => void;
	componentToEdit: SavedComponent | null;
	onComponentSave: (component: SavedComponent) => void;
	savedParameters: FilterParameter[];
}

export const ComponentBuilderStep = (props: ComponentBuilderStepProps) => {
	const {
		savedQueries,
		savedComponents,
		showBuilder,
		onShowBuilderChange,
		componentToEdit,
		onComponentSave,
		savedParameters,
	} = props;
	const [selectedQuery, setSelectedQuery] = useState<string>("");
	const [selectedComponentType, setSelectedComponentType] =
		useState<string>("");
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [editingComponentId, setEditingComponentId] = useState<string | null>(
		null,
	);
	const [originalQueryId, setOriginalQueryId] = useState<string | null>(null);
	const [isOrphanedComponent, setIsOrphanedComponent] =
		useState<boolean>(false);

	// Preview data state
	const [previewData, setPreviewData] = useState<{
		headers: string[];
		values: unknown[][];
		headerInfo: ColumnHeaderInfo[];
	} | null>(null);
	const [isLoadingPreviewData, setIsLoadingPreviewData] =
		useState<boolean>(false);

	// Block-based preview state
	const [blockState, setBlockState] = useState<StateStore | null>(null);
	const [blockId, setBlockId] = useState<string | null>(null);
	const [previewInsightId, setPreviewInsightId] = useState<string | null>(
		null,
	);
	const [hasChartTypeSelected, setHasChartTypeSelected] =
		useState<boolean>(false);

	// Track if block state has been initialized for current query to prevent recreating
	const blockStateInitializedRef = useRef<{
		query: string;
		componentType: string;
	} | null>(null);

	// Track previous component type for cleanup when switching
	const previousComponentTypeRef = useRef<string | null>(null);

	// Handle component edit
	useEffect(() => {
		if (componentToEdit) {
			// Reset initialization tracking when editing a component
			blockStateInitializedRef.current = null;

			setEditingComponentId(componentToEdit.id);
			setOriginalQueryId(componentToEdit.queryId); // Track original query
			setSelectedComponentType(componentToEdit.componentType);

			// HTML and filter blocks don't depend on queries, skip orphaned logic
			if (
				componentToEdit.componentType === "html-block" ||
				componentToEdit.componentType === "visualization-filter-block"
			) {
				setIsOrphanedComponent(false);
				setSelectedQuery("");
				if (componentToEdit.blockState) {
					setShowPreview(true);
				}
			} else {
				// Check if the query still exists for query-dependent blocks
				const queryExists = savedQueries.some(
					(q) => q.id === componentToEdit.queryId,
				);

				if (!queryExists) {
					// Query was deleted - orphaned component
					setIsOrphanedComponent(true);
					setSelectedQuery("");
					setShowPreview(false);
					setBlockState(null);
					setBlockId(null);
					blockStateInitializedRef.current = null;

					// Close any existing preview insight
					if (previewInsightId) {
						try {
							runPixel(
								`CloseInsight(insightId=["${previewInsightId}"]);`,
								previewInsightId,
							);
						} catch (error) {
							console.error(
								"Error closing preview insight:",
								error,
							);
						}
						setPreviewInsightId(null);
					}
				} else {
					// Query exists - proceed normally
					setIsOrphanedComponent(false);
					setSelectedQuery(componentToEdit.queryId);
					// For block components, show preview if it exists
					// Block state will be restored after insight is created
					if (
						(componentToEdit.componentType === "grid-block" ||
							componentToEdit.componentType ===
								"visualization-block") &&
						componentToEdit.blockState
					) {
						// Preview will show after data loads and block state is restored
						if (componentToEdit.componentType === "grid-block") {
							setShowPreview(true);
						}
						// For visualization, preview depends on chart type selection
					}
				}
			}
		}
	}, [componentToEdit, savedQueries, previewInsightId]);

	// Load preview data when query or component type is selected
	// biome-ignore lint/correctness/useExhaustiveDependencies: loadPreviewDataForQuery is a stable function that shouldn't trigger re-renders
	useEffect(() => {
		// Clean up insight when switching away from filter block
		const switchingAwayFromFilterBlock =
			previousComponentTypeRef.current === "visualization-filter-block" &&
			selectedComponentType !== "visualization-filter-block" &&
			selectedComponentType !== "";

		if (switchingAwayFromFilterBlock && previewInsightId) {
			// Clean up the filter block insight
			try {
				runPixel(
					`CloseInsight(insightId=["${previewInsightId}"]);`,
					previewInsightId,
				);
			} catch (error) {
				console.error("Error closing filter block insight:", error);
			}
			setPreviewInsightId(null);
			blockStateInitializedRef.current = null;
		}

		// Update previous component type
		previousComponentTypeRef.current = selectedComponentType;

		// HTML blocks don't need query data loaded
		if (selectedComponentType === "html-block") {
			if (!previewInsightId) {
				runPixel("1+1;", "new").then(({ insightId: newInsightId }) => {
					setPreviewInsightId(newInsightId);
				});
			}
			return;
		}

		if (selectedComponentType === "visualization-filter-block") {
			// Only set up filter block once - check if already initialized
			if (previewInsightId) {
				// Already set up, skip
				return;
			}

			// Create insight and load all queries once
			const setupFilterBlock = async () => {
				// Create new insight and load ALL queries
				const { insightId: newInsightId } = await runPixel(
					"1+1;",
					"new",
				);
				await loadAllQueriesForFilterBlock(newInsightId);
				setPreviewInsightId(newInsightId);
			};

			setupFilterBlock();
			return;
		}

		if (selectedQuery) {
			setIsOrphanedComponent(false);
			blockStateInitializedRef.current = null;

			const isBlockComponent =
				getComponentType(selectedComponentType)?.category === "block";

			// Always reload when switching component types or queries
			const needsReload =
				!previewData ||
				(isBlockComponent && !previewInsightId) ||
				(!isBlockComponent && previewInsightId);

			if (needsReload) {
				loadPreviewDataForQuery(selectedQuery);
			}
		} else {
			setPreviewData(null);
			setPreviewInsightId(null);
			blockStateInitializedRef.current = null;
		}
	}, [previewData, previewInsightId, selectedQuery, selectedComponentType]);
	// Watch for chart type selection in visualization blocks using MobX autorun
	useEffect(() => {
		if (
			selectedComponentType === "visualization-block" &&
			blockState &&
			blockId
		) {
			// Use MobX autorun to react to changes in the observable block state
			const dispose = autorun(() => {
				if (!blockId) return;
				const block = blockState.blocks[blockId];
				const variation = block?.data?.variation;

				if (variation && variation !== "") {
					// Chart type selected, enable preview
					setHasChartTypeSelected(true);
					setShowPreview(true);
				} else {
					// No chart type selected
					setHasChartTypeSelected(false);
					setShowPreview(false);
				}
			});

			// Cleanup the autorun when component unmounts or dependencies change
			return () => dispose();
		}
	}, [blockState, blockId, selectedComponentType]);

	// Cleanup insight on unmount or when switching queries
	useEffect(() => {
		return () => {
			if (previewInsightId) {
				// Clean up the temporary insight
				try {
					runPixel(
						`CloseInsight(insightId=["${previewInsightId}"]);`,
						previewInsightId,
					);
				} catch (error) {
					console.error("Error closing preview insight:", error);
				}
			}
		};
	}, [previewInsightId]);

	/**
	 * Replace parameter references in query with default values
	 */
	const replaceParametersWithDefaults = (sqlQuery: string): string => {
		if (!savedParameters || savedParameters.length === 0) {
			return sqlQuery;
		}

		let processedQuery = sqlQuery;

		// Find all parameter references like {{paramName}}
		const paramPattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
		const matches = [...sqlQuery.matchAll(paramPattern)];

		if (matches.length === 0) {
			return sqlQuery;
		}

		// Replace each parameter with its default value
		for (const match of matches) {
			const fullMatch = match[0]; // ex: "{{param1}}"
			const paramName = match[1]; // ex: "param1"

			// Find the parameter definition
			const param = savedParameters.find((p) => p.name === paramName);

			if (!param) {
				// Parameter not found, leave as is
				continue;
			}

			// Determine default value based on type and parameter definition
			// We don't add quotes here, the SQL should already have them
			let defaultValue: string;

			switch (param.inputType) {
				case "date": {
					// Use current date in SQL format (YYYY-MM-DD)
					const today = new Date();
					const year = today.getFullYear();
					const month = String(today.getMonth() + 1).padStart(2, "0");
					const day = String(today.getDate()).padStart(2, "0");
					defaultValue = `${year}-${month}-${day}`;
					break;
				}
				case "number":
				case "text":
				case "select":
					defaultValue = "()";
					break;
				default:
					// Empty string
					defaultValue = "";
					break;
			}
			// }

			// Replace the parameter reference with the default value
			processedQuery = processedQuery.replace(fullMatch, defaultValue);
		}

		return processedQuery;
	};

	// Create/update block state when component type is a block type
	// biome-ignore lint/correctness/useExhaustiveDependencies: createOrUpdateBlockState and restoreBlockState are not depencencies
	useEffect(() => {
		// HTML and filter blocks only need insight and component type, no query/preview data
		const needsQueryData =
			selectedComponentType !== "html-block" &&
			selectedComponentType !== "visualization-filter-block";

		if (
			(selectedComponentType === "grid-block" ||
				selectedComponentType === "visualization-block" ||
				selectedComponentType === "html-block" ||
				selectedComponentType === "visualization-filter-block") &&
			(needsQueryData ? selectedQuery && previewData : true) &&
			previewInsightId
		) {
			// Check if block state has already been initialized for this query/component combination
			const currentKey = `${selectedQuery}-${selectedComponentType}`;
			const initializedKey = blockStateInitializedRef.current
				? `${blockStateInitializedRef.current.query}-${blockStateInitializedRef.current.componentType}`
				: null;

			// Only initialize if not already done for this combination
			if (initializedKey === currentKey && blockState) {
				// Already initialized, skip
				return;
			}

			// Update block state if:
			// 1. Not editing (new component)
			// 2. Editing but query changed from original
			// 3. Editing and we need to restore saved block state
			const queryChanged =
				editingComponentId && selectedQuery !== originalQueryId;
			const needsRestore =
				editingComponentId &&
				!queryChanged &&
				componentToEdit?.blockState &&
				!blockState; // Only restore if not already done

			if (!editingComponentId || queryChanged) {
				createOrUpdateBlockState();
				blockStateInitializedRef.current = {
					query: selectedQuery,
					componentType: selectedComponentType,
				};
			} else if (needsRestore) {
				restoreBlockState();
				blockStateInitializedRef.current = {
					query: selectedQuery,
					componentType: selectedComponentType,
				};
			}
		}
	}, [
		selectedComponentType,
		selectedQuery,
		previewData,
		previewInsightId,
		editingComponentId,
		originalQueryId,
		blockState,
		componentToEdit?.blockState,
	]);

	/**
	 * Restore block state from saved component (used when editing)
	 */
	const restoreBlockState = () => {
		if (!componentToEdit?.blockState || !previewInsightId) return;

		// Restore the saved block state with the current insight ID
		const state = new StateStore({
			mode: "interactive",
			insightId: previewInsightId,
			state: componentToEdit.blockState,
			cellRegistry: DefaultCells as unknown as Record<
				string,
				CellConfig<CellDef<string>>
			>,
		});

		setBlockState(state);
		setBlockId(componentToEdit.blockId || null);

		// For grid blocks, HTML blocks, and filter blocks show preview immediately
		// For visualization blocks, wait for chart type
		if (
			selectedComponentType === "grid-block" ||
			selectedComponentType === "html-block" ||
			selectedComponentType === "visualization-filter-block"
		) {
			setShowPreview(true);
		} else if (selectedComponentType === "visualization-block") {
			// Check if chart type is already selected in saved state
			const savedBlock =
				componentToEdit.blockState.blocks?.[
					componentToEdit.blockId || ""
				];
			const hasVariation = savedBlock?.data?.variation;
			if (hasVariation) {
				setHasChartTypeSelected(true);
				setShowPreview(true);
			}
		}
	};

	/**
	 * Create or update block state for block-based components
	 */
	const createOrUpdateBlockState = () => {
		// HTML and filter blocks don't require query or preview data
		const needsQueryData =
			selectedComponentType !== "html-block" &&
			selectedComponentType !== "visualization-filter-block";

		if (needsQueryData) {
			const query = savedQueries.find((q) => q.id === selectedQuery);
			if (!query || !previewData || !previewInsightId) return;
		}

		if (!previewInsightId) return;

		const query = savedQueries.find((q) => q.id === selectedQuery);
		// Use the query's defined frame name (if query exists)
		const frameName = query?.frameVariableName || "";

		// Create block ID using component type and index
		// When editing, keep the existing ID
		let newBlockId: string;

		if (editingComponentId) {
			// Keep the same block ID when editing
			newBlockId = editingComponentId;
		} else {
			// Count existing components of this type to determine the next index
			const existingComponentsOfType = savedComponents.filter(
				(c) => c.componentType === selectedComponentType,
			);
			const nextIndex = existingComponentsOfType.length + 1;
			newBlockId = `${selectedComponentType}--${nextIndex}`;
		}

		// Create initial state based on component type
		let initialState: SerializedState;

		if (selectedComponentType === "grid-block") {
			// Grid block
			initialState = {
				version: STATE_VERSION,
				blocks: {
					[newBlockId]: {
						id: newBlockId,
						widget: "grid",
						data: {
							frame: {
								name: frameName,
							},
							columns: previewData?.headerInfo.map(
								(headerInfo) => ({
									name: headerInfo.alias,
									selector: headerInfo.header,
									hidden: false,
								}),
							),
							style: {
								height: "100%",
								width: "100%",
								display: "flex",
								flexDirection: "column",
								padding: "0px",
								gap: "0px",
								flexWrap: "nowrap",
							},
							option: {
								enableExport: false,
							},
							variation: "grid-block",
							show: true,
						},
						listeners: {},
						slots: {},
					},
				},
				queries: {},
				variables: {},
				executionOrder: [],
			};
		} else if (selectedComponentType === "visualization-block") {
			// Visualization block with empty variation (user must select chart type)
			initialState = {
				version: STATE_VERSION,
				blocks: {
					[newBlockId]: {
						id: newBlockId,
						widget: "e-chart",
						data: {
							frame: {
								name: frameName,
							},
							variation: "", // Empty - user must select chart type
							option: {}, // Empty initial config
							style: {
								height: "100%",
								width: "100%",
								display: "flex",
								flexDirection: "column",
								padding: "0px",
								gap: "0px",
							},
							show: true,
						},
						listeners: {
							preProcess: {
								type: "sync",
								order: [],
							},
						},
						slots: {},
					},
				},
				queries: {},
				variables: {},
				executionOrder: [],
			};
		} else if (selectedComponentType === "html-block") {
			// HTML block
			initialState = {
				version: STATE_VERSION,
				blocks: {
					[newBlockId]: {
						id: newBlockId,
						widget: "html",
						data: {
							html: "<div>HTML Content</div>",
							style: {
								height: "100%",
								width: "100%",
								display: "flex",
								flexDirection: "column",
								padding: "0px",
								gap: "0px",
							},
							show: true,
						},
						listeners: {},
						slots: {},
					},
				},
				queries: {},
				variables: {},
				executionOrder: [],
			};
		} else if (selectedComponentType === "visualization-filter-block") {
			// Visualization Filter block - user will select frame from menu
			initialState = {
				version: STATE_VERSION,
				blocks: {
					[newBlockId]: {
						id: newBlockId,
						widget: "visualization-filter",
						data: {
							style: {},
							displayType: "Dropdown",
							frame: "", // User will select frame from filter menu
							column: "",
							showPanelTitle: true,
							searchable: true,
							multipleSelection: false,
							show: "true",
							filterLabel: "Filter",
							sliderSensitivity: 1,
							listOptions: [],
							selectedValues: [],
							color: "secondary",
							size: "medium",
						},
						listeners: {
							preProcess: {
								type: "sync",
								order: [],
							},
						},
						slots: {},
					},
				},
				queries: {},
				variables: {},
				executionOrder: [],
			};
		} else {
			return; // Unsupported component type
		}

		// Create new state store using the temporary insight
		const state = new StateStore({
			mode: "interactive",
			insightId: previewInsightId,
			state: initialState,
			cellRegistry: DefaultCells as unknown as Record<
				string,
				CellConfig<CellDef<string>>
			>,
		});

		setBlockState(state);
		setBlockId(newBlockId);
		// Auto-show preview for most blocks, except visualization-block
		if (
			selectedComponentType === "grid-block" ||
			selectedComponentType === "html-block" ||
			selectedComponentType === "visualization-filter-block"
		) {
			setShowPreview(true);
		} else if (selectedComponentType === "visualization-block") {
			// Don't show preview until chart type is selected
			setShowPreview(false);
			setHasChartTypeSelected(false);
		}
	};

	/**
	 * Load preview data for a specific query
	 */
	const loadPreviewDataForQuery = async (queryId: string) => {
		const query = savedQueries.find((q) => q.id === queryId);
		if (!query) return;

		setIsLoadingPreviewData(true);

		try {
			// Create a temporary insight for block components
			const isBlockComponent =
				getComponentType(selectedComponentType)?.category === "block";
			let insightId: string | undefined;

			if (isBlockComponent) {
				// Clean up any existing preview insight first
				if (previewInsightId) {
					try {
						await runPixel(
							`CloseInsight(insightId=["${previewInsightId}"]);`,
							previewInsightId,
						);
					} catch (error) {
						console.error(
							"Error closing previous preview insight:",
							error,
						);
					}
				}

				// Create a new temporary insight
				const { insightId: newInsightId } = await runPixel(
					"1+1;",
					"new",
				);
				insightId = newInsightId;
				setPreviewInsightId(newInsightId);
			} else {
				// Clean up insight if switching from block to non-block
				if (previewInsightId) {
					try {
						await runPixel(
							`CloseInsight(insightId=["${previewInsightId}"]);`,
							previewInsightId,
						);
					} catch (error) {
						console.error("Error closing preview insight:", error);
					}
					setPreviewInsightId(null);
				}
			}

			// Replace parameter references with default values
			const processedQuery = replaceParametersWithDefaults(
				query.sqlQuery,
			);
			const escapedQuery = processedQuery.replace(/"/g, '\\"');
			// Use the query's defined frame name and type
			const frameName = query.frameVariableName;
			const frameType = query.frameType || "GRID";

			// Build pixel query for preview using the query's frame configuration
			const reactorPixel = `Database(database=["${query.databaseId}"]) | Query("${escapedQuery}") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameName}"])]); META | Frame() | QueryAll() | Limit(601) | Collect(600);`;

			const response = await runPixel(reactorPixel, insightId);
			const type = response.pixelReturn[0]?.operationType;

			if (type && type.indexOf("ERROR") !== -1) {
				const error = response.pixelReturn[0]?.output;
				console.error(error);
				toast.error(String(error));
				setIsLoadingPreviewData(false);
				return;
			}

			const output = response.pixelReturn[1]?.output as {
				data: {
					values: unknown[][];
					headers: string[];
				};
				headerInfo: ColumnHeaderInfo[];
			};

			setPreviewData({
				headers: output?.data?.headers || [],
				values: output?.data?.values || [],
				headerInfo: output?.headerInfo || [],
			});

			setIsLoadingPreviewData(false);
		} catch (error) {
			console.error("Error loading preview data:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Error loading preview data",
			);
			setIsLoadingPreviewData(false);
		}
	};

	/**
	 * Load all saved queries into the filter block's insight
	 * This makes all frames available via GetFrames() in the filter menu
	 */
	const loadAllQueriesForFilterBlock = async (insightId: string) => {
		if (savedQueries.length === 0) {
			return;
		}

		try {
			// Build pixel commands to load all queries into the insight
			const pixelCommands = savedQueries.map((query) => {
				// Replace parameter references with default values
				const processedQuery = replaceParametersWithDefaults(
					query.sqlQuery,
				);
				const escapedQuery = processedQuery.replace(/"/g, '\\"');
				const frameName = query.frameVariableName;
				const frameType = query.frameType || "GRID";

				return `Database(database=["${query.databaseId}"]) | Query("${escapedQuery}") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameName}"])]);`;
			});

			// Execute all query loads in sequence
			for (const pixel of pixelCommands) {
				const response = await runPixel(pixel, insightId);
				const type = response.pixelReturn[0]?.operationType;

				if (type && type.indexOf("ERROR") !== -1) {
					const error = response.pixelReturn[0]?.output;
					console.error(
						"Error loading query for filter block:",
						error,
					);
					// Continue loading other queries even if one fails
				}
			}
		} catch (error) {
			console.error("Error loading queries for filter block:", error);
		}
	};

	const handleSave = () => {
		const componentType = getComponentType(selectedComponentType);
		const isBlockComponent = componentType?.category === "block";

		// HTML and filter blocks don't need query selection
		const needsQuery =
			selectedComponentType !== "html-block" &&
			selectedComponentType !== "visualization-filter-block";

		if (needsQuery && !selectedQuery) {
			toast.error("Please select a query");
			return;
		}

		if (!selectedComponentType) {
			toast.error("Please select a component type");
			return;
		}

		// Block components require block state
		if (isBlockComponent && (!blockState || !blockId)) {
			toast.error("Please configure the block before saving");
			return;
		}

		// Visualization components require a chart type to be selected
		if (selectedComponentType === "visualization-block") {
			const block = blockId ? blockState?.blocks?.[blockId] : null;

			if (!block?.data?.variation) {
				toast.warning("Please select a chart type before saving");
				return;
			}
		}

		// Create component ID using component type and index
		// Count existing components of this type to determine the next index
		const query = savedQueries.find((q) => q.id === selectedQuery);
		let componentId: string;

		if (editingComponentId) {
			// Keep the same ID when editing
			componentId = editingComponentId;
		} else {
			const existingComponentsOfType = savedComponents.filter(
				(c) => c.componentType === selectedComponentType,
			);
			const nextIndex = existingComponentsOfType.length + 1;
			componentId = `${selectedComponentType}--${nextIndex}`;
		}

		const component: SavedComponent = {
			id: componentId,
			queryId: selectedQuery || "", // Empty for HTML and filter blocks
			componentType: selectedComponentType,
			frameVariableName: query?.frameVariableName || "",
			// For block components, save the block state
			...(isBlockComponent && {
				blockState: blockState?.toJSON(),
				blockId: blockId || undefined,
			}),
		};

		onComponentSave(component);

		toast.success(
			editingComponentId
				? "Component updated successfully"
				: "Component saved successfully",
		);

		// Reset form
		handleCancel();
	};

	const handleCancel = () => {
		// Clean up preview insight if it exists
		if (previewInsightId) {
			try {
				runPixel(
					`CloseInsight(insightId=["${previewInsightId}"]);`,
					previewInsightId,
				);
			} catch (error) {
				console.error("Error closing preview insight:", error);
			}
		}
		setSelectedQuery("");
		setSelectedComponentType("");
		setShowPreview(false);
		setEditingComponentId(null);
		setOriginalQueryId(null);
		setBlockState(null);
		setBlockId(null);
		setPreviewInsightId(null);
		setIsOrphanedComponent(false);
		blockStateInitializedRef.current = null;
		onShowBuilderChange(false);
	};

	if (!showBuilder) {
		return (
			<Card className="flex h-full flex-col p-6">
				<div className="flex flex-row items-center gap-1">
					<h2 className="font-semibold text-lg">Component Builder</h2>
					<PieChart className="size-6" />
				</div>
				<div className="flex flex-1 flex-col items-center justify-center rounded border-2 border-gray-300 border-dashed p-8 text-center">
					<p className="mb-3 text-base text-muted-foreground">
						Create components using your saved queries.
					</p>
					<p className="text-muted-foreground text-sm">
						Click the <strong>Add (+)</strong> button in the sidebar
						to start building.
					</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="flex h-full flex-col p-6">
			<div className="flex h-full flex-col gap-2">
				{/* Header with selects */}
				<div className="flex flex-row items-center justify-between gap-2">
					<div className="flex flex-row items-center gap-1">
						<h2 className="mb-2 font-semibold text-lg">
							Component Builder
						</h2>
						<PieChart className="size-6" />
					</div>
					<div className="flex flex-row gap-1">
						<Select
							value={selectedComponentType}
							onValueChange={(val) =>
								setSelectedComponentType(val)
							}
						>
							<SelectTrigger className="min-w-[230px]">
								<SelectValue placeholder="Select Component Type" />
							</SelectTrigger>
							<SelectContent>
								{COMPONENT_TYPES.map((type) => (
									<SelectItem key={type.id} value={type.id}>
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedComponentType !== "html-block" &&
							selectedComponentType !==
								"visualization-filter-block" && (
								<Select
									value={selectedQuery}
									onValueChange={(val) =>
										setSelectedQuery(val)
									}
								>
									<SelectTrigger className="min-w-[220px]">
										<SelectValue placeholder="Select Query" />
									</SelectTrigger>
									<SelectContent>
										{savedQueries.map((query) => (
											<SelectItem
												key={query.id}
												value={query.id}
											>
												{query.frameVariableName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
					</div>
				</div>

				{/* Editor and Preview */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{!selectedComponentType ? (
						<div className="flex flex-1 flex-col items-center justify-center rounded border-2 border-gray-300 border-dashed p-8 text-center">
							<h3 className="mb-2 text-lg text-muted-foreground">
								Select a Component Type
							</h3>
							<p className="text-muted-foreground text-sm">
								Choose a component type from the dropdown above
								to begin building your component.
							</p>
						</div>
					) : (
						<>
							{/* Common header with title and action buttons */}
							<div className="mb-1 flex flex-row gap-1">
								<p className="flex-1 text-sm">
									{
										getComponentType(selectedComponentType)
											?.name
									}{" "}
									- Editor
								</p>
								{showPreview ? (
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowPreview(false)}
										disabled={
											selectedComponentType ===
												"visualization-block" &&
											!hasChartTypeSelected
										}
									>
										Hide Preview
									</Button>
								) : (
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowPreview(true)}
										disabled={
											selectedComponentType ===
												"visualization-block" &&
											!hasChartTypeSelected
										}
									>
										Preview
									</Button>
								)}
							</div>

							{/* Component-specific inputs */}
							{(() => {
								const componentType = getComponentType(
									selectedComponentType,
								);
								const isBlockComponent =
									componentType?.category === "block";

								// Block Components
								if (
									isBlockComponent &&
									selectedComponentType === "grid-block"
								) {
									return (
										<>
											<div
												className="flex flex-col overflow-hidden transition-[height] duration-300"
												style={{
													height: showPreview
														? "30vh"
														: "60vh",
												}}
											>
												<div className="flex-1 overflow-auto rounded border border-gray-300 p-[18px]">
													{isOrphanedComponent ? (
														<div className="flex h-full flex-col items-center justify-center gap-2 p-4">
															<h3 className="flex items-center gap-1 text-lg text-warning">
																Query No Longer
																Exists
															</h3>
															<p className="text-center text-muted-foreground text-sm">
																The query
																associated with
																this component
																has been
																deleted.
																<br />
																Please select a
																new query to
																continue.
															</p>
														</div>
													) : blockState &&
														blockId ? (
														<Blocks
															state={blockState}
															registry={
																DefaultBlocks
															}
														>
															<GridBlockMenu
																id={blockId}
															/>
														</Blocks>
													) : (
														<div className="flex h-full items-center justify-center p-4">
															<p className="text-muted-foreground text-sm">
																{isLoadingPreviewData
																	? "Loading block..."
																	: "Select a query to configure the block"}
															</p>
														</div>
													)}
												</div>
											</div>
											{/* Block Preview section */}
											{showPreview &&
												blockState &&
												blockId &&
												!isOrphanedComponent && (
													<PreviewPanel
														mode="block"
														title="Preview"
														blockData={{
															blockState:
																blockState,
															blockId: blockId,
															registry:
																DefaultBlocks,
														}}
														height="30vh"
													/>
												)}
										</>
									);
								}

								// Visualization block
								if (
									isBlockComponent &&
									selectedComponentType ===
										"visualization-block"
								) {
									return (
										<div className="h-full">
											<div
												className="flex flex-col overflow-hidden transition-[height] duration-300"
												style={{
													height: showPreview
														? "30vh"
														: "60vh",
												}}
											>
												<div className="flex-1 overflow-auto rounded border border-gray-300 p-[18px]">
													{isOrphanedComponent ? (
														<div className="flex h-full flex-col items-center justify-center gap-2 p-4">
															<h3 className="flex items-center gap-1 text-lg text-warning">
																Query No Longer
																Exists
															</h3>
															<p className="text-center text-muted-foreground text-sm">
																The query
																associated with
																this component
																has been
																deleted.
																<br />
																Please select a
																new query to
																continue.
															</p>
														</div>
													) : blockState &&
														blockId ? (
														<Blocks
															state={blockState}
															registry={
																DefaultBlocks
															}
														>
															<VisualizationBlockMenu
																id={blockId}
															/>
														</Blocks>
													) : (
														<div className="flex h-full items-center justify-center p-4">
															<p className="text-muted-foreground text-sm">
																{isLoadingPreviewData
																	? "Loading block..."
																	: "Select a query to configure the visualization"}
															</p>
														</div>
													)}
												</div>
											</div>
											{/* Block Preview section */}
											{showPreview &&
												blockState &&
												blockId &&
												!isOrphanedComponent && (
													<PreviewPanel
														mode="block"
														title="Preview"
														blockData={{
															blockState:
																blockState,
															blockId: blockId,
															registry:
																DefaultBlocks,
														}}
														height="30vh"
													/>
												)}
										</div>
									);
								}

								// HTML block
								if (
									isBlockComponent &&
									selectedComponentType === "html-block"
								) {
									return (
										<>
											<div
												className="flex flex-col overflow-hidden transition-[height] duration-300"
												style={{
													height: showPreview
														? "30vh"
														: "60vh",
												}}
											>
												<div className="flex-1 overflow-auto rounded border border-gray-300 p-[18px]">
													{isOrphanedComponent ? (
														<div className="flex h-full flex-col items-center justify-center gap-2 p-4">
															<h3 className="flex items-center gap-1 text-lg text-warning">
																Query No Longer
																Exists
															</h3>
															<p className="text-center text-muted-foreground text-sm">
																The query
																associated with
																this component
																has been
																deleted.
																<br />
																Please select a
																new query to
																continue.
															</p>
														</div>
													) : blockState &&
														blockId ? (
														<Blocks
															state={blockState}
															registry={
																DefaultBlocks
															}
														>
															<HTMLBlockMenu
																id={blockId}
															/>
														</Blocks>
													) : (
														<div className="flex h-full items-center justify-center p-4">
															<p className="text-muted-foreground text-sm">
																{isLoadingPreviewData
																	? "Loading block..."
																	: "Select a query to configure the HTML block"}
															</p>
														</div>
													)}
												</div>
											</div>
											{/* Block Preview section */}
											{showPreview &&
												blockState &&
												blockId &&
												!isOrphanedComponent && (
													<PreviewPanel
														mode="block"
														title="Preview"
														blockData={{
															blockState:
																blockState,
															blockId: blockId,
															registry:
																DefaultBlocks,
														}}
														height="30vh"
													/>
												)}
										</>
									);
								}

								// Visualization Filter block
								if (
									isBlockComponent &&
									selectedComponentType ===
										"visualization-filter-block"
								) {
									return (
										<>
											<div
												className="flex flex-col overflow-hidden transition-[height] duration-300"
												style={{
													height: showPreview
														? "30vh"
														: "60vh",
												}}
											>
												<div className="flex-1 overflow-auto rounded border border-gray-300 p-[18px]">
													{blockState && blockId ? (
														<Blocks
															state={blockState}
															registry={
																DefaultBlocks
															}
														>
															<VisualizationFilterMenu
																id={blockId}
															/>
														</Blocks>
													) : (
														<div className="flex h-full items-center justify-center p-4">
															<p className="text-muted-foreground text-sm">
																{isLoadingPreviewData
																	? "Loading block..."
																	: "Loading filter..."}
															</p>
														</div>
													)}
												</div>
											</div>
											{/* Block Preview section */}
											{showPreview &&
												blockState &&
												blockId &&
												!isOrphanedComponent && (
													<PreviewPanel
														mode="block"
														title="Preview"
														blockData={{
															blockState:
																blockState,
															blockId: blockId,
															registry:
																DefaultBlocks,
														}}
														height="30vh"
													/>
												)}
										</>
									);
								}

								// Fallback
								return (
									<div className="flex flex-1 flex-col items-center justify-center rounded border-2 border-gray-300 border-dashed p-8 text-center">
										<p className="text-muted-foreground text-sm">
											Component type "
											{selectedComponentType}" is not yet
											implemented.
										</p>
									</div>
								);
							})()}
						</>
					)}
				</div>

				{/* Action buttons */}
				<div className="flex flex-row justify-end gap-1">
					<Button variant="ghost" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							(selectedComponentType !== "html-block" &&
								selectedComponentType !==
									"visualization-filter-block" &&
								!selectedQuery) ||
							!selectedComponentType ||
							(getComponentType(selectedComponentType)
								?.category === "block" &&
								(!blockState || !blockId))
						}
					>
						{editingComponentId ? "Update" : "Save"} Component
					</Button>
				</div>
			</div>
		</Card>
	);
};
