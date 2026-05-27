import { ArrowLeftRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { runPixel } from "@semoss/sdk/react";
import { FlexLayout, getUserProjectPermission } from "@semoss/shared";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Spinner,
} from "@semoss/ui/next";
import type { Role } from "@/types/types";
import { useBlock, useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type BlockComponent,
	type BlockDef,
	type ListenerActions,
} from "../../../store";
import { RendererEngine } from "../../blocks";

const layoutButtonContainerStyles: CSSProperties = {
	position: "relative",
	right: "8px",
};

const blockStyles: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	minHeight: "90vh",
};

// Base container styles for inline style attribute
const layoutContainerStyles: CSSProperties = {
	flex: 1,
	width: "100%",
	position: "relative",
	minHeight: 0,
};

// FlexLayout custom CSS styles
const flexLayoutCustomStyles = `
	/* Ensure FlexLayout library's root element has height for absolute positioning */
	.flexlayout__theme_smss .flexlayout__layout {
		height: 100%;
	}

	/* Get rid of padding around tabsets */
	.flexlayout__theme_smss .flexlayout__tabset_tabbar_outer {
		padding: 0px;
	}

	/* Component tabs (top tabset) styling */
	.flexlayout__theme_smss .flexlayout__tab_button_top {
		border: 1px solid #ddd;
		border-bottom: none;
		border-radius: 8px 8px 0 0;
		background-color: #f5f5f5;
		margin-right: 2px;
		padding: 8px 12px;
		position: relative;
		bottom: -1px;
	}

	/* Component Tab padding to connect tabs to content */
	.flexlayout__theme_smss .flexlayout__tabset_tabbar_outer_top {
		padding-top: 15px;
		padding-right: 0px;
	}

	/* Sheet tabs (bottom) styling */
	.flexlayout__theme_smss .flexlayout__tab_button_bottom {
		border: 1px solid #ddd;
		border-top: none;
		border-radius: 0 0 8px 8px;
		background-color: #f5f5f5;
		margin-right: 2px;
		padding: 8px 12px;
		position: relative;
		top: -1px;
	}

	/* Sheet Tab padding to connect tabs to content */
	.flexlayout__theme_smss .flexlayout__tabset_tabbar_outer_bottom {
		padding: 0px;
	}

	/* Component tabs selected state */
	.flexlayout__theme_smss .flexlayout__tab_button_top.flexlayout__tab_button--selected {
		background-color: #fff;
		border-bottom-color: transparent;
		z-index: 1;
	}

	/* Component tabs content area - add top border to connect with tabs */
	.flexlayout__theme_smss .flexlayout__tabset_tabbar_outer_top + .flexlayout__tabset_content {
		border-top: 1px solid #ddd;
	}

	/* Sheet tabs selected state */
	.flexlayout__theme_smss .flexlayout__tab_button_bottom.flexlayout__tab_button--selected {
		background-color: #fff;
		border-top-color: transparent;
		z-index: 1;
	}

	/* Sheet tabs content area - add bottom border to connect with tabs */
	.flexlayout__theme_smss .flexlayout__tabset_content + .flexlayout__tabset_tabbar_outer_bottom {
		border-top: 1px solid #ddd;
	}

	/* Remove gap between tabs */
	.flexlayout__theme_smss .flexlayout__tabset_tab_divider {
		width: 0px;
	}

	.flexlayout__theme_smss .flexlayout__tab_toolbar_sticky_buttons_container {
		padding-bottom: 20px;
	}

	/* PII tabs - red hue styling (using :has selector to target parent button) */
	.flexlayout__theme_smss .flexlayout__tab_button_top:has([data-pii='true']) {
		background-color: #ffe6e6;
		border-color: #ffcccc;
	}

	/* PII tabs selected state - stronger red hue */
	.flexlayout__theme_smss .flexlayout__tab_button_top.flexlayout__tab_button--selected:has([data-pii='true']) {
		background-color: #ffcccc;
		border-color: #ff9999;
	}
`;

export interface FlexLayoutBlockDef extends BlockDef<"flex-layout"> {
	widget: "flex-layout";
	data: {
		style: CSSProperties;
		appId: string;
		show: string;
	};
	slots: never;
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const FlexLayoutBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<FlexLayoutBlockDef>(id);
	const { state } = useBlocks();
	const [layoutModel, setLayoutModel] = useState<FlexLayout.Model | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [userRole, setUserRole] = useState<Role | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const hasLoadedDefault = useRef(false);
	// Store references to inner sheet models
	const sheetModelsRef = useRef<Map<string, FlexLayout.Model>>(new Map());
	// State for move to sheet menu
	const [moveMenuAnchor, setMoveMenuAnchor] = useState<{
		element: HTMLElement;
		tabId: string;
		currentSheetId: string;
	} | null>(null);

