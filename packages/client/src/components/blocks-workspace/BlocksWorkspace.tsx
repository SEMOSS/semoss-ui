import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	MigrationManager,
	type SerializedState,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { LoadingScreen, useNotification } from "@semoss/ui";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { useWorkspace } from "@/hooks";
import { DesignerStore, type WorkspaceOptions } from "@/stores";
import {
	SettingsPanel,
	TerminalPanel,
	WorkspaceManager,
} from "../../components/workspace";
import { DesignerContext } from "../../contexts";
import { GraphPanel } from "../workspace/panels/GraphPanel";
import { MCPJsonEditor } from "../workspace/panels/MCPJsonEditor";
import { BlocksWorkspaceActions } from "./BlocksWorkspaceActions";
import { BlocksWorkspaceDev } from "./BlocksWorkspaceDev";
import { DEFAULT_MENU } from "./menus/default-menu";
import {
	BlocksMenuPanel,
	DesignerPanel,
	ExportButtonPanel,
	LayersPanel,
	NotebookExplorerPanel,
	NotebookViewerPanel,
	SelectedBlockPanel,
	SettingsNavPanel,
	VariablesPanel,
} from "./panels";

const DEFAULT_BORDER_SIZE = 300;
const BLOCK_SETTINGS_MIN_WIDTH = 450;

const DEFAULT_OPTIONS: WorkspaceOptions = {
	version: "",

	layout: {
		global: { tabEnableClose: false },
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
						id: "filexplorer",
						name: "Files",
						component: "app-file-explorer",
						config: {},
						helpText: "Files",
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
						id: "settings",
						name: "Settings",
						component: "settings",
						config: {},
						// maxWidth: 1,
						helpText: "Settings",
						enableDrag: false,
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
	const notification = useNotification();
	const [state, setState] = useState<StateStore>();

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
				notification.add({
					color: "error",
					message: e.message,
				});
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

	if (!state) {
		return <LoadingScreen.Trigger />;
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
					title={"Add Blocks"}
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
				/>
			);
		} else if (component === "app-file-editor") {
			return <AppFileEditor node={node} app={workspace.appId} />;
		} else if (component === "mcpJsonEditor") {
			return <MCPJsonEditor dataMap={config.data} />;
		} else if (component === "notebook-explorer") {
			return <NotebookExplorerPanel title={"Notebook"} layout={layout} />;
		} else if (component === "notebook-viewer") {
			return <NotebookViewerPanel id={config.id} />;
		} else if (component === "terminal") {
			return <TerminalPanel />;
		} else if (component === "graph") {
			return <GraphPanel />;
		} else if (component === "settingsPanel") {
			return <SettingsPanel value={config.value} />;
		} else if (component === "settings") {
			return <SettingsNavPanel />; // This is a placeholder for the settings tab, which is handled in the border layout
		} else if (component === "export-button") {
			return <ExportButtonPanel />;
		}
		return <>{component}</>;
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
				/>
				<BlocksWorkspaceDev />
			</DesignerContext.Provider>
		</Blocks>
	);
});
