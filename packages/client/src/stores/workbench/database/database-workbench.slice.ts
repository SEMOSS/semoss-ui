import type { ColumnInterface } from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import type { WorkbenchState } from "../workbench.store";
import type { WorkbenchSlice } from "../workbench.types";

/** Query language handled by the database workbench. */
export type DatabaseWorkbenchMode = "SQL" | "SPARQL";

/** One table (SQL) or graph/concept (SPARQL) and its columns from GetDatabaseTableStructure. */
export interface DatabaseTableStructure {
	table: string;
	columns: ColumnInterface[];
}

/** Result rendered by one paired results tab, keyed by its source query panel id. */
export type DatabaseQueryResult =
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
	  };

/** Namespaced domain state contributed by the Database workbench. */
export interface DatabaseWorkbenchSliceState {
	database: {
		/** Engine currently loaded by this workbench instance. */
		engineId: string;
		initialize: (engineId: string) => Promise<void>;

		mode: DatabaseWorkbenchMode;

		structure: {
			status: "IDLE" | "LOADING" | "SUCCESS" | "ERROR";
			error?: string;
			data: DatabaseTableStructure[];
			refresh: () => Promise<void>;
		};

		category: {
			status: "IDLE" | "LOADING" | "SUCCESS" | "ERROR";
			error?: string;
			data: string;
			refresh: () => Promise<void>;
		};

		/** Latest result per query panel id (undefined/null until that panel has run). */
		results: Record<string, DatabaseQueryResult | null>;
		/** Whether a query is currently running for a given query panel id. */
		runningPanels: Record<string, boolean>;

		/** Deterministic id of the results tab paired with a given query panel. */
		getResultsPanelId: (panelId: string) => string;

		/** Monotonically increasing counter used to mint unique query panel ids. */
		panelCounter: number;

		/** Adds a new query editor panel to the main tabset. */
		addQueryPanel: (initialQuery: string, name?: string) => void;

		/** Runs a query and opens/reuses its paired results tab. */
		onQuery: (params: {
			panelId: string;
			query: string;
			raw?: boolean;
		}) => Promise<void>;
	};
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
 * Creates the namespaced `database` slice merged into a workbench store by DatabaseWorkbench.
 *
 * @name createDatabaseWorkbenchSlice
 * @return Zustand state creator contributing the `database` key to the merged workbench store.
 */
export const createDatabaseWorkbenchSlice =
	(): WorkbenchSlice<
		DatabaseWorkbenchSliceState,
		WorkbenchState & DatabaseWorkbenchSliceState
	> =>
	(set, get) => {
		// Registered once per store instance - keeps the Results tab title and stored
		// query results in sync with native FlexLayout tab rename/close interactions.
		let layoutListener: (() => void) | null = null;

		return {
			database: {
				engineId: "",
				initialize: async (engineId) => {
					// unregister previous listener if any
					if (layoutListener) {
						layoutListener();
					}

					layoutListener = get().onModelAction((model, action) => {
						if (action.type === FlexLayout.Actions.DELETE_TAB) {
							const { node: id } = action.data as {
								node: string;
							};
							const resultsPrefix = `${WORKBENCH_COMPONENTS.DATABASE_RESULTS}--`;
							const isResultsPanel = id.startsWith(resultsPrefix);
							const sourcePanel = isResultsPanel
								? id.slice(resultsPrefix.length)
								: id;

							set((state) => {
								const results = { ...state.database.results };
								const runningPanels = {
									...state.database.runningPanels,
								};

								delete results[sourcePanel];
								delete runningPanels[sourcePanel];

								return {
									database: {
										...state.database,
										results,
										runningPanels,
									},
								};
							});

							if (!isResultsPanel) {
								const resultsPanelId =
									get().database.getResultsPanelId(id);
								if (model.getNodeById(resultsPanelId)) {
									model.doAction(
										FlexLayout.Actions.deleteTab(
											resultsPanelId,
										),
									);
								}
							}
							return;
						}

						// automatically rename the paired results tab when its source query panel is renamed
						if (action.type === FlexLayout.Actions.RENAME_TAB) {
							const { node: id, text } = action.data as {
								node: string;
								text: string;
							};

							const node = get().model.getNodeById(id);
							if (
								!(node instanceof FlexLayout.TabNode) ||
								node.getComponent() !==
									WORKBENCH_COMPONENTS.DATABASE_QUERY
							) {
								return;
							}

							const resultsPanelId =
								get().database.getResultsPanelId(id);
							if (get().model.getNodeById(resultsPanelId)) {
								get().renamePanel(
									resultsPanelId,
									`Results — ${text}`,
								);
							}
							return;
						}
					});

					set((state) => ({
						database: {
							...state.database,
							engineId,
							mode: "SQL",
							structure: {
								...state.database.structure,
								status: "IDLE",
								error: undefined,
								data: [],
							},
							category: {
								...state.database.category,
								status: "IDLE",
								error: undefined,
								data: "",
							},
							results: {},
							runningPanels: {},
							panelCounter: 1,
						},
					}));

					await Promise.all([
						get().database.category.refresh(),
						get().database.structure.refresh(),
					]);
				},
				mode: "SQL",

				structure: {
					status: "IDLE",
					error: undefined,
					data: [],
					refresh: async () => {
						const engineId = get().database.engineId;
						if (!engineId) {
							return;
						}

						set((state) => ({
							database: {
								...state.database,
								structure: {
									...state.database.structure,
									status: "LOADING",
									error: undefined,
								},
							},
						}));

						try {
							const response = await runPixel(
								`META|GetDatabaseTableStructure(database=["${engineId}"]);`,
							);

							if (response.errors.length > 0) {
								if (get().database.engineId !== engineId) {
									return;
								}

								set((state) => ({
									database: {
										...state.database,
										structure: {
											...state.database.structure,
											status: "ERROR",
											error: response.errors.join("\n"),
										},
									},
								}));
								return;
							}

							const data = parseDatabaseStructure(
								response.pixelReturn[0]?.output,
							);
							if (get().database.engineId !== engineId) {
								return;
							}

							set((state) => ({
								database: {
									...state.database,
									structure: {
										...state.database.structure,
										status: "SUCCESS",
										error: undefined,
										data,
									},
								},
							}));
						} catch (err: unknown) {
							if (get().database.engineId !== engineId) {
								return;
							}

							const message =
								err instanceof Error
									? err.message
									: "Unknown error";

							set((state) => ({
								database: {
									...state.database,
									structure: {
										...state.database.structure,
										status: "ERROR",
										error: message,
									},
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
						const engineId = get().database.engineId;
						if (!engineId) {
							return;
						}

						set((state) => ({
							database: {
								...state.database,
								category: {
									...state.database.category,
									status: "LOADING",
									error: undefined,
								},
							},
						}));

						try {
							const response = await runPixel(
								`GetDatabaseCategory(engine=["${engineId}"]);`,
							);

							if (response.errors.length > 0) {
								if (get().database.engineId !== engineId) {
									return;
								}

								set((state) => ({
									database: {
										...state.database,
										category: {
											...state.database.category,
											status: "ERROR",
											error: response.errors.join("\n"),
										},
									},
								}));
								return;
							}

							const data = String(
								response.pixelReturn[0]?.output ?? "",
							);
							if (get().database.engineId !== engineId) {
								return;
							}

							set((state) => ({
								database: {
									...state.database,
									mode: data === "RDF" ? "SPARQL" : "SQL",
									category: {
										...state.database.category,
										status: "SUCCESS",
										error: undefined,
										data,
									},
								},
							}));
						} catch (err: unknown) {
							if (get().database.engineId !== engineId) {
								return;
							}

							const message =
								err instanceof Error
									? err.message
									: "Unknown error";

							set((state) => ({
								database: {
									...state.database,
									category: {
										...state.database.category,
										status: "ERROR",
										error: message,
									},
								},
							}));
						}
					},
				},

				results: {},
				runningPanels: {},

				getResultsPanelId: (panelId) =>
					`${WORKBENCH_COMPONENTS.DATABASE_RESULTS}--${panelId}`,

				panelCounter: 1,
				addQueryPanel: (initialQuery, name) => {
					const model = get().model;
					let counter = get().database.panelCounter;
					let panelId = "";
					do {
						counter += 1;
						panelId = `${WORKBENCH_COMPONENTS.DATABASE_QUERY}_${counter}`;
					} while (model.getNodeById(panelId));

					set((state) => ({
						database: { ...state.database, panelCounter: counter },
					}));

					get().openPanel(panelId, {
						type: "tab",
						name: name ?? `Query ${counter}`,
						component: WORKBENCH_COMPONENTS.DATABASE_QUERY,
						config: { initialQuery },
						enableClose: true,
						enableRename: true,
					});
				},

				onQuery: async ({ panelId, query, raw = true }) => {
					const engineId = get().database.engineId;
					if (!engineId) {
						return;
					}

					const q = query.trim();
					if (!q) {
						return;
					}

					const node = get().model.getNodeById(panelId);
					const panelName =
						node instanceof FlexLayout.TabNode
							? node.getName()
							: "Query";
					const resultsPanelId =
						get().database.getResultsPanelId(panelId);

					set((state) => ({
						database: {
							...state.database,
							runningPanels: {
								...state.database.runningPanels,
								[panelId]: true,
							},
						},
					}));

					// Opens the paired results tab if it doesn't exist yet, else selects it.
					get().openPanel(
						resultsPanelId,
						{
							type: "tab",
							name: `Results — ${panelName}`,
							component: WORKBENCH_COMPONENTS.DATABASE_RESULTS,
							config: { sourcePanel: panelId },
							enableClose: true,
							enableRename: false,
						},
						{ type: "BORDER", location: "bottom" },
					);

					try {
						const mode = get().database.mode;
						const pixel =
							mode === "SPARQL"
								? `SparqlQuery(database=["${engineId}"], query=["<encode>${q}</encode>"], raw=[${raw}], commit=[true]);`
								: `SqlQuery(database=["${engineId}"], query=["<encode>${q}</encode>"], commit=[true]);`;

						const response = await runPixel(pixel);
						if (get().database.engineId !== engineId) {
							return;
						}

						let nextResult: DatabaseQueryResult;

						const output = response.pixelReturn[0].output;
						const timeToRun = response.pixelReturn[0].timeToRun;

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
						} else if (output && typeof output === "string") {
							nextResult = {
								type: "MESSAGE",
								query: q,
								raw,
								sourcePanel: panelId,
								message: String(output ?? ""),
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

						set((state) => ({
							database: {
								...state.database,
								results: {
									...state.database.results,
									[panelId]: nextResult,
								},
							},
						}));

						// refresh the structure when the query may have mutated the schema
						if (nextResult.type !== "TABLE") {
							get().database.structure.refresh();
						}
					} catch (err: unknown) {
						if (get().database.engineId !== engineId) {
							return;
						}

						const message =
							err instanceof Error
								? err.message
								: "Unknown error";

						set((state) => ({
							database: {
								...state.database,
								results: {
									...state.database.results,
									[panelId]: {
										type: "ERROR",
										query: q,
										raw: false,
										sourcePanel: panelId,
										message,
										timeToRun: 0,
									},
								},
							},
						}));
					} finally {
						if (get().database.engineId === engineId) {
							set((state) => ({
								database: {
									...state.database,
									runningPanels: {
										...state.database.runningPanels,
										[panelId]: false,
									},
								},
							}));
						}
					}
				},
			},
		};
	};
