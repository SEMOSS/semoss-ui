import { RestartAlt } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
	Breadcrumbs,
	IconButton,
	Stack,
	styled,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { ClosePage } from "@/assets/img/ClosePage";
import SEMOSS_BLACK_LOGO from "@/assets/img/SEMOSS_BLACK_LOGO.png";
import { FlexLayout } from "@/components/flex-layout";
import { useWorkspace } from "@/hooks";
import { SIDEBAR_MENU } from "@/pages/import/import.constants";
import type { WorkspaceOptions } from "@/stores";
import { formatToDataTestId } from "@/utility";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";
import { WorkspaceLoading } from "./WorkspaceLoading";
import { WorkspaceOverlay } from "./WorkspaceOverlay";

const StyledMain = styled("div")(() => ({
	position: "relative",
	height: "100%",
	width: "100%",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
}));

const StyledContent = styled("div")(({ theme }) => ({
	position: "relative",
	flex: "1",
	height: "100%",
	width: "100%",
	overflow: "hidden",
	marginTop: theme.spacing(1),
	paddingTop: theme.spacing(1.5),
	paddingLeft: theme.spacing(1.5),
	paddingRight: theme.spacing(1.5),
	paddingBottom: theme.spacing(1.5),
}));

const StyledSpacer = styled("div")(({ theme }) => ({
	position: "absolute",
	top: 0,
	left: theme.spacing(1.5),
	right: theme.spacing(1.5),
	bottom: theme.spacing(1.5),
	overflow: "hidden",
}));

const StyledAppTypography = styled(Typography)(() => ({
	color: "rgb(0, 0, 0)",
}));

const StyledSemossImage = styled("img")(() => ({}));

const StyledLetTabImage = styled("img")(() => ({
	width: 50,
	height: 40,
	display: "block",
	margin: "auto",
	transition: "all 0.2s ease",
	maxWidth: "none",
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
	display: "flex",
	alignItems: "center",
	":hover": {
		bacakground: theme.palette.action.hover,
	},
}));

const StyledActions = styled(Stack)(({ theme }) => ({
	position: "absolute",
	bottom: "36px",
	left: "5px",
	width: "32px", // from flexlayout
	zIndex: 1,
}));

