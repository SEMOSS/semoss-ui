import {
	FileTextIcon,
	FolderTreeIcon,
	MessageSquareIcon,
	SettingsIcon,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
	EngineSettingsToggle,
} from "../engine";
import { Workbench } from "../workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import { VectorChatPanel } from "./vector-chat-panel";
import { VectorDocumentsPanel } from "./vector-documents-panel";

/**
 * Vector workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const VectorWorkbench: React.FC = () => {
	const registerCommand = useWorkbench((state) => state.registerCommand);

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
							id: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
							name: "Documents",
							component: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
							config: {},
							helpText: "Documents",
							enableClose: false,
						},
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
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [
							{
								type: "tab",
								id: WORKBENCH_COMPONENTS.VECTOR_CHAT,
								name: "Q&A",
								component: WORKBENCH_COMPONENTS.VECTOR_CHAT,
								enableClose: false,
							},
						],
					},
				],
			},
		};
	}, []);

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
		[WORKBENCH_COMPONENTS.VECTOR_CHAT]: {
			tab: () => <MessageSquareIcon className="size-4" />,
			view: () => <VectorChatPanel />,
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
				handler: async (get) => {
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
						{
							type: "BORDER",
							location: "left",
						},
					);
				},
			},
			{
				id: "workbench.vector-chat.open",
				label: "Open Q&A",
				icon: <MessageSquareIcon />,
				handler: async (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.VECTOR_CHAT);
				},
			},
		]);
	}, [registerCommand]);

	return (
		<Workbench
			layout={layout}
			components={components}
			actions={<EngineSettingsToggle />}
		/>
	);
};
