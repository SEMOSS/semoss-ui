import {
	BlocksIcon,
	FlaskConicalIcon,
	FolderTreeIcon,
	PanelsTopLeftIcon,
	SettingsIcon,
	SquareTerminalIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { ProjectDetailTabs } from "@/components/project";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_TABS,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@/components/workbench";
import { useProject, useWorkbench } from "@/hooks";
import { useWorkbenchAssistantConfig } from "@/hooks/use-workbench-assistant-config";
import type { BuildRun, WorkbenchPanelConfig } from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import {
	ProjectEnginesPanel,
	ProjectFileEditorPanel,
	ProjectFileExplorerPanel,
	ProjectInsightExplorerPanel,
	ProjectMcpEditorPanel,
	ProjectPublishButton,
	ProjectSettingsToggle,
	ProjectTerminalPanel,
} from "..";
import { CodeAppRendererPanel } from "./code-app-renderer-panel";

/** FlexLayout tabset that hosts the app preview and any opened files. */
const MAIN_TABSET = "MAIN_TABSET";

/**
 * Tool names that publish the app's frontend, matched case-insensitively on
 * the (possibly MCP-aliased) tool name.
 */
const PUBLISH_TOOL_RE = /buildandpublishapp|publishproject/i;

/**
 * Whether a completed run — or any subagent run in its tree — invoked a tool
 * that published the app's frontend, meaning the preview iframe is stale.
 *
 * @name runTreePublished
 * @param run - The completed root run.
 * @param runs - The assistant slice's full run map, for resolving subagents.
 * @return Whether any tool in the run tree published the frontend.
 */
const runTreePublished = (
	run: BuildRun,
	runs: Record<string, BuildRun>,
): boolean => {
	const stack: BuildRun[] = [run];
	const seen = new Set<string>();
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current || seen.has(current.runId)) continue;
		seen.add(current.runId);
		if (current.tools.some((tool) => PUBLISH_TOOL_RE.test(tool.name))) {
			return true;
		}
		for (const childRunId of current.childRunIds) {
			const child = runs[childRunId];
			if (child) stack.push(child);
		}
	}
	return false;
};

/**
 * Code workbench — the editable surface for a CODE project. Shows a live
 * preview of the published app alongside the project file explorer, the
 * terminal's insight file explorer, a Pixel terminal, and the shared assistant
 * assistant panel.
 */
