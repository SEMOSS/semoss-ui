import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import type { TableInterface } from "@semoss/sdk";
import {
	Card,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Select as ShadcnSelect,
	toast,
} from "@semoss/ui/next";
import {
	DatabaseStructureBrowser,
	QueryResultsPanel,
	SQLQueryEditor,
} from "@/components/database";
import { useQueryEditor, useRootStore, useSettings } from "@/hooks";
import {
	hasTabularData,
	isErrorResponse,
	type QueryResult,
} from "@/hooks/use-database-query-execution";

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

interface AdminDatabaseSchemaRow {
	table: string;
	column: string;
	dataType: string;
}

const mapSchemaRowsToTables = (rows: unknown): TableInterface[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	const tableMap = new Map<string, TableInterface["columns"]>();

	for (const row of rows) {
		if (!row || typeof row !== "object") {
			continue;
		}

		const typedRow = row as Partial<AdminDatabaseSchemaRow>;
		const table = String(typedRow.table ?? "").trim();
		const column = String(typedRow.column ?? "").trim();
		const dataType = String(typedRow.dataType ?? "").trim();

		if (!table || !column) {
			continue;
		}

		const columns = tableMap.get(table) ?? [];
		columns.push({
			column,
			type: dataType || "UNKNOWN",
		});
		tableMap.set(table, columns);
	}

	return Array.from(tableMap.entries()).map(([table, columns]) => ({
		table,
		columns,
	}));
};

interface TypeDbQuery {
	SELECTED_DATABASE: string;
	QUERY: string;
}

const buildAdminSqlPixel = (databaseId: string, queryText: string) => {
	const cleanedQuery = queryText.replaceAll("`", "");
	return `AdminSqlQuery(database=["${databaseId}"], query=["<encode>${cleanedQuery}</encode>"], commit=[true]);`;
};

