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
} from "../../workbench.presets";
import {
	createProjectSettingsPanel,
	PROJECT_SETTINGS_TABS,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** The seeded main.ipynb editor tab. Dedupe happens on `config.path`. */
const NOTEBOOK_EDITOR_ID = "notebook-main";

/** The default arrangement: main.ipynb open, files on the left. */
const createNotebookWorkbenchLayout = (
	projectId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [NOTEBOOK_EDITOR_ID],
			activeId: NOTEBOOK_EDITOR_ID,
		},
		panels: {
			[NOTEBOOK_EDITOR_ID]: {
				id: NOTEBOOK_EDITOR_ID,
				type: WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR,
				name: NOTEBOOK_NAME,
				canClose: true,
				config: {
					mode: { type: "APP", app: projectId },
					name: NOTEBOOK_NAME,
					path: NOTEBOOK_PATH,
				},
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
			[WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL.id]:
				WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL,
			[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
				WORKBENCH_PANEL_RECORDS.ASSISTANT,
		},
		borders: {
			left: {
				panelIds: [
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
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
				panelIds: [WORKBENCH_COMPONENTS.ASSISTANT],
				activeId: null,
				size: 400,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
export const NOTEBOOK_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel(
		PROJECT_SETTINGS_TABS,
	),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Notebook workbench — the editable surface for a NOTEBOOK project. Opens
 * `main.ipynb` in the main tabset alongside the project file explorer, a Pixel
 * terminal, and the shared assistant panel.
 */
export const NotebookWorkbench: React.FC = () => {
	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createNotebookWorkbenchLayout(project.project_id, permission),
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

	// keep the assistant's system prompt/tools in sync with the active notebook
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		syncPermission("PROJECT", project.project_id, permission);
		void refreshPermission("PROJECT", project.project_id).catch(
			() => undefined,
		);

		assistantStore.getState().configure({
			systemPrompt: `You are the assistant for the ${name} notebook workbench (${project.project_id}). Your role is to help the user build and run this notebook and the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active notebook.`,
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
			id: "workbench.project-file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: {
				mode: { type: "APP", app: project.project_id },
			},
		}),
		createOpenPanelCommand({
			id: "workbench.project-terminal.open",
			label: "Open Terminal",
			type: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
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
