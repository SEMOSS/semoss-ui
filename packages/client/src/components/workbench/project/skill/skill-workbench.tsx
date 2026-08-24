import {
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
import { useWorkbenchAssistantConfig } from "@/hooks/use-workbench-assistant-config";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import {
	ProjectFileEditorPanel,
	ProjectFileExplorerPanel,
	ProjectInsightExplorerPanel,
	ProjectMcpEditorPanel,
	ProjectPublishButton,
	ProjectSettingsToggle,
	ProjectTerminalPanel,
} from "..";

/** FlexLayout tabset that hosts SKILL.md and any other opened files. */
const MAIN_TABSET = "MAIN_TABSET";

/** Every SKILL project is created with this file. */
const SKILL_PATH = "/public/SKILL.md";
const SKILL_NAME = "SKILL.md";

/**
 * Skill workbench — the editable surface for a SKILL project. Opens `SKILL.md`
 * in the main tabset alongside the project file explorer, the active terminal's
 * insight explorer, a Pixel terminal, and the shared assistant panel.
 */
export const SkillWorkbench: React.FC = () => {
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
					selected: 0,
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
							id: WORKBENCH_COMPONENTS.ASSISTANT,
							name: "Assistant",
							component: WORKBENCH_COMPONENTS.ASSISTANT,
							helpText: "Assistant",
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
								// openPanel looks for, so selecting SKILL.md in the
								// explorer re-selects this tab instead of duplicating it
								id: `${WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR}--${SKILL_PATH}`,
								type: "tab",
								name: SKILL_NAME,
								component:
									WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
								config: {
									name: SKILL_NAME,
									path: SKILL_PATH,
								},
								enableClose: false,
							},
						],
					},
				],
			},
		};
	}, []);

	const configureAssistant = useWorkbenchAssistantConfig(
		(state) => state.configure,
	);

	// keep the assistant's system prompt/tools in sync with the active skill
	useEffect(() => {
		const name = project.project_display_name || project.project_name;

		configureAssistant({
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
		configureAssistant,
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
		[WORKBENCH_COMPONENTS.ASSISTANT]: WORKBENCH_ASSISTANT_PANEL,
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
