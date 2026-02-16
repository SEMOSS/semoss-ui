import { observer } from "mobx-react-lite";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { useWorkspace } from "@/hooks";
import { SettingsNavPanel } from "../../components/blocks-workspace/panels";
import {
	SettingsPanel,
	TerminalPanel,
	WorkspaceManager,
} from "../../components/workspace";
import type { WorkspaceOptions } from "../../stores";
import { MCPJsonEditor } from "../shared";
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
						component: "app-file-explorer",
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

/**
 * Render the code workspace
 */
export const CodeWorkspace: React.FC = observer(() => {
	const FACTORY: React.ComponentProps<typeof WorkspaceManager>["factory"] = (
		node,
		layout,
	) => {
		const { workspace } = useWorkspace();
		const component = node.getComponent();
		const config = node.getConfig();

		if (component === "app-file-explorer") {
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
		<WorkspaceManager
			navbarActions={<CodeWorkspaceActions />}
			options={DEFAULT_OPTIONS}
			factory={FACTORY}
		/>
	);
});
