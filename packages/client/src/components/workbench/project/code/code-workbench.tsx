import { useCallback, useEffect, useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchCommands,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@semoss/workbench";
import { ASSISTANT_PANEL } from "@/components/assistant";
import { AssistantStoreProvider } from "@/contexts";
import { useAssistantStore, useProject, useSession } from "@/hooks";
import type { BuildRun } from "@/stores/assistant";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	createFileCommands,
	createOpenPanelCommand,
	createReconnectCommand,
} from "../../workbench.presets";
import { PROJECT_ENGINES_PANEL } from "../project-engines-panel";
import { PROJECT_INSIGHT_EXPLORER_PANEL } from "../project-insight-explorer-panel";
import { ProjectPublishButton } from "../project-publish-button";
import {
	createProjectSettingsPanel,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";
import { PROJECT_APP_RENDERER_PANEL } from "./code-app-renderer-panel";

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
 * The default arrangement: the app preview front and centre, files on the
 * left, the terminal below, and the assistant open on the right — it is the
 * primary build surface for a CODE project (a cached layout still wins for
 * users who closed it).
 */
const createCodeWorkbenchLayout = (
	projectId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER],
			activeId: WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
		},
		panels: {
			[WORKBENCH_PANEL_RECORDS.PROJECT_APP_RENDERER.id]: {
				...WORKBENCH_PANEL_RECORDS.PROJECT_APP_RENDERER,
				config: { previewVersion: 0 },
			},
			[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
				...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
				config: { mode: { type: "APP", app: projectId } },
			},
			...(!readOnly
				? {
						[WORKBENCH_PANEL_RECORDS.GIT_VERSION.id]: {
							...WORKBENCH_PANEL_RECORDS.GIT_VERSION,
							config: { type: "PROJECT", id: projectId },
						},
					}
				: {}),
			[WORKBENCH_PANEL_RECORDS.PROJECT_INSIGHT_EXPLORER.id]:
				WORKBENCH_PANEL_RECORDS.PROJECT_INSIGHT_EXPLORER,
			[WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL.id]:
				WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL,
			[WORKBENCH_PANEL_RECORDS.PROJECT_ENGINES.id]:
				WORKBENCH_PANEL_RECORDS.PROJECT_ENGINES,
			[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
				WORKBENCH_PANEL_RECORDS.ASSISTANT,
		},
		borders: {
			left: {
				panelIds: [
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
					WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
				],
				activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
				size: 400,
			},
			bottom: {
				panelIds: [WORKBENCH_COMPONENTS.PROJECT_TERMINAL],
				activeId: null,
				size: 300,
			},
			right: {
				panelIds: [
					WORKBENCH_COMPONENTS.ASSISTANT,
					WORKBENCH_COMPONENTS.PROJECT_ENGINES,
				],
				activeId: WORKBENCH_COMPONENTS.ASSISTANT,
				size: 400,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const CODE_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER]: PROJECT_APP_RENDERER_PANEL,
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER]:
		PROJECT_INSIGHT_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_ENGINES]: PROJECT_ENGINES_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
	// PROJECT_SETTINGS_TABS plus Dependencies and Settings, inserted at two
	// different points — written out rather than nested `withTab` calls, where
	// the second index would have to account for the first insertion
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel([
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
	]),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Code workbench — the editable surface for a CODE project. Shows a live
 * preview of the published app alongside the project file explorer, the
 * terminal's insight file explorer, a Pixel terminal, and the shared assistant
 * assistant panel.
 */
export const CodeWorkbench: React.FC = () => {
	const layoutActions = useWorkbench((s) => s.layout.actions);
	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createCodeWorkbenchLayout(project.project_id, permission),
		[project.project_id, permission],
	);

	/**
	 * Refresh the code renderer
	 */
	const refreshCodeRenderer = useCallback(() => {
		layoutActions.setPanelValue(
			WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
			(count = 0) => count + 1,
		);
	}, [layoutActions]);

	const handleRunCompleted = useCallback(
		(run: BuildRun, runs: Record<string, BuildRun>) => {
			if (!runTreePublished(run, runs)) {
				return;
			}
			// Give the publish a beat to finish moving assets before the
			// preview remounts.
			window.setTimeout(() => {
				refreshCodeRenderer();
			}, 500);
		},
		[refreshCodeRenderer],
	);

	// Manual "rebuild the app" from the assistant header — the same full compile +
	// publish the agent's publish tool performs. Thrown errors surface as an
	// error toast in the assistant panel.
	const handleRebuild = useCallback(async () => {
		if (readOnly) {
			return;
		}
		await insight.actions.run(
			`BuildAndPublishApp(project='${project.project_id}');`,
		);
		refreshCodeRenderer();
		toast.success("App rebuilt and published.");
	}, [readOnly, insight.actions, project.project_id, refreshCodeRenderer]);

	const syncPermission = useSession((s) => s.syncPermission);
	const refreshPermission = useSession((s) => s.refreshPermission);

	const assistantStore = useAssistantStore();

	// keep the assistant's system prompt/tools in sync with the active app
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		syncPermission("PROJECT", project.project_id, permission);
		void refreshPermission("PROJECT", project.project_id).catch(
			() => undefined,
		);

		assistantStore.getState().configure({
			systemPrompt: `You are the assistant for the ${name} code workbench (${project.project_id}). Your role is to help the user build and run this app and the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active project.`,
			mcp: [
				{
					type: "PROJECT",
					id: project.project_id,
					name: name,
				},
			],
			runParams: { project: project.project_id },
			permissionMode: readOnly ? null : "acceptEdits",
			onRunCompleted: handleRunCompleted,
			onRebuild: readOnly ? undefined : handleRebuild,
		});
	}, [
		assistantStore,
		readOnly,
		syncPermission,
		refreshPermission,
		handleRebuild,
		handleRunCompleted,
		permission,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	useWorkbenchCommands([
		createReconnectCommand(insight),
		...createFileCommands({ readOnly: readOnly }),
		createOpenPanelCommand({
			id: "workbench.project-file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: {
				mode: { type: "APP", app: project.project_id },
			},
		}),
		createOpenPanelCommand({
			id: "workbench.project-insight-explorer.open",
			label: "Open Insight File Explorer",
			type: WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
		}),
		createOpenPanelCommand({
			id: "workbench.project-app-renderer.open",
			label: "Open App Preview",
			type: WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
		}),
		createOpenPanelCommand({
			id: "workbench.project-terminal.open",
			label: "Open Terminal",
			type: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
		}),
		createOpenPanelCommand({
			id: "workbench.project-engines.open",
			label: "Open Available Engines",
			type: WORKBENCH_COMPONENTS.PROJECT_ENGINES,
		}),
		createOpenPanelCommand({
			id: "workbench.project-settings.open",
			label: "Open Settings",
			type: WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
		}),
	]);

	return (
		<AssistantStoreProvider store={assistantStore}>
			<Workbench
				layout={workbenchLayout}
				components={CODE_WORKBENCH_COMPONENTS}
				borderSlots={{
					left: {
						after: (
							<>
								<WorkbenchCommandMenuButton />
								<ProjectPublishButton />
								<ProjectSettingsToggle />
							</>
						),
					},
				}}
			/>
		</AssistantStoreProvider>
	);
};