	const loadPermissions = useCallback(async () => {
		if (!data.appId) return;

		try {
			const response: Role = await getUserProjectPermission(data.appId);

			if (response) {
				const permissionData = response;
				setUserRole(permissionData);
			}
		} catch (err) {
			console.error("Error loading permissions:", err);
		}
	}, [data.appId]);

	const backToFiltersDestination = useMemo(() => {
		const pageOneBlock = state.getBlock("page-1");

		if (pageOneBlock && typeof pageOneBlock.data?.route === "string") {
			return pageOneBlock.data.route;
		}

		// Fallback for legacy apps that may use page id as destination.
		return "page-1";
	}, [state]);

	const showBackToFiltersButton = useMemo(() => {
		const pages = state.getAllBlocksOfType("page");

		if (pages.length <= 1) {
			return false;
		}

		const buttons = state.getAllBlocksOfType("button");

		return buttons.some((buttonBlock) => {
			const onClickActions = buttonBlock.listeners?.onClick?.order;

			if (!Array.isArray(onClickActions)) {
				return false;
			}

			return onClickActions.some((action) => {
				const payload = action.payload as {
					destinationType?: unknown;
					destination?: unknown;
				};

				return (
					action.message === ActionMessages.DISPATCH_OPEN_EVENT &&
					payload.destinationType === "Internal" &&
					payload.destination === "page-2"
				);
			});
		});
	}, [state]);

	const handleBackToFilters = useCallback(() => {
		state.dispatch({
			message: ActionMessages.DISPATCH_OPEN_EVENT,
			payload: {
				destinationType: "Internal",
				destination: backToFiltersDestination,
			},
		});
	}, [backToFiltersDestination, state]);

	// Handle saving layout
	const handleSaveLayout = useCallback(async () => {
		if (!data.appId || !layoutModel) return;

		try {
			setIsSaving(true);

			// Update each sheet tab's config with its current inner layout
			const sheetsTabset = layoutModel.getNodeById("sheets-tabset");

			if (sheetsTabset) {
				const sheetTabs = sheetsTabset.getChildren();
				// For each sheet tab, get the corresponding inner model (componet tabs
				// from the ref & update the tab's config
				for (const sheetTab of sheetTabs) {
					const tabNode = sheetTab as FlexLayout.TabNode;
					const sheetId = tabNode.getConfig()?.sheetId;

					if (sheetId) {
						const innerModel = sheetModelsRef.current.get(sheetId);

						if (innerModel) {
							const innerLayoutJson = innerModel.toJson();

							// Update the config with the current inner layout
							layoutModel.doAction(
								FlexLayout.Actions.updateNodeAttributes(
									tabNode.getId(),
									{
										config: {
											...tabNode.getConfig(),
											innerLayout: innerLayoutJson,
										},
									},
								),
							);
						}
					}
				}
			}

			// Get the updated layout JSON after config updates
			const updatedLayoutJson = layoutModel.toJson();

			const layoutString = JSON.stringify(updatedLayoutJson);

			const response = await runPixel(
				`SaveAppAssets(project=["${data.appId}"], filePath=["/portals/default-layout.json"], content=["<encode>${layoutString}</encode>"]);`,
				state.insightId,
			);

			if (response?.errors && response.errors.length > 0) {
				throw new Error(response.errors.join(", "));
			}
		} catch (err) {
			console.error("Error saving layout:", err);
		} finally {
			setIsSaving(false);
		}
	}, [data.appId, layoutModel, state.insightId]);

