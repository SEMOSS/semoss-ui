import { AppWindow, TriangleAlert, X } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActionMessages, type SerializedState } from "@semoss/renderer";
import type { FlexLayout } from "@semoss/shared";
import { Button, Card, Input, Label, Progress, toast } from "@semoss/ui/next";
import { uploadImage } from "@/api";
import type { AppMetadata } from "@/components/app";
import { useRootStore } from "@/hooks";
import type {
	BuilderValue,
	FilterParameter,
	SavedComponent,
	SavedQuery,
} from "../../insight.types";

interface TagInputProps {
	value: string[] | string | undefined;
	onChange: (value: string[]) => void;
	label: string;
	placeholder: string;
	testId?: string;
}

const TagInput = ({
	value,
	onChange,
	label,
	placeholder,
	testId,
}: TagInputProps) => {
	const [inputValue, setInputValue] = useState("");
	const selectedTags = (
		Array.isArray(value) ? value : value ? [value] : []
	).filter((tag) => typeof tag === "string" && tag.trim() !== "");

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (trimmed && !selectedTags.includes(trimmed)) {
			onChange([...selectedTags, trimmed]);
			setInputValue("");
		}
	};

	const removeTag = (tag: string) => {
		onChange(selectedTags.filter((t) => t !== tag));
	};

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
				{selectedTags.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-foreground text-sm"
					>
						{tag}
						<button
							type="button"
							onClick={(event) => {
								event.preventDefault();
								removeTag(tag);
							}}
							className="hover:opacity-70"
						>
							<X className="size-3" />
						</button>
					</span>
				))}
				<input
					type="text"
					value={inputValue}
					onChange={(event) => setInputValue(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							addTag(inputValue);
						}
					}}
					placeholder={placeholder}
					className="min-w-[100px] flex-1 bg-transparent text-sm outline-none"
					data-testid={testId}
				/>
			</div>
		</div>
	);
};

type CreateAppForm = {
	APP_NAME: string;
	APP_DESCRIPTION: string;
	APP_TAGS: string[];
	APP_IMG: File | null;
};

interface CreateAppStepProps {
	savedQueries: SavedQuery[];
	savedComponents: SavedComponent[];
	savedParameters: FilterParameter[];
	customLayout?: FlexLayout.IJsonModel | null;
	onAppCreated?: (appId: string) => void;
	editMode?: boolean;
	appMetadata?: {
		existingAppId?: string;
		appName?: string;
		appDescription?: string;
		appTags?: string[];
	};
}

