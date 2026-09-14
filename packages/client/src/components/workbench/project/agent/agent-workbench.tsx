import { useEffect, useMemo } from "react";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type { FileExplorerApi } from "@semoss/shared";
import { useProject, useWorkbench, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import { Workbench } from "../../core";
import { WorkbenchCommandMenuButton } from "../../core/workbench-command-menu-button";
import {
	FILE_CODE_EDITOR_PANEL,
	FILE_DOWNLOAD_PANEL,
	FILE_EXPLORER_PANEL,
	FILE_IMAGE_VIEWER_PANEL,
	FILE_MARKDOWN_EDITOR_PANEL,
	FILE_MCP_EDITOR_PANEL,
	FILE_NOTEBOOK_EDITOR_PANEL,
	FILE_PDF_VIEWER_PANEL,
	FILE_PPTX_VIEWER_PANEL,
} from "../../files";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import {
	createProjectSettingsPanel,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";
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
				config: { type: "PROJECT", id: projectId },
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
const AGENT_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.AGENT_EDITOR]: AGENT_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel([
		{ name: "Overview", component: "project-overview" },
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
	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createAgentWorkbenchLayout(project.project_id, permission),
		[project.project_id, permission],
	);

	const configureWorkbench = useWorkbench((s) => s.configure);

	// keep the assistant's system prompt/tools in sync with the active skill
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureWorkbench({
			resource: {
				type: "PROJECT",
				id: project.project_id,
				permission,
			},
			assistant: {
				systemPrompt: `You are the assistant for the ${name} agent workbench (${project.project_id}). Your role is to help the user configure this agent and work with the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active project.`,
				mcp: [
					{
						type: "PROJECT",
						id: project.project_id,
						name: name,
					},
				],
				runParams: { project: project.project_id },
			},
		});
	}, [
		configureWorkbench,
		permission,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.server.reconnect",
			label: "Reconnect Server",
			handler: () => {
				void insight.actions
					.run("ReconnectServer();")
					.catch(console.error);
			},
		},
		{
			id: "workbench.file.create",
			category: "File",
			label: "Create File",
			visible: !readOnly,
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.openNewFile(undefined, "add_file"),
		},
		{
			id: "workbench.file.create-folder",
			category: "File",
			label: "Create Folder",
			visible: !readOnly,
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.openNewFile(undefined, "add_directory"),
		},
		{
			id: "workbench.file.upload",
			category: "File",
			label: "Upload Files",
			visible: !readOnly,
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.openNewFile(undefined, "upload"),
		},
		{
			id: "workbench.file.refresh",
			category: "File",
			label: "Refresh Files",
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.refresh(),
		},
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
			layout={workbenchLayout}
			components={AGENT_WORKBENCH_COMPONENTS}
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
	);
};
