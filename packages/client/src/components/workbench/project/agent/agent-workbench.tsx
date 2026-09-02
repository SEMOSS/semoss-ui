import { useEffect } from "react";
import { useProject, useWorkbench, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import { Workbench } from "../../core";
import { WorkbenchCommandMenuButton } from "../../core/workbench-command-menu-button";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import {
	createProjectSettingsPanel,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";
import {
	GitBranchControl,
	PROJECT_GIT_CONFLICT_RESOLVER_PANEL,
	PROJECT_GIT_DIFF_PANEL,
	PROJECT_VERSION_CONTROL_PANEL,
} from "../version-control";
import { AGENT_EDITOR_PANEL } from "./agent-editor-panel";

/**
 * The default arrangement: the agent editor front and centre, files and the
 * insight explorer on a collapsed left rail so they don't take space away
 * from the editor on first load.
 */
const AGENT_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 1,
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
		[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
			WORKBENCH_PANEL_RECORDS.ASSISTANT,
		[WORKBENCH_PANEL_RECORDS.PROJECT_VERSION_CONTROL.id]:
			WORKBENCH_PANEL_RECORDS.PROJECT_VERSION_CONTROL,
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.PROJECT_VERSION_CONTROL],
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

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const AGENT_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.AGENT_EDITOR]: AGENT_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_VERSION_CONTROL]:
		PROJECT_VERSION_CONTROL_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_GIT_CONFLICT_RESOLVER]:
		PROJECT_GIT_CONFLICT_RESOLVER_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_GIT_DIFF]: PROJECT_GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel([
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
			name: "Agent Activity",
			component: "agent-activity",
			restrict: ["OWNER", "EDIT", "READ_ONLY"],
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
	[WORKBENCH_COMPONENTS.ASSISTANT]: WORKBENCH_ASSISTANT_PANEL,
};

/**
 * Agent workbench — the editable surface for a WORKSPACE project. Opens the
 * agent configuration editor in the main tabset alongside the project file
 * explorer, the active terminal's insight explorer, a Pixel terminal, and the
 * shared assistant panel.
 */
export const AgentWorkbench: React.FC = () => {
	const { project } = useProject();

	const configureAssistant = useWorkbench((s) => s.assistant.configure);

	// keep the assistant's system prompt/tools in sync with the active skill
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureAssistant({
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
		configureAssistant,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.project-agent-editor.open",
			category: "View",
			label: "Open Agent Editor",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.AGENT_EDITOR,
				);
			},
		},
	]);

	return (
		<Workbench
			layout={AGENT_WORKBENCH_LAYOUT}
			components={AGENT_WORKBENCH_COMPONENTS}
			borderSlots={{
				bottom: {
					before: <GitBranchControl />,
				},
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
	);
};
