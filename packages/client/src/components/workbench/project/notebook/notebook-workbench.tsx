import { FolderTreeIcon, SettingsIcon, SquareTerminalIcon } from "lucide-react";
import { useEffect } from "react";
import { useProject, useWorkbench, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import { Workbench } from "../../core";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { WorkbenchCommandMenuButton } from "../../workbench-command-menu-button";
import { PROJECT_FILE_EDITOR_PANEL } from "../project-file-editor-panel";
import { PROJECT_FILE_EXPLORER_PANEL } from "../project-file-explorer-panel";
import { PROJECT_MCP_EDITOR_PANEL } from "../project-mcp-editor-panel";
import {
	createProjectSettingsPanel,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** The seeded main.ipynb editor tab. Dedupe happens on `config.path`. */
const NOTEBOOK_EDITOR_ID = "notebook-main";

/** The default arrangement: main.ipynb open, files on the left. */
const NOTEBOOK_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 1,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [NOTEBOOK_EDITOR_ID],
		activeId: NOTEBOOK_EDITOR_ID,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[NOTEBOOK_EDITOR_ID]: {
			id: NOTEBOOK_EDITOR_ID,
			type: WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
			name: NOTEBOOK_NAME,
			canClose: true,
			config: { name: NOTEBOOK_NAME, path: NOTEBOOK_PATH },
		},
		[WORKBENCH_PANEL_RECORDS.PROJECT_FILE_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.PROJECT_FILE_EXPLORER,
		[WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL.id]:
			WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL,
		[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
			WORKBENCH_PANEL_RECORDS.ASSISTANT,
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER],
			activeId: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
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

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const NOTEBOOK_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER]: PROJECT_FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR]: PROJECT_FILE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR]: PROJECT_MCP_EDITOR_PANEL,
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
 * Notebook workbench — the editable surface for a NOTEBOOK project. Opens
 * `main.ipynb` in the main tabset alongside the project file explorer, a Pixel
 * terminal, and the shared assistant panel.
 */
export const NotebookWorkbench: React.FC = () => {
	const { project } = useProject();

	const configureAssistant = useWorkbench((s) => s.assistant.configure);

	// keep the assistant's system prompt/tools in sync with the active notebook
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureAssistant({
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
		configureAssistant,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.project-file-explorer.open",
			label: "Open File Explorer",
			icon: <FolderTreeIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
				);
			},
		},
		{
			id: "workbench.project-terminal.open",
			label: "Open Terminal",
			icon: <SquareTerminalIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
				);
			},
		},
		{
			id: "workbench.project-settings.open",
			label: "Open Settings",
			icon: <SettingsIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
				);
			},
		},
	]);

	return (
		<Workbench
			layout={NOTEBOOK_WORKBENCH_LAYOUT}
			components={NOTEBOOK_WORKBENCH_COMPONENTS}
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
