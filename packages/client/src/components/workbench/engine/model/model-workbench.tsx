import { useEffect, useMemo, useState } from "react";
import type { StoreApi } from "zustand";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import {
	useWorkbenchCommands,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@semoss/workbench";
import { ModelChatStoreProvider } from "@/contexts/model-chat.context";
import { useEngine, useSession } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import type { ModelChatStoreInterface } from "@/stores/workbench/model";
import { createModelChatStore } from "@/stores/workbench/model";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	createFileCommands,
	createOpenPanelCommand,
	createReconnectCommand,
} from "../../workbench.presets";
import {
	createEngineSettingsPanel,
	ENGINE_SETTINGS_TABS,
} from "../engine-settings-panel";
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
				config: { mode: { type: "ENGINE", engine: engineId } },
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
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.MODEL_CHAT]: MODEL_CHAT_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS]: MODEL_CHAT_SETTINGS_PANEL,
	[WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY]: MODEL_CHAT_HISTORY_PANEL,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]:
		createEngineSettingsPanel(ENGINE_SETTINGS_TABS),
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
	const syncPermission = useSession((state) => state.syncPermission);
	const refreshPermission = useSession((state) => state.refreshPermission);

	useEffect(() => {
		syncPermission("ENGINE", engine.engine_id, permission);
		void refreshPermission("ENGINE", engine.engine_id).catch(
			() => undefined,
		);
	}, [syncPermission, refreshPermission, engine.engine_id, permission]);

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
		createReconnectCommand(insight),
		...createFileCommands({ readOnly: readOnly }),
		createOpenPanelCommand({
			id: "workbench.file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: { mode: { type: "ENGINE", engine: engine.engine_id } },
		}),
		createOpenPanelCommand({
			id: "workbench.version-control.open",
			label: "Open Version Control",
			type: WORKBENCH_COMPONENTS.GIT_VERSION,
			config: { type: "ENGINE", id: engine.engine_id },
			visible: !readOnly,
		}),
		createOpenPanelCommand({
			id: "workbench.settings.open",
			label: "Open Settings",
			type: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		}),
		createOpenPanelCommand({
			id: "workbench.model-chat.open",
			label: "Open Model Chat",
			type: WORKBENCH_COMPONENTS.MODEL_CHAT,
		}),
		createOpenPanelCommand({
			id: "workbench.model-chat-settings.open",
			label: "Open Model Settings",
			type: WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS,
		}),
		createOpenPanelCommand({
			id: "workbench.model-chat-history.open",
			label: "Open Conversation History",
			type: WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY,
		}),
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
