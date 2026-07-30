import {
	CodeIcon,
	DatabaseIcon,
	MonitorXIcon,
	PlusIcon,
	Table2Icon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { type ColumnInterface, runPixel, usePixel } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { QueryEditorPanel } from "./query-editor-panel";
import { QueryResultsPanel } from "./query-results-panel";
import type { QueryWorkspaceMode } from "./query-script-templates";
import { QueryStructureBrowser } from "./query-structure-browser";

/** FlexLayout component identifiers for the query workspace panels */
const QUERY_WORKSPACE_COMPONENT = {
	STRUCTURE: "query-structure-browser",
	EDITOR: "query-editor",
	RESULTS: "query-results-panel",
} as const;

/** FlexLayout tab identifiers for the query workspace panels */
const QUERY_WORKSPACE_TAB = {
	STRUCTURE: "DATABASE_STRUCTURE",
	EDITOR: "QUERY_EDITOR",
	RESULTS: "QUERY_RESULTS",
} as const;

/** FlexLayout tabset identifiers for the query workspace panels */
const QUERY_WORKSPACE_TABSET = {
	EDITOR: "QUERY_EDITOR_TABSET",
} as const;

interface QueryWorkspaceProps {
	/** Engine (database) id to query */
	engine: string;

	/** Query language mode (defaults to SQL) */
	mode?: QueryWorkspaceMode;

	/**
	 * Data-access variant (defaults to "engine"). "admin" targets a privileged
	 * system database using AdminSqlQuery and AdminGetSystemDatabaseSchema.
	 */
	variant?: "engine" | "admin";
}

export const QueryWorkspace: React.FC<QueryWorkspaceProps> = observer(
	({ engine, mode = "SQL", variant = "engine" }) => {
		const [isMaximized, setIsMaximized] = useState(false);

		const panelCounterRef = useRef(1);

		const model = useMemo(() => {
			return FlexLayout.Model.fromJson({
				global: {
					tabEnableClose: false,
					tabEnableRename: false,
					tabEnableDrag: true,
					tabSetEnableDrag: true,
					tabSetEnableDrop: true,
					tabSetEnableClose: false,
					tabSetEnableMaximize: false,
					tabSetEnableDeleteWhenEmpty: false,
					borderEnableDrop: true,
				},
				borders: [
					{
						type: "border",
						location: "left",
						selected: 0,
						size: 320,
						children: [
							{
								type: "tab",
								id: QUERY_WORKSPACE_TAB.STRUCTURE,
								name: "Columns",
								component: QUERY_WORKSPACE_COMPONENT.STRUCTURE,
								enableClose: false,
							},
						],
					},
					{
						type: "border",
						location: "bottom",
						selected: -1,
						size: 300,
						children: [
							{
								type: "tab",
								id: QUERY_WORKSPACE_TAB.RESULTS,
								name: "Results",
								component: QUERY_WORKSPACE_COMPONENT.RESULTS,
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
							id: QUERY_WORKSPACE_TABSET.EDITOR,
							weight: 100,
							enableDeleteWhenEmpty: false,
							children: [
								{
									type: "tab",
									id: QUERY_WORKSPACE_TAB.EDITOR,
									name: "Query",
									component: QUERY_WORKSPACE_COMPONENT.EDITOR,
									enableClose: false,
									enableRename: true,
								},
							],
						},
					],
				},
			});
		}, []);

		const structurePixel = engine
			? variant === "admin"
				? `AdminGetSystemDatabaseSchema(database=[${JSON.stringify(engine)}]);`
				: `META|GetDatabaseTableStructure(database=["${engine}"]);`
			: "";

		const getDatabaseStructure = usePixel<unknown[]>(structurePixel);

		// Transform the pixel response rows into a list of tables with their columns.
		// - engine variant: flat array rows
		//   [tableAlias, columnAlias, type, isPrimary, columnName, tableName]
		// - admin variant: object rows { table, column, dataType }
		const structure = useMemo(() => {
			if (getDatabaseStructure.status !== "SUCCESS") {
				return [];
			}

			const rows = getDatabaseStructure.data;
			if (!Array.isArray(rows)) {
				return [];
			}

			const tableMap = new Map<string, ColumnInterface[]>();

			if (variant === "admin") {
				for (const row of rows) {
					if (!row || typeof row !== "object") {
						continue;
					}

					const typedRow = row as {
						table?: string;
						column?: string;
						dataType?: string;
					};
					const tableName = String(typedRow.table ?? "").trim();
					const columnName = String(typedRow.column ?? "").trim();
					const columnType =
						String(typedRow.dataType ?? "").trim() || "UNKNOWN";

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
			} else {
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
			}

			return Array.from(tableMap.entries()).map(([table, columns]) => ({
				table,
				columns,
			}));
		}, [getDatabaseStructure.status, getDatabaseStructure.data, variant]);

		const [isRunning, setIsRunning] = useState(false);
		const [result, setResult] =
			useState<React.ComponentProps<typeof QueryResultsPanel>["result"]>(
				null,
			);

		/**
		 * Execute a query and display the results in the results panel.
		 * @param query
		 * @param panelId
		 * @param raw - Whether to run the query in raw mode (only applicable for SPARQL)
		 * @returns
		 */
		const onRun = async (query: string, panelId: string, raw = true) => {
			const q = query.trim();
			if (!q) {
				return;
			}

			setIsRunning(true);

			try {
				// only select if not selected
				const resultsTab = model.getNodeById(
					QUERY_WORKSPACE_TAB.RESULTS,
				);
				const isResultsSelected =
					resultsTab instanceof FlexLayout.TabNode &&
					resultsTab.isVisible();
				if (!isResultsSelected) {
					model.doAction(
						FlexLayout.Actions.selectTab(
							QUERY_WORKSPACE_TAB.RESULTS,
						),
					);
				}

				let pixel: string;
				if (variant === "admin") {
					pixel = `AdminSqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], commit=[true]);`;
				} else if (mode === "SPARQL") {
					pixel = `SparqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], raw=[${raw}], commit=[true]);`;
				} else {
					pixel = `SqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], commit=[true]);`;
				}

				// run the pixel and store the results
				const response = await runPixel(pixel);

				// store the result for the results panel
				let result: React.ComponentProps<
					typeof QueryResultsPanel
				>["result"] = null;

				const output = response.pixelReturn[0].output;
				const timeToRun = response.pixelReturn[0].timeToRun;

				if (response.errors.length > 0) {
					result = {
						type: "ERROR",
						query: q,
						raw: raw, // for sparql queries, indicates if the result is raw or not
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
					result = {
						type: "TABLE",
						query: q,
						raw: raw, // for sparql queries, indicates if the result is raw or not
						sourcePanel: panelId,
						output: output.data as {
							headers: string[];
							values: unknown[][];
						},
						timeToRun: timeToRun,
					};
				} else if (output && typeof output === "string") {
					result = {
						type: "MESSAGE",
						query: q,
						raw: raw, // for sparql queries, indicates if the result is raw or not
						sourcePanel: panelId,
						message: String(output ?? ""),
						timeToRun: timeToRun,
					};
				} else {
					result = {
						type: "JSON",
						query: q,
						raw: raw, // for sparql queries, indicates if the result is raw or not
						sourcePanel: panelId,
						output: output,
						timeToRun: timeToRun,
					};
				}

				setResult(result);

				// refresh the database structure if the query was a message
				if (result?.type !== "TABLE") {
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
		 * Add a query panel to the workspace with the given initial query and name.
		 * @param initialQuery
		 * @param name
		 * @returns
		 */
		const addQueryPanel = (initialQuery: string, name: string) => {
			const tabsetNode = model.getNodeById(QUERY_WORKSPACE_TABSET.EDITOR);
			const targetTabsetId =
				tabsetNode?.getId() ?? model.getActiveTabset()?.getId() ?? "";

			if (!targetTabsetId) {
				return;
			}

			// increment
			panelCounterRef.current += 1;

			model.doAction(
				FlexLayout.Actions.addNode(
					{
						type: "tab",
						id: `${QUERY_WORKSPACE_TAB.EDITOR}_${panelCounterRef.current}`,
						name,
						component: QUERY_WORKSPACE_COMPONENT.EDITOR,
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

		return (
			<div className="relative h-full w-full overflow-hidden">
				<div
					className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
						isMaximized
							? "pointer-events-auto opacity-100"
							: "pointer-events-none hidden opacity-0"
					}`}
				/>
				<div
					className={`flex flex-col overflow-hidden rounded-lg border border-border bg-secondary-background shadow-sm transition-all duration-200 ease-in-out ${
						isMaximized ? "fixed inset-4 z-50" : "h-full w-full"
					}`}
				>
					<div className="absolute top-0 right-0 z-10 flex h-12.5 flex-row items-center gap-1.5 overflow-hidden pr-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => {
										setIsMaximized(!isMaximized);
									}}
								>
									{isMaximized ? (
										<MonitorXIcon />
									) : (
										<TvMinimalIcon />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isMaximized ? "Minimize" : "Maximize"}
							</TooltipContent>
						</Tooltip>
					</div>
					<div className="w-full flex-1 overflow-hidden rounded-md">
						<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
							<FlexLayout.Layout
								model={model}
								onRenderTab={(node, renderValues) => {
									const component = node.getComponent();
									if (
										component ===
										QUERY_WORKSPACE_COMPONENT.STRUCTURE
									) {
										renderValues.leading = (
											<DatabaseIcon className="size-4" />
										);
									} else if (
										component ===
										QUERY_WORKSPACE_COMPONENT.EDITOR
									) {
										renderValues.leading = (
											<CodeIcon className="size-4" />
										);
									} else if (
										component ===
										QUERY_WORKSPACE_COMPONENT.RESULTS
									) {
										renderValues.leading = (
											<Table2Icon className="size-4" />
										);
									}
								}}
								onRenderTabSet={(tabSetNode, renderValues) => {
									if (
										!(
											tabSetNode instanceof
											FlexLayout.TabSetNode
										)
									) {
										return;
									}

									const hasEditor = tabSetNode
										.getChildren()
										.some(
											(child) =>
												child instanceof
													FlexLayout.TabNode &&
												child.getComponent() ===
													QUERY_WORKSPACE_COMPONENT.EDITOR,
										);

									if (!hasEditor) {
										return;
									}

									renderValues.stickyButtons.push(
										<button
											key="add-query-panel"
											type="button"
											onClick={() => {
												addQueryPanel(
													"",
													`Query ${panelCounterRef.current + 1}`,
												);
											}}
											title="New query panel"
											className="flex size-6 items-center justify-center rounded hover:bg-muted"
										>
											<PlusIcon className="size-4" />
										</button>,
									);
								}}
								factory={(node) => {
									const component = node.getComponent();
									if (
										component ===
										QUERY_WORKSPACE_COMPONENT.STRUCTURE
									) {
										return (
											<div className="h-full w-full overflow-hidden bg-card">
												<QueryStructureBrowser
													engine={engine}
													mode={mode}
													isLoading={
														getDatabaseStructure.status ===
														"LOADING"
													}
													error={
														getDatabaseStructure.status ===
														"ERROR"
															? (getDatabaseStructure
																	.error
																	?.message ??
																"Failed to fetch database structure")
															: ""
													}
													refresh={() =>
														getDatabaseStructure.refresh()
													}
													structure={structure}
													onCreateQueryPanel={
														addQueryPanel
													}
												/>
											</div>
										);
									}
									if (
										component ===
										QUERY_WORKSPACE_COMPONENT.EDITOR
									) {
										return (
											<div className="h-full w-full overflow-hidden bg-card">
												<QueryEditorPanel
													node={node}
													mode={mode}
													structure={structure}
													isRunning={isRunning}
													onRun={onRun}
												/>
											</div>
										);
									}
									if (
										component ===
										QUERY_WORKSPACE_COMPONENT.RESULTS
									) {
										return (
											<div className="h-full w-full overflow-hidden">
												<QueryResultsPanel
													engine={engine}
													mode={mode}
													variant={variant}
													model={model}
													isRunning={isRunning}
													result={result}
												/>
											</div>
										);
									}
									return null;
								}}
								icons={{
									close: <XIcon className="size-4" />,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	},
);