export const AdminQueryPage = () => {
	const { monolithStore } = useRootStore();
	const { configStore } = useRootStore();
	const { adminMode } = useSettings();
	const dbSelectId = useId();
	const [previewData, setPreviewData] = useState<QueryResult | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [schemaLoading, setSchemaLoading] = useState<Record<string, boolean>>(
		{},
	);
	const [schemaByDatabase, setSchemaByDatabase] = useState<
		Record<string, TableInterface[]>
	>({});
	const [schemaErrorByDatabase, setSchemaErrorByDatabase] = useState<
		Record<string, string | null>
	>({});
	const [schemaSearchTerm, setSchemaSearchTerm] = useState("");
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});
	const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
	const [isQueryResultsExpanded, setIsQueryResultsExpanded] = useState(false);
	const {
		control,
		watch,
		handleSubmit,
		setValue: setFormValue,
	} = useForm<{
		SELECTED_DATABASE: string;
		QUERY: string;
	}>({
		defaultValues: {
			SELECTED_DATABASE: "",
			QUERY: "",
		},
	});

	const query = watch("QUERY");
	const selectedDatabase = watch("SELECTED_DATABASE");
	const selectedDatabaseSchema = selectedDatabase
		? schemaByDatabase[selectedDatabase]
		: undefined;
	const selectedDatabaseLoading = selectedDatabase
		? (schemaLoading[selectedDatabase] ?? false)
		: false;
	const selectedDatabaseError = selectedDatabase
		? (schemaErrorByDatabase[selectedDatabase] ?? null)
		: null;
	const pixelQueryForExport =
		selectedDatabase && query?.trim()
			? buildAdminSqlPixel(selectedDatabase, query)
			: undefined;

	const setQuery = useCallback(
		(nextQuery: string) => {
			setFormValue("QUERY", nextQuery, { shouldDirty: true });
		},
		[setFormValue],
	);

	const clearQuery = useCallback(() => {
		setFormValue("QUERY", "", { shouldDirty: true });
	}, [setFormValue]);

	const databaseOptions = configStore.config.notificationEnabled
		? [
				...DATABASE_OPTIONS,
				{ label: "Notification", value: "Notification" },
			]
		: DATABASE_OPTIONS;

	const fetchSystemDatabaseSchema = useCallback(
		async (databaseId: string, force = false) => {
			if (!databaseId) {
				return;
			}

			if (!force && schemaByDatabase[databaseId]) {
				return;
			}

			setSchemaLoading((prev) => ({
				...prev,
				[databaseId]: true,
			}));
			setSchemaErrorByDatabase((prev) => ({
				...prev,
				[databaseId]: null,
			}));

			try {
				const response = await monolithStore.runQuery(
					`AdminGetSystemDatabaseSchema(database=[${JSON.stringify(databaseId)}]);`,
				);
				const result = response.pixelReturn?.[0];
				if (result?.operationType?.indexOf("ERROR") > -1) {
					throw new Error(
						String(result.output ?? "Failed to load schema"),
					);
				}

				const tables = mapSchemaRowsToTables(result?.output);
				setSchemaByDatabase((prev) => ({
					...prev,
					[databaseId]: tables,
				}));
			} catch (error) {
				setSchemaByDatabase((prev) => ({
					...prev,
					[databaseId]: [],
				}));
				setSchemaErrorByDatabase((prev) => ({
					...prev,
					[databaseId]: "Failed to fetch database structure",
				}));
				console.error(
					`Failed to load schema for ${databaseId}:`,
					error,
				);
				toast.error(`Failed to load schema metadata for ${databaseId}`);
			} finally {
				setSchemaLoading((prev) => ({
					...prev,
					[databaseId]: false,
				}));
			}
		},
		[schemaByDatabase, monolithStore],
	);

	useEffect(() => {
		if (!selectedDatabase) {
			return;
		}

		void fetchSystemDatabaseSchema(selectedDatabase);
	}, [selectedDatabase, fetchSystemDatabaseSchema]);

	useEffect(() => {
		if (!selectedDatabase) {
			setSchemaSearchTerm("");
			setExpandedTables({});
			return;
		}

		setSchemaSearchTerm("");
		setExpandedTables((prev) => {
			const next: Record<string, boolean> = {};
			for (const table of selectedDatabaseSchema ?? []) {
				next[table.table] = prev[table.table] ?? true;
			}
			return next;
		});
	}, [selectedDatabase, selectedDatabaseSchema]);

	const searchedSchemaStructure = useMemo(() => {
		const tables = selectedDatabaseSchema ?? [];
		if (!schemaSearchTerm) {
			return tables;
		}

		const cleanedSearch = schemaSearchTerm.replace(/ /g, "_").toLowerCase();
		const searched: TableInterface[] = [];
		for (const table of tables) {
			const tableMatches = table.table
				.toLowerCase()
				.includes(cleanedSearch);

			if (tableMatches) {
				searched.push(table);
				continue;
			}

			const matchedColumns = table.columns.filter((column) =>
				column.column.toLowerCase().includes(cleanedSearch),
			);

			if (matchedColumns.length > 0) {
				searched.push({
					table: table.table,
					columns: matchedColumns,
				});
			}
		}
		return searched;
	}, [selectedDatabaseSchema, schemaSearchTerm]);

	const toggleTable = useCallback((tableName: string) => {
		setExpandedTables((prev) => ({
			...prev,
			[tableName]: !prev[tableName],
		}));
	}, []);

	const toggleAllTables = useCallback(() => {
		setExpandedTables((prev) => {
			const allExpanded =
				searchedSchemaStructure.length > 0 &&
				searchedSchemaStructure.every((table) => !!prev[table.table]);
			const nextExpanded = !allExpanded;
			const next = { ...prev };
			for (const table of searchedSchemaStructure) {
				next[table.table] = nextExpanded;
			}
			return next;
		});
	}, [searchedSchemaStructure]);

	const insertQueryToken = useCallback(
		(token: string) => {
			const trimmedToken = token.trim();
			if (!trimmedToken) {
				return;
			}

			const shouldAddSpace = query.length > 0 && !/[\s(,]$/.test(query);
			const nextQuery = shouldAddSpace
				? `${query} ${trimmedToken}`
				: `${query}${trimmedToken}`;
			setFormValue("QUERY", nextQuery, { shouldDirty: true });
		},
		[query, setFormValue],
	);

	const handleTableClick = useCallback(
		(tableName: string) => {
			if (!query.trim()) {
				setQuery(`SELECT * FROM ${tableName}`);
				return;
			}

			insertQueryToken(tableName);
		},
		[query, setQuery, insertQueryToken],
	);

	const handleColumnNameInsert = useCallback(
		(tableName: string, columnName: string) => {
			if (!query.trim()) {
				setQuery(`SELECT ${columnName} FROM ${tableName}`);
				return;
			}

			insertQueryToken(columnName);
		},
		[query, setQuery, insertQueryToken],
	);

	const refreshDatabaseStructure = useCallback(() => {
		if (!selectedDatabase) {
			toast.info("Select a database first");
			return;
		}

		setRefreshMessage("Refreshing database structure...");
		void fetchSystemDatabaseSchema(selectedDatabase, true).finally(() => {
			setTimeout(() => {
				setRefreshMessage(null);
			}, 2500);
		});
	}, [selectedDatabase, fetchSystemDatabaseSchema]);

	const mapResponseToQueryResult = (
		response: unknown,
		queryText: string,
	): QueryResult => {
		const firstResult =
			typeof response === "object" &&
			response !== null &&
			"pixelReturn" in response &&
			Array.isArray((response as { pixelReturn?: unknown[] }).pixelReturn)
				? (response as { pixelReturn: unknown[] }).pixelReturn[0]
				: null;

		if (firstResult && typeof firstResult === "object") {
			const normalized: QueryResult = {
				...(firstResult as Omit<QueryResult, "queryType">),
				queryType: "OTHER",
				queryText,
			};

			normalized.queryType = hasTabularData(normalized)
				? "SELECT"
				: "OTHER";
			return normalized;
		}

		const fallback: QueryResult = {
			output: response,
			timeToRun: 0,
			queryType: "OTHER",
			queryText,
		};

		fallback.queryType = hasTabularData(fallback) ? "SELECT" : "OTHER";
		return fallback;
	};

	const submitQuery = handleSubmit(async (data: TypeDbQuery) => {
		const queryToRun = data.QUERY ?? "";
		const pixelString = buildAdminSqlPixel(
			data.SELECTED_DATABASE,
			queryToRun,
		);

		setPreviewLoading(true);
		try {
			const response = await monolithStore.runQuery(pixelString);
			const result = mapResponseToQueryResult(response, queryToRun);
			setPreviewData(result);

			if (isErrorResponse(result)) {
				toast.error(
					typeof result.output === "string"
						? result.output
						: JSON.stringify(result.output),
				);
				return;
			}

			toast.success("Successfully submitted query");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			setPreviewData({
				error: true,
				output: `Error: ${message}`,
				operationType: ["ERROR"],
				queryType: "OTHER",
				queryText: queryToRun,
			});
			toast.error(message);
		} finally {
			setPreviewLoading(false);
		}
	});

	const executeQuery = useCallback(() => {
		if (!selectedDatabase) {
			toast.info("Select a database first");
			return;
		}

		void submitQuery();
	}, [selectedDatabase, submitQuery]);

	const { handleEditorMount } = useQueryEditor({
		onRun: (value) => {
			const trimmedValue = value.trim();
			if (!selectedDatabase || !trimmedValue) {
				return;
			}

			setQuery(value);
			void submitQuery();
		},
		tables: selectedDatabase
			? (schemaByDatabase[selectedDatabase] ?? [])
			: [],
	});

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	return (
		<div className="relative flex w-full flex-col gap-6 pb-8">
			{isQueryResultsExpanded && (
				<div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-[1px]" />
			)}

			<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]">
				<div className="flex w-full flex-col gap-2 lg:col-start-1 lg:row-start-1">
					<label
						htmlFor={dbSelectId}
						className="text-muted-foreground text-sm"
					>
						Database
					</label>
					<Controller
						name="SELECTED_DATABASE"
						control={control}
						render={({ field }) => (
							<ShadcnSelect
								value={field.value ?? ""}
								onValueChange={field.onChange}
							>
								<SelectTrigger
									id={dbSelectId}
									className="w-full"
								>
									<SelectValue placeholder="Select database" />
								</SelectTrigger>
								<SelectContent>
									{databaseOptions?.map((option, i) => (
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
						)}
					/>
				</div>

				<Card className="group flex h-[360px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl lg:col-start-1 lg:row-start-2 lg:h-[560px] lg:max-h-[calc(100dvh-300px)]">
					<DatabaseStructureBrowser
						searchTerm={schemaSearchTerm}
						setSearchTerm={setSchemaSearchTerm}
						searchedStructure={searchedSchemaStructure}
						expandedTables={expandedTables}
						toggleTable={toggleTable}
						toggleAllTables={toggleAllTables}
						isLoading={selectedDatabaseLoading}
						error={selectedDatabaseError}
						refreshDatabaseStructure={refreshDatabaseStructure}
						refreshMessage={refreshMessage}
						onTableClick={handleTableClick}
						onColumnNameInsert={handleColumnNameInsert}
						titleClassName="font-medium text-sm"
					/>
				</Card>

				<div className="min-w-0 lg:col-start-2 lg:row-start-2">
					<Card className="group flex h-[360px] flex-col overflow-hidden rounded-2xl p-0 shadow-lg lg:h-[560px] lg:max-h-[calc(100dvh-300px)]">
						<SQLQueryEditor
							query={query}
							setQuery={setQuery}
							clearQuery={clearQuery}
							handleEditorMount={handleEditorMount}
							executeQuery={executeQuery}
							previewLoading={previewLoading}
							runDisabled={!selectedDatabase}
						/>
					</Card>
					<p className="mt-2 text-muted-foreground text-xs">
						Use Ctrl/Cmd+Space for SQL suggestions and
						Ctrl/Cmd+Enter to run.
						{selectedDatabase && schemaLoading[selectedDatabase]
							? " Loading schema metadata..."
							: ""}
					</p>
				</div>
			</div>

			<div
				className={
					isQueryResultsExpanded
						? "fixed inset-4 z-50"
						: "h-[420px] min-h-[320px] w-full lg:h-[min(68vh,820px)] lg:min-h-[420px]"
				}
			>
				<QueryResultsPanel
					previewData={previewData}
					previewLoading={previewLoading}
					clearResults={() => setPreviewData(null)}
					onExpandChange={setIsQueryResultsExpanded}
					pixelQuery={pixelQueryForExport}
				/>
			</div>
		</div>
	);
};
