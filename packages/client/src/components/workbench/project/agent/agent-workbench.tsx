import { useEffect, useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { useCacheState } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import {
	parseWorkbenchSnapshot,
	useWorkbenchCommands,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@semoss/workbench";
import { ASSISTANT_PANEL } from "@/components/assistant";
import { AssistantStoreProvider } from "@/contexts";
import { useAssistantStore, useProject, useSession } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	createFileCommands,
	createOpenPanelCommand,
	createReconnectCommand,
	withTab,
} from "../../workbench.presets";
import {
	createProjectSettingsPanel,
	PROJECT_SETTINGS_TABS,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { AGENT_EDITOR_PANEL } from "./agent-editor-panel";

/**
 * The default arrangement: the agent editor front and centre, files and the
 * insight explorer on a collapsed left rail so they don't take space away
 * from the editor on first load.
 */
const createAgentWorkbenchLayout = (
	projectId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [WORKBENCH_COMPONENTS.AGENT_EDITOR],
			activeId: WORKBENCH_COMPONENTS.AGENT_EDITOR,
		},
		panels: {
			[WORKBENCH_PANEL_RECORDS.AGENT_EDITOR.id]:
				WORKBENCH_PANEL_RECORDS.AGENT_EDITOR,
			[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
				...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
				config: { mode: { type: "APP", app: projectId } },
			},
			[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
				WORKBENCH_PANEL_RECORDS.ASSISTANT,
			...(!readOnly
				? {
						[WORKBENCH_PANEL_RECORDS.GIT_VERSION.id]: {
							...WORKBENCH_PANEL_RECORDS.GIT_VERSION,
							config: { type: "PROJECT", id: projectId },
						},
					}
				: {}),
		},
		borders: {
			left: {
				panelIds: [
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
				],
				activeId: null,
				size: 400,
			},
			right: {
				panelIds: [WORKBENCH_COMPONENTS.ASSISTANT],
				activeId: null,
				size: 400,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
export const AGENT_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	[WORKBENCH_COMPONENTS.AGENT_EDITOR]: AGENT_EDITOR_PANEL,
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel(
		withTab(
			PROJECT_SETTINGS_TABS,
			{
				name: "Agent Activity",
				component: "agent-activity",
				restrict: ["OWNER", "EDIT", "READ_ONLY"],
			},
			// before Access Control
			3,
		),
	),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Agent workbench — the editable surface for a WORKSPACE project. Opens the
 * agent configuration editor in the main tabset alongside the project file
 * explorer and the shared assistant panel.
 *
 * No terminal, unlike the code, notebook and skill workbenches: this one seeds
 * no terminal record, has no bottom border to put one in, and registers no
 * command to open one. It used to register the blueprint anyway, which only
 * meant a panel nothing could reach.
 */
export const AgentWorkbench: React.FC = () => {
	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createAgentWorkbenchLayout(project.project_id, permission),
		[project.project_id, permission],
	);

	// What this workbench is known by: its own cache entry, and — where there
	// is an assistant — the workbench its conversations are tagged with,
	// server-side. Read-only variants keep their own arrangement.
	const workbenchId = readOnly
		? `${project.project_id}--read-only`
		: project.project_id;

	const [snapshot, onSnapshotChange] = useCacheState<WorkbenchSnapshot>(
		workbenchLayout,
		`workbench-layout--${workbenchId}--1`,
		parseWorkbenchSnapshot,
	);

	const syncPermission = useSession((s) => s.syncPermission);
	const refreshPermission = useSession((s) => s.refreshPermission);

	const assistantStore = useAssistantStore(workbenchId);

	// keep the assistant's system prompt/tools in sync with the active skill
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		syncPermission("PROJECT", project.project_id, permission);
		void refreshPermission("PROJECT", project.project_id).catch(
			() => undefined,
		);

		assistantStore.getState().configure({
			systemPrompt: `You are the assistant for the ${name} agent workbench (${project.project_id}). Your role is to help the user configure this agent and work with the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active project.`,
			mcp: [
				{
					type: "PROJECT",
					id: project.project_id,
					name: name,
				},
			],
			runParams: { project: project.project_id },
		});
	}, [
		assistantStore,
		syncPermission,
		refreshPermission,
		permission,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	useWorkbenchCommands([
		createReconnectCommand(insight),
		...createFileCommands({ readOnly: readOnly }),
		createOpenPanelCommand({
			id: "workbench.project-agent-editor.open",
			label: "Open Agent Editor",
			type: WORKBENCH_COMPONENTS.AGENT_EDITOR,
		}),
	]);

	return (
		<AssistantStoreProvider store={assistantStore}>
			<Workbench
				snapshot={snapshot}
				onUnmount={onSnapshotChange}
				borderSlots={{
					left: {
						after: (
							<>
								<WorkbenchCommandMenuButton />
								<ProjectSettingsToggle />
							</>
						),
					},
				}}
			/>
		</AssistantStoreProvider>
	);
};
