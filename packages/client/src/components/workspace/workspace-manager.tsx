import {
	Blocks,
	Braces,
	ChevronRightIcon,
	FlaskConical,
	Folder,
	Layers,
	type LucideIcon,
	Notebook,
	NotebookTabs,
	PanelsTopLeft,
	Settings,
	Terminal,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import { FlexLayout, getFileIconComponent } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	cn,
} from "@semoss/ui/next";
import { useProject, useTabBarScroll, useWorkspace } from "@/hooks";
import type { WorkspaceOptions } from "@/stores";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";
import { WorkspaceLoading } from "./WorkspaceLoading";
import { WorkspaceResetButton } from "./workspace-reset-button";
import { WorkspaceSettingsToggle } from "./workspace-settings-toggle";

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
		const { catalog, project } = useProject();
		const { workspace } = useWorkspace();
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const containerRef = useRef<HTMLDivElement | null>(null);

		useTabBarScroll(containerRef);

		// Offset the actions above the bottom border tab strip when one exists.
		const hasBottomBorder = useMemo(
			() =>
				workspace.model
					?.toJson()
					.borders?.some((border) => border.location === "bottom") ??
				false,
			[workspace.model],
		);

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

		return (
			<>
				<NavbarLeft>
					<NavbarHeader logo={null} />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to={catalog.path}>
										{catalog.name} Catalog
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<ChevronRightIcon />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										to={`${catalog.path}/${project.project_id}`}
									>
										{project.project_display_name ||
											project.project_name}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<ChevronRightIcon />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage>Edit</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</NavbarLeft>
				<NavbarRight>{navbarActions}</NavbarRight>
				<div className="relative flex h-full w-full flex-col overflow-hidden">
					<WorkspaceLoading />
					<div
						ref={containerRef}
						className="flexlayout__theme_smss absolute inset-0 overflow-hidden"
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
										close: <XIcon className="size-4" />,
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
									onRenderTab={(tabNode, renderValues) => {
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
								<div
									className={cn(
										"absolute left-2 z-10 flex flex-col gap-1",
										hasBottomBorder
											? "bottom-14"
											: "bottom-2",
									)}
								>
									<WorkspaceSettingsToggle
										model={workspace.model}
									/>
									<WorkspaceResetButton
										layout={options.layout}
									/>
								</div>
							</>
						) : null}
					</div>
				</div>
			</>
		);
	},
);
