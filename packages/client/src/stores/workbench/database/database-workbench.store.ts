import { createStore, type StoreApi } from "zustand";
import type { ColumnInterface } from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import type { WorkbenchState } from "../workbench.store";
import type { WorkbenchPanelRecord } from "../workbench.types";

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
			timeToRun: number;
	  };

interface DatabaseStatementResultBase {
	statement: number;
	query: string;
	route: string;
	timeToRun: number;
}

/** One eagerly collected statement result from a multi-statement SQL query. */
export type DatabaseStatementResult = DatabaseStatementResultBase &
	(
		| {
				type: "TABLE";
				status: "SUCCESS";
				output: { headers: string[]; values: unknown[][] };
		  }
		| {
				type: "MESSAGE";
				status: "SUCCESS";
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

	/** Runs a query and opens/reuses its paired results panel. */
	onQuery: (params: {
		panelId: string;
		query: string;
		raw?: boolean;
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

/** Narrows an unknown value to a property-bearing object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/** Parses the stable SQL batch payload returned by AbstractSqlQueryReactor. */
export const parseStatementResults = (
	output: unknown,
): DatabaseStatementResult[] | null => {
	if (!Array.isArray(output) || output.length < 2) {
		return null;
	}

	const results: DatabaseStatementResult[] = [];
	for (const item of output) {
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

		const base = { statement, query, route, timeToRun };
		if (type === "TABLE" && status === "SUCCESS" && isRecord(item.output)) {
			const headers = item.output.headers;
			const values = item.output.values;
			if (
				Array.isArray(headers) &&
				headers.every((header) => typeof header === "string") &&
				Array.isArray(values) &&
				values.every((row) => Array.isArray(row))
			) {
				results.push({
					...base,
					type,
					status,
					output: {
						headers,
						values: values as unknown[][],
					},
				});
				continue;
			}
		}

		if (typeof item.message === "string") {
			if (type === "MESSAGE" && status === "SUCCESS") {
				results.push({ ...base, type, status, message: item.message });
				continue;
			}
			if (type === "ERROR" && status === "ERROR") {
				results.push({ ...base, type, status, message: item.message });
				continue;
			}
			if (type === "SKIPPED" && status === "SKIPPED") {
				results.push({ ...base, type, status, message: item.message });
				continue;
			}
		}

		return null;
	}

	return results;
};

/**
 * The database store a `DatabaseWorkbench` attached, for paths that can't use
 * `useDatabaseWorkbench` — a blueprint's `menuItems` factory runs
 * outside React. This cast and the hook's are the only two points where the
 * untyped `domainStore` attachment is narrowed back to its concrete shape; the
 * attachment is only ever made by `DatabaseWorkbench`.
 *
 * @name getDatabaseWorkbenchStore
 * @param state - The scoped workbench store's state.
 * @return The attached store, or undefined outside a `DatabaseWorkbench`.
 */
export const getDatabaseWorkbenchStore = (
	state: WorkbenchState,
): StoreApi<DatabaseWorkbenchState> | undefined =>
	state.layout.domainStore as StoreApi<DatabaseWorkbenchState> | undefined;

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
 * @return A vanilla zustand store attached via `actions.attachDomainStore`.
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

					const message =
						err instanceof Error ? err.message : "Unknown error";

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

					const message =
						err instanceof Error ? err.message : "Unknown error";

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

		onQuery: async ({ panelId, query, raw = true }) => {
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
				let pixel: string;
				if (mode === "ADMIN_SQL") {
					pixel = `AdminSqlQuery(database=["${engineId}"], query=["<encode>${q}</encode>"], commit=[true]);`;
				} else if (mode === "SPARQL") {
					pixel = `SparqlQuery(database=["${engineId}"], query=["<encode>${q}</encode>"], raw=[${raw}], commit=[true]);`;
				} else {
					pixel = `SqlQuery(database=["${engineId}"], query=["<encode>${q}</encode>"], commit=[true]);`;
				}

				const response = await runPixel(pixel);
				if (get().engineId !== engineId) {
					return;
				}

				let nextResult: DatabaseQueryResult;

				const firstReturn = response.pixelReturn[0];
				const output = firstReturn?.output;
				const timeToRun = firstReturn?.timeToRun ?? 0;

				if (response.errors.length > 0) {
					nextResult = {
						type: "ERROR",
						query: q,
						raw,
						sourcePanel: panelId,
						message: response.errors.join("\n"),
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

				const message =
					err instanceof Error ? err.message : "Unknown error";

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
