import { useEffect, useMemo, useState } from "react";
import type { StoreApi } from "zustand";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type { FileExplorerApi } from "@semoss/shared";
import { makeEngineRoomMcp } from "@/api/rooms";
import { DatabaseWorkbenchStoreProvider } from "@/contexts/database-workbench.context";
import {
	useEngine,
	useWorkbench,
	useWorkbenchCommands,
	useWorkbenchStoreApi,
} from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import {
	createDatabaseWorkbenchStore,
	type DatabaseWorkbenchState,
} from "@/stores/workbench/database";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
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
const DATABASE_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_COLUMNS]: DATABASE_COLUMNS_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_QUERY]: DATABASE_QUERY_PANEL,
	[WORKBENCH_COMPONENTS.DATABASE_RESULTS]: DATABASE_RESULTS_PANEL,
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
			name: "Metadata",
			component: "metadata",
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

	// Created once per workbench instance before its panels render.
	const [databaseStore] = useState<StoreApi<DatabaseWorkbenchState>>(() => {
		return createDatabaseWorkbenchStore({ workbench: storeApi });
	});

	// initialize the workbench
	useEffect(() => {
		void databaseStore.getState().initialize(engine.engine_id);
	}, [engine.engine_id, databaseStore]);

	const configureWorkbench = useWorkbench((s) => s.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureWorkbench({
			resource: {
				type: "ENGINE",
				id: engine.engine_id,
				permission,
			},
			assistant: {
				systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user understand and work with this database. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
				prepareRoom: (insightId) =>
					makeEngineRoomMcp(insightId, engine.engine_id),
			},
		});
	}, [
		configureWorkbench,
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
					{
						type: "ENGINE",
						id: engine.engine_id,
					},
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
					{
						type: "ENGINE",
						id: engine.engine_id,
					},
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
			id: "workbench.database-columns.open",
			category: "View",
			label: "Open Columns",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
				);
			},
		},
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
		<DatabaseWorkbenchStoreProvider store={databaseStore}>
			<Workbench
				layout={workbenchLayout}
				components={DATABASE_WORKBENCH_COMPONENTS}
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
	);
};
