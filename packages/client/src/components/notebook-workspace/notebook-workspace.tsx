import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { ProjectDetailTabs } from "@/components/project";
import { useProject, useWorkspace } from "@/hooks";
import type { WorkspaceOptions } from "../../stores";
import { CodeWorkspaceActions } from "../code-workspace/code-workspace-actions";
import { MCPJsonEditor } from "../shared";
import {
	WorkspaceManager,
	WorkspaceNavbar,
	WorkspaceTerminal,
} from "../workspace";

const NOTEBOOK_MAIN_TAB_ID = "MAIN_IPYNB";

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
				],
			},
		],
		layout: {
			type: "row",
			weight: 100,
			children: [
				{
					type: "tabset",
					id: "main-tabset",
					weight: 100,
					selected: 0,
					enableMaximize: true,
					children: [
						{
							id: NOTEBOOK_MAIN_TAB_ID,
							type: "tab",
							name: "main.ipynb",
							component: "app-file-editor",
							config: {
								name: "main.ipynb",
								path: "/public/main.ipynb",
							},
							enableClose: true,
						},
					],
				},
			],
		},
	},
};

export const NotebookWorkspace: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const { project } = useProject();
	const insight = useInsight();

	const FACTORY: React.ComponentProps<typeof WorkspaceManager>["factory"] = (
		node,
		layout,
	) => {
		const component = node.getComponent();
		const config = node.getConfig();

		if (component === "app-file-explorer") {
			return (
				<AppFileExplorer
					node={node}
					layout={layout}
					app={project.project_id}
				/>
			);
		} else if (component === "app-file-editor") {
			return <AppFileEditor node={node} app={project.project_id} />;
		} else if (component === "mcpJsonEditor") {
			return <MCPJsonEditor dataMap={config.data} />;
		} else if (component === "settings-panel") {
			return (
				<ProjectDetailTabs
					tabs={[
						{ name: "Overview", component: "project-overview" },
						{
							name: "MCP",
							component: "mcp-usage",
							restrict: ["OWNER", "EDIT", "READ_ONLY"],
						},
						{
							name: "Commits",
							component: "commits",
							restrict: ["OWNER", "EDIT"],
						},
						{
							name: "GitHub",
							component: "github",
							restrict: ["OWNER"],
						},
						{
							name: "Access Control",
							component: "access-control",
							restrict: ["OWNER", "EDIT"],
						},
						{
							name: "SMSS",
							component: "smss",
							restrict: ["OWNER"],
						},
					]}
				/>
			);
		} else if (component === "terminal") {
			return <WorkspaceTerminal appId={project.project_id} />;
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
					`RenameAppAsset(project=["${project.project_id}"], filePath=["${path}"], newValue=["${newPath}"]);`,
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
		<>
			<WorkspaceNavbar actions={<CodeWorkspaceActions />} />
			<WorkspaceManager
				options={DEFAULT_OPTIONS}
				factory={FACTORY}
				onAction={handleAction}
			/>
		</>
	);
});
