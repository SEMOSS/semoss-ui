import { RotateCcw } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { ClosePage } from "@/assets/img/ClosePage";
import { FlexLayout } from "@/components/flex-layout";
import { useWorkspace } from "@/hooks";
import { SIDEBAR_MENU } from "@/pages/import/import.constants";
import type { WorkspaceOptions } from "@/stores";
import { formatToDataTestId } from "@/utility";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";
import { WorkspaceLoading } from "./WorkspaceLoading";
import { WorkspaceOverlay } from "./WorkspaceOverlay";

type WorkspaceManagerProps = {
	/** Actions to render in the navbar */
	navbarActions?: React.ReactNode;

	/** Options to load into the workspace */
	options: WorkspaceOptions;

	/** Factor method */
	factory: (
		node: FlexLayout.TabNode,
		layout: FlexLayout.Layout,
	) => React.ReactNode;
};

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = observer(
	({ navbarActions, options, factory = () => null }) => {
		const { workspace } = useWorkspace();
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const containerRef = useRef<HTMLDivElement | null>(null);
		const model = workspace.model;

		useEffect(() => {
			const container = containerRef.current;
			if (!container) return;
			const onWheel = (e: WheelEvent) => {
				if (!(e.target instanceof Element)) return;
				const tabBar = e.target.closest(
					".flexlayout__tabset_tabbar_inner",
				) as HTMLElement | null;
				if (!tabBar || !container.contains(tabBar)) return;
				if (tabBar.scrollWidth <= tabBar.clientWidth) return;
				const delta =
					Math.abs(e.deltaX) > Math.abs(e.deltaY)
						? e.deltaX
						: e.deltaY;
				if (delta === 0) return;
				tabBar.scrollLeft += delta;
				e.preventDefault();
				e.stopPropagation();
			};
			container.addEventListener("wheel", onWheel, {
				capture: true,
				passive: false,
			});
			return () => container.removeEventListener("wheel", onWheel, true);
		}, []);

		// build the model from the layout
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only event registration
		useEffect(() => {
			const handler = (e: CustomEvent) => {
				const { destinationType, destination } = e.detail;
				if (destinationType === "App Page") {
					const model = workspace.model;

					// get the model
					if (!model) {
						throw new Error("Missing model");
					}

					let selectedNode: FlexLayout.TabNode | null = null;

					// visit the notes, and see if it exists
					model.visitNodes((node) => {
						// check if it is a tabNode
						if (node instanceof FlexLayout.TabNode) {
							// it needs to be a notebook-viewer
							const component = node.getComponent();
							if (component !== "designer") {
								return;
							}

							// path and space need to match
							const config = node.getConfig();
							if (config.id !== destination) {
								return;
							}

							selectedNode = node;
						}
					});

					// create a new panel if there is no node
					if (!selectedNode) {
						// get the name
						const name = destination;

						// where to add the node
						const addId =
							model.getActiveTabset()?.getId() ||
							model.getRoot().getChildren()[0]?.getId() ||
							"";

						// create and select the panel
						model.doAction(
							FlexLayout.Actions.addNode(
								{
									type: "tab",
									name: name,
									component: "designer",
									config: {
										id: destination,
									},
									enableClose: true,
								},
								addId,
								FlexLayout.DockLocation.CENTER,
								-1,
								true,
							),
						);
					}

					const selectedNodeId = selectedNode.getId();
					model.doAction(
						FlexLayout.Actions.selectTab(selectedNodeId),
					);
				}
			};
			window.addEventListener("OPEN_EVENT", handler as EventListener);
			return () => {
				window.removeEventListener(
					"OPEN_EVENT",
					handler as EventListener,
				);
			};
		}, []);

		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only run when options identity changes
		useEffect(() => {
			// default options if not loaded from cache
			const defaultOptions = JSON.parse(JSON.stringify(options));

			// set the workspace options
			// try to load from cache
			const isLoaded = workspace.loadFromCache();
			if (!isLoaded) {
				workspace.load(defaultOptions);
			}
		}, [options]);

		/**
		 * reset the selected layout
		 */
		const resetWorkspace = () => {
			try {
				// copy the optoins
				const layout = JSON.parse(JSON.stringify(options.layout));

				// update the layout
				workspace.updateLayout(layout);
			} catch (e) {
				console.error(e);
				throw new e();
			}
		};

		const updateModel = (action) => {
			if (!model) return;

			const isSettingsTab = action.data.tabNode === "settings";
			const mainTabsetWeight = model
				?.getNodeById("main-tabset")
				?.getAttr("weight");

			// Find a tab node's id by its display name
			const findTabIdByName = (name: string): string | null => {
				let id: string | null = null;
				model.visitNodes((node) => {
					if (
						node instanceof FlexLayout.TabNode &&
						node.getName() === name
					) {
						id = node.getId();
					}
				});
				return id;
			};

			// Collapse all border panels
			const collapseAllBorders = () => {
				model
					.getBorderSet()
					.getBorders()
					.forEach((b) => {
						b.setSelected(-1);
					});
			};

			// Toggle the settings sidebar highlight
			const setSettingsActive = (active: boolean) =>
				model.doAction(
					FlexLayout.Actions.updateNodeAttributes("settings", {
						config: { isSettingsActive: active },
					}),
				);

			if (isSettingsTab) {
				try {
					// getNodeById is sufficient — no visitNodes needed for an id lookup
					const settingsNode = model.getNodeById(
						"settings",
					) as FlexLayout.TabNode | null;
					const isAlreadyActive =
						settingsNode?.getConfig()?.isSettingsActive;

					if (isAlreadyActive) {
						const existingId = findTabIdByName("AppSettings");
						if (existingId) {
							model.doAction(
								FlexLayout.Actions.selectTab(existingId),
							);
						}
						return true;
					}

					setSettingsActive(true);
					collapseAllBorders();

					const mainTabsetId =
						model.getNodeById("main-tabset")?.getId() ||
						model.getRoot().getChildren()[0]?.getId() ||
						"";

					let existingId = findTabIdByName("AppSettings");

					if (!existingId) {
						model.doAction(
							FlexLayout.Actions.addNode(
								{
									type: "tab",
									name: "AppSettings",
									component: "settingsPanel",
									config: {},
									enableClose: true,
								},
								mainTabsetId,
								FlexLayout.DockLocation.CENTER,
								-1,
								true,
							),
						);
						existingId = findTabIdByName("AppSettings");
					}

					if (existingId) {
						model.doAction(
							FlexLayout.Actions.selectTab(existingId),
						);
					}
				} catch (err) {
					console.error(err);
				}

				return true;
			}

			setSettingsActive(false);
			model
				.getBorderSet()
				.getBorders()
				.forEach((border) => {
					border.setSelected(
						action.data.tabNode === "block-settings" &&
							mainTabsetWeight === 0
							? 1
							: border.getSelected(),
					);
				});

			if (isSettingsTab || mainTabsetWeight === 0) {
				model.visitNodes((node) => {
					if (
						node &&
						typeof node.getType === "function" &&
						node.getType() === "tabset"
					) {
						const newWeight =
							(isSettingsTab &&
								node.getId() === "settings-tabset") ||
							(!isSettingsTab &&
								mainTabsetWeight === 0 &&
								node.getId() !== "settings-tabset")
								? 100
								: 0;
						model.doAction(
							FlexLayout.Actions.updateNodeAttributes(
								node.getId(),
								{
									weight: newWeight,
								},
							),
						);
					}
				});
			}
		};

		return (
			<>
				<NavbarLeft>
					<NavbarHeader logo={null} />
					<div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
						<div className="flex items-center gap-1">
							<Link
								to={`/app/${workspace.metadata.project_id}/view`}
								className="flex items-center text-inherit no-underline"
							>
								<div
									title={workspace?.metadata?.project_name}
									className="max-w-[10ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]"
								>
									{workspace?.metadata?.project_name}
								</div>
							</Link>
							<span className="text-muted-foreground text-sm">
								{" /"}&nbsp;
							</span>
							<span className="text-sm">Editing</span>
						</div>
					</div>
				</NavbarLeft>
				<NavbarRight>{navbarActions}</NavbarRight>
				<WorkspaceOverlay />
				<div className="relative flex h-full w-full flex-col overflow-hidden">
					<div className="relative mt-2 flex h-full w-full flex-1 overflow-hidden px-3 pt-3 pb-3">
						<WorkspaceLoading />
						<div
							ref={containerRef}
							className="flexlayout__theme_smss--legacy absolute top-0 right-3 bottom-3 left-3 overflow-hidden"
						>
							{workspace.model ? (
								<>
									<FlexLayout.Layout
										ref={layoutRef}
										model={workspace.model}
										factory={(node) => {
											return factory(
												node,
												layoutRef.current,
											);
										}}
										icons={{
											close: <ClosePage />,
										}}
										onModelChange={() => {
											workspace.saveToCache();
										}}
										onAction={(action) => {
											const handled = updateModel(action);
											return !handled ? action : false;
										}}
										onRenderTab={(
											tabNode,
											renderValues,
										) => {
											const isSettingsTab =
												tabNode.getName() ===
												"Settings";
											const item = SIDEBAR_MENU.MENU.find(
												(menuItem) =>
													menuItem.name ===
													tabNode.getName(),
											);
											const isSelected = isSettingsTab
												? !!tabNode.getConfig()
														?.isSettingsActive
												: tabNode.isSelected();

											const baseDataTestId =
												formatToDataTestId(
													`workspace-${tabNode.getName()}`,
												);

											const DynamicDataTestId = (
												el: HTMLElement | null,
											) => {
												if (el) {
													const parent =
														el.parentElement;
													const grandParent =
														parent?.parentElement;

													const isGhost =
														parent?.classList.contains(
															"flexlayout__tab_button_stamp",
														) ||
														grandParent?.classList.contains(
															"flexlayout__tab_button_stamp",
														);

													const suffix = isGhost
														? "ghost"
														: "image";
													el.setAttribute(
														"data-testid",
														`${baseDataTestId}-${suffix}`,
													);
												}
											};

											if (item?.icon?.component) {
												const Icon =
													item.icon.component;

												renderValues.content = (
													<Tooltip>
														<TooltipTrigger asChild>
															<button
																type="button"
																className="flex size-7 items-center justify-center rounded hover:bg-accent"
																ref={
																	DynamicDataTestId
																}
															>
																<Icon
																	className={
																		isSelected
																			? "text-primary"
																			: "text-inherit"
																	}
																	style={{
																		fontSize:
																			"inherit",
																	}}
																/>
															</button>
														</TooltipTrigger>
														<TooltipContent>
															{item.icon.tooltip}
														</TooltipContent>
													</Tooltip>
												);
											} else if (item?.icon) {
												const iconSrc = isSelected
													? item.icon.active
													: item.icon.default;
												renderValues.content = (
													<img
														src={iconSrc}
														alt={tabNode.getName()}
														ref={DynamicDataTestId}
														className="m-auto block h-[40px] w-[50px] max-w-none transition-all duration-200"
													/>
												);
											}
											return renderValues;
										}}
									/>
									<div className="absolute bottom-9 left-[5px] z-[1] flex w-8 flex-col justify-center">
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="flex size-7 items-center justify-center rounded hover:bg-accent"
													onClick={resetWorkspace}
												>
													<RotateCcw className="size-4" />
												</button>
											</TooltipTrigger>
											<TooltipContent>
												Reset workspace
											</TooltipContent>
										</Tooltip>
									</div>
								</>
							) : null}
						</div>
					</div>
				</div>
				<WorkspaceOverlay />
			</>
		);
	},
);
