import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { InsightProvider, useInsight } from "@semoss/sdk/react";
import { FileExplorer, FlexLayout } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { ProjectDetailTabs } from "@/components/project";
import { useWorkspace } from "@/hooks";
import { WorkspaceManager } from "../../components/workspace";
import { WorkspaceTerminal } from "../../components/workspace/panels";
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
					{
						id: "insight-explorer",
						type: "tab",
						name: "Insight",
						component: "insight-explorer",
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
 * The "Insight" file explorer. Each terminal tab owns its own insight, so this
 * binds to the *active* terminal tab's insight (published to the store by the
 * terminal panel) via an adopting InsightProvider — `mode.INSIGHT` browsing and
 * uploads then land in the same workspace the terminal sees. `destroyOnUnmount`
 * is off so this pane never drops the insight the terminal owns. Its own
 * observer so it re-binds when the active terminal changes; shows a spinner
 * until a terminal insight is ready.
 */
const InsightFilesPanel = observer(() => {
	const { workspace } = useWorkspace();
	const insightId = workspace.activeTerminalInsightId;

	if (!insightId) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-background">
				<Spinner className="size-4" />
			</div>
		);
	}

	return (
		<InsightProvider options={{ insightId }} destroyOnUnmount={false}>
			<FileExplorer mode={{ type: "INSIGHT" }} onItemSelect={() => {}} />
		</InsightProvider>
	);
});

/**
 * Render the code workspace
 */
export const CodeWorkspace: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const insight = useInsight();

	// Inject the Insight tab into the left border if it was loaded from a
	// cached layout that pre-dates this tab. Runs once after the model loads.
	useEffect(() => {
		const model = workspace.model;
		if (!model) return;
		if (model.getNodeById("insight-explorer")) return; // already there

		// Find the left border via the always-present file-explorer tab
		const fileExplorerNode = model.getNodeById("file-explorer");
		const leftBorder = fileExplorerNode?.getParent();
		if (!leftBorder) return;

		model.doAction(
			FlexLayout.Actions.addNode(
				{
					id: "insight-explorer",
					type: "tab",
					name: "Insight",
					component: "insight-explorer",
					enableClose: false,
					config: {},
				},
				leftBorder.getId(),
				FlexLayout.DockLocation.CENTER,
				-1,
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
		} else if (component === "renderer") {
			return <RendererPanel />;
		} else if (component === "settingsPanel") {
			return (
				<ProjectDetailTabs
					type="CODE"
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
		} else if (component === "insight-explorer") {
			return <InsightFilesPanel />;
		} else if (component === "terminal") {
			return (
				<WorkspaceTerminal
					appId={workspace.appId}
					onActiveInsightChange={workspace.setActiveTerminalInsightId}
				/>
			);
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
