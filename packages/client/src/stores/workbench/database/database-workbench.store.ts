import { createStore, type StoreApi } from "zustand";
import type { ColumnInterface } from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import { isRecord } from "@semoss/utility/object";
import type { WorkbenchPanelRecord, WorkbenchState } from "@semoss/workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

/**
 * Query mode handled by the database workbench. SQL/SPARQL are derived from
 * the engine's category; ADMIN_SQL is pinned by the admin query page and runs
 * the admin-permission pixels against a system database — its queries are
 * always SQL, so anything branching on the language should treat every
 * non-SPARQL mode as SQL.
 */
type DatabaseWorkbenchMode = "SQL" | "SPARQL" | "ADMIN_SQL";

/** One table (SQL) or graph/concept (SPARQL) and its columns from GetDatabaseTableStructure. */
interface DatabaseTableStructure {
	table: string;
	columns: ColumnInterface[];
}

/** Result rendered by one paired results panel, keyed by its source query panel id. */
type DatabaseQueryResult =
	| {
			type: "TABLE";
			query: string;
			raw: boolean;
			sourcePanel: string;
			output: { headers: string[]; values: unknown[][] };
			timeToRun: number;
	  }
	| {
			type: "MESSAGE";
			query: string;
			raw: boolean;
			sourcePanel: string;
			message: string;
			timeToRun: number;
	  }
	| {
			type: "JSON";
			query: string;
			raw: boolean;
			sourcePanel: string;
			output: unknown;
			timeToRun: number;
	  }
	| {
			type: "ERROR";
			query: string;
			raw: boolean;
			sourcePanel: string;
			message: string;
			timeToRun: number;
	  }
	| {
			type: "BATCH";
			query: string;
			raw: boolean;
			sourcePanel: string;
			results: DatabaseStatementResult[];
			/** What the script left in the database, when it ran in one transaction. */
			transaction?: DatabaseTransactionSummary;
			timeToRun: number;
	  };

/** Each outcome a SQL script run in one transaction can have. */
const TRANSACTION_OUTCOMES = ["COMMITTED", "ROLLED_BACK", "UNKNOWN"] as const;

/**
 * What a SQL script run in one transaction left in the database: COMMITTED
 * kept every change, ROLLED_BACK kept none, and UNKNOWN means the commit did
 * not report back, so the database has to be checked.
 */
export type DatabaseTransactionOutcome = (typeof TRANSACTION_OUTCOMES)[number];

/** The whole-script part of a SQL script run in one transaction. */
export interface DatabaseTransactionSummary {
	/** What the transaction left in the database. */
	outcome: DatabaseTransactionOutcome;
	/** The backend's sentence about the outcome, naming a failed statement. */
	message: string;
}

interface DatabaseStatementResultBase {
	statement: number;
	query: string;
	route: string;
	timeToRun: number;
	/** Rows the statement changed, as the driver reported it, in one transaction. */
	updateCount?: number;
	/** The SQLState of the statement's error, when the driver gave one, in one transaction. */
	sqlState?: string;
	/** Whether rows were left out of a table kept in one transaction, past the limit. */
	hasMoreRows?: boolean;
}

/**
 * One eagerly collected statement result from a multi-statement SQL query, or
 * from a script run in one transaction, where a table can belong to a statement
 * that was then rolled back.
 */
export type DatabaseStatementResult = DatabaseStatementResultBase &
	(
		| {
				type: "TABLE";
				status: "SUCCESS";
				output: { headers: string[]; values: unknown[][] };
		  }
		| {
				type: "TABLE";
				status: "ROLLED_BACK";
				output: { headers: string[]; values: unknown[][] };
		  }
		| {
				type: "MESSAGE";
				status: "SUCCESS";
				message: string;
		  }
		| {
				type: "MESSAGE";
				status: "ROLLED_BACK";
				message: string;
		  }
		| {
				type: "ERROR";
				status: "ERROR";
				message: string;
		  }
		| {
				type: "SKIPPED";
				status: "SKIPPED";
				message: string;
		  }
	);

/** Async request state shared by the structure and category fetches. */
interface DatabaseFetchState<TData> {
	status: "IDLE" | "LOADING" | "SUCCESS" | "ERROR";
	error?: string;
	data: TData;
	refresh: () => Promise<void>;
}

/** State and actions owned by one database workbench's dedicated store. */
export interface DatabaseWorkbenchState {
	/** Engine currently loaded by this workbench instance. */
	engineId: string;

