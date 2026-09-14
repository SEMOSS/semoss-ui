import { useEffect, useMemo, useState } from "react";
import type { StoreApi } from "zustand";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type { FileExplorerApi } from "@semoss/shared";
import { ModelChatStoreProvider } from "@/contexts/model-chat.context";
import { useEngine, useWorkbench, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import type { ModelChatStoreInterface } from "@/stores/workbench/model";
import { createModelChatStore } from "@/stores/workbench/model";
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
const createModelWorkbenchLayout = (
	engineId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
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
			[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
				...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
				config: { type: "ENGINE", id: engineId },
			},
			...(!readOnly
				? {
						[WORKBENCH_PANEL_RECORDS.GIT_VERSION.id]: {
							...WORKBENCH_PANEL_RECORDS.GIT_VERSION,
							config: { type: "ENGINE", id: engineId },
						},
					}
				: {}),
			[WORKBENCH_PANEL_RECORDS.MODEL_CHAT_SETTINGS.id]:
				WORKBENCH_PANEL_RECORDS.MODEL_CHAT_SETTINGS,
			[WORKBENCH_PANEL_RECORDS.MODEL_CHAT_HISTORY.id]:
				WORKBENCH_PANEL_RECORDS.MODEL_CHAT_HISTORY,
		},
		borders: {
			left: {
				panelIds: [
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
				],
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
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const MODEL_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT]: MODEL_CHAT_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS]: MODEL_CHAT_SETTINGS_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY]: MODEL_CHAT_HISTORY_PANEL,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
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
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createModelWorkbenchLayout(engine.engine_id, permission),
		[engine.engine_id, permission],
	);
	const configureWorkbench = useWorkbench((state) => state.configure);

	useEffect(() => {
		configureWorkbench({
			resource: {
				type: "ENGINE",
				id: engine.engine_id,
				permission,
			},
		});
	}, [configureWorkbench, engine.engine_id, permission]);

	// Created once per workbench instance before its panels render.
	const [chatStore] = useState<StoreApi<ModelChatStoreInterface>>(() => {
		return createModelChatStore();
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
			id: "workbench.file-explorer.open",
			category: "View",
			label: "Open File Explorer",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					{ type: "ENGINE", id: engine.engine_id },
				);
			},
		},
		{
			id: "workbench.version-control.open",
			category: "View",
			label: "Open Version Control",
			visible: !readOnly,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.GIT_VERSION,
					{ type: "ENGINE", id: engine.engine_id },
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
		<ModelChatStoreProvider store={chatStore}>
			<Workbench
				layout={workbenchLayout}
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
		</ModelChatStoreProvider>
	);
};
