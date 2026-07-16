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
			children: [],
		},
	},
};

const SKILL_MD_TAB_ID = "SKILL_MD";

export const SkillWorkspace: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const insight = useInsight();
	const skillMdOpened = useRef(false);

	useEffect(() => {
		const model = workspace.model;
		if (!model || skillMdOpened.current) return;
		skillMdOpened.current = true;

		if (model.getNodeById(SKILL_MD_TAB_ID)) return;

		const tabsetId =
			model.getActiveTabset()?.getId() ??
			model.getRoot().getChildren()[0]?.getId() ??
			"";
		if (!tabsetId) return;

		model.doAction(
			FlexLayout.Actions.addNode(
				{
					id: SKILL_MD_TAB_ID,
					type: "tab",
					name: "SKILL.md",
					component: "app-file-editor",
					config: { name: "SKILL.md", path: "/skill/SKILL.md" },
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

		if (component === "app-file-explorer") {
			return (
				<AppFileExplorer
					node={node}
					layout={layout}
					app={workspace.appId}
					initialPath="/skill"
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
		} else if (component === "settingsPanel") {
			return (
				<ProjectDetailTabs
					type="SKILL"
					tabs={[
						{ name: "Overview", path: "" },
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
