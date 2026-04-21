import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { useWorkspace } from "@/hooks";
import { AppDetailPage } from "@/pages/app/app-detail-page";
import { TerminalPanel, WorkspaceManager } from "../../components/workspace";
import type { WorkspaceOptions } from "../../stores";
import { MCPJsonEditor } from "../shared";
import { CodeWorkspaceActions } from "./code-workspace-actions";
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
						component: "settingsPanel",
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
	const insight = useInsight();

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
			return (
				<MCPJsonEditor
					dataMap={{
						...config.data,
						onSave: async (data, path) => {
							try {
								await insight.actions.run(
									`SaveAppAssets(project=["${workspace.appId}"], filePath=["${path}"], content=["<encode>${JSON.stringify(data, null, 2)}</encode>"]);`,
								);
								toast.success("Tool saved successfully");
							} catch (e) {
								toast.error(`Failed to save Tool: ${e}`);
							}
						},
						resourceId: workspace.appId,
					}}
				/>
			);
		} else if (component === "renderer") {
			return <RendererPanel />;
		} else if (component === "settingsPanel") {
			return <AppDetailPage showNav={false} />;
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
