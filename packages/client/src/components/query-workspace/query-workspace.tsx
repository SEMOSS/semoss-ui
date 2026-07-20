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
import { useCallback, useMemo, useRef, useState } from "react";
import { type ColumnInterface, runPixel, usePixel } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { QueryResultsPanel } from "@/components/database";
import {
	hasTabularData,
	isErrorResponse,
	type QueryResult,
} from "@/hooks/use-database-query-execution";
import { QueryEditorPanel } from "./query-editor-panel";
import { QueryStructureBrowser } from "./query-structure-browser";

/** Query language handled by the workspace */
export type QueryWorkspaceMode = "SQL" | "SPARQL";

/** Data-access variant handled by the workspace */
export type QueryWorkspaceVariant = "engine" | "admin";

/** FlexLayout component identifiers for the query workspace panels */
export const QUERY_WORKSPACE_COMPONENT = {
	STRUCTURE: "query-structure-browser",
	EDITOR: "query-editor",
	RESULTS: "query-results-panel",
} as const;

/** FlexLayout tab identifiers for the query workspace panels */
export const QUERY_WORKSPACE_TAB = {
	STRUCTURE: "DATABASE_STRUCTURE",
	EDITOR: "QUERY_EDITOR",
	RESULTS: "QUERY_RESULTS",
} as const;

/** FlexLayout tabset identifiers for the query workspace panels */
export const QUERY_WORKSPACE_TABSET = {
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
	variant?: QueryWorkspaceVariant;
}

export const QueryWorkspace: React.FC<QueryWorkspaceProps> = observer(
	({ engine, mode = "SQL", variant = "engine" }) => {
		const [isMaximized, setIsMaximized] = useState(false);
		const [activeResultPanelId, setActiveResultPanelId] = useState<
			string | null
		>(null);
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

		const [previewData, setPreviewData] = useState<QueryResult | null>(
			null,
		);
		const [isRunning, setIsRunning] = useState(false);
		const [pixelQuery, setPixelQuery] = useState<string | null>(null);

		const clearResults = () => {
			setPreviewData(null);
		};

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

			setActiveResultPanelId(panelId);
			setIsRunning(true);

			// only select if active
			const resultsTab = model.getNodeById(QUERY_WORKSPACE_TAB.RESULTS);
			const isResultsSelected =
				resultsTab instanceof FlexLayout.TabNode &&
				resultsTab.isVisible();

			if (!isResultsSelected) {
				model.doAction(
					FlexLayout.Actions.selectTab(QUERY_WORKSPACE_TAB.RESULTS),
				);
			}

			try {
				let pixel: string;
				if (variant === "admin") {
					const cleaned = q.replaceAll("`", "");
					pixel = `AdminSqlQuery(database=["${engine}"], query=["<encode>${cleaned}</encode>"], commit=[true]);`;
				} else if (mode === "SPARQL") {
					pixel = `SparqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], raw=[${raw}], commit=[true]);`;
				} else {
					pixel = `SqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], commit=[true]);`;
				}
				setPixelQuery(pixel);

				const response = await runPixel(pixel);

				let resultToStore: QueryResult;
				if (response?.pixelReturn && response.pixelReturn.length > 0) {
					resultToStore = {
						...response.pixelReturn[0],
						queryType: "OTHER",
						queryText: q,
					};
				} else {
					resultToStore = {
						output: response,
						queryType: "OTHER",
						timeToRun: 0,
						queryText: q,
					};
				}

				resultToStore.queryType = hasTabularData(resultToStore)
					? "SELECT"
					: "OTHER";

				setPreviewData(resultToStore);

				if (
					!isErrorResponse(resultToStore) &&
					!hasTabularData(resultToStore)
				) {
					getDatabaseStructure.refresh();
				}
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : "Unknown error";

				setPreviewData({
					error: true,
					output: `Error: ${message}`,
					operationType: ["ERROR"],
					queryType: "OTHER",
					queryText: q,
				});
			} finally {
				setIsRunning(false);
			}
		};

		const addQueryPanel = useCallback(
			(initialQuery: string, name: string) => {
				const tabsetNode = model.getNodeById(
					QUERY_WORKSPACE_TABSET.EDITOR,
				);
				const targetTabsetId =
					tabsetNode?.getId() ??
					model.getActiveTabset()?.getId() ??
					"";

				if (!targetTabsetId) {
					return;
				}

				panelCounterRef.current += 1;
				const panelId = `${QUERY_WORKSPACE_TAB.EDITOR}_${Date.now()}_${panelCounterRef.current}`;

				model.doAction(
					FlexLayout.Actions.addNode(
						{
							type: "tab",
							id: panelId,
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
			},
			[model],
		);

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
										const sourceNode = activeResultPanelId
											? model.getNodeById(
													activeResultPanelId,
												)
											: undefined;
										const sourcePanelName =
											sourceNode instanceof
											FlexLayout.TabNode
												? sourceNode.getName()
												: undefined;
										return (
											<div className="h-full w-full overflow-hidden">
												<QueryResultsPanel
													previewData={previewData}
													previewLoading={isRunning}
													clearResults={clearResults}
													pixelQuery={
														pixelQuery ?? undefined
													}
													sourcePanelName={
														sourcePanelName
													}
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