const StyledNavLeft = styled(Stack)(({ theme }) => ({
	minWidth: 0,
	overflow: "hidden",
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
	"& .MuiBreadcrumbs-ol": {
		flexWrap: "nowrap",
	},
}));

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
		const model = workspace.model;
		// build the model from the layout
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

			model
				.getBorderSet()
				.getBorders()
				.forEach((border) => {
					// border.setSelected(isSettingsTab ? -1 : border.getSelected());
					border.setSelected(
						action.data.tabNode === "block-settings" &&
							mainTabsetWeight === 0
							? 1
							: border.getSelected(),
					);
				});

			if (isSettingsTab || mainTabsetWeight === 0) {
				model.visitNodes((node) => {
					if (node.getType() === "tabset") {
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
					<NavbarHeader
						logo={
							<StyledSemossImage
								src={SEMOSS_BLACK_LOGO}
								alt="SEMOSS"
							></StyledSemossImage>
						}
					/>
					<StyledNavLeft>
						<StyledBreadcrumbs separator=" /">
							<StyledHeaderLogo to={"/app"}>
								<Stack direction={"row"} alignItems={"center"}>
									<StyledAppTypography variant={"subtitle1"}>
										App Library
									</StyledAppTypography>
								</Stack>
							</StyledHeaderLogo>

							<StyledHeaderLogo
								to={`/app/${workspace.metadata.project_id}/view`}
							>
								<div
									title={workspace?.metadata?.project_name}
									className="max-w-[10ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]"
								>
									{workspace?.metadata?.project_name}
								</div>
							</StyledHeaderLogo>

							<StyledHeaderLogo to="">
								<div
									title={workspace?.metadata?.project_name}
									className="max-w-[10ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]"
								>
									{workspace?.metadata?.project_name}
								</div>
								<span className="w-[10ch]"> - Editor</span>
							</StyledHeaderLogo>
						</StyledBreadcrumbs>
					</StyledNavLeft>
				</NavbarLeft>
				<NavbarRight>{navbarActions}</NavbarRight>
				<WorkspaceOverlay />
				<StyledMain>
					<StyledContent>
						<WorkspaceLoading />
						<StyledSpacer className="flexlayout__theme_smss--legacy">
							{workspace.model ? (
								<>
									<FlexLayout.Layout
										ref={layoutRef}
										model={workspace.model}
										classNameMapper={(defaultClassName) =>
											`${defaultClassName} workspace_layout`
										}
										factory={(node) => {
											return factory(
												node,
												layoutRef.current,
											);
										}}
										icons={{
											close: <ClosePage />,
										}}
										// onRenderTabSet={handleRenderTabSet}
										onModelChange={() => {
											workspace.saveToCache();
										}}
										onAction={(action) => {
											updateModel(action);
											return action;
										}}
										onRenderTab={(
											tabNode,
											renderValues,
										) => {
											const item = SIDEBAR_MENU.MENU.find(
												(menuItem) =>
													menuItem.name ===
													tabNode.getName(),
											);
											const isSelected =
												tabNode.isSelected();
	
										// Base test ID without suffix
										const baseDataTestId =
											formatToDataTestId(
												`workspace-${tabNode.getName()}`,
											);

										// Ref callback to set data-testid based on ghost/original state
										const DynamicDataTestId = (
											el: HTMLElement | null,
										) => {
											if (el) {
												// Check if this is a ghost/preview element during drag
												const parent = el.parentElement;
												const grandParent =
													parent?.parentElement;

												const isGhost =
													parent?.classList.contains(
														"flexlayout__tab_button_stamp",
													) ||
													grandParent?.classList.contains(
														"flexlayout__tab_button_stamp",
													);

												// Determine suffix: ghost for drag preview, image for original
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
												<Tooltip
													title={item.icon.tooltip}
												>
													<IconButton
														size={"small"}
														color="default"
														ref={DynamicDataTestId}
													>
														<Icon
															color={
																isSelected
																	? "primary"
																	: "inherit"
															}
															fontSize="inherit"
														/>
													</IconButton>
												</Tooltip>
											);
										} else if (item?.icon) {
											const iconSrc = isSelected
												? item.icon.active
												: item.icon.default;
											renderValues.content = (
												<StyledLetTabImage
													src={iconSrc}
													alt={tabNode.getName()}
													ref={DynamicDataTestId}
												/>
											);
										}
										return renderValues;
									}}
								/>
								<StyledActions
									direction="column"
									justifyContent={"center"}
								>
									<Tooltip title={"Reset workspace"}>
										<IconButton
											size={"small"}
											color="default"
											onClick={() => {
												resetWorkspace();
											}}
										>
											<RestartAlt fontSize="inherit" />
										</IconButton>
									</Tooltip>
								</StyledActions>
							</>
						) : null}
					</StyledSpacer>
				</StyledContent>
			</StyledMain>
			<WorkspaceOverlay />
		</WorkspaceContext.Provider>
	);
});

// NOTES: WE HAVE TO FIX ALOT HERE.
// The code specific to blocks apps should not be here.
// Interacting with the model seems to be something that is needed for alot of these conventions that we have here.
// One issue i see is the renderTabSet.  it is dependent on the useBlocks hook.  We will need to figure out how to do this without the useBlocks Dependency here.
// The quick fix is to comment out the action on the tabset

// const StyledRenderTabSet = styled("div")(() => ({
// 	padding: "0 8px",
// 	cursor: "pointer",
// 	display: "flex",
// 	fontSize: "1.2rem",
// 	alignItems: "center",
// }));

// TODO: Should not be used in workspace this is a shared component for apps that aren't drag and drop
// const notification = useNotification();
// const [layoutRefeshKey, setLayoutRefeshKey] = useState(0);
// const { page } = usePage();
// const { state } = useBlocks();
// const { designer } = useDesigner();
// const { configStore } = useRootStore();
// const accordionRefs = useRef({});

// TODO: probably should be passed as callback to the BlocksWorkspace
// useEffect(() => {
//     openTab();
// }, [designer.selected]);

// const openTab = () => {
//     const layout = layoutRef.current;
//     if (!layout) return;
//     const model = workspace.model;
//     const tabId = getIdByName(model['idMap'], 'Block Settings');
//     model.doAction(Actions.selectTab(tabId));
// };
// const handlePageAdd = async () => {
//     try{
//     const newPageId = await state.dispatch({
//         message: ActionMessages.ADD_BLOCK,
//         payload: {
//             json: PAGE_BLOCK,
//         },
//     });
//     if (typeof newPageId === 'string') {
//         const block = state.blocks[newPageId];
//         handlePageSelection(block);
//     } else {
//         console.error('Invalid newPageId:', newPageId);
//     }
// } catch (error) {
//     console.error('Error adding new page:', error);
//     notification.add({
//         color: 'error',
//         message: 'Failed to add new page',
//     });
// };
// };
// function getIdByName(iMap, targetName: string): string | null {
//     for (const [key, value] of iMap.entries()) {
//         if (value?.attributes?.name === targetName) {
//             if (!value?.visible) {
//                 return key;
//             }
//         }
//     }
//     return null;
// }
// const handlePageSelection = (block) => {
//     accordionRefs.current = {};
//     // designer.setSelected(block.id);
//     handleOnSelect(block);
// };
// const handleRenderTabSet = (tabSetNode, renderValues) => {
//     if (
//         tabSetNode.getId() === 'border_left' ||
//         tabSetNode.getId() === 'border_right'
//     ) {
//         return;
//     }
//     renderValues.buttons.unshift(
//         <StyledRenderTabSet
//             key="custom-add-button"
//             title="Add Tab"
//             // onClick={() => handlePageAdd()}
//         >
//             <AddPage />
//         </StyledRenderTabSet>,
//     );
// };
// const handleOnSelect = (blockData) => {
//     const id = blockData.id;
//     if (blockData.widget !== 'page') {
//         scrollIntoView(getBlockElement(id));
//         return;
//     }
//     // try to select a panel, if it doesn't exist create it. Save the path
//     const IsSelected = selectPanel(id);
//     if (!IsSelected) {
//         createPanel(id);
//     }
// };
// const createPanel = (id: string): boolean => {
//     try {
//         if (!id) {
//             return false;
//         }

//         // get the model
//         const model = workspace.model;
//         if (!model) {
//             throw new Error('Missing model');
//         }

//         // get the name
//         const name = id;

//         // where to add the node
//         const addId =
//             model.getActiveTabset()?.getId() ||
//             model.getRoot().getChildren()[0]?.getId() ||
//             '';

//         // create and select the panel
//         model.doAction(
//             Actions.addNode(
//                 {
//                     type: 'tab',
//                     name: name,
//                     component: 'designer',
//                     config: {
//                         id: id,
//                     },
//                     enableClose: true,
//                 },
//                 addId,
//                 DockLocation.CENTER,
//                 -1,
//                 true,
//             ),
//         );
//     } catch (e) {
//         notification.add({
//             color: 'error',
//             message: e,
//         });

//         return false;
//     }

//     return true;
// };
// const scrollIntoView = (
//     element: Element | null,
//     {
//         behavior = 'smooth' as ScrollBehavior,
//         block = 'center' as ScrollLogicalPosition,
//         inline = 'start' as ScrollLogicalPosition,
//     } = {},
// ) => {
//     (element as HTMLElement)?.scrollIntoView({
//         behavior,
//         block,
//         inline,
//     });
// };

// const selectPanel = (id: string): boolean => {
//     try {
//         if (!id) {
//             return false;
//         }

//         let selectedNode: TabNode | null = null;

//         // get the model
//         const model = workspace.model;
//         if (!model) {
//             throw new Error('Missing model');
//         }

//         selectedNode = getNodeInfo(id, model);

//         // create a new panel if there is no node
//         if (!selectedNode) {
//             return false;
//         }
//         const selectedNodeId = selectedNode.getId();
//         model.doAction(Actions.selectTab(selectedNodeId));
//     } catch (e) {
//         notification.add({
//             color: 'error',
//             message: e,
//         });

//         return false;
//     }

//     return true;
// };

// const getNodeInfo = (id, model) => {
//     let returnedNode: TabNode | null = null;
//     // visit the notes, and see if it exists
//     model.visitNodes((node) => {
//         // check if it is a tabNode
//         if (node instanceof TabNode) {
//             // it needs to be a notebook-viewer
//             const component = node.getComponent();
//             if (component !== 'designer') {
//                 return;
//             }

//             // path and space need to match
//             const config = node.getConfig();
//             if (config.id !== id) {
//                 return;
//             }

//             returnedNode = node;
//         }
//     });

//     return returnedNode;
// };
