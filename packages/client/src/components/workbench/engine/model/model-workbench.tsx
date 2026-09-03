import { useEffect, useState } from "react";
import type { StoreApi } from "zustand";
import { useInsight } from "@semoss/sdk/react";
import { useEngine, useWorkbenchCommands, useWorkbenchStoreApi } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import type { ModelChatStoreInterface } from "@/stores/workbench/model";
import { createModelChatStore } from "@/stores/workbench/model";
import { Workbench } from "../../core";
import { WorkbenchCommandMenuButton } from "../../core/workbench-command-menu-button";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { ENGINE_FILE_CODE_EDITOR_PANEL } from "../engine-file-code-editor-panel";
import { ENGINE_FILE_DOWNLOAD_VIEWER_PANEL } from "../engine-file-download-viewer-panel";
import { ENGINE_FILE_EXPLORER_PANEL } from "../engine-file-explorer-panel";
import { ENGINE_FILE_IMAGE_EDITOR_PANEL } from "../engine-file-image-editor-panel";
import { ENGINE_FILE_MARKDOWN_EDITOR_PANEL } from "../engine-file-markdown-editor-panel";
import { ENGINE_FILE_NOTEBOOK_EDITOR_PANEL } from "../engine-file-notebook-editor-panel";
import { ENGINE_FILE_PDF_EDITOR_PANEL } from "../engine-file-pdf-editor-panel";
import { ENGINE_MCP_EDITOR_PANEL } from "../engine-mcp-editor-panel";
import { createEngineSettingsPanel } from "../engine-settings-panel";
import { EngineSettingsToggle } from "../engine-settings-toggle";
import { MODEL_CHAT_HISTORY_PANEL } from "./model-chat-conversations";
import { MODEL_CHAT_PANEL } from "./model-chat-panel";
import { MODEL_CHAT_SETTINGS_PANEL } from "./model-chat-settings";

/**
 * The default arrangement: the chat fills the main tabset, files on the left
 * (collapsed), model settings and conversation history on the right
 * (collapsed). Both borders start closed so the chat opens full width; their
 * rails carry the toggles.
 *
 * Version 2 dropped the assistant border, version 3 added the settings/history
 * border — a cached layout shadows the default forever, so the bump is what
 * retires the previous arrangement.
 */
const MODEL_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 3,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [WORKBENCH_COMPONENTS.MODEL_CHAT],
		activeId: WORKBENCH_COMPONENTS.MODEL_CHAT,
	},
	panels: {
		[WORKBENCH_PANEL_RECORDS.MODEL_CHAT.id]:
			WORKBENCH_PANEL_RECORDS.MODEL_CHAT,
		[WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER,
		[WORKBENCH_PANEL_RECORDS.MODEL_CHAT_SETTINGS.id]:
			WORKBENCH_PANEL_RECORDS.MODEL_CHAT_SETTINGS,
		[WORKBENCH_PANEL_RECORDS.MODEL_CHAT_HISTORY.id]:
			WORKBENCH_PANEL_RECORDS.MODEL_CHAT_HISTORY,
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.FILE_EXPLORER],
			activeId: null,
			size: 300,
		},
		right: {
			panelIds: [
				WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS,
				WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY,
			],
			activeId: null,
			size: 360,
		},
	},
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const MODEL_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: ENGINE_FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: ENGINE_FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD_VIEWER]:
		ENGINE_FILE_DOWNLOAD_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_EDITOR]: ENGINE_FILE_IMAGE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]:
		ENGINE_FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]:
		ENGINE_FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_EDITOR]: ENGINE_FILE_PDF_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MCP_EDITOR]: ENGINE_MCP_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT]: MODEL_CHAT_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS]: MODEL_CHAT_SETTINGS_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY]: MODEL_CHAT_HISTORY_PANEL,
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
};

/**
 * Model workbench: a persistent chat with the model engine, alongside the
 * shared file explorer, editor, and MCP editor. Rendered inside an
 * InsightProvider by the page so the chat room and file operations share a
 * single insight.
 */
export const ModelWorkbench: React.FC = () => {
	const storeApi = useWorkbenchStoreApi();
	const { engine } = useEngine();
	const insight = useInsight();

	// created once per mount and attached before the panels first render
	const [chatStore] = useState<StoreApi<ModelChatStoreInterface>>(() => {
		const store = createModelChatStore();
		storeApi.getState().layout.actions.attachDomainStore(store);
		return store;
	});

	// The room can only be created once the insight exists; re-runs bind a new
	// room when the insight or the target engine changes.
	useEffect(() => {
		if (!insight.isReady || !insight.insightId) {
			return;
		}

		void chatStore
			.getState()
			.initialize(insight.insightId, engine.engine_id);
		return () => chatStore.getState().dispose();
	}, [chatStore, engine.engine_id, insight.isReady, insight.insightId]);

	useWorkbenchCommands([
		{
			id: "workbench.file-explorer.open",
			category: "View",
			label: "Open File Explorer",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
				);
			},
		},
		{
			id: "workbench.settings.open",
			category: "View",
			label: "Open Settings",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
				);
			},
		},
		{
			id: "workbench.model-chat.open",
			category: "View",
			label: "Open Model Chat",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.MODEL_CHAT,
				);
			},
		},
		{
			id: "workbench.model-chat-settings.open",
			category: "View",
			label: "Open Model Settings",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS,
				);
			},
		},
		{
			id: "workbench.model-chat-history.open",
			category: "View",
			label: "Open Conversation History",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY,
				);
			},
		},
		{
			id: "workbench.model-chat.new-conversation",
			category: "View",
			label: "New Model Conversation",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.MODEL_CHAT,
				);
				void chatStore.getState().newRoom();
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
