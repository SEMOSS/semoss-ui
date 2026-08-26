import {
	DatabaseIcon,
	FolderTreeIcon,
	NetworkIcon,
	SettingsIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { StoreApi } from "zustand";
import { makeEngineRoomMcp } from "@/api/rooms";
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
import { DATABASE_COLUMNS_PANEL } from "./database-columns-panel";
import { DatabaseNewQueryButton } from "./database-new-query-button";
import { DATABASE_QUERY_PANEL } from "./database-query-panel";
import { DATABASE_RESULTS_PANEL } from "./database-query-results-panel";

/** The seeded query panel every database workbench starts with. */
const INITIAL_QUERY_PANEL_ID = "database-query-1";

/**
 * The default arrangement: columns + files on the left, an empty bottom
 * border kept as the docking target for query results, and the assistant on
 * the right.
 */
const DATABASE_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 1,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [INITIAL_QUERY_PANEL_ID],
		activeId: INITIAL_QUERY_PANEL_ID,
		enableDeleteWhenEmpty: false,
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
		[WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER,
		[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
			WORKBENCH_PANEL_RECORDS.ASSISTANT,
	},
	borders: {
		left: {
			panelIds: [
				WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
				WORKBENCH_COMPONENTS.FILE_EXPLORER,
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

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const DATABASE_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: ENGINE_FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_EDITOR]: ENGINE_FILE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MCP_EDITOR]: ENGINE_MCP_EDITOR_PANEL,
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
	const { engine } = useEngine();

	// created once per mount and attached before the panels first render
	const [databaseStore] = useState<StoreApi<DatabaseWorkbenchState>>(() => {
		const store = createDatabaseWorkbenchStore({ workbench: storeApi });
		storeApi.getState().layout.actions.attachDomainStore(store);
		return store;
	});

	// initialize the workbench
	useEffect(() => {
		void databaseStore.getState().initialize(engine.engine_id);
	}, [engine.engine_id, databaseStore]);

	const configureAssistant = useWorkbench((s) => s.assistant.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureAssistant({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user understand and work with this database. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
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
			id: "workbench.database-columns.open",
			label: "Open Columns",
			icon: <NetworkIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
				);
			},
		},
		{
			id: "workbench.database-query.open",
			label: "New Query",
			icon: <DatabaseIcon />,
			handler: () => {
				databaseStore.getState().addQueryPanel("");
			},
		},
	]);

	return (
		<Workbench
			layout={DATABASE_WORKBENCH_LAYOUT}
			components={DATABASE_WORKBENCH_COMPONENTS}
			onPanelClose={(pid, record) =>
				databaseStore.getState().handlePanelClosed(pid, record)
			}
			borderSlots={{
				left: {
					after: (
						<>
							<DatabaseNewQueryButton />
							<WorkbenchCommandMenuButton />
							<EngineSettingsToggle />
						</>
					),
				},
			}}
		/>
	);
};
