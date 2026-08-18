import {
	BotIcon,
	FlaskConicalIcon,
	FolderTreeIcon,
	SettingsIcon,
	SquareTerminalIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
	ProjectInsightExplorerPanel,
	ProjectMcpEditorPanel,
	ProjectPublishButton,
	ProjectSettingsToggle,
	ProjectTerminalPanel,
} from "..";
import { AgentEditorPanel } from "./agent-editor-panel";

/** FlexLayout tabset that hosts the agent editor and any opened files. */
const MAIN_TABSET = "MAIN_TABSET";

/**
 * Agent workbench — the editable surface for a WORKSPACE project. Opens the
 * agent configuration editor in the main tabset alongside the project file
 * explorer, the active terminal's insight explorer, a Pixel terminal, and the
 * shared assistant chat panel.
 */
export const AgentWorkbench: React.FC = () => {
	const registerCommand = useWorkbench((state) => state.registerCommand);
	const { project } = useProject();

	// insightId of the active terminal tab, published by the terminal panel so
	// the Insight file explorer browses the same insight commands run in
	const [terminalInsightId, setTerminalInsightId] = useState<string | null>(
		null,
	);

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
					// Keep file management available from the edge tab without
					// taking space away from the agent editor on first load.
					selected: -1,
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
						children: [WORKBENCH_PANEL_TABS.PROJECT_AGENT_EDITOR],
					},
				],
			},
		};
	}, []);

	const configureChat = useWorkbenchChatConfig((state) => state.configure);

	// keep the assistant's system prompt/tools in sync with the active skill
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureChat({
			systemPrompt: `You are the assistant for the ${name} agent workbench (${project.project_id}). Your role is to help the user configure this agent and work with the rest of the project's files. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active project.`,
			mcp: [
				{
					type: "PROJECT",
					id: project.project_id,
					name: name,
				},
			],
		});
	}, [
		configureChat,
		project.project_display_name,
		project.project_id,
		project.project_name,
	]);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.PROJECT_AGENT_EDITOR]: {
			tab: () => <BotIcon className="size-4" />,
			view: () => <AgentEditorPanel />,
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
				id: "workbench.project-agent-editor.open",
				label: "Open Agent Editor",
				icon: <BotIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.PROJECT_AGENT_EDITOR,
						WORKBENCH_PANEL_TABS.PROJECT_AGENT_EDITOR,
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
					<ProjectPublishButton />
					<ProjectSettingsToggle />
				</>
			}
		/>
	);
};
