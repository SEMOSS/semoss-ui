import { FolderTreeIcon, MessageSquareIcon, SettingsIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { makeEngineRoomMcp } from "@/api/rooms";
import {
	WORKBENCH_COMPONENTS,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@/components/workbench";
import { useEngine, useWorkbench } from "@/hooks";
import { useWorkbenchChatConfig } from "@/hooks/use-workbench-chat-config";
import type { WorkbenchPanelConfig } from "@/stores";
import { WORKBENCH_CHAT_PANEL } from "../../chat";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
	EngineSettingsToggle,
} from "..";
import { ModelChatPanel } from "./model-chat-panel";

/**
 * Model workbench that combines a chat panel with the shared file explorer,
 * editor, and MCP editor. Rendered inside an InsightProvider by the page so
 * the chat and file operations share a single insight.
 */
export const ModelWorkbench: React.FC = () => {
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
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [],
					},
				],
			},
		};
	}, []);

	const configureChat = useWorkbenchChatConfig((state) => state.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureChat({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user inspect, test, and configure this model. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
			prepareRoom: (insightId) =>
				makeEngineRoomMcp(insightId, engine.engine_id),
		});
	}, [
		configureChat,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
	]);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return <EngineFileExplorerPanel layout={layout} node={node} />;
			},
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
		[WORKBENCH_COMPONENTS.MODEL_CHAT]: {
			tab: () => <MessageSquareIcon className="size-4" />,
			view: () => {
				return <ModelChatPanel />;
			},
		},
		[WORKBENCH_COMPONENTS.CHAT]: WORKBENCH_CHAT_PANEL,
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
				id: "workbench.model-chat.open",
				label: "Open Model Chat",
				icon: <MessageSquareIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.MODEL_CHAT, {
						type: "tab",
						name: "Model Chat",
						component: WORKBENCH_COMPONENTS.MODEL_CHAT,
						helpText: "Model Chat",
						enableClose: false,
					});
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
