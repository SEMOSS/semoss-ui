import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	MigrationManager,
	type SerializedState,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { runPixel, useInsight } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { ProjectDetailTabs } from "@/components/project";
import { useWorkspace } from "@/hooks";
import { DesignerStore, type WorkspaceOptions } from "@/stores";
import { WorkspaceManager } from "../../components/workspace";
import { WorkspaceTerminal } from "../../components/workspace/panels";
import { DesignerContext } from "../../contexts";
import { MCPJsonEditor } from "../shared";
import { GraphPanel } from "../workspace/panels/graph-panel";
import { BlocksWorkspaceDev } from "./BlocksWorkspaceDev";
import { BlocksWorkspaceActions } from "./blocks-workspace-actions";
import { DEFAULT_MENU } from "./menus/default-menu";
import {
	BlocksMenuPanel,
	DesignerPanel,
	ExportButtonPanel,
	LayersPanel,
	NotebookExplorerPanel,
	NotebookViewerPanel,
	SelectedBlockPanel,
	VariablesPanel,
} from "./panels";

const DEFAULT_BORDER_SIZE = 300;
const BLOCK_SETTINGS_MIN_WIDTH = 450;

const DEFAULT_OPTIONS: WorkspaceOptions = {
	version: "",

	layout: {
		global: { tabEnableClose: false, tabEnableRename: false },
		borders: [
			{
				type: "border",
				location: "left",
				size: DEFAULT_BORDER_SIZE,
				children: [
					{
						type: "tab",
						id: "blocks",
						name: "Blocks",
						component: "blocks",
						config: {},
						helpText: "Blocks",
					},
					{
						type: "tab",
						id: "layers",
						name: "Layers",
						component: "layers",
						config: {},
						helpText: "Layers",
					},
					{
						type: "tab",
						id: "variables",
						name: "Variables",
						component: "variables",
						config: {},
						helpText: "Variables",
					},
					{
						type: "tab",
						id: "notebook-explorer",
						name: "Notebooks",
						component: "notebook-explorer",
						config: {},
						helpText: "Notebooks",
					},
					{
						type: "tab",
						id: "filexplorer",
						name: "Files",
						component: "app-file-explorer",
						config: {},
						helpText: "Files",
					},
				],
			},
			{
				type: "border",
				location: "right",
				size: BLOCK_SETTINGS_MIN_WIDTH,
				minSize: BLOCK_SETTINGS_MIN_WIDTH,
				selected: 0,
				children: [
					{
						type: "tab",
						id: "block-settings",
						name: "Block Settings",
						component: "selected",
						config: {
							className: "selected_block",
						},
						helpText: "Block Settings",
					},
					{
						type: "tab",
						id: "export-button",
						name: "Export",
						component: "export-button",
						config: {},
						helpText: "Export Tool",
						enableDrag: false,
					},
				],
			},
			{
				type: "border",
				location: "bottom",
				size: DEFAULT_BORDER_SIZE,
				children: [
					{
						id: "terminal",
						type: "tab",
						name: "Terminal",
						component: "terminal",
						enableClose: false,
						config: {},
					},
					{
						type: "tab",
						id: "settings",
						name: "Settings",
						component: "settings-panel",
						config: {},
						// maxWidth: 1,
						helpText: "Settings",
						enableClose: false,
						borderWidth: 800,
						borderHeight: 600,
					},
				],
			},
		],
		layout: {
			type: "row",
			weight: 0,
			children: [
				{
					type: "tabset",
					id: "main-tabset",
					weight: 100,
					selected: 0,
					enableMaximize: true,
					children: [
						{
							type: "tab",
							name: "page-1",
							component: "designer",
							config: {
								id: "page-1",
							},
							enableClose: true,
						},
					],
				},
				// {
				// 	type: "tabset",
				// 	id: "settings-tabset",
				// 	weight: 0,
				// 	selected: 0,
				// 	enableMaximize: true,
				// 	enableTabStrip: false,
				// 	children: [
				// 		{
				// 			type: "tab",
				// 			name: "Settings",
				// 			component: "settingsPanel",
				// 			enableClose: false,
				// 		},
				// 	],
				// },
			],
		},
	},
};

