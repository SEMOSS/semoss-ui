import {
	CodeIcon,
	DatabaseIcon,
	FolderTreeIcon,
	SettingsIcon,
	Table2Icon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnInterface, runPixel, usePixel } from "@semoss/sdk/react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { useEngine, useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
	EngineSettingsToggle,
} from "../engine";
import { Workbench } from "../workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import { DatabaseColumnsPanel } from "./database-columns-panel";
import { DatabaseQueryPanel } from "./database-query-panel";
import { DatabaseQueryResultsPanel } from "./database-query-results-panel";

/** FlexLayout tabset that hosts both file editors and query editors */
const MAIN_TABSET = "MAIN_TABSET";

const DATABASE_WORKBENCH_LAYOUT: FlexLayout.IJsonModel = {
	global: {
		tabSetEnableDeleteWhenEmpty: true,
		tabEnableRename: false,
	},
	borders: [
		{
			type: "border",
			location: "left",
			size: 300,
			selected: 0,
			children: [
				{
					type: "tab",
					id: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
					name: "Columns",
					component: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
					helpText: "Database Structure",
					enableClose: false,
				},
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
			location: "bottom",
			size: 300,
			selected: -1,
			children: [
				{
					type: "tab",
					id: WORKBENCH_COMPONENTS.DATABASE_RESULTS,
					name: "Results",
					component: WORKBENCH_COMPONENTS.DATABASE_RESULTS,
					enableClose: false,
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
				id: MAIN_TABSET,
				weight: 100,
				enableDeleteWhenEmpty: false,
				children: [
					{
						type: "tab",
						id: WORKBENCH_COMPONENTS.DATABASE_QUERY,
						name: "Query",
						component: WORKBENCH_COMPONENTS.DATABASE_QUERY,
						enableClose: false,
						enableRename: true,
					},
				],
			},
		],
	},
};

/**
 * Database workbench that combines the file editor with an inline SQL/SPARQL
 * query experience. The query language is derived from the database category
 * (RDF -> SPARQL, otherwise SQL). Rendered inside an InsightProvider so the
 * category/structure pixels and query execution share a single insight.
 */
export const DatabaseWorkbench: React.FC = observer(() => {
	const openPanel = useWorkbench((state) => state.openPanel);
	const registerCommand = useWorkbench((state) => state.registerCommand);

	const { engine } = useEngine();
	const model = useWorkbench((state) => state.model);

	// Derive the query language from the database category (RDF -> SPARQL).
	const getDatabaseCategory = usePixel<string>(
		engine.engine_id
			? `GetDatabaseCategory(engine=["${engine.engine_id}"]);`
			: "",
		{ data: "" },
	);
	const mode: "SPARQL" | "SQL" =
		getDatabaseCategory.data === "RDF" ? "SPARQL" : "SQL";

	// Fetch the database structure for the columns browser.
	const getDatabaseStructure = usePixel<unknown[]>(
		engine.engine_id
			? `META|GetDatabaseTableStructure(database=["${engine.engine_id}"]);`
			: "",
	);

	// Transform flat rows
	// [tableAlias, columnAlias, type, isPrimary, columnName, tableName]
	// into a list of tables with their columns.
	const structure = useMemo(() => {
		if (getDatabaseStructure.status !== "SUCCESS") {
			return [];
		}

		const rows = getDatabaseStructure.data;
		if (!Array.isArray(rows)) {
			return [];
		}

		const tableMap = new Map<string, ColumnInterface[]>();

		for (const row of rows) {
			if (!Array.isArray(row) || row.length < 3) {
				continue;
			}

			const tableName = String(row[5] ?? row[0] ?? "").trim();
			const columnName = String(row[4] ?? row[1] ?? "").trim();
			const columnType = String(row[2] ?? "UNKNOWN").trim() || "UNKNOWN";

			if (!tableName || !columnName) {
				continue;
			}

			const columns = tableMap.get(tableName) ?? [];
			columns.push({
				column: columnName,
				type: columnType,
			});
			tableMap.set(tableName, columns);
		}

		return Array.from(tableMap.entries()).map(([table, columns]) => ({
			table,
			columns,
		}));
	}, [getDatabaseStructure.status, getDatabaseStructure.data]);

	const [isRunning, setIsRunning] = useState(false);
	const [result, setResult] =
		useState<
			React.ComponentProps<typeof DatabaseQueryResultsPanel>["result"]
		>(null);

	const panelCounterRef = useRef(1);

	/**
	 * Execute a query and display the results in the results panel.
	 * @param query - the query text to run
	 * @param panelId - the editor panel that triggered the run
	 * @param raw - whether to run in raw mode (only applicable for SPARQL)
	 */
	const onRun = async (query: string, panelId: string, raw = true) => {
		const q = query.trim();
		if (!q) {
			return;
		}

		setIsRunning(true);

		try {
			openPanel(
				WORKBENCH_COMPONENTS.DATABASE_RESULTS,
				{
					type: "tab",
					name: "Results",
					component: WORKBENCH_COMPONENTS.DATABASE_RESULTS,
					enableClose: false,
				},
				{ type: "BORDER", location: "bottom" },
			);

			const pixel =
				mode === "SPARQL"
					? `SparqlQuery(database=["${engine.engine_id}"], query=["<encode>${q}</encode>"], raw=[${raw}], commit=[true]);`
					: `SqlQuery(database=["${engine.engine_id}"], query=["<encode>${q}</encode>"], commit=[true]);`;

			const response = await runPixel(pixel);

			let nextResult: React.ComponentProps<
				typeof DatabaseQueryResultsPanel
			>["result"] = null;

			const output = response.pixelReturn[0].output;
			const timeToRun = response.pixelReturn[0].timeToRun;

			if (response.errors.length > 0) {
				nextResult = {
					type: "ERROR",
					query: q,
					raw: raw,
					sourcePanel: panelId,
					message: response.errors.join("\n"),
					timeToRun: timeToRun,
				};
			} else if (
				output &&
				typeof output === "object" &&
				"data" in output &&
				typeof output.data === "object" &&
				output.data !== null &&
				"headers" in output.data &&
				"values" in output.data
			) {
				nextResult = {
					type: "TABLE",
					query: q,
					raw: raw,
					sourcePanel: panelId,
					output: output.data as {
						headers: string[];
						values: unknown[][];
					},
					timeToRun: timeToRun,
				};
			} else if (output && typeof output === "string") {
				nextResult = {
					type: "MESSAGE",
					query: q,
					raw: raw,
					sourcePanel: panelId,
					message: String(output ?? ""),
					timeToRun: timeToRun,
				};
			} else {
				nextResult = {
					type: "JSON",
					query: q,
					raw: raw,
					sourcePanel: panelId,
					output: output,
					timeToRun: timeToRun,
				};
			}

			setResult(nextResult);

			// refresh the structure when the query may have mutated the schema
			if (nextResult?.type !== "TABLE") {
				getDatabaseStructure.refresh();
			}
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Unknown error";

			setResult({
				type: "ERROR",
				query: q,
				raw: false,
				sourcePanel: panelId,
				message: message,
				timeToRun: 0,
			});
		} finally {
			setIsRunning(false);
		}
	};

	/**
	 * Add a query editor panel to the main tabset.
	 * @param initialQuery - seed text for the new editor
	 * @param name - tab label for the new editor
	 */
	const addQueryPanel = useCallback(
		(initialQuery: string, name: string) => {
			let panelId = "";
			do {
				panelCounterRef.current += 1;
				panelId = `${WORKBENCH_COMPONENTS.DATABASE_QUERY}_${panelCounterRef.current}`;
			} while (model.getNodeById(panelId));

			openPanel(panelId, {
				type: "tab",
				name,
				component: WORKBENCH_COMPONENTS.DATABASE_QUERY,
				config: { initialQuery },
				enableClose: true,
				enableRename: true,
			});
		},
		[openPanel, model],
	);

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
		[WORKBENCH_COMPONENTS.DATABASE_COLUMNS]: {
			tab: () => <DatabaseIcon className="size-4" />,
			view: () => {
				return (
					<div className="h-full w-full overflow-hidden">
						<DatabaseColumnsPanel
							mode={mode}
							isLoading={
								getDatabaseStructure.status === "LOADING"
							}
							error={
								getDatabaseStructure.status === "ERROR"
									? (getDatabaseStructure.error?.message ??
										"Failed to fetch database structure")
									: ""
							}
							refresh={() => getDatabaseStructure.refresh()}
							structure={structure}
							onCreateQueryPanel={addQueryPanel}
						/>
					</div>
				);
			},
		},
		[WORKBENCH_COMPONENTS.DATABASE_QUERY]: {
			tab: () => <CodeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode) => {
				return (
					<div className="h-full w-full overflow-hidden">
						<DatabaseQueryPanel
							node={node}
							mode={mode}
							structure={structure}
							isRunning={isRunning}
							onRun={onRun}
						/>
					</div>
				);
			},
		},
		[WORKBENCH_COMPONENTS.DATABASE_RESULTS]: {
			tab: () => <Table2Icon className="size-4" />,
			view: () => {
				return (
					<div className="h-full w-full overflow-hidden">
						<DatabaseQueryResultsPanel
							mode={mode}
							variant="engine"
							model={model}
							isRunning={isRunning}
							result={result}
						/>
					</div>
				);
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
					]}
				/>
			),
		},
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
				id: "workbench.database-columns.open",
				label: "Open Columns",
				icon: <DatabaseIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.DATABASE_COLUMNS, {
						type: "tab",
						name: "Columns",
						component: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
						helpText: "Database Columns",
						enableClose: false,
					});
				},
			},
			{
				id: "workbench.database-query.open",
				label: "Open New Query",
				icon: <CodeIcon />,
				handler: () => {
					addQueryPanel("", `Query ${panelCounterRef.current + 1}`);
				},
			},
			{
				id: "workbench.database-results.open",
				label: "Open Results",
				icon: <Table2Icon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.DATABASE_RESULTS, {
						type: "tab",
						name: "Results",
						component: WORKBENCH_COMPONENTS.DATABASE_RESULTS,
						helpText: "Database Results",
						enableClose: false,
					});
				},
			},
		]);
	}, [registerCommand, addQueryPanel]);

	return (
		<Workbench
			layout={DATABASE_WORKBENCH_LAYOUT}
			components={components}
			actions={<EngineSettingsToggle />}
		/>
	);
});