	/**
	 * Resets the store for an engine and loads its structure. Without a mode
	 * the query language is derived from the engine's category; passing
	 * ADMIN_SQL pins the mode and skips the category fetch (system databases
	 * reject the engine category pixel).
	 */
	initialize: (
		engineId: string,
		mode?: DatabaseWorkbenchMode,
	) => Promise<void>;

	mode: DatabaseWorkbenchMode;

	structure: DatabaseFetchState<DatabaseTableStructure[]>;

	category: DatabaseFetchState<string>;

	/** Latest result per query panel id (undefined/null until that panel has run). */
	results: Record<string, DatabaseQueryResult | null>;

	/** Whether a query is currently running for a given query panel id. */
	runningPanels: Record<string, boolean>;

	/** The results panel paired with a query panel, found by config.sourcePanel. */
	getResultsPanelId: (queryPanelId: string) => string | undefined;

	/** Adds a new query editor panel to the main tabset. */
	addQueryPanel: (initialQuery: string, name?: string) => void;

	/**
	 * Runs a query and opens/reuses its paired results panel. In SQL mode a
	 * script can run in one transaction that commits once, with a timeout for
	 * the whole script; other modes ignore both.
	 */
	onQuery: (params: {
		panelId: string;
		query: string;
		raw?: boolean;
		transaction?: boolean;
		timeout?: number;
	}) => Promise<void>;

	/**
	 * Wired to the workbench shell's onPanelClose: cascades a query panel's
	 * close to its paired results panel and prunes both maps.
	 */
	handlePanelClosed: (pid: string, record: WorkbenchPanelRecord) => void;
}

/** Dependencies injected into the database store. */
export interface DatabaseWorkbenchStoreDeps {
	/** The scoped workbench store this domain drives panels through. */
	workbench: StoreApi<WorkbenchState>;
}

/**
 * Transforms flat GetDatabaseTableStructure rows
 * [tableAlias, columnAlias, type, isPrimary, columnName, tableName]
 * into a list of tables with their columns.
 */
const parseDatabaseStructure = (rows: unknown): DatabaseTableStructure[] => {
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
		columns.push({ column: columnName, type: columnType });
		tableMap.set(tableName, columns);
	}

	return Array.from(tableMap.entries()).map(([table, columns]) => ({
		table,
		columns,
	}));
};

/**
 * Transforms AdminGetSystemDatabaseSchema rows { table, column, dataType }
 * into a list of tables with their columns.
 */
const parseAdminSchemaRows = (rows: unknown): DatabaseTableStructure[] => {
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
		const columnType = String(typedRow.dataType ?? "").trim() || "UNKNOWN";

		if (!tableName || !columnName) {
			continue;
		}

		const columns = tableMap.get(tableName) ?? [];
		columns.push({ column: columnName, type: columnType });
		tableMap.set(tableName, columns);
	}

	return Array.from(tableMap.entries()).map(([table, columns]) => ({
		table,
		columns,
	}));
};

/** Parses one statement's entry, or returns null when the item is not one. */
const parseStatementResult = (
	item: unknown,
): DatabaseStatementResult | null => {
	if (!isRecord(item)) {
		return null;
	}

	const statement = item.statement;
	const query = item.query;
	const route = item.route;
	const type = item.type;
	const status = item.status;
	const timeToRun = item.timeToRun;
	if (
		typeof statement !== "number" ||
		typeof query !== "string" ||
		typeof route !== "string" ||
		typeof type !== "string" ||
		typeof status !== "string" ||
		typeof timeToRun !== "number"
	) {
		return null;
	}

	const base: DatabaseStatementResultBase = {
		statement,
		query,
		route,
		timeToRun,
	};
	if (typeof item.updateCount === "number") {
		base.updateCount = item.updateCount;
	}
	if (typeof item.sqlState === "string") {
		base.sqlState = item.sqlState;
	}
	if (typeof item.hasMoreRows === "boolean") {
		base.hasMoreRows = item.hasMoreRows;
	}

	if (type === "TABLE" && isRecord(item.output)) {
		const headers = item.output.headers;
		const values = item.output.values;
		if (
			Array.isArray(headers) &&
			headers.every((header) => typeof header === "string") &&
			Array.isArray(values) &&
			values.every((row) => Array.isArray(row))
		) {
			const output = { headers, values: values as unknown[][] };
			if (status === "SUCCESS") {
				return { ...base, type, status, output };
			}
			if (status === "ROLLED_BACK") {
				return { ...base, type, status, output };
			}
		}
	}

	if (typeof item.message === "string") {
		if (type === "MESSAGE" && status === "SUCCESS") {
			return { ...base, type, status, message: item.message };
		}
		if (type === "MESSAGE" && status === "ROLLED_BACK") {
			return { ...base, type, status, message: item.message };
		}
		if (type === "ERROR" && status === "ERROR") {
			return { ...base, type, status, message: item.message };
		}
		if (type === "SKIPPED" && status === "SKIPPED") {
			return { ...base, type, status, message: item.message };
		}
	}

	return null;
};

