import { useEffect, useMemo } from "react";
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
import { makeEngineRoomMcp } from "@/api/rooms";
import { ASSISTANT_PANEL } from "@/components/assistant";
import { AssistantStoreProvider } from "@/contexts";
import { useAssistantStore, useEngine, useSession } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
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
import { VECTOR_DOCUMENTS_PANEL } from "./vector-documents-panel";

/**
 * The default arrangement: assistant + documents in the main dock, files on
 * the left. The assistant lives in the main tabset here (not a border), so
 * its record carries no border min-width.
 */
const createVectorWorkbenchLayout = (
	engineId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [
				WORKBENCH_COMPONENTS.ASSISTANT,
				WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
			],
			activeId: WORKBENCH_COMPONENTS.ASSISTANT,
		},
		panels: {
			[WORKBENCH_COMPONENTS.ASSISTANT]: {
				id: WORKBENCH_COMPONENTS.ASSISTANT,
				type: WORKBENCH_COMPONENTS.ASSISTANT,
				name: "Assistant",
				helpText: "Vector workbench assistant",
				canClose: false,
			},
			[WORKBENCH_PANEL_RECORDS.VECTOR_DOCUMENTS.id]:
				WORKBENCH_PANEL_RECORDS.VECTOR_DOCUMENTS,
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
		},
		borders: {
			left: {
				panelIds: [
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
				],
				activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
				size: 300,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const VECTOR_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS]: VECTOR_DOCUMENTS_PANEL,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]:
		createEngineSettingsPanel(ENGINE_SETTINGS_TABS),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Vector workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const VectorWorkbench: React.FC = () => {
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createVectorWorkbenchLayout(engine.engine_id, permission),
		[engine.engine_id, permission],
	);

	const syncPermission = useSession((s) => s.syncPermission);
	const refreshPermission = useSession((s) => s.refreshPermission);

	const assistantStore = useAssistantStore();

	// Revalidate the engine's permission and keep the assistant prompt and
	// room tools in sync with it.
	useEffect(() => {
		syncPermission("ENGINE", engine.engine_id, permission);
		void refreshPermission("ENGINE", engine.engine_id).catch(
			() => undefined,
		);

		assistantStore.getState().configure({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} vector workbench (${engine.engine_id}, subtype ${engine.engine_subtype || "unknown"}). Use only the tools provided in this room and decide whether a tool is needed for each request. For questions about indexed content, call VectorDatabaseQuery before answering, ground the answer only in its returned chunks, and cite the Source and Divider when available. Use ListDocumentsInVectorDatabase when the user asks what is indexed. For requests to add, download, or remove vector documents, or to inspect or change engine asset files, use the matching room tool; honor its approval requirement and the user's permissions. When the user attaches a file and asks to index it, use the available attachment path with the document embedding tool. Simple greetings or general guidance that do not require engine data can be answered without a tool. Do not invent unsupported parameters, and never claim an operation succeeded unless its tool result confirms success.`,
			prepareRoom: (insightId) =>
				makeEngineRoomMcp(insightId, engine.engine_id),
		});
	}, [
		assistantStore,
		syncPermission,
		refreshPermission,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
		engine.engine_subtype,
		permission,
	]);

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
			id: "workbench.vector-documents.open",
			label: "Open Documents",
			type: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
		}),
		createOpenPanelCommand({
			id: "workbench.vector-assistant.open",
			label: "Open Assistant",
			type: WORKBENCH_COMPONENTS.ASSISTANT,
		}),
	]);

	return (
		<AssistantStoreProvider store={assistantStore}>
			<Workbench
				layout={workbenchLayout}
				components={VECTOR_WORKBENCH_COMPONENTS}
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
		</AssistantStoreProvider>
	);
};
