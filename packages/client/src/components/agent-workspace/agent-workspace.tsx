import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { useInsight } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { ProjectDetailTabs } from "@/components/project";
import { useWorkspace } from "@/hooks";
import type { WorkspaceOptions } from "../../stores";
import { CodeWorkspaceActions } from "../code-workspace/code-workspace-actions";
import { MCPJsonEditor } from "../shared";
import { WorkspaceManager, WorkspaceTerminal } from "../workspace";
import { AgentEditor } from "./agent-editor";

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
						id: "settings",
						type: "tab",
						name: "Settings",
						component: "settings-panel",
						config: {},
						enableClose: false,
						borderWidth: 800,
						borderHeight: 600,
					},
				],
			},
		],
		layout: {
			type: "row",
			weight: 100,
			children: [],
		},
	},
};

export const AgentWorkspace: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const insight = useInsight();
	const agentTabOpened = useRef(false);

	useEffect(() => {
		const model = workspace.model;
		if (!model || agentTabOpened.current) return;
		agentTabOpened.current = true;

		if (model.getNodeById("AGENT")) return;

		const tabsetId =
			model.getActiveTabset()?.getId() ??
			model.getRoot().getChildren()[0]?.getId() ??
			"";
		if (!tabsetId) return;

		model.doAction(
			FlexLayout.Actions.addNode(
				{
					id: "AGENT",
					type: "tab",
					name: "Agent",
					component: "agent-editor",
					config: {},
					enableClose: false,
				},
				tabsetId,
				FlexLayout.DockLocation.CENTER,
				-1,
				true,
			),
		);
	}, [workspace.model]);

	const FACTORY: React.ComponentProps<typeof WorkspaceManager>["factory"] = (
		node,
		layout,
	) => {
		const component = node.getComponent();
		const config = node.getConfig();

		if (component === "agent-editor") {
			return <AgentEditor />;
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
		} else if (component === "settings-panel") {
			return (
				<ProjectDetailTabs
					type="WORKSPACE"
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
							name: "Access Control",
							path: "access-control",
							restrict: ["OWNER", "EDIT"],
						},
						{ name: "SMSS", path: "smss", restrict: ["OWNER"] },
					]}
				/>
			);
		} else if (component === "terminal") {
			return <WorkspaceTerminal appId={workspace.appId} />;
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
			return action;
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
		<WorkspaceManager
			navbarActions={<CodeWorkspaceActions />}
			options={DEFAULT_OPTIONS}
			factory={FACTORY}
			onAction={handleAction}
		/>
	);
});