export const CreateAppStep = (props: CreateAppStepProps) => {
	const {
		savedQueries,
		savedComponents,
		savedParameters,
		customLayout,
		onAppCreated,
		editMode = false,
		appMetadata,
	} = props;

	const { monolithStore, configStore } = useRootStore();

	const [isLoading, setIsLoading] = useState(false);

	const baseId = useId();

	// Check for orphaned components (components using deleted queries)
	const getOrphanedComponents = () => {
		const queryIds = new Set(savedQueries.map((q) => q.id));
		return savedComponents.filter((component) => {
			// HTML and filter blocks don't require queries
			if (
				component.componentType === "html-block" ||
				component.componentType === "visualization-filter-block"
			) {
				return false;
			}
			return !queryIds.has(component.queryId);
		});
	};

	const orphanedComponents = getOrphanedComponents();
	const hasOrphanedComponents = orphanedComponents.length > 0;

	/**
	 * Build the flex-layout configuration to support multiple sheets
	 */
	const buildLayoutConfig = (): FlexLayout.IJsonModel => {
		const componentTabs: FlexLayout.IJsonTabNode[] = [];

		// Add each component as a tab in the components tabset
		for (const component of savedComponents) {
			const query = savedQueries.find((q) => q.id === component.queryId);
			if (!query) continue;

			componentTabs.push({
				type: "tab",
				id: component.blockId || component.id,
				name: `${query.frameVariableName}-${component.id}`,
				component: "insight-component",
				enableClose: false,
				enableRename: true,
				config: {
					blockId: component.blockId,
					componentId: component.id,
					queryId: component.queryId,
					frameVariableName: query.frameVariableName,
				},
			});
		}

		return {
			global: {
				tabEnableClose: false,
				tabEnableRename: true,
				tabSetEnableTabStrip: true,
				tabSetEnableMaximize: false,
			},
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						id: "sheets-tabset",
						weight: 100,
						selected: 0,
						enableTabStrip: true,
						enableDrag: false,
						enableDrop: true,
						tabLocation: "bottom",
						children: [
							{
								type: "tab",
								id: "sheet-1",
								name: `sheet--1`,
								component: "sheet-container",
								enableClose: false,
								enableRename: true,
								enableDrag: true,
								config: {
									sheetId: "sheet-1",
									sheetName: `sheet--1`,
									componentTabs: componentTabs,
									innerLayout: null,
								},
							},
						],
					},
				],
			},
		};
	};

	/**
	 * Reconcile existing layout with current components
	 * - Remove tabs for deleted components
	 * - Update tabs for edited components
	 * - Add tabs for new components to the first sheet
	 * - Preserve layout structure and component positions
	 */
	const reconcileLayoutConfig = (
		existingLayout: FlexLayout.IJsonModel,
	): FlexLayout.IJsonModel => {
		// Build a map of current components by blockId
		const currentComponentsMap = new Map<
			string,
			{ component: SavedComponent; query: SavedQuery }
		>();

		for (const component of savedComponents) {
			const query = savedQueries.find((q) => q.id === component.queryId);
			if (query) {
				const key = component.blockId || component.id;
				currentComponentsMap.set(key, { component, query });
			}
		}

		// Process inner layout to update/remove component tabs
		const processInnerLayout = (innerLayout: unknown): void => {
			if (!innerLayout || typeof innerLayout !== "object") return;

			const layout = innerLayout as {
				type?: string;
				component?: string;
				id?: string;
				name?: string;
				config?: Record<string, unknown>;
				children?: unknown[];
				layout?: unknown;
			};

			// Process component tabs
			if (
				layout.type === "tab" &&
				layout.component === "insight-component"
			) {
				const blockId = layout.id;
				const componentData = blockId
					? currentComponentsMap.get(blockId)
					: null;

				if (componentData) {
					// Component exists - update it
					const { component, query } = componentData;
					layout.name = `${query.frameVariableName}-${component.id}`;
					layout.config = {
						blockId: component.blockId,
						componentId: component.id,
						queryId: component.queryId,
						frameVariableName: query.frameVariableName,
					};
					if (blockId) {
						// Mark as processed
						currentComponentsMap.delete(blockId);
					}
				} else {
					// Component was deleted - mark for removal
					(layout as { _shouldRemove?: boolean })._shouldRemove =
						true;
				}
			}

			// Process children
			if (layout.children && Array.isArray(layout.children)) {
				layout.children = layout.children.filter((child) => {
					processInnerLayout(child);
					return !(child as { _shouldRemove?: boolean })
						._shouldRemove;
				});
			}

			// Process nested layout
			if (layout.layout) {
				processInnerLayout(layout.layout);
			}
		};

		// Process all sheets in the layout
		const processLayout = (obj: unknown): void => {
			if (!obj || typeof obj !== "object") return;

			const layoutObj = obj as {
				type?: string;
				component?: string;
				config?: { innerLayout?: unknown };
				children?: unknown[];
				layout?: unknown;
			};

			// If this is a sheet container, process its inner layout
			if (
				layoutObj.component === "sheet-container" &&
				layoutObj.config?.innerLayout
			) {
				processInnerLayout(layoutObj.config.innerLayout);
			}

			// Recursively process children
			if (layoutObj.children && Array.isArray(layoutObj.children)) {
				for (const child of layoutObj.children) {
					processLayout(child);
				}
			}

			// Process nested layout
			if (layoutObj.layout) {
				processLayout(layoutObj.layout);
			}
		};

		// Process the entire layout
		processLayout(existingLayout);

		// Add remaining components (new ones) to the first sheet's first tabset
		if (currentComponentsMap.size > 0) {
			// Find the first sheet
			const findFirstSheet = (
				obj: unknown,
			): {
				config?: { innerLayout?: unknown };
			} | null => {
				if (!obj || typeof obj !== "object") return null;

				const node = obj as {
					type?: string;
					component?: string;
					config?: { innerLayout?: unknown };
					children?: unknown[];
					layout?: unknown;
				};

				if (
					node.type === "tab" &&
					node.component === "sheet-container"
				) {
					return node;
				}

				if (node.children && Array.isArray(node.children)) {
					for (const child of node.children) {
						const found = findFirstSheet(child);
						if (found) return found;
					}
				}

				if (node.layout) {
					return findFirstSheet(node.layout);
				}

				return null;
			};

			const firstSheet = findFirstSheet(existingLayout);

			if (firstSheet?.config?.innerLayout) {
				// Find the first tabset in the inner layout
				const findFirstTabset = (
					obj: unknown,
				): { children?: unknown[] } | null => {
					if (!obj || typeof obj !== "object") return null;

					const node = obj as {
						type?: string;
						children?: unknown[];
						layout?: unknown;
					};

					if (node.type === "tabset") return node;

					if (node.children && Array.isArray(node.children)) {
						for (const child of node.children) {
							const found = findFirstTabset(child);
							if (found) return found;
						}
					}

					if (node.layout) {
						return findFirstTabset(node.layout);
					}

					return null;
				};

				const firstTabset = findFirstTabset(
					firstSheet.config.innerLayout,
				);

				if (
					firstTabset?.children &&
					Array.isArray(firstTabset.children)
				) {
					// Add new components
					for (const [
						blockId,
						{ component, query },
					] of currentComponentsMap) {
						firstTabset.children.push({
							type: "tab",
							id: blockId,
							name: `${query.frameVariableName}-${component.id}`,
							component: "insight-component",
							enableClose: false,
							enableRename: true,
							config: {
								blockId: component.blockId,
								componentId: component.id,
								queryId: component.queryId,
								frameVariableName: query.frameVariableName,
							},
						});
					}
				}
			}
		}

		return existingLayout;
	};

	const { handleSubmit, control, watch } = useForm<CreateAppForm>({
		defaultValues: {
			APP_NAME: appMetadata?.appName || "",
			APP_DESCRIPTION: appMetadata?.appDescription || "",
			// Filter out "Insight" tag from default values - it's always added automatically
			APP_TAGS: (appMetadata?.appTags || []).filter(
				(tag) => tag !== "Insight",
			),
			APP_IMG: null,
		},
	});

	const watchAll = watch();

	const isFormValid = !!watchAll.APP_NAME;

	/**
	 * Get parameters that are actually used in queries
	 */
	const getUsedParameters = (): FilterParameter[] => {
		if (!savedParameters || savedParameters.length === 0) {
			return [];
		}

		// Find all parameter references in all queries
		const usedParamNames = new Set<string>();
		const paramPattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

		for (const query of savedQueries) {
			const matches = [...query.sqlQuery.matchAll(paramPattern)];
			for (const match of matches) {
				usedParamNames.add(match[1]);
			}
		}

		// Filter parameters to only those actually used
		return savedParameters.filter((p) => usedParamNames.has(p.name));
	};

	/**
	 * Generate block definition for a parameter
	 */
	const generateParameterBlock = (
		param: FilterParameter,
		index: number,
	): Record<string, unknown> => {
		const blockId = `${param.inputType}--${index + 1}`;
		// Base block structure
		const baseBlock = {
			id: blockId,
			parent: {
				id: "container--1",
				slot: "children",
			},
			data: {
				style: {
					width: "100%",
					padding: "4px",
					marginBottom: "0px",
				},
				label: param.label || param.name,
				hint: param.hint || "",
				required: param.required || false,
				disabled: false,
				loading: false,
				show: "true",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {
				content: {
					name: "content",
					children: [],
				},
			},
			communityBlockMapping: {},
		};

		// Configure based on input type
		switch (param.inputType) {
			case "text":
			case "number":
			case "date":
				return {
					...baseBlock,
					widget: "input",
					data: {
						...baseBlock.data,
						value: param.defaultValue || "",
						type: param.inputType,
						rows: 1,
						multiline: false,
					},
					listeners: {
						...baseBlock.listeners,
						onChange: {
							type: "sync",
							order: [],
						},
					},
				};

			case "radio":
				return {
					...baseBlock,
					widget: "radio",
					data: {
						...baseBlock.data,
						value: param.defaultValue || "",
						options: param.options || [],
						direction: param.direction || "column",
						color: "secondary",
						size: "medium",
					},
					listeners: {
						...baseBlock.listeners,
						onChange: {
							type: "sync",
							order: [],
						},
					},
				};

			case "select": {
				// Check if parameter has SQL query configured
				const hasSqlQuery = !!(
					param.parameterDatabaseId && param.parameterSqlQuery
				);
				const notebookId = hasSqlQuery
					? `${param.name}-options-list`
					: null;

				return {
					...baseBlock,
					widget: "select",
					data: {
						...baseBlock.data,
						value: param.defaultValue || "",
						// Use notebook output if SQL configured, otherwise use manual options
						options: hasSqlQuery
							? `${notebookId}.2.output`
							: param.selectOptions || [],
						// Include column mapping for SQL-based options
						...(hasSqlQuery && {
							optionLabel: param.optionLabel,
							optionValue: param.optionValue,
							optionSublabel: param.optionSublabel,
							loading: `{{${notebookId}.isLoading}}`,
						}),
						multiple: param.multiple || false,
						color: "secondary",
						size: "medium",
					},
					listeners: {
						...baseBlock.listeners,
						onChange: {
							type: "sync",
							order: [],
						},
					},
				};
			}

			case "toggle":
				return {
					...baseBlock,
					widget: "switch",
					data: {
						...baseBlock.data,
						value: param.defaultValue || false,
						color: "secondary",
						size: "medium",
					},
				};

			default:
				// Fallback to text input
				return {
					...baseBlock,
					widget: "input",
					data: {
						...baseBlock.data,
						value: param.defaultValue || "",
						type: "text",
					},
				};
		}
	};

	/**
	 * Build the app state with queries and block components
	 */
	const buildAppState = (
		appName: string,
		appId?: string,
	): SerializedState => {
		const usedParameters = getUsedParameters();
		const needsParameterPage = usedParameters.length > 0;
		const queriesNotebookId = `${appName}-queries`;

		// Dashboard page name depends on whether we have a parameter page
		const dashboardPageId = needsParameterPage ? "page-2" : "page-1";
		const dashboardRoute = needsParameterPage ? "page-2" : "";

		const state: SerializedState = {
			version: "1.0.0-alpha.7",
			executionOrder: [],
			variables: {},
			queries: {},
			blocks: {},
		};

		// If parameters are used, create parameter input page as page-1
		if (needsParameterPage) {
			// Generate parameter blocks
			const parameterBlockChildren: string[] = [];
			const requiredParameterBlockIds: string[] = [];
			const parameterNotebooks: string[] = [];

			usedParameters.forEach((param, index) => {
				const block = generateParameterBlock(param, index);
				const blockId = block.id as string;
				state.blocks[blockId] = block as unknown as {
					id: string;
					widget: string;
					parent?: { id: string; slot: string } | null;
					data: Record<string, unknown>;
					listeners: Record<
						string,
						{ order: never[]; type: "sync" | "async" }
					>;
					slots: Record<string, { name: string; children: string[] }>;
					communityBlockMapping?: Record<string, string>;
				};
				parameterBlockChildren.push(blockId);

				// Track req paramater blocks for button validation
				if (param.required) {
					requiredParameterBlockIds.push(blockId);
				}

				// Add variable for the parameter block
				state.variables[param.name] = {
					type: "block",
					to: blockId,
				};

				// Create notebook for SQL-configured select parameters
				if (
					param.inputType === "select" &&
					param.parameterDatabaseId &&
					param.parameterSqlQuery
				) {
					const notebookId = `${param.name}-options-list`;
					const frameName = `${param.name}`;

					// Create notebook with 2 cells
					const cell1Code = `Database(database=["${param.parameterDatabaseId}"]) | Query("<encode>${param.parameterSqlQuery}</encode>") | Import(frame=[CreateFrame(frameType=["NATIVE"], override=[true]).as(["${frameName}"])]);`;
					const cell2Code = `Frame(frame=["${frameName}"]) | QueryAll() | Limit(-1) | CollectAll();`;

					state.queries[notebookId] = {
						id: notebookId,
						cells: [
							{
								id: "cell-1",
								widget: "code",
								parameters: {
									type: "pixel",
									code: cell1Code,
								},
							},
							{
								id: "cell-2",
								widget: "code",
								parameters: {
									type: "pixel",
									code: cell2Code,
								},
							},
						],
					};

					// Add notebook to variables
					state.variables[notebookId] = {
						type: "query",
						to: notebookId,
					};

					// Track notebook for page load execution
					parameterNotebooks.push(notebookId);
				}
			});

			state.blocks["page-1"] = {
				id: "page-1",
				widget: "page",
				parent: null,
				data: {
					route: "",
					style: {
						padding: "24px",
						fontFamily: "roboto",
						flexDirection: "column",
						display: "flex",
						gap: "8px",
					},
				},
				listeners: {
					onPageLoad: {
						type: "sync",
						// Add parameter notebooks to onPageLoad to populate select options
						order: parameterNotebooks.map((notebookId) => {
							return {
								message:
									ActionMessages.RUN_QUERY as typeof ActionMessages.RUN_QUERY,
								payload: {
									queryId: notebookId,
								},
							};
						}),
					},
				},
				slots: {
					content: {
						name: "content",
						children: ["container--1"],
					},
				},
			};

			// Main container for parameters
			state.blocks["container--1"] = {
				id: "container--1",
				widget: "container",
				parent: {
					id: "page-1",
					slot: "content",
				},
				data: {
					style: {
						position: "relative",
						display: "flex",
						flexDirection: "column",
						padding: "8px",
						gap: "8px",
						width: "100%",
						height: "100%",
						overflow: "hidden",
						flexWrap: "wrap",
					},
					type: "custom",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: [...parameterBlockChildren, "container--2"],
					},
				},
			};

			// Button container
			state.blocks["container--2"] = {
				id: "container--2",
				widget: "container",
				parent: {
					id: "container--1",
					slot: "children",
				},
				data: {
					style: {
						display: "flex",
						flexDirection: "column",
						padding: "4px",
						gap: "0px",
						flexWrap: "wrap",
						marginBottom: "0px",
						alignItems: "center",
					},
					show: "true",
					loading: false,
					loadType: "Skeleton",
					boxShadowParts: {
						offsetX: "",
						offsetY: "",
						blurRadius: "",
						spreadRadius: "",
						color: "",
					},
					type: "custom",
				},
				listeners: {
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {
					children: {
						name: "children",
						children: ["button--1"],
					},
				},
			};

			// Execute button
			state.blocks["button--1"] = {
				id: "button--1",
				widget: "button",
				parent: {
					id: "container--2",
					slot: "children",
				},
				data: {
					style: {
						marginBottom: "0px",
					},
					label: "Execute",
					loading: false,
					disabled: false,
					variant: "contained",
					color: "primary",
					show: true,
					type: "button",
					requiredBlocks: requiredParameterBlockIds,
				},
				listeners: {
					onClick: {
						type: "sync",
						order: [
							{
								message: ActionMessages.DISPATCH_OPEN_EVENT,
								payload: {
									destinationType: "Internal",
									destination: "page-2",
								},
							},
						],
					},
					preProcess: {
						type: "sync",
						order: [],
					},
				},
				slots: {},
			};
		}

		// Create dashboard page (page-1 if no parameters, page-2 if parameters exist)
		state.blocks[dashboardPageId] = {
			id: dashboardPageId,
			widget: "page",
			parent: null,
			data: {
				route: dashboardRoute,
				style: {
					padding: "8px",
					fontFamily: "roboto",
					flexDirection: "column",
					display: "flex",
					gap: "8px",
				},
				loading: `{{${queriesNotebookId}.isLoading}}`,
			},
			listeners: {
				onPageLoad: {
					type: "sync",
					order: [
						{
							message:
								ActionMessages.RUN_QUERY as typeof ActionMessages.RUN_QUERY,
							payload: {
								queryId: queriesNotebookId,
							},
						},
					],
				},
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {
				content: {
					name: "content",
					children: ["layout-container"],
				},
			},
		};

		state.blocks["layout-container"] = {
			id: "layout-container",
			widget: "container",
			parent: {
				id: dashboardPageId,
				slot: "content",
			},
			data: {
				style: {
					display: "flex",
					flexDirection: "column",
					padding: "8px",
					gap: "8px",
					flexShrink: 0,
					height: "100%",
				},
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {
				children: {
					name: "children",
					children: ["flex-layout--1"],
				},
			},
		};

		state.blocks["flex-layout--1"] = {
			id: "flex-layout--1",
			widget: "flex-layout",
			parent: {
				id: dashboardPageId,
				slot: "content",
			},
			data: {
				style: {
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					padding: "0px",
					gap: "0px",
				},
				appId: appId || "",
				show: "true",
			},
			listeners: {
				preProcess: {
					type: "sync",
					order: [],
				},
			},
			slots: {},
		};

		// Build query cells for all queries
		const queryCells: Array<{
			id: string;
			widget: string;
			parameters: { type: string; code: string };
		}> = [];

		// Track which queries have been added to avoid duplicates
		const addedQueryIds = new Set<string>();

		// Add queries and store component blocks for flex-layout rendering
		for (const component of savedComponents) {
			// Check if component requires a query
			// HTML and filter blocks don't need queries
			const needsQuery =
				component.componentType !== "html-block" &&
				component.componentType !== "visualization-filter-block";

			// Find query if component needs one
			const query = component.queryId
				? savedQueries.find((q) => q.id === component.queryId)
				: null;

			// Skip if component needs a query but doesn't have one
			if (needsQuery && !query) {
				console.warn(
					`Component ${component.id} requires a query but none found`,
				);
				continue;
			}

			// Add query cell if query exists
			if (query) {
				const frameType = query.frameType || "NATIVE";
				const frameName = query.frameVariableName;

				// Only add each unique query once
				if (!addedQueryIds.has(query.id)) {
					queryCells.push({
						id: `cell-${query.id}`,
						widget: "code",
						parameters: {
							type: "pixel",
							code: `Database(database=["${query.databaseId}"]) | Query("<encode>${query.sqlQuery}</encode>") | Import(frame=[CreateFrame(frameType=["${frameType}"], override=[true]).as(["${frameName}"])]);`,
						},
					});
					addedQueryIds.add(query.id);
				}
			}

			// Add component blocks to state (will be rendered by flex-layout)
			if (component.blockState && component.blockId) {
				const blockState = component.blockState;

				// Add all blocks from the component's block state
				if (blockState.blocks) {
					for (const [blockId, block] of Object.entries(
						blockState.blocks,
					)) {
						// Store blocks without parent assignment (flex-layout will handle rendering)
						state.blocks[blockId] = {
							...block,
							parent: null,
						};
					}
				}
			}
		}

		// Create the queries notebook
		state.queries[queriesNotebookId] = {
			id: queriesNotebookId,
			cells: queryCells,
		};

		// Add queries notebook as a variable
		state.variables[queriesNotebookId] = {
			type: "query",
			to: queriesNotebookId,
		};

		return state;
	};

	/**
	 * Method that is called to create or update the app
	 */
	const onSubmit = handleSubmit(async (data: CreateAppForm) => {
		let appId = appMetadata?.existingAppId || "";
		try {
			// start the loading screen
			setIsLoading(true);

			if (editMode && appMetadata?.existingAppId) {
				// Update existing app
				appId = appMetadata.existingAppId;

				// Build the updated state
				const updatedState = buildAppState(data.APP_NAME, appId);

				// Load existing layout and reconcile with current components
				let layoutConfig: FlexLayout.IJsonModel;

				// Use custom layout if provided, otherwise load existing or build default
				if (customLayout) {
					// User customized the layout in LayoutBuilderStep
					layoutConfig = customLayout;
				} else {
					try {
						const layoutResponse = await monolithStore.runQuery<
							[string]
						>(
							`GetAppAssets(filePath=["/portals/default-layout.json"], project=["${appId}"]);`,
						);

						if (layoutResponse?.pixelReturn?.[0]?.output) {
							const output = layoutResponse.pixelReturn[0].output;
							const existingLayout =
								typeof output === "string"
									? JSON.parse(output)
									: output;

							// Reconcile existing layout with current components
							layoutConfig =
								reconcileLayoutConfig(existingLayout);
						} else {
							// No existing layout found, create new one
							layoutConfig = buildLayoutConfig();
						}
					} catch (err) {
						console.error("Error loading existing layout:", err);
						// Fallback to creating new layout
						layoutConfig = buildLayoutConfig();
					}
				}

				// Save blocks
				const updatePixel = `SaveAppBlocksJson(project=["${appId}"], json=["<encode>${JSON.stringify(updatedState)}</encode>"]);`;
				await monolithStore.runQuery(updatePixel);

				// Save updated layout
				const defaultLayoutPixel = `SaveAppAssets(project=["${appId}"], filePath=["/portals/default-layout.json"], content=["<encode>${JSON.stringify(layoutConfig, null, 2)}</encode>"]);`;
				await monolithStore.runQuery(defaultLayoutPixel);
			} else {
				// Create new app
				// Build the app state
				const state = buildAppState(data.APP_NAME);

				// Create the pixel using CreateAppFromBlocks
				const pixel = `CreateAppFromBlocks(project=["${data.APP_NAME}"], json=["<encode>${JSON.stringify(state)}</encode>"]);`;

				// create the project
				const { errors, pixelReturn } =
					await monolithStore.runQuery<[AppMetadata]>(pixel);

				if (errors.length > 0) {
					throw new Error(errors.join(","));
				}

				appId = pixelReturn[0].output.project_id;

				// Now update the app state with the correct edit URL and save layout
				const updatedState = buildAppState(data.APP_NAME, appId);

				// Use custom layout if provided, otherwise build default
				const layoutConfig = customLayout || buildLayoutConfig();

				// Save blocks
				const updatePixel = `SaveAppBlocksJson(project=["${appId}"], json=["<encode>${JSON.stringify(updatedState)}</encode>"]);`;
				await monolithStore.runQuery(updatePixel);

				// Save default layout
				const defaultLayoutPixel = `SaveAppAssets(project=["${appId}"], filePath=["/portals/default-layout.json"], content=["<encode>${JSON.stringify(layoutConfig, null, 2)}</encode>"]);`;
				await monolithStore.runQuery(defaultLayoutPixel);
			}

			// upload the image
			if (data.APP_IMG && appId) {
				await uploadImage(
					[data.APP_IMG],
					appId,
					configStore.store.insightID,
				);
			}

			// Set project metadata (always include insight builder data)
			const metadata: Record<string, BuilderValue | string[] | string> = {
				// insightQueries: savedQueries,
				// insightComponents: savedComponents,
			};

			// Always include "Insight" tag as first tag to identify insight builder apps
			const insightTag = "Insight";
			const userTags = data.APP_TAGS || [];
			// Remove "Insight" if user added it, then prepend to ensure it's always first
			const filteredUserTags = userTags.filter(
				(tag) => tag !== insightTag,
			);
			metadata.tag = [insightTag, ...filteredUserTags];

			if (data.APP_DESCRIPTION) {
				metadata.description = data.APP_DESCRIPTION;
			}

			const setProjectMetadataResponse = await monolithStore.runQuery(
				`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
					metadata,
				)}])`,
			);

			const output = setProjectMetadataResponse.pixelReturn[0].output;
			const operationType =
				setProjectMetadataResponse.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") > -1) {
				toast.error(String(output));
			}

			toast.success(
				editMode
					? `App "${data.APP_NAME}" updated successfully with ${savedComponents.length} components!`
					: `App "${data.APP_NAME}" created successfully with ${savedComponents.length} components!`,
			);

			if (onAppCreated) {
				onAppCreated(appId);
			}
		} catch (e) {
			console.error(e);

			toast.error(
				e instanceof Error
					? e.message
					: editMode
						? "Error updating app"
						: "Error creating app",
			);
		} finally {
			// stop the loading screen
			setIsLoading(false);
		}
	});

	return (
		<Card className="flex h-full flex-col p-6">
			<div className="flex flex-row items-center gap-1">
				<h2 className="font-semibold text-lg">
					{editMode ? "Update App" : "Create App"}
				</h2>
				<AppWindow className="size-6" />
			</div>
			<p className="mb-3 text-muted-foreground text-sm">
				{editMode ? "Update" : "Create"} a notebook application with{" "}
				{savedComponents.length} component
				{savedComponents.length !== 1 ? "s" : ""} and{" "}
				{savedQueries.length} quer
				{savedQueries.length !== 1 ? "ies" : "y"}
			</p>

			{hasOrphanedComponents && (
				<div className="mb-2 flex items-start gap-1 rounded border border-yellow-400 bg-yellow-50 p-2">
					<TriangleAlert className="mt-0.5 size-5 text-yellow-600" />
					<div>
						<p className="font-bold text-sm">
							Warning: Orphaned Components Detected
						</p>
						<p className="mt-0.5 text-sm">
							{orphanedComponents.length} component
							{orphanedComponents.length !== 1 ? "s are" : " is"}{" "}
							using deleted queries:{" "}
							{orphanedComponents
								.map(
									(comp) =>
										comp.componentType +
										" (" +
										comp.frameVariableName +
										")",
								)
								.join(", ")}
							. Please delete these components or recreate the
							queries before creating the app.
						</p>
					</div>
				</div>
			)}

			<form onSubmit={onSubmit} className="flex flex-1 flex-col gap-2">
				<div className="flex flex-1 flex-col gap-2">
					<Controller
						name={"APP_NAME"}
						control={control}
						rules={{ required: true }}
						render={({ field }) => {
							return (
								<div>
									<Label htmlFor="app-name">App Name</Label>
									<Input
										id={`app-name-${baseId}`}
										value={field.value ? field.value : ""}
										disabled={isLoading}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
									/>
								</div>
							);
						}}
					/>
					<Controller
						name={"APP_DESCRIPTION"}
						control={control}
						rules={{ required: false }}
						render={({ field }) => (
							<div className="space-y-2">
								<Label htmlFor={`app-description-${baseId}`}>
									Description
								</Label>
								<textarea
									id={`app-description-${baseId}`}
									className="flex max-h-[72px] min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
									value={field.value ?? ""}
									onChange={(event) =>
										field.onChange(event.target.value)
									}
									placeholder="Please provide a description for this app to help others find it and understand how to use it."
								/>
							</div>
						)}
					/>
					<Controller
						name={"APP_TAGS"}
						control={control}
						rules={{}}
						render={({ field }) => (
							<TagInput
								value={field.value}
								onChange={(value) => {
									// Filter out "Insight" tag - it's added automatically
									const filtered = value.filter(
										(tag) => tag !== "Insight",
									);
									field.onChange(filtered);
								}}
								label="Tags"
								placeholder="Press enter to add tags"
								testId="app-tags"
							/>
						)}
					/>
					<Controller
						name={"APP_IMG"}
						control={control}
						rules={{}}
						render={({ field }) => (
							<div className="space-y-2">
								<Label htmlFor={`app-image-${baseId}`}>
									Image
								</Label>
								<Input
									id={`app-image-${baseId}`}
									type="file"
									accept="image/*"
									disabled={isLoading}
									onChange={(event) => {
										const value = (
											event.target as HTMLInputElement
										).files;
										if (value && value.length > 0) {
											field.onChange(value[0]);
										}
									}}
								/>
							</div>
						)}
					/>
				</div>

				<div className="flex flex-row justify-end gap-1">
					<Button
						type="submit"
						disabled={
							isLoading || !isFormValid || hasOrphanedComponents
						}
					>
						{isLoading
							? editMode
								? "Updating..."
								: "Creating..."
							: editMode
								? "Update App"
								: "Create App"}
					</Button>
				</div>
			</form>

			{isLoading && <Progress value={undefined} className="w-full" />}
		</Card>
	);
};