	// Load layout from the app (always grab from default-layout.json)
	const loadLayout = useCallback(async () => {
		if (!data.appId) {
			setError("No app ID provided");
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			let layoutData = null;

			// Load the layout.json
			const defaultResponse = await runPixel<[string]>(
				`GetAppAssets(filePath=["/portals/default-layout.json"], project=["${data.appId}"]);`,
				state.insightId,
			);

			if (defaultResponse?.pixelReturn?.[0]?.output) {
				const output = defaultResponse.pixelReturn[0].output;
				// Parse the JSON string response
				layoutData =
					typeof output === "string" ? JSON.parse(output) : output;

				if (layoutData && typeof layoutData === "object") {
					// Clear any existing sheet models before loading new layout
					sheetModelsRef.current.clear();

					// Parse the layout JSON and create FlexLayout model
					const model = FlexLayout.Model.fromJson(
						layoutData as unknown as FlexLayout.IJsonModel,
					);
					setLayoutModel(model);
					hasLoadedDefault.current = true;
				} else {
					setError("Invalid layout data");
					console.error("Invalid layout data");
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [data.appId, state]);

	// Load layout on mount
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
		loadLayout();
		loadPermissions();
	}, [loadLayout, loadPermissions, listeners.preProcess]);

	// Add close button for sheets and move button for components
	const onRenderTab = useCallback(
		(
			node: FlexLayout.TabNode,
			renderValues: FlexLayout.ITabRenderValues,
		) => {
			const component = node.getComponent();

			// Handle sheet tabs - add close button
			if (component === "sheet-container") {
				// Only add close button if this is not the first sheet (sheet-1)
				const tabId = node.getId();
				if (tabId !== "sheet-1") {
					// Add a close button to the tab itself
					renderValues.buttons?.push(
						<button
							key="close-sheet"
							type="button"
							className="flexlayout__tab_button_trailing"
							title="Close Sheet"
							aria-label="Close Sheet"
							onClick={(e) => {
								e.stopPropagation();
								if (!layoutModel) return;

								// Before deleting, move all components to sheet-1
								const sheetId = node.getConfig()?.sheetId;

								if (sheetId) {
									const closingSheetModel =
										sheetModelsRef.current.get(sheetId);
									const sheet1Model =
										sheetModelsRef.current.get("sheet-1");

									if (closingSheetModel && sheet1Model) {
										// Find sheet-1's tabset
										let sheet1TabsetId = "";
										sheet1Model.visitNodes((visitNode) => {
											if (
												visitNode.getType() ===
													"tabset" &&
												!sheet1TabsetId
											) {
												sheet1TabsetId =
													visitNode.getId();
											}
										});

										if (sheet1TabsetId) {
											// Collect all component tabs from closing sheet
											const componentTabsToMove: FlexLayout.IJsonTabNode[] =
												[];
											closingSheetModel.visitNodes(
												(visitNode) => {
													if (
														visitNode.getType() ===
														"tab"
													) {
														const visitTabNode =
															visitNode as FlexLayout.TabNode;
														if (
															visitTabNode.getComponent() ===
															"insight-component"
														) {
															componentTabsToMove.push(
																visitTabNode.toJson() as FlexLayout.IJsonTabNode,
															);
														}
													}
												},
											);

											// Move each component to sheet-1
											for (const tabJson of componentTabsToMove) {
												sheet1Model.doAction(
													FlexLayout.Actions.addNode(
														tabJson,
														sheet1TabsetId,
														FlexLayout.DockLocation
															.CENTER,
														-1,
														false,
													),
												);
											}

											// Update sheet-1's model in ref
											sheetModelsRef.current.set(
												"sheet-1",
												sheet1Model,
											);
										}
									}

									// Remove the closing sheet's model from ref
									sheetModelsRef.current.delete(sheetId);
								}

								// Now remove the sheet from the model
								layoutModel.doAction(
									FlexLayout.Actions.deleteTab(tabId),
								);
							}}
						>
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="currentColor"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<path d="M6 4.586L9.293 1.293a1 1 0 0 1 1.414 1.414L7.414 6l3.293 3.293a1 1 0 0 1-1.414 1.414L6 7.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L4.586 6 1.293 2.707a1 1 0 0 1 1.414-1.414L6 4.586z" />
							</svg>
						</button>,
					);
				}
			}

			// Add move to sheet button
			if (component === "insight-component") {
				const tabId = node.getId();
				const config = node.getConfig();
				const hasPII = config?.hasPII || false;

				// Apply PII styling by modifying the content wrapper
				if (hasPII && renderValues.content) {
					// Wrap content to add data attribute for CSS targeting
					const originalContent = renderValues.content;
					renderValues.content = (
						<span data-pii="true" style={{ display: "contents" }}>
							{originalContent}
						</span>
					);
				}
				// Find which sheet this component belongs to
				let currentSheetId = "";
				if (layoutModel) {
					layoutModel.visitNodes((visitNode) => {
						if (
							visitNode.getType() === "tab" &&
							(
								visitNode as FlexLayout.TabNode
							).getComponent?.() === "sheet-container"
						) {
							const sheetTab = visitNode as FlexLayout.TabNode;
							const sheetId = sheetTab.getConfig()?.sheetId;
							if (sheetId) {
								const innerModel =
									sheetModelsRef.current.get(sheetId);
								if (innerModel) {
									// Check if this inner model contains our component tab
									const componentNode =
										innerModel.getNodeById(tabId);
									if (componentNode) {
										currentSheetId = sheetId;
									}
								}
							}
						}
					});
				}

				// Add move to sheet button
				renderValues.buttons?.push(
					<button
						key="move-to-sheet"
						type="button"
						className="flexlayout__tab_button_trailing"
						title="Move to Sheet"
						aria-label="Move to Sheet"
						onClick={(e) => {
							e.stopPropagation();
							setMoveMenuAnchor({
								element: e.currentTarget as HTMLElement,
								tabId: tabId,
								currentSheetId: currentSheetId,
							});
						}}
					>
						<ArrowLeftRight className="size-4" />
					</button>,
				);
			}
		},
		[layoutModel],
	);

	// Factory function to render components
	const factory = useCallback(
		(node: FlexLayout.TabNode) => {
			const component = node.getComponent();
			const config = node.getConfig();

			// Renders inner tabset with components
			if (component === "sheet-container") {
				const componentTabs = config?.componentTabs || [];
				const savedInnerLayout = config?.innerLayout;
				const sheetId = config?.sheetId || "sheet-unknown";

				// Check if we already have a model for this sheet
				let sheetModel = sheetModelsRef.current.get(sheetId);

				if (!sheetModel) {
					// Create new model only if we don't have one yet
					let sheetLayoutJson: FlexLayout.IJsonModel;

					if (savedInnerLayout) {
						// Use the previously saved inner layout
						sheetLayoutJson = savedInnerLayout;
					} else {
						// Create initial inner layout model for this sheet
						sheetLayoutJson = {
							global: {
								tabEnableClose: false,
								tabEnableRename: true,
							},
							borders: [],
							layout: {
								type: "row",
								weight: 100,
								children: [
									{
										type: "tabset",
										id: `${sheetId}-components`,
										weight: 100,
										selected: 0,
										enableMaximize: true,
										enableClose: false,
										children: componentTabs,
									},
								],
							},
						};
					}

					sheetModel = FlexLayout.Model.fromJson(sheetLayoutJson);
					// Store reference to this sheet's model
					sheetModelsRef.current.set(sheetId, sheetModel);
				}

				const handleInnerModelChange = (
					innerModel: FlexLayout.Model,
				) => {
					// Update the ref with the latest model state
					sheetModelsRef.current.set(sheetId, innerModel);
				};

				return (
					<div style={{ width: "100%", height: "100%" }}>
						<FlexLayout.Layout
							model={sheetModel}
							factory={factory}
							onModelChange={handleInnerModelChange}
							onRenderTab={onRenderTab}
						/>
					</div>
				);
			}

			// Handle insight components
			if (component === "insight-component" && config?.blockId) {
				return <RendererEngine id={config.blockId} />;
			}

			return (
				<div style={{ padding: "16px" }}>
					<p className="text-base">Unknown component: {component}</p>
				</div>
			);
		},
		[onRenderTab],
	);

	const onAction = useCallback(
		(action: FlexLayout.Action): FlexLayout.Action => {
			return action;
		},
		[],
	);

	// Add the add button for sheets
	const onRenderTabSet = useCallback(
		(
			node: FlexLayout.TabSetNode | FlexLayout.BorderNode,
			renderValues: FlexLayout.ITabSetRenderValues,
		) => {
			// Check if this tabset contains sheet tabs (not component tabs)
			const children = node.getChildren();
			const hasSheetTabs = children.some((child) => {
				const tabNode = child as FlexLayout.TabNode;
				return tabNode.getComponent?.() === "sheet-container";
			});

			// Only add button to tabsets that contain sheets
			if (hasSheetTabs) {
				// Add a custom add button next to the tabs (sticky button)
				renderValues.stickyButtons?.push(
					<button
						key="add-sheet"
						type="button"
						className="flexlayout__tab_toolbar_button"
						title="Add Sheet"
						aria-label="Add Sheet"
						onClick={() => {
							if (!layoutModel) return;

							// Find the highest sheet number across ALL tabsets to avoid duplicate IDs
							let maxSheetNumber = 0;
							layoutModel.visitNodes((visitNode) => {
								if (
									visitNode.getType() === "tab" &&
									(
										visitNode as FlexLayout.TabNode
									).getComponent?.() === "sheet-container"
								) {
									const nodeId = visitNode.getId();
									const match = nodeId.match(/^sheet-(\d+)$/);
									if (match) {
										const sheetNumber = parseInt(
											match[1],
											10,
										);
										if (sheetNumber > maxSheetNumber) {
											maxSheetNumber = sheetNumber;
										}
									}
								}
							});

							const newSheetNumber = maxSheetNumber + 1;

							// Create and add new sheet to THIS tabset (where button was clicked)
							layoutModel.doAction(
								FlexLayout.Actions.addNode(
									{
										type: "tab",
										id: `sheet-${newSheetNumber}`,
										name: `sheet--${newSheetNumber}`,
										component: "sheet-container",
										enableClose: false,
										enableRename: true,
										enableDrag: false,
										config: {
											sheetId: `sheet-${newSheetNumber}`,
											sheetName: `sheet--${newSheetNumber}`,
											componentTabs: [],
											innerLayout: null,
										},
									},
									node.getId(), // Add to THIS tabset
									FlexLayout.DockLocation.CENTER,
									-1,
									true,
								),
							);
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="currentColor"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z" />
						</svg>
					</button>,
				);
			}
		},
		[layoutModel],
	);

	// Handle moving component to a different sheet
	const handleMoveToSheet = useCallback(
		(tabId: string, currentSheetId: string, targetSheetId: string) => {
			if (!layoutModel || currentSheetId === targetSheetId) return;

			const currentModel = sheetModelsRef.current.get(currentSheetId);
			const targetModel = sheetModelsRef.current.get(targetSheetId);

			if (!currentModel || !targetModel) {
				console.error("Could not find sheet models");
				return;
			}

			// Get the component tab node
			const componentNode = currentModel.getNodeById(tabId);
			if (!componentNode || componentNode.getType() !== "tab") {
				console.error("Could not find component tab");
				return;
			}

			const tabNode = componentNode as FlexLayout.TabNode;
			const tabJson = tabNode.toJson();

			// Find the target tabset in the target sheet
			let targetTabsetId = "";
			targetModel.visitNodes((node) => {
				if (node.getType() === "tabset") {
					// Use the first tabset we find
					if (!targetTabsetId) {
						targetTabsetId = node.getId();
					}
				}
			});

			if (!targetTabsetId) {
				console.error("Could not find target tabset");
				return;
			}

			// Remove from current sheet
			currentModel.doAction(FlexLayout.Actions.deleteTab(tabId));

			// Add to target sheet
			targetModel.doAction(
				FlexLayout.Actions.addNode(
					tabJson,
					targetTabsetId,
					FlexLayout.DockLocation.CENTER,
					-1,
					true,
				),
			);

			// Update refs with the modified models
			sheetModelsRef.current.set(currentSheetId, currentModel);
			sheetModelsRef.current.set(targetSheetId, targetModel);

			// Close the menu
			setMoveMenuAnchor(null);
		},
		[layoutModel],
	);

	// Handle layout changes
	const handleModelChange = useCallback(
		async (model: FlexLayout.Model) => {
			if (!data.appId) return;

			try {
				// Convert model to JSON
				const layoutJson = model.toJson();

				// Update each sheet tab's config with its current inner layout
				model.visitNodes((node) => {
					if (node.getType() === "tab") {
						const tabNode = node as FlexLayout.TabNode;
						const component = tabNode.getComponent();

						if (component === "sheet-container") {
							const sheetId = tabNode.getConfig()?.sheetId;
							const innerModel =
								sheetModelsRef.current.get(sheetId);

							if (innerModel) {
								// Get the current inner layout JSON
								const innerLayoutJson = innerModel.toJson();

								// Find this sheet tab in the layout JSON and update its config
								const updateSheetConfig = (
									obj: unknown,
								): void => {
									if (obj && typeof obj === "object") {
										const objWithId = obj as {
											id?: string;
											type?: string;
											config?: {
												innerLayout?: FlexLayout.IJsonModel;
											};
											children?: unknown[];
											layout?: unknown;
										};
										if (
											objWithId.id === tabNode.getId() &&
											objWithId.type === "tab"
										) {
											// Update the innerLayout in the config
											if (!objWithId.config)
												objWithId.config = {};
											objWithId.config.innerLayout =
												innerLayoutJson;
										}
										// Recursively search in children
										if (
											objWithId.children &&
											Array.isArray(objWithId.children)
										) {
											for (const child of objWithId.children) {
												updateSheetConfig(child);
											}
										}
										if (objWithId.layout) {
											updateSheetConfig(objWithId.layout);
										}
									}
								};

								updateSheetConfig(layoutJson);
							}
						}
					}
				});

				// Store the layout JSON in a state variable so it can be accessed by save query
				if (state.variables.currentLayoutJson) {
					state.variables.currentLayoutJson.value =
						JSON.stringify(layoutJson);
				} else {
					state.variables.currentLayoutJson = {
						type: "JSON",
						value: JSON.stringify(layoutJson),
					};
				}
			} catch (err) {
				console.error("Error saving layout:", err);
			}
		},
		[data.appId, state],
	);

	if (isLoading) {
		return (
			<div {...attrs}>
				<div
					className="flex flex-col items-center justify-center gap-2"
					style={{ padding: "32px", ...data.style }}
				>
					<Spinner />
					<p className="text-base">Loading layout...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div {...attrs}>
				<div
					className="flex flex-col items-center justify-center gap-2"
					style={{ padding: "32px", ...data.style }}
				>
					<p className="text-base text-destructive">Error: {error}</p>
				</div>
			</div>
		);
	}

	if (!layoutModel) {
		return (
			<div {...attrs}>
				<div
					className="flex flex-col items-center justify-center gap-2"
					style={{ padding: "32px", ...data.style }}
				>
					<p className="text-base">No layout configuration found</p>
				</div>
			</div>
		);
	}

	return (
		<div {...attrs} style={{ ...blockStyles, ...data.style }}>
			{/* Inject FlexLayout custom styles */}
			<style>{flexLayoutCustomStyles}</style>

			{(userRole === "OWNER" || showBackToFiltersButton) && (
				<div
					className="flex flex-row justify-end gap-1"
					style={{
						flexShrink: 0,
						paddingBottom: "8px",
					}}
				>
					{showBackToFiltersButton && (
						<div style={layoutButtonContainerStyles}>
							<Button
								variant="outline"
								size="sm"
								onClick={handleBackToFilters}
							>
								Back to Filters
							</Button>
						</div>
					)}
					{userRole === "OWNER" && (
						<div style={layoutButtonContainerStyles}>
							<Button
								size="sm"
								disabled={isSaving}
								onClick={handleSaveLayout}
							>
								{isSaving ? "Saving..." : "Save Layout"}
							</Button>
						</div>
					)}
				</div>
			)}
			<div
				className="flexlayout__theme_smss"
				style={layoutContainerStyles}
			>
				<FlexLayout.Layout
					model={layoutModel}
					factory={factory}
					onAction={onAction}
					onModelChange={handleModelChange}
					onRenderTabSet={onRenderTabSet}
					onRenderTab={onRenderTab}
				/>
			</div>

			{/* Move to Sheet Menu */}
			<DropdownMenu
				open={Boolean(moveMenuAnchor)}
				onOpenChange={(open) => {
					if (!open) setMoveMenuAnchor(null);
				}}
			>
				<DropdownMenuTrigger asChild>
					<div />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{moveMenuAnchor &&
						layoutModel &&
						(() => {
							// Get all available sheets
							const sheets: Array<{ id: string; name: string }> =
								[];
							layoutModel.visitNodes((visitNode) => {
								if (
									visitNode.getType() === "tab" &&
									(
										visitNode as FlexLayout.TabNode
									).getComponent?.() === "sheet-container"
								) {
									const sheetTab =
										visitNode as FlexLayout.TabNode;
									const sheetId =
										sheetTab.getConfig()?.sheetId;
									const sheetName = sheetTab.getName();
									if (
										sheetId &&
										sheetId !==
											moveMenuAnchor.currentSheetId
									) {
										sheets.push({
											id: sheetId,
											name: sheetName,
										});
									}
								}
							});

							if (sheets.length === 0) {
								return (
									<DropdownMenuItem disabled>
										<em>No other sheets available</em>
									</DropdownMenuItem>
								);
							}

							return sheets.map((sheet) => (
								<DropdownMenuItem
									key={sheet.id}
									onClick={() =>
										handleMoveToSheet(
											moveMenuAnchor.tabId,
											moveMenuAnchor.currentSheetId,
											sheet.id,
										)
									}
								>
									{sheet.name}
								</DropdownMenuItem>
							));
						})()}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
});
