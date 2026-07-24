import {
	CodeIcon,
	DatabaseIcon,
	FolderTreeIcon,
	SettingsIcon,
	Table2Icon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { type ColumnInterface, runPixel, usePixel } from "@semoss/sdk/react";
import { FlexLayout, getFileIconComponent } from "@semoss/shared";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
} from "../engine";
import { Workbench } from "../workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.contants";
import { DatabaseColumnsPanel } from "./database-columns-panel";
import { DatabaseQueryPanel } from "./database-query-panel";
import { DatabaseQueryResultsPanel } from "./database-query-results-panel";

/** FlexLayout tabset that hosts both file editors and query editors */
const MAIN_TABSET = "MAIN_TABSET";

interface DatabaseWorkbenchProps {
	/** Engine (database) id to edit and query */
	engine: string;
}

/**
 * Database workbench that combines the file editor with an inline SQL/SPARQL
 * query experience. The query language is derived from the database category
 * (RDF -> SPARQL, otherwise SQL). Rendered inside an InsightProvider so the
 * category/structure pixels and query execution share a single insight.
 */
export const DatabaseWorkbench: React.FC<DatabaseWorkbenchProps> = observer(
	({ engine }) => {
		// Derive the query language from the database category (RDF -> SPARQL).
		const getDatabaseCategory = usePixel<string>(
			engine ? `GetDatabaseCategory(engine=["${engine}"]);` : "",
			{ data: "" },
		);
		const mode: "SPARQL" | "SQL" =
			getDatabaseCategory.data === "RDF" ? "SPARQL" : "SQL";

		// Fetch the database structure for the columns browser.
		const getDatabaseStructure = usePixel<unknown[]>(
			engine
				? `META|GetDatabaseTableStructure(database=["${engine}"]);`
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
				const columnType =
					String(row[2] ?? "UNKNOWN").trim() || "UNKNOWN";

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

		const model = useMemo(() => {
			return FlexLayout.Model.fromJson({
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
								component:
									WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
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
								component:
									WORKBENCH_COMPONENTS.DATABASE_RESULTS,
								enableClose: false,
							},
							{
								type: "tab",
								id: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
								name: "Settings",
								component: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
								enableClose: false,
								borderWidth: 800,
								borderHeight: 1200,
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
									component:
										WORKBENCH_COMPONENTS.DATABASE_QUERY,
									enableClose: false,
									enableRename: true,
								},
							],
						},
					],
				},
			});
		}, []);

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
				// reveal the results panel if it is not already visible
				const resultsTab = model.getNodeById(
					WORKBENCH_COMPONENTS.DATABASE_RESULTS,
				);
				const isResultsSelected =
					resultsTab instanceof FlexLayout.TabNode &&
					resultsTab.isVisible();
				if (!isResultsSelected) {
					model.doAction(
						FlexLayout.Actions.selectTab(
							WORKBENCH_COMPONENTS.DATABASE_RESULTS,
						),
					);
				}

				const pixel =
					mode === "SPARQL"
						? `SparqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], raw=[${raw}], commit=[true]);`
						: `SqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], commit=[true]);`;

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
		const addQueryPanel = (initialQuery: string, name: string) => {
			const tabsetNode = model.getNodeById(MAIN_TABSET);
			const targetTabsetId =
				tabsetNode?.getId() ?? model.getActiveTabset()?.getId() ?? "";

			if (!targetTabsetId) {
				return;
			}

			panelCounterRef.current += 1;

			model.doAction(
				FlexLayout.Actions.addNode(
					{
						type: "tab",
						id: `${WORKBENCH_COMPONENTS.DATABASE_QUERY}_${panelCounterRef.current}`,
						name,
						component: WORKBENCH_COMPONENTS.DATABASE_QUERY,
						config: { initialQuery },
						enableClose: true,
						enableRename: true,
					},
					targetTabsetId,
					FlexLayout.DockLocation.CENTER,
					-1,
					true,
				),
			);
		};

		const components = {
			[WORKBENCH_COMPONENTS.FILE_EXPLORER]: {
				tab: () => <FolderTreeIcon className="size-4" />,
				panel: (
					node: FlexLayout.TabNode,
					layout: FlexLayout.Layout,
				) => {
					return (
						<EngineFileExplorerPanel
							layout={layout}
							node={node}
							engine={engine}
						/>
					);
				},
			},
			[WORKBENCH_COMPONENTS.FILE_EDITOR]: {
				tab: (node: FlexLayout.TabNode) => {
					const Icon = getFileIconComponent(node.getName());
					return <Icon className="size-4" />;
				},
				panel: (node: FlexLayout.TabNode) => {
					return (
						<EngineFileEditorPanel node={node} engine={engine} />
					);
				},
			},
			[WORKBENCH_COMPONENTS.MCP_EDITOR]: {
				tab: (node: FlexLayout.TabNode) => {
					const Icon = getFileIconComponent(node.getName());
					return <Icon className="size-4" />;
				},
				panel: (node: FlexLayout.TabNode) => {
					return <EngineMcpEditorPanel node={node} engine={engine} />;
				},
			},
			[WORKBENCH_COMPONENTS.DATABASE_COLUMNS]: {
				tab: () => <DatabaseIcon className="size-4" />,
				panel: () => {
					return (
						<div className="h-full w-full overflow-hidden">
							<DatabaseColumnsPanel
								engine={engine}
								mode={mode}
								isLoading={
									getDatabaseStructure.status === "LOADING"
								}
								error={
									getDatabaseStructure.status === "ERROR"
										? (getDatabaseStructure.error
												?.message ??
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
				panel: (node: FlexLayout.TabNode) => {
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
				panel: () => {
					return (
						<div className="h-full w-full overflow-hidden">
							<DatabaseQueryResultsPanel
								engine={engine}
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
				panel: () => (
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

		return <Workbench model={model} components={components} />;
	},
);
