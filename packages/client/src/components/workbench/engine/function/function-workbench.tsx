import { useEffect, useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { useCacheState } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import {
	parseWorkbenchSnapshot,
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

/** The default arrangement: files on the left, assistant on the right. */
const createFunctionWorkbenchLayout = (
	engineId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [],
			activeId: null,
		},
		panels: {
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
			[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
				WORKBENCH_PANEL_RECORDS.ASSISTANT,
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
			right: {
				panelIds: [WORKBENCH_COMPONENTS.ASSISTANT],
				activeId: null,
				size: 400,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
export const FUNCTION_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]:
		createEngineSettingsPanel(ENGINE_SETTINGS_TABS),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Function workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const FunctionWorkbench: React.FC = () => {
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createFunctionWorkbenchLayout(engine.engine_id, permission),
		[engine.engine_id, permission],
	);

	// What this workbench is known by: its own cache entry, and — where there
	// is an assistant — the workbench its conversations are tagged with,
	// server-side. Read-only variants keep their own arrangement.
	const workbenchId = readOnly
		? `${engine.engine_id}--read-only`
		: engine.engine_id;

	const [snapshot, onSnapshotChange] = useCacheState<WorkbenchSnapshot>(
		workbenchLayout,
		`workbench-layout--${workbenchId}--1`,
		parseWorkbenchSnapshot,
	);

	const syncPermission = useSession((s) => s.syncPermission);
	const refreshPermission = useSession((s) => s.refreshPermission);

	const assistantStore = useAssistantStore(workbenchId);

	// Revalidate the engine's permission and keep the assistant prompt and
	// room tools in sync with it.
	useEffect(() => {
		syncPermission("ENGINE", engine.engine_id, permission);
		void refreshPermission("ENGINE", engine.engine_id).catch(
			() => undefined,
		);

		assistantStore.getState().configure({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user understand, test, and maintain this function. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
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
	]);

	return (
		<AssistantStoreProvider store={assistantStore}>
			<Workbench
				snapshot={snapshot}
				onUnmount={onSnapshotChange}
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
