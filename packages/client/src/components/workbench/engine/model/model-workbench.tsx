import { FolderTreeIcon, MessageSquareIcon, SettingsIcon } from "lucide-react";
import { useEffect } from "react";
import { makeEngineRoomMcp } from "@/api/rooms";
import { useEngine, useWorkbench, useWorkbenchCommands } from "@/hooks";
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
import { ENGINE_FILE_EDITOR_PANEL } from "../engine-file-editor-panel";
import { ENGINE_FILE_EXPLORER_PANEL } from "../engine-file-explorer-panel";
import { ENGINE_MCP_EDITOR_PANEL } from "../engine-mcp-editor-panel";
import { createEngineSettingsPanel } from "../engine-settings-panel";
import { EngineSettingsToggle } from "../engine-settings-toggle";
import { MODEL_CHAT_PANEL } from "./model-chat-panel";

/** The default arrangement: files on the left (collapsed), assistant right. */
const MODEL_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 1,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER,
		[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
			WORKBENCH_PANEL_RECORDS.ASSISTANT,
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.FILE_EXPLORER],
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
const MODEL_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: ENGINE_FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_EDITOR]: ENGINE_FILE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MCP_EDITOR]: ENGINE_MCP_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT]: MODEL_CHAT_PANEL,
	[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]: createEngineSettingsPanel([
		{
			name: "Overview",
			component: "overview",
			restrict: ["READ_ONLY", "EDIT", "OWNER", "DISCOVERABLE"],
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
	]),
	[WORKBENCH_COMPONENTS.ASSISTANT]: WORKBENCH_ASSISTANT_PANEL,
};

/**
 * Model workbench that combines a chat panel with the shared file explorer,
 * editor, and MCP editor. Rendered inside an InsightProvider by the page so
 * the chat and file operations share a single insight.
 */
export const ModelWorkbench: React.FC = () => {
	const { engine } = useEngine();

	const configureAssistant = useWorkbench((s) => s.assistant.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureAssistant({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user inspect, test, and configure this model. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
			prepareRoom: (insightId) =>
				makeEngineRoomMcp(insightId, engine.engine_id),
		});
	}, [
		configureAssistant,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.file-explorer.open",
			label: "Open File Explorer",
			icon: <FolderTreeIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
				);
			},
		},
		{
			id: "workbench.settings.open",
			label: "Open Settings",
			icon: <SettingsIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
				);
			},
		},
		{
			id: "workbench.model-chat.open",
			label: "Open Model Chat",
			icon: <MessageSquareIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.MODEL_CHAT,
				);
			},
		},
	]);

	return (
		<Workbench
			layout={MODEL_WORKBENCH_LAYOUT}
			components={MODEL_WORKBENCH_COMPONENTS}
			borderSlots={{
				left: {
					after: (
						<>
							<WorkbenchCommandMenuButton />
							<EngineSettingsToggle />
						</>
					),
				},
			}}
		/>
	);
};