/** Parses every entry, or returns null when any item is not a statement's entry. */
const parseStatementList = (
	items: unknown[],
): DatabaseStatementResult[] | null => {
	const results: DatabaseStatementResult[] = [];
	for (const item of items) {
		const result = parseStatementResult(item);
		if (!result) {
			return null;
		}
		results.push(result);
	}
	return results;
};

/** Parses the stable SQL batch payload returned by AbstractSqlQueryReactor. */
export const parseStatementResults = (
	output: unknown,
): DatabaseStatementResult[] | null => {
	if (!Array.isArray(output) || output.length < 2) {
		return null;
	}
	return parseStatementList(output);
};

/**
 * Parses the payload of a SQL script run in one transaction: its outcome, the
 * backend's message about it, and one entry per statement, a script of one
 * statement included.
 */
export const parseTransactionResult = (
	output: unknown,
): {
	transaction: DatabaseTransactionSummary;
	results: DatabaseStatementResult[];
} | null => {
	if (!isRecord(output)) {
		return null;
	}

	const outcome = TRANSACTION_OUTCOMES.find(
		(candidate) => candidate === output.outcome,
	);
	const message = output.message;
	const statements = output.statements;
	if (
		!outcome ||
		typeof message !== "string" ||
		!Array.isArray(statements) ||
		statements.length === 0
	) {
		return null;
	}

	const results = parseStatementList(statements);
	return results ? { transaction: { outcome, message }, results } : null;
};

/** What one run of a query panel sends. */
export interface DatabaseQueryRequest {
	/** The workbench mode, which picks the pixel. */
	mode: DatabaseWorkbenchMode;
	/** The database the query runs on. */
	engineId: string;
	/** The query or script, as typed. */
	query: string;
	/** SPARQL only: whether the rows come back raw. */
	raw: boolean;
	/** SQL only: whether every statement runs in one transaction that commits once. */
	transaction: boolean;
	/** SQL in one transaction only: the seconds the whole script may run. */
	timeout?: number;
}

/**
 * The pixel for one run. Only SQL mode runs a script in one transaction, since
 * AdminSqlQuery and SparqlQuery take no transaction.
 */
export const buildQueryPixel = ({
	mode,
	engineId,
	query,
	raw,
	transaction,
	timeout,
}: DatabaseQueryRequest): string => {
	const target = `database=["${engineId}"], query=["<encode>${query}</encode>"]`;
	if (mode === "ADMIN_SQL") {
		return `AdminSqlQuery(${target}, commit=[true]);`;
	}
	if (mode === "SPARQL") {
		return `SparqlQuery(${target}, raw=[${raw}], commit=[true]);`;
	}
	if (!transaction) {
		return `SqlQuery(${target}, commit=[true]);`;
	}
	const limit = timeout === undefined ? "" : `, timeout=[${timeout}]`;
	return `SqlQuery(${target}, commit=[true], transaction=[true]${limit});`;
};

/** The next query number, derived from the records so it survives a reload. */
const nextQueryNumber = (workbench: StoreApi<WorkbenchState>): number => {
	const numbers = Object.values(workbench.getState().layout.panels)
		.filter((record) => record.type === WORKBENCH_COMPONENTS.DATABASE_QUERY)
		.map((record) => Number(record.config?.queryNumber ?? 1))
		.filter((value) => Number.isFinite(value));
	return Math.max(1, ...numbers) + 1;
};

/**
 * Creates the dedicated store for one database workbench. Structure, results,
 * and query execution live here so the columns/query/results panels can share
 * them; panels are driven through the injected workbench store's actions.
 *
 * @name createDatabaseWorkbenchStore
 * @param deps - The scoped workbench store to drive panels through.
 * @return A vanilla zustand store provided by the database workbench.
 */
