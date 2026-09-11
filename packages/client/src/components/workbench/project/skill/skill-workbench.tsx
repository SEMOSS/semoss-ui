import { useEffect, useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import {
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
import { PROJECT_INSIGHT_EXPLORER_PANEL } from "../project-insight-explorer-panel";
import {
	createProjectSettingsPanel,
	PROJECT_SETTINGS_TABS,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";

/** Every SKILL project is created with this file. */
const SKILL_PATH = "/public/SKILL.md";
const SKILL_NAME = "SKILL.md";

/** The seeded SKILL.md editor tab. Dedupe happens on `config.path`. */
const SKILL_EDITOR_ID = "skill-md";

/** The default arrangement: SKILL.md open, files and insight on the left. */
const createSkillWorkbenchLayout = (
	projectId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [SKILL_EDITOR_ID],
			activeId: SKILL_EDITOR_ID,
		},
		panels: {
			[SKILL_EDITOR_ID]: {
				id: SKILL_EDITOR_ID,
				type: WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR,
				name: SKILL_NAME,
				canClose: false,
				config: {
					mode: { type: "APP", app: projectId },
					name: SKILL_NAME,
					path: SKILL_PATH,
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
			[WORKBENCH_PANEL_RECORDS.PROJECT_INSIGHT_EXPLORER.id]:
				WORKBENCH_PANEL_RECORDS.PROJECT_INSIGHT_EXPLORER,
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
				panelIds: [WORKBENCH_COMPONENTS.ASSISTANT],
				activeId: null,
				size: 400,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const SKILL_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER]:
		PROJECT_INSIGHT_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel(
		PROJECT_SETTINGS_TABS,
	),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Skill workbench — the editable surface for a SKILL project. Opens `SKILL.md`
 * in the main tabset alongside the project file explorer, the active terminal's
 * insight explorer, a Pixel terminal, and the shared assistant panel.
 */
export const SkillWorkbench: React.FC = () => {
	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createSkillWorkbenchLayout(project.project_id, permission),
		[project.project_id, permission],
	);

	const syncPermission = useSession((s) => s.syncPermission);
	const refreshPermission = useSession((s) => s.refreshPermission);

	const assistantStore = useAssistantStore();

	// keep the assistant's system prompt/tools in sync with the active skill
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		syncPermission("PROJECT", project.project_id, permission);
		void refreshPermission("PROJECT", project.project_id).catch(
			() => undefined,
		);

		assistantStore.getState().configure({
			systemPrompt: `You are the assistant for the ${name} skill workbench (${project.project_id}). Your role is to help the user build and run this skill and the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active project.`,
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
			id: "workbench.project-insight-explorer.open",
			label: "Open Insight File Explorer",
			type: WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
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
				layout={workbenchLayout}
				components={SKILL_WORKBENCH_COMPONENTS}
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
