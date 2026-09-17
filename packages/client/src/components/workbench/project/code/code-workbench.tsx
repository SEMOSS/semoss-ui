import { useCallback, useEffect, useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { toast, useCacheData } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchCommands,
	Workbench,
	WorkbenchCommandMenuButton,
	WorkbenchResetButton,
} from "@semoss/workbench";
import { ASSISTANT_PANEL } from "@/components/assistant";
import { AssistantStoreProvider } from "@/contexts";
import { useAssistantStore, useProject, useSession } from "@/hooks";
import type { BuildRun } from "@/stores/assistant";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_EVENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	runTreeTools,
	useAssistantFilesChanged,
} from "../../use-assistant-files-changed";
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
			[WORKBENCH_PANEL_RECORDS.PROJECT_APP_RENDERER.id]:
				WORKBENCH_PANEL_RECORDS.PROJECT_APP_RENDERER,
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
export const CODE_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
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
	const emit = useWorkbench((s) => s.events.actions.emit);
	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createCodeWorkbenchLayout(project.project_id, permission),
		[project.project_id, permission],
	);

	// What this workbench is known by: its own cache entry, and — where there
	// is an assistant — the workbench its conversations are tagged with,
	// server-side. Read-only variants keep their own arrangement.
	const workbenchId = readOnly
		? `${project.project_id}--read-only`
		: project.project_id;

	const [snapshot, onSnapshotChange] = useCacheData<WorkbenchSnapshot>(
		`workbench-layout--${workbenchId}--1`,
		workbenchLayout,
	);

	/**
	 * Announce that the project's frontend was published.
	 *
	 * Whoever is showing it decides what to do — today that is the preview
	 * panel, which remounts its iframe. This used to reach into that panel and
	 * bump its scratch value by a hardcoded id, which the dock's own rules
	 * forbid and which only ever worked for this one publisher.
	 */
	const announcePublished = useCallback(() => {
		emit(WORKBENCH_EVENTS.APP_PUBLISHED, { projectId: project.project_id });
	}, [emit, project.project_id]);

	const filesChanged = useAssistantFilesChanged({
		type: "APP",
		app: project.project_id,
	});

	const handleRunCompleted = useCallback(
		(run: BuildRun, runs: Record<string, BuildRun>) => {
			filesChanged(run, runs);

			if (
				runTreeTools(run, runs).some((tool) =>
					PUBLISH_TOOL_RE.test(tool.name),
				)
			) {
				// The run only tells us a publish *tool ran*, not that the
				// server finished moving the assets — there is no settle signal
				// to wait on, so the delay stays here, with the producer that
				// knows why it is needed, rather than in every consumer.
				window.setTimeout(announcePublished, 500);
			}
		},
		[announcePublished, filesChanged],
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
		// No delay needed here: the pixel is awaited, so the publish has
		// already settled by the time this returns.
		announcePublished();
		toast.success("App rebuilt and published.");
	}, [readOnly, insight.actions, project.project_id, announcePublished]);

	const syncPermission = useSession((s) => s.syncPermission);
	const refreshPermission = useSession((s) => s.refreshPermission);

	const assistantStore = useAssistantStore(workbenchId);

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
				snapshot={snapshot}
				onChange={onSnapshotChange}
				borderSlots={{
					left: {
						after: (
							<>
								<WorkbenchCommandMenuButton />
								<ProjectPublishButton />
								<ProjectSettingsToggle />
								<WorkbenchResetButton
									snapshot={workbenchLayout}
								/>
							</>
						),
					},
				}}
			/>
		</AssistantStoreProvider>
	);
};