export const CodeWorkbench: React.FC = () => {
	const registerCommand = useWorkbench((state) => state.registerCommand);
	const { project } = useProject();
	const insight = useInsight();

	// insightId of the active terminal tab, published by the terminal panel so
	// the Insight file explorer browses the same insight commands run in
	const [terminalInsightId, setTerminalInsightId] = useState<string | null>(
		null,
	);

	// Bumped when an agent run publishes the frontend; keys the preview panel
	// so its iframe remounts on the freshly published assets.
	const [previewVersion, setPreviewVersion] = useState(0);

	const handleRunCompleted = useCallback(
		(run: BuildRun, runs: Record<string, BuildRun>) => {
			if (!runTreePublished(run, runs)) return;
			// Give the publish a beat to finish moving assets before the
			// preview remounts.
			window.setTimeout(() => {
				setPreviewVersion((version) => version + 1);
			}, 500);
		},
		[],
	);

	// Manual "rebuild the app" from the assistant header — the same full compile +
	// publish the agent's publish tool performs. Thrown errors surface as an
	// error toast in the assistant panel.
	const handleRebuild = useCallback(async () => {
		await insight.actions.run(
			`BuildAndPublishApp(project='${project.project_id}');`,
		);
		setPreviewVersion((version) => version + 1);
		toast.success("App rebuilt and published.");
	}, [insight.actions, project.project_id]);

	const layout = useMemo<FlexLayout.IJsonModel>(() => {
		return {
			global: {
				tabSetEnableDeleteWhenEmpty: true,
				tabEnableRename: false,
			},
			borders: [
				{
					type: "border",
					location: "left",
					size: 400,
					selected: 0,
					children: [
						WORKBENCH_PANEL_TABS.PROJECT_FILE_EXPLORER,
						WORKBENCH_PANEL_TABS.PROJECT_INSIGHT_EXPLORER,
					],
				},
				{
					type: "border",
					location: "bottom",
					size: 300,
					selected: -1,
					children: [WORKBENCH_PANEL_TABS.PROJECT_TERMINAL],
				},
				{
					type: "border",
					location: "right",
					size: 400,
					minSize: 320,
					// The assistant is the primary build surface for a CODE project —
					// open by default (a cached layout still wins for users
					// who closed it).
					selected: 0,
					children: [
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.ASSISTANT,
							name: "Assistant",
							component: WORKBENCH_COMPONENTS.ASSISTANT,
							helpText: "Assistant",
							enableClose: false,
							enableRenderOnDemand: false,
						},
						WORKBENCH_PANEL_TABS.PROJECT_ENGINES,
					],
				},
			],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						id: MAIN_TABSET,
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [WORKBENCH_PANEL_TABS.PROJECT_APP_RENDERER],
					},
				],
			},
		};
	}, []);

	const configureAssistant = useWorkbenchAssistantConfig(
		(state) => state.configure,
	);

	// keep the assistant's system prompt/tools in sync with the active app
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureAssistant({
			systemPrompt: `You are the assistant for the ${name} code workbench (${project.project_id}). Your role is to help the user build and run this app and the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active project.`,
			mcp: [
				{
					type: "PROJECT",
					id: project.project_id,
					name: name,
				},
			],
			runParams: { project: project.project_id },
			permissionMode: "acceptEdits",
			onRunCompleted: handleRunCompleted,
			onRebuild: handleRebuild,
		});
	}, [
		configureAssistant,
		handleRebuild,
		handleRunCompleted,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER]: {
			tab: () => <PanelsTopLeftIcon className="size-4" />,
			view: () => <CodeAppRendererPanel key={previewVersion} />,
		},
		[WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return <ProjectFileExplorerPanel layout={layout} node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER]: {
			tab: () => <FlaskConicalIcon className="size-4" />,
			view: () => (
				<ProjectInsightExplorerPanel insightId={terminalInsightId} />
			),
		},
		[WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <ProjectFileEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <ProjectMcpEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.PROJECT_ENGINES]: {
			tab: () => <BlocksIcon className="size-4" />,
			view: () => <ProjectEnginesPanel />,
		},
		[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: {
			tab: () => <SquareTerminalIcon className="size-4" />,
			view: () => {
				return (
					<div className="h-full w-full overflow-hidden">
						<ProjectTerminalPanel
							onActiveInsightChange={setTerminalInsightId}
						/>
					</div>
				);
			},
		},
		[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: {
			tab: () => <SettingsIcon className="size-4" />,
			view: () => (
				<ProjectDetailTabs
					tabs={[
						{ name: "Overview", component: "project-overview" },
						{
							name: "Dependencies",
							component: "project-dependencies",
							restrict: ["OWNER", "EDIT", "READ_ONLY"],
						},
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
							name: "Settings",
							component: "settings",
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
			),
		},
		[WORKBENCH_COMPONENTS.ASSISTANT]: WORKBENCH_ASSISTANT_PANEL,
	};

	useEffect(() => {
		return registerCommand([
			{
				id: "workbench.project-file-explorer.open",
				label: "Open File Explorer",
				icon: <FolderTreeIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
						WORKBENCH_PANEL_TABS.PROJECT_FILE_EXPLORER,
						{ type: "BORDER", location: "left" },
					);
				},
			},
			{
				id: "workbench.project-insight-explorer.open",
				label: "Open Insight File Explorer",
				icon: <FlaskConicalIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
						WORKBENCH_PANEL_TABS.PROJECT_INSIGHT_EXPLORER,
						{ type: "BORDER", location: "left" },
					);
				},
			},
			{
				id: "workbench.project-app-renderer.open",
				label: "Open App Preview",
				icon: <PanelsTopLeftIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
						WORKBENCH_PANEL_TABS.PROJECT_APP_RENDERER,
					);
				},
			},
			{
				id: "workbench.project-terminal.open",
				label: "Open Terminal",
				icon: <SquareTerminalIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
						WORKBENCH_PANEL_TABS.PROJECT_TERMINAL,
						{ type: "BORDER", location: "bottom" },
					);
				},
			},
			{
				id: "workbench.project-engines.open",
				label: "Open Available Engines",
				icon: <BlocksIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_ENGINES,
						WORKBENCH_PANEL_TABS.PROJECT_ENGINES,
						{ type: "BORDER", location: "right" },
					);
				},
			},
			{
				id: "workbench.project-settings.open",
				label: "Open Settings",
				icon: <SettingsIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
						WORKBENCH_PANEL_TABS.PROJECT_SETTINGS,
					);
				},
			},
		]);
	}, [registerCommand]);

	return (
		<Workbench
			layout={layout}
			components={components}
			actions={
				<>
					<WorkbenchCommandMenuButton />
					<ProjectPublishButton />
					<ProjectSettingsToggle />
				</>
			}
		/>
	);
};
