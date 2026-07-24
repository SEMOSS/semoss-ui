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
import { useId, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { type ColumnInterface, runPixel, usePixel } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Select as ShadcnSelect,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	DatabaseColumnsPanel,
	DatabaseQueryPanel,
	DatabaseQueryResultsPanel,
	WORKBENCH_COMPONENTS,
} from "@/components/workbench";
import { useRootStore, useSettings } from "@/hooks";

/** FlexLayout tabset that hosts both file editors and query editors */
const MAIN_TABSET = "MAIN_TABSET";

const DATABASE_OPTIONS = [
	{ label: "Audit Logs", value: "AuditLogs" },
	{ label: "Local Master Database", value: "LocalMasterDatabase" },
	{
		label: "Model Inference Logs Database",
		value: "ModelInferenceLogsDatabase",
	},
	{ label: "Prompt Database", value: "PromptDatabase" },
	{ label: "Scheduler", value: "scheduler" },
	{ label: "Security", value: "security" },
	{ label: "Themes", value: "themes" },
	{ label: "User Tracking Database", value: "UserTrackingDatabase" },
];

interface AdminQueryWorkspaceProps {
	/** System database id to query */
	engine: string;
}

/**
 * Query workspace for privileged admin access to internal system databases.
 * Runs AdminSqlQuery / AdminGetSystemDatabaseSchema against the selected
 * system database.
 */
const AdminQueryWorkspace: React.FC<AdminQueryWorkspaceProps> = observer(
	({ engine }) => {
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
								id: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
								name: "Columns",
								component:
									WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
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
								id: WORKBENCH_COMPONENTS.DATABASE_RESULTS,
								name: "Results",
								component:
									WORKBENCH_COMPONENTS.DATABASE_RESULTS,
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

		const getDatabaseStructure = usePixel<unknown[]>(
			engine
				? `AdminGetSystemDatabaseSchema(database=[${JSON.stringify(engine)}]);`
				: "",
		);

		// Transform the admin schema rows { table, column, dataType } into a
		// list of tables with their columns.
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

		/**
		 * Execute an admin SQL query and display the results in the results panel.
		 * @param query - the query text to run
		 * @param panelId - the editor panel that triggered the run
		 */
		const onRun = async (query: string, panelId: string) => {
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

				const pixel = `AdminSqlQuery(database=["${engine}"], query=["<encode>${q}</encode>"], commit=[true]);`;

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
						raw: false,
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
						raw: false,
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
						raw: false,
						sourcePanel: panelId,
						message: String(output ?? ""),
						timeToRun: timeToRun,
					};
				} else {
					nextResult = {
						type: "JSON",
						query: q,
						raw: false,
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
		 * Add a query editor panel to the workspace.
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
										WORKBENCH_COMPONENTS.DATABASE_COLUMNS
									) {
										renderValues.leading = (
											<DatabaseIcon className="size-4" />
										);
									} else if (
										component ===
										WORKBENCH_COMPONENTS.DATABASE_QUERY
									) {
										renderValues.leading = (
											<CodeIcon className="size-4" />
										);
									} else if (
										component ===
										WORKBENCH_COMPONENTS.DATABASE_RESULTS
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
													WORKBENCH_COMPONENTS.DATABASE_QUERY,
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
										WORKBENCH_COMPONENTS.DATABASE_COLUMNS
									) {
										return (
											<div className="h-full w-full overflow-hidden bg-card">
												<DatabaseColumnsPanel
													engine={engine}
													mode="SQL"
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
										WORKBENCH_COMPONENTS.DATABASE_QUERY
									) {
										return (
											<div className="h-full w-full overflow-hidden bg-card">
												<DatabaseQueryPanel
													node={node}
													mode="SQL"
													structure={structure}
													isRunning={isRunning}
													onRun={onRun}
												/>
											</div>
										);
									}
									if (
										component ===
										WORKBENCH_COMPONENTS.DATABASE_RESULTS
									) {
										return (
											<div className="h-full w-full overflow-hidden">
												<DatabaseQueryResultsPanel
													engine={engine}
													mode="SQL"
													variant="admin"
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

export const AdminQueryPage = () => {
	const { configStore } = useRootStore();
	const { adminMode } = useSettings();
	const dbSelectId = useId();
	const [selectedDatabase, setSelectedDatabase] = useState("");

	const databaseOptions = configStore.config.notificationEnabled
		? [
				...DATABASE_OPTIONS,
				{ label: "Notification", value: "Notification" },
			]
		: DATABASE_OPTIONS;

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	return (
		<div className="flex w-full flex-col gap-4 pb-8">
			<div className="flex w-full max-w-md flex-col gap-2">
				<label
					htmlFor={dbSelectId}
					className="text-muted-foreground text-sm"
				>
					Database
				</label>
				<ShadcnSelect
					value={selectedDatabase}
					onValueChange={setSelectedDatabase}
				>
					<SelectTrigger id={dbSelectId} className="w-full">
						<SelectValue placeholder="Select database" />
					</SelectTrigger>
					<SelectContent>
						{databaseOptions.map((option, i) => (
							<SelectItem
								value={option.value}
								key={option.value}
								data-testid={`adminQueryPage-db-option-${i}`}
							>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</ShadcnSelect>
			</div>

			{selectedDatabase ? (
				<div className="h-[calc(100dvh-240px)] min-h-[480px] w-full overflow-hidden">
					<AdminQueryWorkspace
						key={selectedDatabase}
						engine={selectedDatabase}
					/>
				</div>
			) : (
				<div className="flex h-60 w-full items-center justify-center rounded-2xl border border-border/50 border-dashed bg-card/50 text-muted-foreground text-sm">
					Select a database to begin querying.
				</div>
			)}
		</div>
	);
};
