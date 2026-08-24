import {
	FileTextIcon,
	FolderTreeIcon,
	MessageSquareIcon,
	SettingsIcon,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { makeEngineRoomMcp } from "@/api/rooms";
import {
	WORKBENCH_COMPONENTS,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@/components/workbench";
import { useEngine, useWorkbench } from "@/hooks";
import { useWorkbenchAssistantConfig } from "@/hooks/use-workbench-assistant-config";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
	EngineSettingsToggle,
} from "..";
import { VectorDocumentsPanel } from "./vector-documents-panel";

const VECTOR_MAIN_TABSET = "vector-main-tabset";

/**
 * Vector workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const VectorWorkbench: React.FC = () => {
	const registerCommand = useWorkbench((state) => state.registerCommand);
	const { engine } = useEngine();

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
					size: 300,
					selected: 0,
					children: [
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.FILE_EXPLORER,
							name: "Files",
							component: WORKBENCH_COMPONENTS.FILE_EXPLORER,
							config: {},
							helpText: "File Explorer",
							enableClose: false,
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
						id: VECTOR_MAIN_TABSET,
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [
							{
								type: "tab",
								id: WORKBENCH_COMPONENTS.ASSISTANT,
								name: "Assistant",
								component: WORKBENCH_COMPONENTS.ASSISTANT,
								helpText: "Vector workbench assistant",
								enableClose: false,
								enableRenderOnDemand: false,
							},
							{
								type: "tab",
								id: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
								name: "Documents",
								component:
									WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
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

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureAssistant({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} vector workbench (${engine.engine_id}, subtype ${engine.engine_subtype || "unknown"}). Use only the tools provided in this room and decide whether a tool is needed for each request. For questions about indexed content, call VectorDatabaseQuery before answering, ground the answer only in its returned chunks, and cite the Source and Divider when available. Use ListDocumentsInVectorDatabase when the user asks what is indexed. For requests to add, download, or remove vector documents, or to inspect or change engine asset files, use the matching room tool; honor its approval requirement and the user's permissions. When the user attaches a file and asks to index it, use the available attachment path with the document embedding tool. Simple greetings or general guidance that do not require engine data can be answered without a tool. Do not invent unsupported parameters, and never claim an operation succeeded unless its tool result confirms success.`,
			prepareRoom: (insightId) =>
				makeEngineRoomMcp(insightId, engine.engine_id),
		});
	}, [
		configureAssistant,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
		engine.engine_subtype,
	]);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return <EngineFileExplorerPanel layout={layout} node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS]: {
			tab: () => <FileTextIcon className="size-4" />,
			view: () => <VectorDocumentsPanel />,
		},
		[WORKBENCH_COMPONENTS.FILE_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <EngineFileEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.MCP_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <EngineMcpEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]: {
			tab: () => <SettingsIcon className="size-4" />,
			view: () => (
				<EngineSettingsPanel
					tabs={[
						{
							name: "Overview",
							component: "overview",
							restrict: [
								"READ_ONLY",
								"EDIT",
								"OWNER",
								"DISCOVERABLE",
							],
						},
						{
							name: "Usage",
							component: "usage",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "MCP",
							component: "mcp-usage",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "Activity Log",
							component: "activity",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "Access Control",
							component: "access-control",
							restrict: ["EDIT", "OWNER"],
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
				id: "workbench.file-explorer.open",
				label: "Open File Explorer",
				icon: <FolderTreeIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.FILE_EXPLORER, {
						type: "tab",
						name: "Files",
						component: WORKBENCH_COMPONENTS.FILE_EXPLORER,
						helpText: "File Explorer",
						enableClose: false,
					});
				},
			},
			{
				id: "workbench.settings.open",
				label: "Open Settings",
				icon: <SettingsIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.ENGINE_SETTINGS, {
						type: "tab",
						name: "Settings",
						component: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
						helpText: "Settings",
						enableClose: false,
					});
				},
			},
			{
				id: "workbench.vector-documents.open",
				label: "Open Documents",
				icon: <FileTextIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
							name: "Documents",
							component: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
							config: {},
							helpText: "Documents",
							enableClose: false,
						},
						{ type: "TAB", id: VECTOR_MAIN_TABSET },
					);
				},
			},
			{
				id: "workbench.vector-assistant.open",
				label: "Open Assistant",
				icon: <MessageSquareIcon />,
				handler: (get) => {
					get().openPanel(
						WORKBENCH_COMPONENTS.ASSISTANT,
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.ASSISTANT,
							name: "Assistant",
							component: WORKBENCH_COMPONENTS.ASSISTANT,
							helpText: "Vector workbench assistant",
							enableClose: false,
							enableRenderOnDemand: false,
						},
						{ type: "TAB", id: VECTOR_MAIN_TABSET },
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
					<EngineSettingsToggle />
				</>
			}
		/>
	);
};
