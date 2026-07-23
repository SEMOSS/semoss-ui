import {
	Blocks,
	Braces,
	FlaskConical,
	Folder,
	Layers,
	type LucideIcon,
	Notebook,
	NotebookTabs,
	PanelsTopLeft,
	RotateCcw,
	Settings,
	Terminal,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FlexLayout, getFileIconComponent } from "@semoss/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { ClosePage } from "@/assets/img/ClosePage";
import { useTabBarScroll, useWorkspace } from "@/hooks";
import type { WorkspaceOptions } from "@/stores";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";
import { WorkspaceLoading } from "./WorkspaceLoading";
import { WorkspaceOverlay } from "./workspace-overlay";

const TAB_ICON_CLASS_NAME = "size-4";

const WORKSPACE_TAB_ICON_BY_COMPONENT: Record<string, LucideIcon> = {
	designer: PanelsTopLeft,
	"notebook-viewer": NotebookTabs,
	"settings-panel": Settings,
	terminal: Terminal,
	variables: Braces,
	blocks: Blocks,
	layers: Layers,
	insight: FlaskConical,
	"app-file-explorer": Folder,
	"notebook-explorer": Notebook,
};

const renderTabIcon = (Icon: React.ComponentType<{ className?: string }>) => (
	<Icon className={TAB_ICON_CLASS_NAME} />
);

const getFileTabIcon = (fileName: string) => {
	const Icon = getFileIconComponent(fileName);
	return renderTabIcon(Icon);
};

const getWorkspaceTabIcon = (component: string, name: string) => {
	if (component === "app-file-editor") {
		return getFileTabIcon(name);
	}

	const Icon = WORKSPACE_TAB_ICON_BY_COMPONENT[component];
	return Icon ? renderTabIcon(Icon) : null;
};

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

	/** Optional action handler — return the action to let FlexLayout process it, return undefined to consume it */
	onAction?: (action: FlexLayout.Action) => FlexLayout.Action | undefined;
};

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = observer(
	({ navbarActions, options, factory = () => null, onAction }) => {
		const { workspace } = useWorkspace();
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const containerRef = useRef<HTMLDivElement | null>(null);

		useTabBarScroll(containerRef);

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
					} else {
						model.doAction(
							FlexLayout.Actions.selectTab(
								(selectedNode as FlexLayout.TabNode).getId(),
							),
						);
					}
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
				throw e;
			}
		};

		return (
			<>
				<NavbarLeft>
					<NavbarHeader logo={null} />
					<div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
						<div className="flex items-center gap-1">
							{workspace.type === "SKILL" ||
							workspace.type === "WORKSPACE" ? (
								<div
									title={workspace?.metadata?.project_name}
									className="max-w-[30ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]"
								>
									{workspace?.metadata?.project_name}
								</div>
							) : (
								<>
									<Link
										to={`/app/${workspace.metadata.project_id}/view`}
										className="flex items-center text-inherit no-underline"
									>
										<div
											title={
												workspace?.metadata
													?.project_name
											}
											className="max-w-[30ch] truncate text-ellipsis font-normal text-[16px] leading-[175%]"
										>
											{workspace?.metadata?.project_name}
										</div>
									</Link>
									<span className="text-muted-foreground text-sm">
										/
									</span>
									<span className="text-sm">Editing</span>
								</>
							)}
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
							className="flexlayout__theme_smss absolute top-0 right-3 bottom-3 left-3 overflow-hidden"
						>
							{workspace.model ? (
								<>
									<FlexLayout.Layout
										ref={layoutRef}
										model={workspace.model}
										factory={(node) => {
											return factory(
												node,
												layoutRef.current as FlexLayout.Layout,
											);
										}}
										icons={{
											close: <ClosePage />,
										}}
										onModelChange={() => {
											workspace.saveToCache();
										}}
										onAction={(action) => {
											const external = onAction?.(action);
											if (external === undefined) {
												return undefined;
											}

											return action;
										}}
										onRenderTab={(
											tabNode,
											renderValues,
										) => {
											const tabIcon = getWorkspaceTabIcon(
												tabNode.getComponent() as string,
												tabNode.getName(),
											);

											if (tabIcon) {
												renderValues.leading = tabIcon;
											}

											return renderValues;
										}}
									/>
									<div className="absolute bottom-12 left-0 z-1 flex h-12 w-12 flex-col items-center justify-center">
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
