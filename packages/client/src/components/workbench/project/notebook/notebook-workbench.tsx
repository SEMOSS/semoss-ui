import { FolderTreeIcon, SettingsIcon, SquareTerminalIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { ProjectDetailTabs } from "@/components/project";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_TABS,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@/components/workbench";
import { useProject, useWorkbench } from "@/hooks";
import { useWorkbenchChatConfig } from "@/hooks/use-workbench-chat-config";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WORKBENCH_CHAT_PANEL } from "../../chat";
import {
	ProjectFileEditorPanel,
	ProjectFileExplorerPanel,
	ProjectMcpEditorPanel,
	ProjectSettingsToggle,
	ProjectTerminalPanel,
} from "..";

/** FlexLayout tabset that hosts the notebook and any other opened files. */
const MAIN_TABSET = "MAIN_TABSET";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/**
 * Notebook workbench — the editable surface for a NOTEBOOK project. Opens
 * `main.ipynb` in the main tabset alongside the project file explorer, a Pixel
 * terminal, and the shared assistant chat panel.
 */
export const NotebookWorkbench: React.FC = () => {
	const registerCommand = useWorkbench((state) => state.registerCommand);
	const { project } = useProject();

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
					children: [WORKBENCH_PANEL_TABS.PROJECT_FILE_EXPLORER],
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
					selected: -1,
					children: [
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.CHAT,
							name: "Chat",
							component: WORKBENCH_COMPONENTS.CHAT,
							helpText: "Chat",
							enableClose: false,
							enableRenderOnDemand: false,
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
						id: MAIN_TABSET,
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [
							{
								// the `--<path>` id form is what the file explorer's
								// openPanel looks for, so selecting main.ipynb in the
								// explorer re-selects this tab instead of duplicating it
								id: `${WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR}--${NOTEBOOK_PATH}`,
								type: "tab",
								name: NOTEBOOK_NAME,
								component:
									WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
								config: {
									name: NOTEBOOK_NAME,
									path: NOTEBOOK_PATH,
								},
								enableClose: true,
							},
						],
					},
				],
			},
		};
	}, []);

	const configureChat = useWorkbenchChatConfig((state) => state.configure);

	// keep the assistant's system prompt/tools in sync with the active notebook
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureChat({
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
		configureChat,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return <ProjectFileExplorerPanel layout={layout} node={node} />;
			},
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
		[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: {
			tab: () => <SquareTerminalIcon className="size-4" />,
			view: () => {
				return (
					<div className="h-full w-full overflow-hidden">
						<ProjectTerminalPanel />
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
					]}
				/>
			),
		},
		[WORKBENCH_COMPONENTS.CHAT]: WORKBENCH_CHAT_PANEL,
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
					<ProjectSettingsToggle />
				</>
			}
		/>
	);
};
