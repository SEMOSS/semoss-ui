import { observer } from "mobx-react-lite";
import { SettingsNavPanel } from "../../components/blocks-workspace/panels";
import {
	FileEditorPanel,
	FileExplorerPanel,
	SettingsPanel,
	TerminalPanel,
	Workspace,
} from "../../components/workspace";
import type { WorkspaceOptions, WorkspaceStore } from "../../stores";
import { MCPJsonEditor } from "../workspace/panels/MCPJsonEditor";
import { CodeWorkspaceActions } from "./CodeWorkspaceActions";
import { RendererPanel } from "./panels";

const DEFAULT_BORDER_SIZE = 300;

const DEFAULT_OPTIONS: WorkspaceOptions = {
	version: "",
	layout: {
		global: {
			tabEnableClose: false,
			tabEnableRename: false,
		},
		borders: [
			{
				type: "border",
				location: "left",
				selected: 0,
				size: 400,
				children: [
					{
						id: "file-explorer",
						type: "tab",
						name: "Files",
						component: "file-explorer",
						enableClose: false,
						config: {},
					},
					{
						id: "settings",
						type: "tab",
						name: "Settings",
						component: "settings",
						config: {},
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
			weight: 100,
			children: [
				{
					type: "tabset",
					weight: 50,
					selected: 0,
					enableTabStrip: true,
					children: [
						{
							id: "render",
							type: "tab",
							name: "App",
							component: "renderer",
							config: {},
						},
					],
				},
			],
		},
	},
};

interface CodeWorkspaceProps {
	/** Workspace to render */
	workspace: WorkspaceStore;
}

/**
 * Render the code workspace
 */
export const CodeWorkspace = observer((props: CodeWorkspaceProps) => {
	const { workspace } = props;
	const FACTORY: React.ComponentProps<typeof Workspace>["factory"] = (
		node,
		layout,
	) => {
		const component = node.getComponent();
		const config = node.getConfig();

		if (component === "file-explorer") {
			return <FileExplorerPanel title={"Files"} layout={layout} />;
		} else if (component === "file-editor") {
			return <FileEditorPanel path={config.path} />;
		} else if (component === "mcpJsonEditor") {
			return <MCPJsonEditor dataMap={config.data}/>;
		} else if (component === "renderer") {
			return <RendererPanel />;
		} else if (component === "settingsPanel") {
			return <SettingsPanel value={config.value} />;
		} else if (component === "settings") {
			return <SettingsNavPanel />; // This is a placeholder for the settings tab, which is handled in the border layout
		} else if (component === "terminal") {
			return <TerminalPanel />;
		}

		return <>{component}</>;
	};
	return (
		<Workspace
			navbarActions={<CodeWorkspaceActions />}
			options={DEFAULT_OPTIONS}
			workspace={workspace}
			factory={FACTORY}
		/>
	);
});