const ACTIVE = "page-1";

/**
 * Render the Blocks worksapce
 */
export const BlocksWorkspace: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const insight = useInsight();
	const [state, setState] = useState<StateStore>();

	useEffect(() => {
		if (!workspace.model) return;
		workspace.model.doAction(
			FlexLayout.Actions.updateModelAttributes({
				tabEnableRename: false,
			}),
		);
	}, [workspace.model]);

	//to throw a warning when the user tried to reload the page
	// this is to prevent the user from losing their work
	useEffect(() => {
		if (!import.meta.env.DEV) {
			const handleBeforeUnload = (e: BeforeUnloadEvent) => {
				e.preventDefault();
				e.returnValue = "";
			};
			window.addEventListener("beforeunload", handleBeforeUnload);

			return () => {
				window.removeEventListener("beforeunload", handleBeforeUnload);
			};
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(() => {
		// start the loading screen
		workspace.setLoading(true);

		// load the app
		runPixel<[SerializedState]>(
			`GetAppBlocksJson ( project=["${workspace.appId}"]);`,
			workspace.insightId ? workspace.insightId : "new",
		)
			.then(async ({ pixelReturn, errors, insightId }) => {
				if (errors.length) {
					throw new Error(errors.join(""));
				}

				// get the output (SerializedState)
				const { output } = pixelReturn[0];

				// assume the output is the current state
				let state = output;

				// run migration if not up to date
				if (state.version !== STATE_VERSION) {
					const migration = new MigrationManager();
					state = await migration.run(output);
				}

				// create a new state store
				const s = new StateStore({
					mode: "static",
					insightId: insightId,
					state: state,
					cellRegistry: DefaultCells,
				});

				// set it
				setState(s);
			})
			.catch((e) => {
				toast.error(e.message);
				console.error(e);
			})
			.finally(() => {
				// close the loading screen
				workspace.setLoading(false);
			});
	}, []);

	/**
	 * Have the designer control the blocks
	 */
	const designer = useMemo(() => {
		// return the store
		if (state) {
			return new DesignerStore(state, {
				rendered: ACTIVE,
			});
		}
	}, [state]);

	/**
	 * set the designer's selected component to be the selected tab in the active tabset whenever the layout changes
	 */
	useLayoutEffect(() => {
		const model = workspace.model;
		if (!model || !designer) return;

		const originalDoAction = model.doAction.bind(model);

		model.doAction = (action: FlexLayout.Action) => {
			const result = originalDoAction(action);

			// Get the active tabset
			const activeTabset =
				model.getActiveTabset() as FlexLayout.TabSetNode;

			// Get the selected tab of the active tabset
			const selectedTab = activeTabset?.getChildren()[
				activeTabset.getSelected()
			] as FlexLayout.TabNode;

			// If the selected tab is a designer component, update the designer's selected component
			if (selectedTab?.getComponent() === "designer") {
				designer.setSelected(selectedTab.getName());
			}

			return result;
		};

		// Clean up when the component is unmounted
		return () => {
			model.doAction = originalDoAction;
		};
	}, [workspace.model, designer]);

	if (!state) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const FACTORY: React.ComponentProps<typeof WorkspaceManager>["factory"] = (
		node,
		layout,
	) => {
		const component = node.getComponent();
		const config = node.getConfig();
		if (component === "designer") {
			return <DesignerPanel id={config.id} />;
		} else if (component === "variables") {
			return <VariablesPanel title={"Variables"} />;
		} else if (component === "layers") {
			return <LayersPanel title={"Layers"} />;
		} else if (component === "selected") {
			return <SelectedBlockPanel title="Block Settings" />;
		} else if (component === "blocks") {
			return (
				<BlocksMenuPanel
					title={"Blocks"}
					items={DEFAULT_MENU}
					name={component}
				/>
			);
		} else if (component === "app-file-explorer") {
			return (
				<AppFileExplorer
					node={node}
					layout={layout}
					app={workspace.appId}
					onOpenStateChange={workspace.setFileBrowserOpen}
					onVisibleAssetPathsChange={({ path, paths }) => {
						workspace.setFileBrowserVisiblePaths(path, paths);
					}}
				/>
			);
		} else if (component === "app-file-editor") {
			return <AppFileEditor node={node} app={workspace.appId} />;
		} else if (component === "mcpJsonEditor") {
			return <MCPJsonEditor dataMap={config.data} />;
		} else if (component === "notebook-explorer") {
			return (
				<NotebookExplorerPanel title={"Notebooks"} layout={layout} />
			);
		} else if (component === "notebook-viewer") {
			return <NotebookViewerPanel id={config.id} />;
		} else if (component === "terminal") {
			return <WorkspaceTerminal appId={workspace.appId} />;
		} else if (component === "graph") {
			return <GraphPanel />;
		} else if (component === "settings-panel") {
			return (
				<ProjectDetailTabs
					type="CODE"
					tabs={[
						{ name: "Overview", path: "" },
						{
							name: "MCP",
							path: "mcp-usage",
							restrict: ["OWNER", "EDIT", "READ_ONLY"],
						},
						{
							name: "Commits",
							path: "commits",
							restrict: ["OWNER", "EDIT"],
						},
						{ name: "GitHub", path: "github", restrict: ["OWNER"] },
						{
							name: "Settings",
							path: "settings",
							restrict: ["OWNER"],
						},
						{
							name: "Access Control",
							path: "access-control",
							restrict: ["OWNER", "EDIT"],
						},
						{ name: "SMSS", path: "smss", restrict: ["OWNER"] },
					]}
				/>
			);
		} else if (component === "export-button") {
			return <ExportButtonPanel />;
		}
		return <>{component}</>;
	};

	const handleAction = (
		action: FlexLayout.Action,
	): FlexLayout.Action | undefined => {
		if (action.type !== FlexLayout.Actions.RENAME_TAB) return action;
		const { node: id, text } = action.data as {
			node: string;
			text: string;
		};
		const model = workspace.model;
		if (!model) return action;
		const tabNode = model.getNodeById(id);
		if (
			!(tabNode instanceof FlexLayout.TabNode) ||
			tabNode.getComponent() !== "app-file-editor"
		)
			return undefined;
		const cfg = tabNode.getConfig() as { path?: string };
		if (!cfg?.path) return action;
		const path = cfg.path;
		const dir = path.substring(0, path.lastIndexOf("/") + 1);
		const newPath = `${dir}${text}`;
		(async () => {
			try {
				await insight.actions.run(
					`RenameAppAsset(project=["${workspace.appId}"], filePath=["${path}"], newValue=["${newPath}"]);`,
				);
				const tabsetId =
					tabNode.getParent()?.getId() ??
					model.getActiveTabset()?.getId() ??
					model.getRoot().getChildren()[0]?.getId() ??
					"";
				model.doAction(FlexLayout.Actions.deleteTab(id));
				model.doAction(
					FlexLayout.Actions.addNode(
						{
							id: `APP_FILE--${newPath}`,
							type: "tab",
							name: text,
							component: "app-file-editor",
							config: { name: text, path: newPath },
							enableClose: true,
							enableRename: true,
						},
						tabsetId,
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
				);
			} catch (e) {
				console.error(e);
			}
		})();
		return undefined;
	};

	return (
		<Blocks state={state} registry={DefaultBlocks}>
			<DesignerContext.Provider
				value={{
					designer: designer,
				}}
			>
				<WorkspaceManager
					navbarActions={<BlocksWorkspaceActions />}
					options={DEFAULT_OPTIONS}
					factory={FACTORY}
					onAction={handleAction}
				/>
				<BlocksWorkspaceDev />
			</DesignerContext.Provider>
		</Blocks>
	);
});