export const createDatabaseWorkbenchStore = (
	deps: DatabaseWorkbenchStoreDeps,
): StoreApi<DatabaseWorkbenchState> => {
	return createStore<DatabaseWorkbenchState>()((set, get) => ({
		engineId: "",
		initialize: async (engineId, mode = "SQL") => {
			set((state) => ({
				engineId,
				mode,
				structure: {
					...state.structure,
					status: "IDLE",
					error: undefined,
					data: [],
				},
				category: {
					...state.category,
					status: "IDLE",
					error: undefined,
					data: "",
				},
				results: {},
				runningPanels: {},
			}));

			// ADMIN_SQL is pinned, so the category (whose only job is
			// deriving SQL vs SPARQL) is irrelevant — and system databases
			// reject the engine category pixel anyway
			await Promise.all(
				mode === "ADMIN_SQL"
					? [get().structure.refresh()]
					: [get().category.refresh(), get().structure.refresh()],
			);
		},
		mode: "SQL",

		structure: {
			status: "IDLE",
			error: undefined,
			data: [],
			refresh: async () => {
				const engineId = get().engineId;
				if (!engineId) {
					return;
				}

				set((state) => ({
					structure: {
						...state.structure,
						status: "LOADING",
						error: undefined,
					},
				}));

				const isAdmin = get().mode === "ADMIN_SQL";

				try {
					const response = await runPixel(
						isAdmin
							? `AdminGetSystemDatabaseSchema(database=["${engineId}"]);`
							: `META|GetDatabaseTableStructure(database=["${engineId}"]);`,
					);

					if (response.errors.length > 0) {
						if (get().engineId !== engineId) {
							return;
						}

						set((state) => ({
							structure: {
								...state.structure,
								status: "ERROR",
								error: response.errors.join("\n"),
							},
						}));
						return;
					}

					const data = isAdmin
						? parseAdminSchemaRows(response.pixelReturn[0]?.output)
						: parseDatabaseStructure(
								response.pixelReturn[0]?.output,
							);
					if (get().engineId !== engineId) {
						return;
					}

					set((state) => ({
						structure: {
							...state.structure,
							status: "SUCCESS",
							error: undefined,
							data,
						},
					}));
				} catch (err: unknown) {
					if (get().engineId !== engineId) {
						return;
					}

					const message = getErrorMessage(err, "Unknown error");

					set((state) => ({
						structure: {
							...state.structure,
							status: "ERROR",
							error: message,
						},
					}));
				}
			},
		},

		category: {
			status: "IDLE",
			error: undefined,
			data: "",
			refresh: async () => {
				const engineId = get().engineId;
				if (!engineId) {
					return;
				}

				set((state) => ({
					category: {
						...state.category,
						status: "LOADING",
						error: undefined,
					},
				}));

				try {
					const response = await runPixel(
						`GetDatabaseCategory(engine=["${engineId}"]);`,
					);

					if (response.errors.length > 0) {
						if (get().engineId !== engineId) {
							return;
						}

						set((state) => ({
							category: {
								...state.category,
								status: "ERROR",
								error: response.errors.join("\n"),
							},
						}));
						return;
					}

					const data = String(response.pixelReturn[0]?.output ?? "");
					if (get().engineId !== engineId) {
						return;
					}

					set((state) => ({
						mode: data === "RDF" ? "SPARQL" : "SQL",
						category: {
							...state.category,
							status: "SUCCESS",
							error: undefined,
							data,
						},
					}));
				} catch (err: unknown) {
					if (get().engineId !== engineId) {
						return;
					}

					const message = getErrorMessage(err, "Unknown error");

					set((state) => ({
						category: {
							...state.category,
							status: "ERROR",
							error: message,
						},
					}));
				}
			},
		},

		results: {},
		runningPanels: {},

		getResultsPanelId: (queryPanelId) =>
			Object.values(deps.workbench.getState().layout.panels).find(
				(record) =>
					record.type === WORKBENCH_COMPONENTS.DATABASE_RESULTS &&
					record.config?.sourcePanel === queryPanelId,
			)?.id,

		addQueryPanel: (initialQuery, name) => {
			const number = nextQueryNumber(deps.workbench);
			deps.workbench
				.getState()
				.layout.actions.spawnPanel(
					WORKBENCH_COMPONENTS.DATABASE_QUERY,
					{
						name: name ?? `Query ${number}`,
						config: { initialQuery, queryNumber: number },
						canClose: true,
					},
				);
		},

		onQuery: async ({
			panelId,
			query,
			raw = true,
			transaction = false,
			timeout,
		}) => {
			const engineId = get().engineId;
			if (!engineId) {
				return;
			}

			const q = query.trim();
			if (!q) {
				return;
			}

			const workbench = deps.workbench.getState();
			const panelName = workbench.layout.panels[panelId]?.name ?? "Query";

			set((state) => ({
				runningPanels: {
					...state.runningPanels,
					[panelId]: true,
				},
			}));

			// Reveals the paired results panel, spawning it into the bottom
			// border the first time this query panel runs.
			const existingResultsId = get().getResultsPanelId(panelId);
			if (existingResultsId) {
				workbench.layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.DATABASE_RESULTS,
					{ sourcePanel: panelId },
				);
			} else {
				workbench.layout.actions.spawnPanel(
					WORKBENCH_COMPONENTS.DATABASE_RESULTS,
					{
						name: `Results — ${panelName}`,
						config: { sourcePanel: panelId },
						canClose: true,
						canRename: false,
						target: { kind: "border", side: "bottom" },
					},
				);
			}

			try {
				const mode = get().mode;
				const isOneTransaction = transaction && mode === "SQL";
				const pixel = buildQueryPixel({
					mode,
					engineId,
					query: q,
					raw,
					transaction: isOneTransaction,
					timeout,
				});

				const response = await runPixel(pixel);
				if (get().engineId !== engineId) {
					return;
				}

				let nextResult: DatabaseQueryResult;

				const firstReturn = response.pixelReturn[0];
				const output = firstReturn?.output;
				const timeToRun = firstReturn?.timeToRun ?? 0;
				// a reply that is not a transaction result reads as any other reply
				const transactionResult = isOneTransaction
					? parseTransactionResult(output)
					: null;

				if (response.errors.length > 0) {
					nextResult = {
						type: "ERROR",
						query: q,
						raw,
						sourcePanel: panelId,
						message: response.errors.join("\n"),
						timeToRun,
					};
				} else if (transactionResult) {
					nextResult = {
						type: "BATCH",
						query: q,
						raw,
						sourcePanel: panelId,
						results: transactionResult.results,
						transaction: transactionResult.transaction,
						timeToRun,
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
						raw,
						sourcePanel: panelId,
						output: output.data as {
							headers: string[];
							values: unknown[][];
						},
						timeToRun,
					};
				} else if (typeof output === "string") {
					nextResult = {
						type: "MESSAGE",
						query: q,
						raw,
						sourcePanel: panelId,
						message: String(output ?? ""),
						timeToRun,
					};
				} else {
					const statementResults = parseStatementResults(output);
					if (statementResults) {
						nextResult = {
							type: "BATCH",
							query: q,
							raw,
							sourcePanel: panelId,
							results: statementResults,
							timeToRun,
						};
					} else {
						nextResult = {
							type: "JSON",
							query: q,
							raw,
							sourcePanel: panelId,
							output,
							timeToRun,
						};
					}
				}

				set((state) => ({
					results: {
						...state.results,
						[panelId]: nextResult,
					},
				}));

				// refresh the structure when the query may have mutated the schema
				if (nextResult.type !== "TABLE") {
					get().structure.refresh();
				}
			} catch (err: unknown) {
				if (get().engineId !== engineId) {
					return;
				}

				const message = getErrorMessage(err, "Unknown error");

				set((state) => ({
					results: {
						...state.results,
						[panelId]: {
							type: "ERROR",
							query: q,
							raw: false,
							sourcePanel: panelId,
							message,
							timeToRun: 0,
						},
					},
				}));
			} finally {
				if (get().engineId === engineId) {
					set((state) => ({
						runningPanels: {
							...state.runningPanels,
							[panelId]: false,
						},
					}));
				}
			}
		},

		handlePanelClosed: (pid, record) => {
			if (record.type === WORKBENCH_COMPONENTS.DATABASE_QUERY) {
				// cascade: a closed query panel takes its results panel along
				const resultsId = get().getResultsPanelId(pid);
				if (resultsId) {
					deps.workbench
						.getState()
						.layout.actions.closePanel(resultsId);
				}
				set((state) => {
					const results = { ...state.results };
					const runningPanels = { ...state.runningPanels };
					delete results[pid];
					delete runningPanels[pid];
					return { results, runningPanels };
				});
				return;
			}

			if (record.type === WORKBENCH_COMPONENTS.DATABASE_RESULTS) {
				const sourcePanel = String(record.config?.sourcePanel ?? "");
				if (!sourcePanel) {
					return;
				}
				set((state) => {
					const results = { ...state.results };
					const runningPanels = { ...state.runningPanels };
					delete results[sourcePanel];
					delete runningPanels[sourcePanel];
					return { results, runningPanels };
				});
			}
		},
	}));
};
