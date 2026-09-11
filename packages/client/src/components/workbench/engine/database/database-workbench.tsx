import { useEffect, useMemo, useState } from "react";
import type { StoreApi } from "zustand";
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
	useWorkbenchStoreApi,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@semoss/workbench";
import { makeEngineRoomMcp } from "@/api/rooms";
import { ASSISTANT_PANEL } from "@/components/assistant";
import { AssistantStoreProvider } from "@/contexts";
import { DatabaseWorkbenchStoreProvider } from "@/contexts/database-workbench.context";
import { useAssistantStore, useEngine, useSession } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import {
	createDatabaseWorkbenchStore,
	type DatabaseWorkbenchState,
} from "@/stores/workbench/database";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	createFileCommands,
	createOpenPanelCommand,
	createReconnectCommand,
	withTab,
} from "../../workbench.presets";
import {
	createEngineSettingsPanel,
	ENGINE_SETTINGS_TABS,
} from "../engine-settings-panel";
import { EngineSettingsToggle } from "../engine-settings-toggle";
import { DATABASE_COLUMNS_PANEL } from "./database-columns-panel";
import { DATABASE_QUERY_PANEL } from "./database-query-panel";
import { DATABASE_RESULTS_PANEL } from "./database-query-results-panel";

/** The seeded query panel every database workbench starts with. */
const INITIAL_QUERY_PANEL_ID = "database-query-1";

/**
 * The default arrangement: columns + files on the left, an empty bottom
 * border kept as the docking target for query results, and the assistant on
 * the right.
 */
const createDatabaseWorkbenchLayout = (
	engineId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [INITIAL_QUERY_PANEL_ID],
			activeId: INITIAL_QUERY_PANEL_ID,
		},
		panels: {
			[INITIAL_QUERY_PANEL_ID]: {
				id: INITIAL_QUERY_PANEL_ID,
				type: WORKBENCH_COMPONENTS.DATABASE_QUERY,
				name: "Query",
				canClose: false,
				config: { initialQuery: "", queryNumber: 1 },
			},
			[WORKBENCH_PANEL_RECORDS.DATABASE_COLUMNS.id]:
				WORKBENCH_PANEL_RECORDS.DATABASE_COLUMNS,
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
					WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
				],
				activeId: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
				size: 300,
			},
			bottom: { panelIds: [], activeId: null, size: 300 },
			right: {
				panelIds: [WORKBENCH_COMPONENTS.ASSISTANT],
				activeId: null,
				size: 400,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
export const DATABASE_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_COLUMNS]: DATABASE_COLUMNS_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_QUERY]: DATABASE_QUERY_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_RESULTS]: DATABASE_RESULTS_PANEL,
	[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]: createEngineSettingsPanel(
		withTab(
			ENGINE_SETTINGS_TABS,
			{
				name: "Metadata",
				component: "metadata",
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			// before Access Control, where it has always sat
			4,
		),
	),
	[WORKBENCH_COMPONENTS.ASSISTANT]: ASSISTANT_PANEL,
};

/**
 * Database workbench that combines the file editor with an inline SQL/SPARQL
 * query experience. The query language is derived from the database category
 * (RDF -> SPARQL, otherwise SQL). Structure, results, and query execution
 * live in a dedicated store attached to the workbench store, so the
 * columns/query/results panels can share them. Rendered inside an
 * InsightProvider so the category/structure pixels and query execution share
 * a single insight.
 */
export const DatabaseWorkbench: React.FC = () => {
	const storeApi = useWorkbenchStoreApi();
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createDatabaseWorkbenchLayout(engine.engine_id, permission),
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

	// Created once per workbench instance before its panels render.
	const [databaseStore] = useState<StoreApi<DatabaseWorkbenchState>>(() => {
		return createDatabaseWorkbenchStore({ workbench: storeApi });
	});

	// initialize the workbench
	useEffect(() => {
		void databaseStore.getState().initialize(engine.engine_id);
	}, [engine.engine_id, databaseStore]);

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
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user understand and work with this database. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
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
		{
			id: "workbench.database-columns.refresh",
			category: "Database",
			label: "Refresh Database Structure",
			description: "Columns",
			handler: () => {
				databaseStore.getState().structure.refresh();
			},
		},
		createReconnectCommand(insight),
		...createFileCommands({ readOnly: readOnly }),
		createOpenPanelCommand({
			id: "workbench.file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: {
				mode: { type: "ENGINE", engine: engine.engine_id },
			},
		}),
		createOpenPanelCommand({
			id: "workbench.version-control.open",
			label: "Open Version Control",
			type: WORKBENCH_COMPONENTS.GIT_VERSION,
			config: {
				type: "ENGINE",
				id: engine.engine_id,
			},
			visible: !readOnly,
		}),
		createOpenPanelCommand({
			id: "workbench.settings.open",
			label: "Open Settings",
			type: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		}),
		createOpenPanelCommand({
			id: "workbench.database-columns.open",
			label: "Open Columns",
			type: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
		}),
		{
			id: "workbench.database-query.open",
			category: "Database",
			label: "New Query",
			handler: () => {
				databaseStore.getState().addQueryPanel("");
			},
		},
	]);

	return (
		<AssistantStoreProvider store={assistantStore}>
			<DatabaseWorkbenchStoreProvider store={databaseStore}>
				<Workbench
					snapshot={snapshot}
					onUnmount={onSnapshotChange}
					onPanelClose={(pid, record) =>
						databaseStore.getState().handlePanelClosed(pid, record)
					}
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
			</DatabaseWorkbenchStoreProvider>
		</AssistantStoreProvider>
	);
};
