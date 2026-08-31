import { Layout, type Model, type TabNode } from "flexlayout-react";
import { SlidersHorizontal, Zap } from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatSqlList, isParamSatisfied } from "@/components/ParamControl";
import { ParamSheet } from "@/components/ParamSheet";
import { PhiExportWarningModal } from "@/components/PhiExportWarningModal";
import type { QueryRunFn } from "@/components/QueryRunner";
import { Area_Chart } from "@/components/visualizations/Area_Chart";
import { Bar_Chart } from "@/components/visualizations/Bar_Chart";
import { BoxPlotChart } from "@/components/visualizations/BoxPlotChart";
import { BubbleChart } from "@/components/visualizations/BubbleChart";
import { ClusterChart } from "@/components/visualizations/ClusterChart";
import { Combo_Chart } from "@/components/visualizations/Combo_Chart";
import { HalfDonutChart } from "@/components/visualizations/HalfDonutChart";
import { HeatmapChart } from "@/components/visualizations/HeatmapChart";
import { HtmlBlockVisualization } from "@/components/visualizations/HtmlBlockVisualization";
import { aggregateKpiValue, KPI } from "@/components/visualizations/KPI";
import { Line_Chart } from "@/components/visualizations/Line_Chart";
import { MultiLineChart } from "@/components/visualizations/MultiLineChart";
import { Pie_Chart } from "@/components/visualizations/Pie_Chart";
import { PivotTable } from "@/components/visualizations/PivotTable";
import { PolarBarChart } from "@/components/visualizations/PolarBarChart";
import { PuckChart } from "@/components/visualizations/PuckChart";
import { StretchFill } from "@/components/visualizations/StretchFill";
import { SunburstChart } from "@/components/visualizations/SunburstChart";
import { aggregateChartData } from "@/components/visualizations/shared/chartShared";
import { PaginatedLegend } from "@/components/visualizations/shared/PaginatedLegend";
import { TableView } from "@/components/visualizations/TableView";
import { TreemapChart } from "@/components/visualizations/TreemapChart";
import { WordCloud } from "@/components/visualizations/WordCloud";
import { WorldMapChart } from "@/components/visualizations/WorldMapChart";
import { CsvExportButton } from "@/components/widgets/CsvExportButton";
import { FilterWidget } from "@/components/widgets/FilterWidget";
import { pivotTransform, usePivotTransform } from "@/hooks/usePivotTransform";
import { useVizEvents } from "@/hooks/useVizEvents";
import {
	type AppliedFilter,
	DashboardFilterProvider,
	useAppliedFilters,
	useFilterStore,
} from "@/lib/dashboardFilters";
import { EventParamProvider, useEventParamStore } from "@/lib/eventParamStore";
import { formatValue } from "@/lib/formatValue";
import {
	computeParamGroups,
	ensureParamSheet,
	migrateSheetsToSharedQueries,
	type QuerySource,
	resolveParamDefault,
	resolveQuery,
} from "@/lib/resolveQuery";
import { useTabColors } from "@/lib/tabColors";
import { aggregateTableRows } from "@/lib/tableAggregate";
import { filterRowMatrix } from "@/lib/vizFilter";
import { contentSizeStyles, hasContentSize } from "@/lib/vizSize";
import { applyVizSort } from "@/lib/vizSort";
import { buildFlexModel } from "@/utils/dashboardLayout";
import {
	loadMoreFromTask,
	runDatabaseQuery,
	runDatabaseQueryPaged,
} from "../api";
import { usePortalStore } from "../store";
import type {
	DashboardQuery,
	QueryResult,
	Sheet,
	Visualization,
	VisualizationConfig,
} from "../types";

const COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
];

/** Convert a QueryResult into an array of row objects keyed by header name.
 *  Coerces bare numeric strings to numbers so formatValue/inferColumnType see proper types. */
const NUMERIC_RE = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
function toChartData(result: QueryResult): Record<string, unknown>[] {
	return result.values.map((row) => {
		const obj: Record<string, unknown> = {};
		result.headers.forEach((h, i) => {
			const v = row[i];
			obj[h] =
				typeof v === "string" && NUMERIC_RE.test((v as string).trim())
					? Number(v)
					: v;
		});
		return obj;
	});
}

/** Download query result as a CSV file. Flattens pivot results when vizType is 'pivot'. */
function exportCsv(
	result: QueryResult,
	title: string,
	vizType: string,
	config?: VisualizationConfig,
): void {
	const escapeCsv = (v: unknown) => {
		const s = String(v ?? "");
		return s.includes(",") || s.includes('"') || s.includes("\n")
			? `"${s.replace(/"/g, '""')}"`
			: s;
	};

	let headers: string[];
	let dataRows: string[];

	if (vizType === "kpi") {
		// KPI export: one row, one column per configured metric, with the aggregated value
		const rows = toChartData(result);
		const yKeys = config?.yKeys ?? [];
		headers = yKeys;
		const flat = yKeys.map((col) =>
			String(aggregateKpiValue(rows, col, config as any)),
		);
		dataRows = [flat.map(escape).join(",")];
	} else if (vizType === "pivot") {
		// Flatten the pivot result into rows for CSV (mirrors DashboardVisualization.exportData)
		const rows = toChartData(result);
		// Cast: portal's VisualizationConfig is a structural subset of the shared dashboard config
		const pivot = pivotTransform(rows, config as any);
		const rowFields = pivot.rowFields;
		const flatRows: Record<string, unknown>[] = [];
		const flatten = (row: (typeof pivot.rows)[number]) => {
			const flat: Record<string, unknown> = {};
			rowFields.forEach(
				(f, idx) => (flat[f] = row.rowHeaders[idx] ?? ""),
			);
			pivot.columns.forEach((col) => {
				const header = col.columnHeaders.length
					? `${col.columnHeaders.join(" / ")} - ${col.valueField}`
					: col.valueField;
				flat[header] = row.cells[col.key];
			});
			if (pivot.hasGrandTotalColumn) {
				pivot.valueFields.forEach((vf) => {
					flat[`Total ${vf}`] = row.rowTotals[vf];
				});
			}
			return flat;
		};
		pivot.rows.forEach((r) => flatRows.push(flatten(r)));
		if (pivot.grandTotalRow) flatRows.push(flatten(pivot.grandTotalRow));
		headers = flatRows.length ? Object.keys(flatRows[0]) : [];
		dataRows = flatRows.map((r) =>
			headers.map((h) => escapeCsv(r[h])).join(","),
		);
	} else {
		const tableColumns = config?.tableColumns;
		const cols = tableColumns?.length ? tableColumns : result.headers;
		// Mirror the on-screen table: if columns are aggregated/grouped, export the
		// aggregated rows; otherwise export the raw rows (projected to the columns).
		const aggregated =
			vizType === "table"
				? aggregateTableRows(
						toChartData(result) as Record<string, any>[],
						cols,
						config?.columnAggregations ?? {},
					)
				: null;
		headers = cols.filter((h) =>
			aggregated ? true : result.headers.includes(h),
		);
		if (aggregated) {
			dataRows = aggregated.map((r) =>
				headers.map((h) => escapeCsv(r[h])).join(","),
			);
		} else {
			dataRows = result.values.map((row) => {
				const obj: Record<string, unknown> = {};
				result.headers.forEach((h, i) => {
					obj[h] = row[i];
				});
				return headers.map((h) => escapeCsv(obj[h])).join(",");
			});
		}
	}

	const csv = [headers.map(escape).join(","), ...dataRows].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${title || "export"}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

function substituteParams(
	query: string,
	values: Record<string, string>,
	params: {
		id: string;
		name: string;
		inputType?: string;
		options?: string[];
	}[] = [],
	loadedOptions: Record<string, string[]> = {},
	sheetOptions: Record<string, string[]> = {},
): string {
	return query.replace(/\{\{(\w+)\}\}/g, (_, name) => {
		const val = values[name] ?? "";
		const param = params.find((p) => p.name === name);
		// Empty multiselect = "all options" → substitute every known option so
		// IN ({{param}}) matches all rows instead of generating invalid IN ().
		if (param?.inputType === "multiselect" && !val.trim()) {
			// sheetOptions (name-keyed, from ParamSheet) covers static + SQL + conditional branches
			const sheetOpts = sheetOptions[name] ?? [];
			const legacyOpts = [
				...(loadedOptions[param.id] ?? []),
				...(param.options ?? []),
			];
			const allOpts = sheetOpts.length > 0 ? sheetOpts : legacyOpts;
			if (allOpts.length > 0) return formatSqlList(allOpts);
		}
		return val;
	});
}

interface VizState {
	paramValues: Record<string, string>;
	result: QueryResult | null;
	error: string | null;
	running: boolean;
}

type BatchTableState = {
	headers: string[];
	rows: Record<string, unknown>[];
	taskId: string | null;
	pageSize: number;
	hasMore: boolean;
	loading: boolean;
	loadingMore: boolean;
	error: string | null;
};

/** Inline "Export CSV" hover button with optional PHI/PII gate. */
function InlineExportButton({
	onExport,
	phi,
}: {
	onExport: () => void;
	phi?: boolean;
}) {
	const [showModal, setShowModal] = useState(false);
	return (
		<>
			<button
				onClick={() => (phi ? setShowModal(true) : onExport())}
				className="rounded-md border border-gray-300 bg-white/90 px-2 py-1 font-medium text-gray-600 text-xs shadow-sm backdrop-blur-sm transition-colors hover:bg-gray-50"
			>
				Export CSV
			</button>
			{showModal && (
				<PhiExportWarningModal
					onConfirm={() => {
						onExport();
						setShowModal(false);
					}}
					onCancel={() => setShowModal(false)}
				/>
			)}
		</>
	);
}

export function ViewMode() {
	return (
		<EventParamProvider>
			<ViewModeInner />
		</EventParamProvider>
	);
}

function ViewModeInner() {
	const { config } = usePortalStore();

	// Migrate legacy embedded queries into shared queries ONCE (stable ids), so
	// charts bound to the same query share one parameter form and one fetch.
	const migrated = useMemo(() => {
		if (!config)
			return { sheets: [] as Sheet[], queries: [] as DashboardQuery[] };
		const base: Sheet[] = config.sheets?.length
			? config.sheets
			: [
					{
						id: "default",
						name: "Sheet 1",
						color: "#3b82f6",
						visualizations: config.visualizations ?? [],
						layout: config.layout ?? [],
						flexLayout: config.flexLayout,
					},
				];
		const m = migrateSheetsToSharedQueries(base, config.queries);
		// Legacy dashboards without an `isParamSheet` sheet
		// get one on the fly, so they render the same Parameters-tab UX as new
		// dashboards without needing a resave.
		return {
			sheets: ensureParamSheet(m.sheets, m.queries),
			queries: m.queries,
		};
	}, [config]);
	const configSheets = migrated.sheets;
	const queries = migrated.queries;
	/** Shared key a chart's data lives under: its query id, or its own id if unbound. */
	const qKeyOf = (viz: Visualization) => viz.queryId ?? viz.id;

	// Query state is keyed by the SHARED query id (above), so every chart on a query
	// shares params/results/loading and re-runs together as a single fetch.
	const [queryStates, setQueryStates] = useState<Record<string, VizState>>(
		{},
	);

	// Batch-loading table state, keyed the same way as queryStates.
	const [batchTableStates, setBatchTableStates] = useState<
		Record<string, BatchTableState>
	>({});
	// csvexport: track which query keys are awaiting an on-click fetch, and a per-key
	// download counter that bumps to signal the button to auto-download on completion.
	const pendingExportKeysRef = useRef<Set<string>>(new Set());
	const [exportDownloadKeys, setExportDownloadKeys] = useState<
		Record<string, number>
	>({});

	// SQL-sourced dropdown options, keyed by parameter id.
	const [paramOptions, setParamOptions] = useState<Record<string, string[]>>(
		{},
	);
	// All options from ParamSheet (static + SQL + conditional branches), keyed by param name.
	const [sheetParamOptions, setSheetParamOptions] = useState<
		Record<string, string[]>
	>({});
	// Wraps the portal's runDatabaseQuery into the QueryRunFn shape ParamSheet expects,
	// so its option-fetching effects work without a QueryRunnerProvider in the tree.
	const portalQueryRunner = useCallback<QueryRunFn>(
		async (databaseId, query) => {
			const result = await runDatabaseQuery(databaseId, query, -1);
			return {
				headers: result.headers,
				values: result.values as any[][],
				raw: result,
			};
		},
		[],
	);

	// Ref mirrors for stale-closure safety in the async event-param subscription callback.
	const queryStatesRef = useRef(queryStates);
	const paramOptionsRef = useRef(paramOptions);
	const sheetParamOptionsRef = useRef(sheetParamOptions);
	useEffect(() => {
		queryStatesRef.current = queryStates;
	}, [queryStates]);
	useEffect(() => {
		paramOptionsRef.current = paramOptions;
	}, [paramOptions]);
	useEffect(() => {
		sheetParamOptionsRef.current = sheetParamOptions;
	}, [sheetParamOptions]);

	// Shared query cache: charts built from the SAME query fetch it once. `force`
	// bypasses the cache for a manual re-run.
	const queryCache = useRef<Map<string, Promise<QueryResult>>>(new Map());
	const cachedQuery = (
		db: string,
		query: string,
		force = false,
	): Promise<QueryResult> => {
		const key = `${db}::${query}`;
		if (!force) {
			const hit = queryCache.current.get(key);
			if (hit) return hit;
		}
		const p = runDatabaseQuery(db, query);
		queryCache.current.set(key, p);
		p.catch(() => queryCache.current.delete(key));
		return p;
	};

	// When a custom_query event fires on a source viz, EventParamStore.trigger() is called
	// with the target viz's ID and the resolved param values. Subscribe here to catch those
	// triggers and re-run the target viz's query with the event params merged in.
	const eventParamStore = useEventParamStore();
	useEffect(() => {
		if (!eventParamStore) return;
		const prevCounters = new Map<string, number>();
		return eventParamStore.subscribe(() => {
			const allVizs = configSheets.flatMap((s) => s.visualizations);
			allVizs.forEach((viz) => {
				const prev = prevCounters.get(viz.id) ?? 0;
				const curr = eventParamStore.getRunCounter(viz.id);
				if (curr <= prev) return;
				prevCounters.set(viz.id, curr);
				const eventParams = eventParamStore.getParamValues(viz.id);
				const src = resolveQuery(viz, queries);
				const qKey = qKeyOf(viz);
				setQueryStates((p) => ({
					...p,
					[qKey]: { ...p[qKey], running: true, error: null },
				}));
				const baseValues =
					queryStatesRef.current[qKey]?.paramValues ?? {};
				const mergedValues: Record<string, string> = {
					...baseValues,
					...eventParams,
				};
				src.parameters?.forEach((p) => {
					if (p.useCurrentDate)
						mergedValues[p.name] = resolveParamDefault(p);
				});
				const q = substituteParams(
					src.query,
					mergedValues,
					src.parameters,
					paramOptionsRef.current,
					sheetParamOptionsRef.current,
				);
				cachedQuery(src.databaseId, q, true)
					.then((r) =>
						setQueryStates((p) => ({
							...p,
							[qKey]: { ...p[qKey], result: r, running: false },
						})),
					)
					.catch((e: unknown) =>
						setQueryStates((p) => ({
							...p,
							[qKey]: {
								...p[qKey],
								error: String((e as Error)?.message ?? e),
								running: false,
							},
						})),
					);
			});
		});
	}, [eventParamStore, configSheets, queries]);

	// Initialise param defaults (one entry per distinct query) then auto-run
	// parameter-less queries — each fetched a single time, shared across its charts.
	useEffect(() => {
		if (!config) return;
		const allVizs = configSheets.flatMap((s) => s.visualizations);

		const initial: Record<string, VizState> = {};
		allVizs.forEach((viz) => {
			const key = qKeyOf(viz);
			if (initial[key]) return;
			const src = resolveQuery(viz, queries);
			const paramValues: Record<string, string> = {};
			(src.parameters ?? []).forEach((p) => {
				paramValues[p.name] = resolveParamDefault(p);
			});
			initial[key] = {
				paramValues,
				result: null,
				error: null,
				running: false,
			};
		});
		setQueryStates(initial);

		// Fetch SQL-sourced dropdown options for each distinct query's parameters.
		const seenOpt = new Set<string>();
		allVizs.forEach((viz) => {
			const src = resolveQuery(viz, queries);
			(src.parameters ?? [])
				.filter(
					(p) =>
						(p.inputType === "dropdown" ||
							p.inputType === "multiselect") &&
						p.optionsQuery,
				)
				.forEach((p) => {
					if (seenOpt.has(p.id)) return;
					seenOpt.add(p.id);
					const db = p.optionsDatabaseId || src.databaseId;
					if (!db) return;
					runDatabaseQuery(db, p.optionsQuery as string)
						.then((r) => {
							const vals = Array.from(
								new Set(
									(r.values ?? [])
										.map((row) =>
											Array.isArray(row) ? row[0] : row,
										)
										.filter((v) => v != null)
										.map((v) => String(v))
										.filter(Boolean),
								),
							);
							setParamOptions((prev) => ({
								...prev,
								[p.id]: vals,
							}));
						})
						.catch(() => {});
				});
		});

		// Auto-run each distinct parameter-less, non-loadAfterParams query exactly once.
		const autoRunItems: Array<{
			key: string;
			src: QuerySource;
			label: string;
		}> = [];
		const seenAuto = new Set<string>();
		allVizs.forEach((viz) => {
			// csvexport runs its query on button click — never auto-fetch on app load.
			if (viz.visualizationType === "csvexport") return;
			const key = qKeyOf(viz);
			if (seenAuto.has(key)) return;
			const src = resolveQuery(viz, queries);
			const boundQ = queries.find((q) => q.id === viz.queryId);
			if (
				!(src.databaseId && src.query) ||
				(src.parameters ?? []).length ||
				(boundQ?.loadAfterParams ?? false)
			)
				return;
			seenAuto.add(key);
			autoRunItems.push({
				key,
				src,
				label:
					queries.find((q) => q.id === viz.queryId)?.name ?? "query",
			});
		});

		autoRunItems.forEach(({ key, src }) => {
			// Check if any viz sharing this query key is a batch table.
			const isBatch = allVizs.some(
				(v) => qKeyOf(v) === key && isVizBatchTable(v),
			);
			if (isBatch) {
				// Batch tables need a queryState entry too (for paramValues).
				setQueryStates((prev) => ({
					...prev,
					[key]: { ...prev[key], running: true, error: null },
				}));
				void loadBatchTable(src, key).then(() => {
					setQueryStates((prev) => ({
						...prev,
						[key]: { ...prev[key], running: false },
					}));
				});
				return;
			}
			setQueryStates((prev) => ({
				...prev,
				[key]: { ...prev[key], running: true, error: null },
			}));
			cachedQuery(src.databaseId, src.query)
				.then((r) => {
					setQueryStates((prev) => ({
						...prev,
						[key]: { ...prev[key], result: r, running: false },
					}));
				})
				.catch((e: unknown) => {
					setQueryStates((prev) => ({
						...prev,
						[key]: {
							...prev[key],
							error: String((e as Error)?.message ?? e),
							running: false,
						},
					}));
				});
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config]);

	const setQueryParam = (key: string, name: string, value: string) => {
		setQueryStates((prev) => ({
			...prev,
			[key]: {
				...(prev[key] ?? {
					paramValues: {},
					result: null,
					error: null,
					running: false,
				}),
				paramValues: {
					...(prev[key]?.paramValues ?? {}),
					[name]: value,
				},
			},
		}));
	};

	const isVizBatchTable = (v: Visualization) =>
		v.visualizationType === "table" &&
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		!!(v.config as any)?.styling?.table?.batchLoading;

	const loadBatchTable = async (src: QuerySource, key: string) => {
		const state = queryStates[key];
		if (!state) return;
		setBatchTableStates((prev) => ({
			...prev,
			[key]: {
				headers: [],
				rows: [],
				taskId: null,
				pageSize: 0,
				hasMore: false,
				loading: true,
				loadingMore: false,
				error: null,
			},
		}));
		try {
			const resolvedValues = { ...state.paramValues };
			src.parameters?.forEach((p) => {
				if (p.useCurrentDate)
					resolvedValues[p.name] = resolveParamDefault(p);
			});
			const q = substituteParams(
				src.query,
				resolvedValues,
				src.parameters,
				paramOptions,
				sheetParamOptions,
			);
			const page = await runDatabaseQueryPaged(src.databaseId, q);
			setBatchTableStates((prev) => ({
				...prev,
				[key]: {
					headers: page.headers,
					rows: page.rows,
					taskId: page.taskId,
					pageSize: page.pageSize,
					hasMore: page.hasMore,
					loading: false,
					loadingMore: false,
					error: null,
				},
			}));
		} catch (e: unknown) {
			setBatchTableStates((prev) => ({
				...prev,
				[key]: {
					...prev[key],
					loading: false,
					error: String((e as Error)?.message ?? e),
				},
			}));
		}
	};

	const loadMoreBatch = async (key: string) => {
		const st = batchTableStates[key];
		if (!st || !st.taskId || !st.hasMore || st.loadingMore) return;
		setBatchTableStates((prev) => ({
			...prev,
			[key]: { ...prev[key], loadingMore: true },
		}));
		try {
			const page = await loadMoreFromTask(st.taskId);
			setBatchTableStates((prev) => ({
				...prev,
				[key]: {
					...prev[key],
					rows: [...prev[key].rows, ...page.rows],
					hasMore: page.hasMore,
					loadingMore: false,
				},
			}));
		} catch (e: unknown) {
			setBatchTableStates((prev) => ({
				...prev,
				[key]: {
					...prev[key],
					loadingMore: false,
					error: String((e as Error)?.message ?? e),
				},
			}));
		}
	};

	const runQuery = async (src: QuerySource, key: string) => {
		const state = queryStates[key];
		if (!state) return;
		setQueryStates((prev) => ({
			...prev,
			[key]: { ...prev[key], running: true, error: null },
		}));
		try {
			// Re-resolve useCurrentDate params so they always use today's date at run
			// time, not the date when the page was first loaded.
			const resolvedValues = { ...state.paramValues };
			src.parameters?.forEach((p) => {
				if (p.useCurrentDate)
					resolvedValues[p.name] = resolveParamDefault(p);
			});
			const q = substituteParams(
				src.query,
				resolvedValues,
				src.parameters,
				paramOptions,
				sheetParamOptions,
			);
			const r = await cachedQuery(src.databaseId, q, true);
			setQueryStates((prev) => ({
				...prev,
				[key]: { ...prev[key], result: r, running: false },
			}));
		} catch (e: unknown) {
			setQueryStates((prev) => ({
				...prev,
				[key]: {
					...prev[key],
					error: String((e as Error)?.message ?? e),
					running: false,
				},
			}));
		}
	};

	// ── Param sheet derivations (safe before conditional return — deps are always arrays) ──
	const paramGroups = useMemo(() => computeParamGroups(queries), [queries]);
	const sharedParamValues = useMemo(() => {
		const out: Record<string, string> = {};
		for (const g of paramGroups) {
			const state = queryStates[g.queryIds[0]];
			out[g.name] =
				state?.paramValues[g.name] ?? g.param.defaultValue ?? "";
		}
		return out;
	}, [paramGroups, queryStates]);
	const allParamsSatisfied = useMemo(
		() =>
			paramGroups.every((g) =>
				isParamSatisfied(g.param, sharedParamValues[g.name] ?? ""),
			),
		[paramGroups, sharedParamValues],
	);

	const handleSharedParamChange = (paramName: string, val: string) => {
		const group = paramGroups.find((g) => g.name === paramName);
		if (!group) return;
		for (const qid of group.queryIds) setQueryParam(qid, paramName, val);
	};

	const [runAllInProgress, setRunAllInProgress] = useState(false);
	const runAllQueryKeysRef = useRef<Set<string>>(new Set());
	const [activeSheetId, setActiveSheetId] = useState<string>(
		configSheets[0]?.id ?? "default",
	);
	const modelCacheRef = useRef<Record<string, Model>>({});

	const handleRunAll = () => {
		const keys = new Set<string>();
		const seen = new Set<string>();
		for (const sheet of configSheets.filter((s) => !s.isParamSheet)) {
			for (const viz of sheet.visualizations) {
				// csvexport runs its query on button click, not on Run All.
				if (viz.visualizationType === "csvexport") continue;
				const qKey = qKeyOf(viz);
				if (seen.has(qKey)) continue;
				const src = resolveQuery(viz, queries);
				const boundQ = queries.find((q) => q.id === viz.queryId);
				const hasQParams = (src.parameters ?? []).length > 0;
				if (hasQParams || (boundQ?.loadAfterParams ?? false)) {
					seen.add(qKey);
					keys.add(qKey);
					const isBatch = sheet.visualizations.some(
						(v) => qKeyOf(v) === qKey && isVizBatchTable(v),
					);
					if (isBatch) {
						void loadBatchTable(src, qKey);
					} else {
						void runQuery(src, qKey);
					}
				}
			}
		}
		runAllQueryKeysRef.current = keys;
		if (keys.size > 0) setRunAllInProgress(true);
	};

	// When a csvexport on-click fetch completes, bump its downloadKey so the button auto-downloads.
	useEffect(() => {
		const pending = pendingExportKeysRef.current;
		if (!pending.size) return;
		const toDownload: string[] = [];
		pending.forEach((key) => {
			const s = queryStates[key];
			if (s && !s.running && s.result) toDownload.push(key);
		});
		if (!toDownload.length) return;
		toDownload.forEach((k) => pending.delete(k));
		setExportDownloadKeys((prev) => {
			const next = { ...prev };
			toDownload.forEach((k) => {
				next[k] = (next[k] ?? 0) + 1;
			});
			return next;
		});
	}, [queryStates]);

	// When all tracked queries finish, clear the running flag and navigate to first non-param sheet.
	useEffect(() => {
		if (!runAllInProgress) return;
		const keys = runAllQueryKeysRef.current;
		if (keys.size === 0) {
			setRunAllInProgress(false);
			return;
		}
		const allDone = Array.from(keys).every((k) => {
			const st = queryStates[k];
			return st && !st.running;
		});
		if (allDone) {
			setRunAllInProgress(false);
			const firstNonParam = configSheets.find((s) => !s.isParamSheet);
			if (firstNonParam) setActiveSheetId(firstNonParam.id);
		}
	}, [queryStates, runAllInProgress, configSheets]);

	const activeSheet =
		configSheets.find((s) => s.id === activeSheetId) ?? configSheets[0];
	useTabColors(activeSheet?.visualizations ?? []);

	if (!config) return null;

	// Per-sheet flexlayout model cache
	const getModel = (sheet: {
		id: string;
		visualizations: any[];
		layout: any[];
		flexLayout?: any;
	}) => {
		const sid = sheet?.id ?? "default";
		if (!modelCacheRef.current[sid]) {
			const s = {
				id: sid,
				name: "",
				visualizations: sheet?.visualizations ?? [],
				layout: sheet?.layout ?? [],
				flexLayout: sheet?.flexLayout,
			};
			modelCacheRef.current[sid] = buildFlexModel(s as any);
		}
		return modelCacheRef.current[sid];
	};

	const SHEET_TAB_H = configSheets.length > 1 ? 44 : 0;

	// Factory: renders each viz panel for a given sheet.
	const makeFactory =
		(sheet: { id: string; visualizations: any[] }) => (node: TabNode) => {
			const cfg = node.getConfig() as { vizId?: string } | undefined;
			const viz = sheet.visualizations.find((v) => v.id === cfg?.vizId);
			if (!viz)
				return (
					<div className="flex h-full items-center justify-center text-gray-400 text-sm">
						Visualization not found
					</div>
				);
			// Resolve the shared query; its data/params live under the shared key, so
			// charts on the same query share one form and run as a single fetch.
			const src = resolveQuery(viz, queries);
			const qKey = qKeyOf(viz);
			const state = queryStates[qKey] ?? {
				paramValues: {},
				result: null,
				error: null,
				running: false,
			};
			const hasParams = (src.parameters ?? []).length > 0;
			const hasEventParams = (src.parameters ?? []).some(
				(p) => p.inputType === "event",
			);
			const boundQuery = queries.find((q) => q.id === viz.queryId);
			const isLoadAfter = boundQuery?.loadAfterParams ?? false;
			// Param sheet (if present) — used to navigate the user there on click.
			const paramSheet = configSheets.find((s) => s.isParamSheet) ?? null;
			// Custom title: prefer `styling.title.text` from the Title tool, fall back to `viz.title`.
			const titleCfg = (viz.config as any)?.styling?.title;
			// Export-CSV gating — MUST mirror DashboardVisualization (main app) exactly:
			// only table/pivot/kpi are exportable; table & kpi default to ON (`?? true`),
			// pivot is always on. Anything else gets no button.
			const isExportable = ["table", "pivot", "kpi"].includes(
				viz.visualizationType,
			);
			const showExport =
				!!state.result &&
				isExportable &&
				((viz.visualizationType === "table" &&
					((viz.config as any)?.styling?.table?.showExport ??
						true)) ||
					(viz.visualizationType === "kpi" &&
						((viz.config as any)?.styling?.kpi?.showExport ??
							true)) ||
					viz.visualizationType === "pivot");
			// HTML Block: renders directly from config — no query/data needed
			if (viz.visualizationType === "htmlblock") {
				return (
					<div className="flex h-full flex-col overflow-hidden bg-white">
						{/* Only a user-configured custom title gets a header bar — the tab already
                        shows the viz title. */}
						{titleCfg?.text && (
							<div className="flex flex-shrink-0 items-center border-gray-100 border-b px-4 py-2.5">
								<h2
									style={{
										fontSize: titleCfg.fontSize
											? `${titleCfg.fontSize}px`
											: undefined,
										color: titleCfg.color || undefined,
										fontWeight:
											titleCfg.fontWeight || "semibold",
									}}
									className="min-w-0 flex-1 truncate"
								>
									{titleCfg.text}
								</h2>
							</div>
						)}
						<div className="min-h-0 flex-1">
							<HtmlBlockVisualization
								config={viz.config as any}
							/>
						</div>
					</div>
				);
			}

			return (
				<div className="group relative flex h-full flex-col overflow-hidden bg-white">
					{/* The viz/tab title is shown by the layout tab; only a user-configured
                    custom title (Title tool) gets a slim inline header. Action controls
                    float in the top-right corner instead of taking their own row. */}
					{titleCfg?.text && (
						<h2
							style={{
								fontSize: titleCfg.fontSize
									? `${titleCfg.fontSize}px`
									: undefined,
								color: titleCfg.color || undefined,
								textAlign: titleCfg.textAlign || "left",
								fontWeight: titleCfg.fontWeight || "semibold",
								fontFamily: titleCfg.fontFamily || undefined,
							}}
							className="flex-shrink-0 truncate px-2 pt-1 pb-0.5"
						>
							{titleCfg.text}
						</h2>
					)}
					{/* Action controls float top-right and REVEAL ON HOVER so they never
                    permanently cover the visualization. Parameter-less queries auto-run
                    on load and parameterized ones have their own Run button in the params
                    strip, so hiding these by default costs no discoverability. */}
					<div className="absolute top-1 right-1 z-20 flex flex-shrink-0 items-center gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
						{showExport && (
							<InlineExportButton
								onExport={() =>
									exportCsv(
										state.result!,
										viz.title,
										viz.visualizationType,
										viz.config as any,
									)
								}
								phi={viz.phi}
							/>
						)}
						{/* Non-parameterized charts get a manual Refresh button.
                        Parameterized / loadAfter charts run via the Parameters sheet.
                        The Filter widget has no query of its own, so it gets no button. */}
						{viz.visualizationType !== "filter" &&
							viz.visualizationType !== "csvexport" &&
							!hasParams &&
							!isLoadAfter && (
								<button
									onClick={() => void runQuery(src, qKey)}
									disabled={state.running}
									className="rounded bg-blue-600 px-3 py-1 font-medium text-white text-xs shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
								>
									{state.running ? "Running..." : "Refresh"}
								</button>
							)}
					</div>
					<div className="min-h-0 flex-1 overflow-auto p-1.5">
						{/* csvexport: always show the button regardless of query state.
                        Data is fetched lazily when the user clicks — the button's
                        downloadKey prop triggers the auto-download on completion. */}
						{viz.visualizationType === "csvexport" ? (
							<>
								{state.running && (
									<div className="flex h-full flex-col items-center justify-center text-gray-500 text-sm">
										<style>{`@keyframes query-wave{0%,100%{transform:scaleY(.2)}50%{transform:scaleY(1)}}`}</style>
										<div
											className="flex items-center gap-[3px]"
											style={{ height: "2.25rem" }}
										>
											{[0, 1, 2, 3, 4].map((i) => (
												<div
													key={i}
													className="w-1.5 rounded-full"
													style={{
														height: "100%",
														backgroundColor:
															"#32b4f5",
														transformOrigin:
															"center",
														animation:
															"query-wave 1s ease-in-out infinite",
														animationDelay: `${i * 0.15}s`,
													}}
												/>
											))}
										</div>
										<p className="text-slate-400 text-sm">
											Loading data
										</p>
									</div>
								)}
								{!state.running && (
									<CsvExportButton
										rows={
											state.result
												? (toChartData(
														state.result,
													) as Record<string, any>[])
												: []
										}
										title={viz.title || "export"}
										config={viz.config as any}
										phi={viz.phi}
										onExportClick={
											!state.result
												? () => {
														pendingExportKeysRef.current.add(
															qKey,
														);
														void runQuery(
															src,
															qKey,
														);
													}
												: undefined
										}
										downloadKey={
											exportDownloadKeys[qKey] ?? 0
										}
									/>
								)}
							</>
						) : /* The Filter widget holds no data of its own — it derives options from
                        its targets' loaded rows, so it renders without needing a result. */
						viz.visualizationType === "filter" ? (
							<VizContent
								viz={viz}
								result={
									state.result ?? { headers: [], values: [] }
								}
							/>
						) : (
							<>
								{state.error && (
									<div className="m-3 rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
										{state.error}
									</div>
								)}
								{state.running && (
									<div className="flex h-full flex-col items-center justify-center text-gray-500 text-sm">
										{/* Wave bar animation */}
										<style>{`@keyframes query-wave{0%,100%{transform:scaleY(.2)}50%{transform:scaleY(1)}}`}</style>
										<div
											className="flex items-center gap-[3px]"
											style={{ height: "2.25rem" }}
										>
											{[0, 1, 2, 3, 4].map((i) => (
												<div
													key={i}
													className="w-1.5 rounded-full"
													style={{
														height: "100%",
														backgroundColor:
															"#32b4f5",
														transformOrigin:
															"center",
														animation:
															"query-wave 1s ease-in-out infinite",
														animationDelay: `${i * 0.15}s`,
													}}
												/>
											))}
										</div>
										<p className="text-slate-400 text-sm">
											Loading data
										</p>
									</div>
								)}
								{!state.running && state.result && (
									<VizContent
										viz={viz}
										result={state.result}
									/>
								)}
								{/* Batch table pane — renders when the viz is a batch table */}
								{!state.running &&
									!state.result &&
									isVizBatchTable(viz) &&
									batchTableStates[qKey] && (
										<BatchTablePane
											vizKey={qKey}
											viz={viz}
											batchState={batchTableStates[qKey]}
											onLoadMore={() =>
												void loadMoreBatch(qKey)
											}
										/>
									)}
								{!state.running &&
									!state.result &&
									!state.error &&
									hasEventParams && (
										<div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
											<Zap className="h-8 w-8 text-amber-400" />
											<p className="font-semibold text-gray-700 text-sm">
												Awaiting event
											</p>
											<p className="text-gray-400 text-xs">
												Interact with a configured event
												to load this visualization.
											</p>
										</div>
									)}
								{!state.running &&
									!state.result &&
									!state.error &&
									!hasEventParams &&
									(hasParams || isLoadAfter) && (
										<div
											className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
											onClick={
												paramSheet
													? () =>
															setActiveSheetId(
																paramSheet.id,
															)
													: undefined
											}
											style={
												paramSheet
													? { cursor: "pointer" }
													: undefined
											}
										>
											<div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo-400">
												<SlidersHorizontal className="h-5 w-5" />
											</div>
											<p className="font-semibold text-slate-600 text-sm">
												Waiting for parameters
											</p>
											<p className="max-w-xs text-slate-400 text-xs">
												Go to the{" "}
												<span className="font-medium text-indigo-500">
													Parameters
												</span>{" "}
												tab and click{" "}
												<span className="font-medium text-slate-500">
													Run All
												</span>{" "}
												to load this chart.
											</p>
										</div>
									)}
								{!state.running &&
									!state.result &&
									!state.error &&
									!hasEventParams &&
									!hasParams &&
									!isLoadAfter && (
										<div className="flex h-full items-center justify-center px-6 text-center text-gray-400 text-sm">
											Click Refresh to load data
										</div>
									)}
							</>
						)}
					</div>
				</div>
			);
		};

	return (
		<DashboardFilterProvider>
			<div className="relative h-screen bg-stone-50">
				{/* flexlayout canvas — fills from the very top (no app header in the portal).
                Single active Layout; results persist in queryStates so switching never
                refetches, but only one sheet's charts are mounted at a time. */}
				<div
					className="absolute top-0 right-0 left-0"
					style={{ bottom: SHEET_TAB_H }}
				>
					{activeSheet?.isParamSheet ? (
						<div className="h-full overflow-auto bg-stone-50 p-6">
							<ParamSheet
								paramGroups={paramGroups}
								values={sharedParamValues}
								onChangeValue={handleSharedParamChange}
								onRunAll={handleRunAll}
								allSatisfied={allParamsSatisfied}
								isRunning={runAllInProgress}
								config={activeSheet.paramSheetConfig}
								onParamOptionsChange={setSheetParamOptions}
								queryRunner={portalQueryRunner}
							/>
						</div>
					) : (
						activeSheet &&
						(activeSheet.visualizations?.length ?? 0) > 0 && (
							<Layout
								key={activeSheetId}
								model={getModel(activeSheet)}
								factory={makeFactory(activeSheet)}
								onRenderTab={(node, rv) => {
									const vizId = (
										node.getConfig() as
											| { vizId?: string }
											| undefined
									)?.vizId;
									if (!vizId) return;
									const viz = activeSheet.visualizations.find(
										(v) => v.id === vizId,
									);
									if (viz?.phi) {
										rv.content = (
											<span
												data-pii="true"
												style={{ display: "contents" }}
											>
												{rv.content}
											</span>
										);
									} else if (viz?.tabColor) {
										rv.content = (
											<span
												data-tab-id={vizId}
												style={{ display: "contents" }}
											>
												{rv.content}
											</span>
										);
									}
								}}
							/>
						)
					)}
				</div>

				{configSheets.length > 1 && (
					<div
						className="absolute right-0 bottom-0 left-0 z-10 flex items-stretch overflow-x-auto border-stone-200 border-t bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.06)]"
						style={{ height: SHEET_TAB_H }}
					>
						{configSheets.map((sheet) => {
							const isActive = sheet.id === activeSheetId;
							const tabColor = sheet.isParamSheet
								? "#6366f1"
								: (sheet.color ?? "#3b82f6");
							return (
								<button
									key={sheet.id}
									onClick={() => setActiveSheetId(sheet.id)}
									className={`flex flex-shrink-0 select-none items-center gap-2 border-stone-200 border-t-2 border-r px-5 text-sm transition-colors ${
										isActive
											? "bg-white font-semibold text-stone-900"
											: "border-t-transparent bg-stone-50 text-stone-500 hover:bg-white hover:text-stone-700"
									}`}
									style={
										isActive
											? { borderTopColor: tabColor }
											: undefined
									}
								>
									{sheet.isParamSheet ? (
										<SlidersHorizontal className="h-2.5 w-2.5 flex-shrink-0 text-indigo-500" />
									) : (
										<span
											className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
											style={{
												backgroundColor: tabColor,
											}}
										/>
									)}
									{sheet.name}
									{!sheet.isParamSheet && (
										<span
											className={`rounded-full px-1.5 py-0.5 text-xs ${isActive ? "text-white" : "bg-stone-200 text-stone-500"}`}
											style={
												isActive
													? {
															backgroundColor:
																tabColor,
														}
													: undefined
											}
										>
											{sheet.visualizations.length}
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>
		</DashboardFilterProvider>
	);
}

/** Filter a QueryResult's rows by applied cross-frame filters.
 *  Handles both column/values filters (FilterWidget) and row-based filters (event triggers). */
function filterResult(
	result: QueryResult,
	filters: AppliedFilter[],
): QueryResult {
	if (!filters.length) return result;
	const idx: Record<string, number> = {};
	result.headers.forEach((h, i) => (idx[h] = i));
	const values = result.values.filter((row) =>
		filters.every((f) => {
			// Row-based filter from event triggers (click-to-filter)
			if (f.row && Object.keys(f.row).length > 0) {
				const shared = Object.entries(f.row).filter(
					([k]) => idx[k] != null,
				);
				if (!shared.length) return true; // filter key not present in this result → inapplicable
				return shared.every(
					([k, v]) => String(row[idx[k]]) === String(v),
				);
			}
			// Column/values filter from FilterWidget
			if (!f.values.length) return true;
			const i = idx[f.column];
			if (i == null) return true;
			const cell = row[i];
			return (
				cell != null && new Set(f.values.map(String)).has(String(cell))
			);
		}),
	);
	return { ...result, values };
}

/**
/**
 * Renders a batch-loaded table with a "Load more" button.
 */
function BatchTablePane({
	viz,
	batchState,
	onLoadMore,
}: {
	vizKey: string;
	viz: Visualization;
	batchState: BatchTableState;
	onLoadMore: () => void;
}) {
	if (batchState.loading) {
		return (
			<div className="flex h-full items-center justify-center text-gray-500 text-sm">
				Loading data…
			</div>
		);
	}
	if (batchState.error) {
		return (
			<div className="m-3 rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
				{batchState.error}
			</div>
		);
	}
	const result: QueryResult = {
		headers: batchState.headers,
		values: batchState.rows.map((r) => batchState.headers.map((h) => r[h])),
	};
	return (
		<div className="flex h-full flex-col">
			<div className="min-h-0 flex-1 overflow-auto">
				<VizContent viz={viz} result={result} />
			</div>
			{batchState.hasMore && (
				<div className="flex-shrink-0 border-gray-200 border-t px-3 py-2 text-center">
					<button
						onClick={onLoadMore}
						disabled={batchState.loadingMore}
						className="rounded bg-blue-600 px-4 py-1.5 font-medium text-white text-xs shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
					>
						{batchState.loadingMore ? "Loading…" : "Load more ↓"}
					</button>
				</div>
			)}
		</div>
	);
}

/**
 * Renders a visualization's content. Subscribes to cross-frame filters that
 * target THIS viz, so changing a filter re-renders only the targeted panels.
 */
function VizContent({
	viz,
	result,
}: {
	viz: Visualization;
	result: QueryResult;
}) {
	const filters = useAppliedFilters(viz.id);
	// Publish loaded rows so Filter widgets can build options from this viz's data
	// (no query of their own needed). Filter/export widgets don't hold data themselves.
	const filterStore = useFilterStore();
	const eventParamStore = useEventParamStore();
	const { onTrigger } = useVizEvents(
		(viz.config as any)?.styling?.events,
		viz.id,
		filterStore,
		eventParamStore,
	);
	const publishRows = useMemo(
		() => toChartData(result) as Record<string, any>[],
		[result],
	);
	useEffect(() => {
		if (!filterStore) return;
		if (
			viz.visualizationType === "filter" ||
			viz.visualizationType === "csvexport"
		)
			return;
		filterStore.publishVizData(viz.id, result.headers ?? [], publishRows);
	}, [
		filterStore,
		viz.id,
		viz.visualizationType,
		result.headers,
		publishRows,
	]);
	// Author-defined per-viz filter (Filter Visualization tool) + cross-frame widget filters.
	const vizFilter = (viz.config as any)?.styling?.vizFilter;
	const filtered = useMemo(() => {
		const f = filterResult(result, filters);
		if (!vizFilter) return f;
		return {
			...f,
			values: filterRowMatrix(f.headers, f.values, vizFilter),
		};
	}, [result, filters, vizFilter]);

	// Author-defined Size & Position — box the rendered content and align it within
	// the panel (leaves the flexlayout panel itself untouched).
	const size = (viz.config as any)?.styling?.size;
	const wrapSize = (node: ReactNode) => {
		if (!hasContentSize(size)) return node;
		const { outer, inner } = contentSizeStyles(size);
		return (
			<div style={outer}>
				<div style={inner}>{node}</div>
			</div>
		);
	};

	if (viz.visualizationType === "csvexport") {
		return wrapSize(
			<CsvExportButton
				rows={toChartData(filtered) as Record<string, any>[]}
				title={viz.title || "export"}
				config={viz.config as any}
				phi={viz.phi}
			/>,
		);
	}
	if (viz.visualizationType === "filter") {
		return wrapSize(
			<FilterWidget
				vizId={viz.id}
				title={viz.title}
				column={(viz.config as any)?.filterColumn ?? ""}
				targets={(viz.config as any)?.filterTargets ?? []}
				rows={toChartData(result) as Record<string, any>[]}
				displayType={
					(viz.config as any)?.filterDisplayType ?? "dropdown"
				}
				multiSelect={(viz.config as any)?.filterMultiSelect ?? true}
				autoRun={(viz.config as any)?.filterAutoRun ?? true}
				filterFloatRules={(viz.config as any)?.filterFloatRules}
				floatSchemaColumns={
					(viz.config as any)?.filterFloatColumns ?? []
				}
			/>,
		);
	}
	// "Stretch to fill" distorts charts to fill their box; table/pivot/kpi manage
	// their own fill and skip the visual transform.
	const NO_STRETCH = ["table", "pivot", "kpi"];
	const chart = (
		<ChartOrTable
			result={filtered}
			vizType={viz.visualizationType}
			config={viz.config as any}
			onTrigger={onTrigger}
			rawData={publishRows}
		/>
	);
	const stretched =
		size?.stretch && !NO_STRETCH.includes(viz.visualizationType) ? (
			<StretchFill>{chart}</StretchFill>
		) : (
			chart
		);
	return wrapSize(stretched);
}

interface VizConfig {
	xKey?: string;
	yKeys?: string[];
	tableColumns?: string[];
	tablePageSize?: number;
	styling?: {
		table?: {
			colorRules?: Array<{
				id: string;
				targetColumn: string;
				color: string;
				colorEntireRow: boolean;
				valueColumn: string;
				comparator: string;
				value: string | number;
			}>;
		};
	};
	[key: string]: unknown;
}

type OnTrigger = (
	payload: import("@/types/dashboard").VizTriggerPayload,
) => void;

function ChartOrTable({
	result,
	vizType,
	config,
	onTrigger,
	rawData,
}: {
	result: QueryResult;
	vizType: string;
	config?: VizConfig;
	onTrigger?: OnTrigger;
	rawData?: Record<string, unknown>[];
}) {
	if (!result.headers.length || !result.values.length) {
		return <p className="text-gray-500 text-sm">No results.</p>;
	}

	if (vizType === "table") {
		return <DataTable result={result} config={config} />;
	}

	if (vizType === "pivot") {
		return <PivotView result={result} config={config} />;
	}

	if (vizType === "kpi") {
		return <KpiView result={result} config={config} />;
	}

	// Guard: some charts render one SVG node per RAW row (no aggregation), so a very
	// large result (charts aren't paginated — they Collect all rows) explodes the DOM
	// and crashes the renderer. Refuse to plot those and tell the user to aggregate.
	// Aggregating charts (bar/line/pie/…) collapse rows first, so they're exempt.
	const RAW_POINT_TYPES = new Set([
		"scatter",
		"bubble",
		"cluster",
		"heatmap",
	]);
	const MAX_CHART_ROWS = 20_000;
	if (RAW_POINT_TYPES.has(vizType) && result.values.length > MAX_CHART_ROWS) {
		return (
			<div className="flex h-full w-full items-center justify-center p-6 text-center">
				<div className="max-w-sm text-gray-500 text-sm">
					<p className="font-medium text-gray-700">
						Too many rows to chart
					</p>
					<p className="mt-1">
						This query returned{" "}
						{result.values.length.toLocaleString()} rows. Add a
						GROUP BY / aggregation to your query (or use a Table) to
						plot it.
					</p>
				</div>
			</div>
		);
	}

	const data = toChartData(result);
	const chartX = result.headers[0];
	const chartY = result.headers.slice(1);

	if (vizType === "radar") {
		const radarXKey = (config as any)?.xKey || chartX;
		const radarYKeys: string[] = (config as any)?.yKeys?.length
			? (config as any).yKeys
			: chartY;
		const radarStyling = (config as any)?.styling?.radar;
		const radarAggs: Record<string, string> =
			(config as any)?.columnAggregations ?? {};
		const radarAggNames: Record<string, string> = {
			sum: "Sum",
			avg: "Average",
			count: "Count",
			countUnique: "Count Unique",
			min: "Min",
			max: "Max",
			median: "Median",
			last: "Last",
		};
		const radarAxisLabel = (col: string) => {
			const agg = radarAggs[col];
			return agg ? `${radarAggNames[agg] ?? agg} of ${col}` : col;
		};
		const radarColors = (config as any)?.styling?.colorPalette?.colors
			?.length
			? (config as any).styling.colorPalette.colors
			: COLORS;
		const radarFmtRules = (config as any)?.styling?.formatRules ?? [];
		// Apply sort rules before aggregation (mirrors DashboardVisualization behavior)
		const radarSortedData = applyVizSort(
			data,
			(config as any)?.styling?.sortValues,
		);
		// Aggregate sorted rows by dimension column, then pivot so value columns become axes
		const aggregated = aggregateChartData(
			radarSortedData,
			radarXKey,
			radarYKeys,
			config as any,
		);
		const radarSeries = radarXKey
			? [...new Set(aggregated.map((r) => String(r[radarXKey] ?? "")))]
			: ["Value"];
		// Raw pivot — always holds original aggregated values (for labels & tooltip)
		const radarPivoted = radarYKeys.map((col) => {
			const entry: Record<string, unknown> = {
				_axis: radarAxisLabel(col),
				_col: col,
			};
			if (radarXKey) {
				aggregated.forEach((row) => {
					entry[String(row[radarXKey] ?? "")] = row[col] ?? 0;
				});
			} else {
				entry.Value = aggregated[0]?.[col] ?? 0;
			}
			return entry;
		});
		const radarShowArea = radarStyling?.showArea ?? false;
		const radarFillOpacity = radarStyling?.fillOpacity ?? 0.25;
		const radarShowTooltip = radarStyling?.showTooltip ?? true;
		const radarShapePolygon = radarStyling?.shapePolygon !== false;
		const radarValueLabel = radarStyling?.valueLabel;
		const radarShowValueLabels = radarValueLabel?.show ?? false;
		// normalizeAxes=false (default): per-column [0, colMax] → all spokes fill to outer ring
		// normalizeAxes=true: raw values → shared Recharts domain → scale differences visible
		const radarNormalize = radarStyling?.normalizeAxes ?? false;
		const radarDisplayPivoted = radarNormalize
			? radarPivoted
			: radarPivoted.map((row) => {
					const vals = radarSeries.map((s) => Number(row[s] ?? 0));
					const colMax = Math.max(...vals, 0.0001);
					const norm: Record<string, unknown> = {
						_axis: row._axis,
						_col: row._col,
					};
					radarSeries.forEach((s) => {
						norm[s] = Number(row[s] ?? 0) / colMax;
					});
					return norm;
				});
		return (
			<div className="h-full w-full">
				<ResponsiveContainer width="100%" height="100%">
					<RadarChart data={radarDisplayPivoted}>
						<PolarGrid
							gridType={radarShapePolygon ? "polygon" : "circle"}
						/>
						<PolarAngleAxis dataKey="_axis" />
						{!radarNormalize && (
							<PolarRadiusAxis
								domain={[0, 1]}
								tick={false}
								axisLine={false}
							/>
						)}
						{radarSeries.map((s, i) => {
							const color = radarColors[i % radarColors.length];
							return (
								<Radar
									key={s}
									name={s}
									dataKey={s}
									isAnimationActive={false}
									stroke={color}
									fill={radarShowArea ? color : "transparent"}
									fillOpacity={
										radarShowArea ? radarFillOpacity : 0
									}
									label={
										radarShowValueLabels
											? (props: any) => {
													const raw =
														radarPivoted[
															props.index
														]?.[s];
													if (
														raw === undefined ||
														raw === null
													)
														return null;
													const col = String(
														radarPivoted[
															props.index
														]?._col ?? "",
													);
													const pos =
														radarValueLabel?.position ??
														"top";
													const dy =
														pos === "bottom"
															? 14
															: pos === "inside"
																? 4
																: -8;
													const fwMap: Record<
														string,
														number
													> = {
														normal: 400,
														medium: 500,
														semibold: 600,
														bold: 700,
													};
													return (
														<text
															key={`rl-${s}-${props.index}`}
															x={props.x}
															y={props.y + dy}
															textAnchor="middle"
															fill={
																radarValueLabel?.color ??
																color
															}
															fontSize={
																radarValueLabel?.fontSize ??
																10
															}
															fontWeight={
																fwMap[
																	radarValueLabel?.fontWeight ??
																		""
																] ?? 500
															}
														>
															{formatValue(
																raw,
																col,
																radarFmtRules,
															)}
														</text>
													);
												}
											: undefined
									}
								/>
							);
						})}
						{radarSeries.length > 1 && (
							<Legend
								content={<PaginatedLegend />}
								wrapperStyle={{
									fontSize: 11,
									color: "#64748b",
								}}
							/>
						)}
						{radarShowTooltip && (
							<Tooltip
								wrapperStyle={{ zIndex: 10 }}
								content={(props: any) => {
									if (!props.active || !props.payload?.length)
										return null;
									const spoke = props.payload[0]?.payload;
									return (
										<div className="min-w-[120px] rounded-md border border-slate-200 bg-white p-2 text-xs shadow-md">
											<p className="mb-1.5 truncate font-semibold text-slate-700">
												{spoke?._axis ?? ""}
											</p>
											{props.payload.map((p: any) => {
												const rawEntry =
													radarPivoted.find(
														(r) =>
															r._axis ===
															spoke?._axis,
													);
												const rawVal =
													rawEntry?.[p.dataKey];
												const col = String(
													rawEntry?._col ?? "",
												);
												return (
													<div
														key={p.dataKey}
														className="flex items-center gap-2 py-0.5"
													>
														<span
															className="h-2 w-2 flex-shrink-0 rounded-full"
															style={{
																background:
																	p.color,
															}}
														/>
														<span className="flex-1 text-slate-500">
															{p.name}:
														</span>
														<span className="font-medium text-slate-700">
															{rawVal !==
															undefined
																? formatValue(
																		rawVal,
																		col,
																		radarFmtRules,
																	)
																: ""}
														</span>
													</div>
												);
											})}
										</div>
									);
								}}
							/>
						)}
					</RadarChart>
				</ResponsiveContainer>
			</div>
		);
	}

	if (vizType === "treemap") {
		return (
			<div className="h-full w-full">
				<TreemapChart
					data={data}
					config={config as any}
					height="100%"
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "scatter") {
		const scatterCfg = config as any;
		const labelKey: string = scatterCfg?.label || "";
		const sizeKey: string = scatterCfg?.size || "";
		const colorKey: string = scatterCfg?.color || "";
		const fmtRules = scatterCfg?.styling?.formatRules ?? [];
		const scatterTooltipCols: Array<{
			column: string;
			aggregation: string;
		}> = scatterCfg?.tooltips?.length
			? scatterCfg.tooltips
			: scatterCfg?.tooltip
				? [
						{
							column: scatterCfg.tooltip,
							aggregation:
								scatterCfg?.tooltipAggregation ||
								scatterCfg?.columnAggregations?.[
									scatterCfg.tooltip
								] ||
								"count",
						},
					]
				: [];

		const aggVal = (vals: any[], type: string): number => {
			const nums = vals.map(Number).filter((n) => !Number.isNaN(n));
			if (!nums.length) return 0;
			switch (type) {
				case "avg":
					return nums.reduce((a, b) => a + b, 0) / nums.length;
				case "count":
					return nums.length;
				case "max":
					return Math.max(...nums);
				case "min":
					return Math.min(...nums);
				default:
					return nums.reduce((a, b) => a + b, 0);
			}
		};

		let scatterData: any[] = [];

		if (labelKey && data.length > 0) {
			const grouped = new Map<string, any>();
			data.forEach((row) => {
				const labelValue = String(row[labelKey] ?? "");
				if (!grouped.has(labelValue)) {
					const _ttVals: Record<string, any[]> = {};
					for (const { column } of scatterTooltipCols)
						_ttVals[column] = [];
					grouped.set(labelValue, {
						label: labelValue,
						_xValues: [] as any[],
						_yValues: [] as any[],
						_sizeValues: [] as any[],
						_ttVals,
						colorCategory: colorKey ? row[colorKey] : undefined,
					});
				}
				const g = grouped.get(labelValue)!;
				g._xValues.push(row[chartX]);
				g._yValues.push(row[chartY[0]]);
				if (sizeKey) g._sizeValues.push(row[sizeKey]);
				for (const { column } of scatterTooltipCols)
					g._ttVals[column].push(row[column]);
			});

			scatterData = Array.from(grouped.values()).map((g) => {
				const point: any = { label: g.label };
				const xAgg = scatterCfg?.columnAggregations?.[chartX] || "avg";
				point[chartX] = aggVal(g._xValues, xAgg);
				const yAgg =
					scatterCfg?.columnAggregations?.[chartY[0]] || "avg";
				point[chartY[0]] = aggVal(g._yValues, yAgg);
				if (sizeKey && g._sizeValues.length > 0) {
					const sizeAgg =
						scatterCfg?.columnAggregations?.[sizeKey] || "avg";
					point[sizeKey] = aggVal(g._sizeValues, sizeAgg);
					point.sizeValue = point[sizeKey];
				}
				for (const { column, aggregation } of scatterTooltipCols) {
					const vals = g._ttVals[column] ?? [];
					if (vals.length)
						point[`_tooltip_${column}`] = aggVal(vals, aggregation);
				}
				if (colorKey) point.colorCategory = g.colorCategory;
				return point;
			});
		} else {
			scatterData = data.map((row) => {
				const point: any = {
					[chartX]: row[chartX],
					[chartY[0]]: row[chartY[0]],
				};
				if (sizeKey && row[sizeKey] != null) {
					point[sizeKey] = Number(row[sizeKey]);
					point.sizeValue = point[sizeKey];
				}
				if (colorKey && row[colorKey])
					point.colorCategory = row[colorKey];
				return point;
			});
		}

		const colorCategories = colorKey
			? Array.from(
					new Set(
						scatterData.map((d) => d.colorCategory).filter(Boolean),
					),
				)
			: [];

		if (sizeKey) {
			const sizes = scatterData
				.map((d) => d[sizeKey])
				.filter((s) => s != null);
			if (sizes.length > 0) {
				const minSize = Math.min(...sizes);
				const maxSize = Math.max(...sizes);
				const range = maxSize - minSize || 1;
				scatterData.forEach((d) => {
					d.size =
						d[sizeKey] != null
							? 3 + ((d[sizeKey] - minSize) / range) * 12
							: 5;
				});
			} else {
				scatterData.forEach((d) => (d.size = 5));
			}
		} else {
			scatterData.forEach((d) => (d.size = 5));
		}

		return (
			<div className="h-full w-full">
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart
						margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
						<XAxis
							type="number"
							dataKey={chartX}
							name={chartX}
							tick={{ fontSize: 11, fill: "#94a3b8" }}
							axisLine={false}
							tickLine={false}
							tickFormatter={(v: unknown) =>
								formatValue(v, chartX, fmtRules)
							}
							label={
								scatterCfg?.xLabel
									? {
											value: scatterCfg.xLabel,
											position: "insideBottom",
											offset: -4,
											fontSize: 11,
											fill: "#94a3b8",
										}
									: undefined
							}
						/>
						<YAxis
							type="number"
							dataKey={chartY[0]}
							name={chartY[0]}
							tick={{ fontSize: 11, fill: "#94a3b8" }}
							axisLine={false}
							tickLine={false}
							width={48}
							tickFormatter={(v: unknown) =>
								formatValue(v, chartY[0] ?? "", fmtRules)
							}
							label={
								scatterCfg?.yLabel
									? {
											value: scatterCfg.yLabel,
											angle: -90,
											position: "insideLeft",
											fontSize: 11,
											fill: "#94a3b8",
										}
									: undefined
							}
						/>
						<Tooltip
							cursor={{ strokeDasharray: "3 3" }}
							wrapperStyle={{ zIndex: 10 }}
							content={({ payload }) => {
								if (!payload?.length) return null;
								const d = payload[0].payload;
								const xAgg =
									scatterCfg?.columnAggregations?.[chartX] ||
									"avg";
								const yAgg =
									scatterCfg?.columnAggregations?.[
										chartY[0]
									] || "avg";
								const sizeAgg = sizeKey
									? scatterCfg?.columnAggregations?.[
											sizeKey
										] || "avg"
									: "";
								const activeTtCols = scatterTooltipCols.filter(
									({ column }) =>
										d[`_tooltip_${column}`] !== undefined,
								);
								return (
									<div className="rounded border border-slate-200 bg-white p-2 text-xs shadow-lg">
										{labelKey && d.label && (
											<div className="mb-1 font-semibold">
												{formatValue(
													d.label,
													labelKey,
													fmtRules,
												)}
											</div>
										)}
										<div>{`${chartX} (${xAgg}): ${formatValue(d[chartX], chartX, fmtRules)}`}</div>
										<div>{`${chartY[0]} (${yAgg}): ${formatValue(d[chartY[0]], chartY[0], fmtRules)}`}</div>
										{sizeKey && d[sizeKey] != null && (
											<div>{`${sizeKey} (${sizeAgg}): ${formatValue(d[sizeKey], sizeKey, fmtRules)}`}</div>
										)}
										{colorKey && d.colorCategory && (
											<div>{`${colorKey}: ${formatValue(d.colorCategory, colorKey, fmtRules)}`}</div>
										)}
										{activeTtCols.length > 0 && (
											<div className="mt-1 border-slate-200 border-t pt-1">
												{activeTtCols.map(
													({
														column,
														aggregation,
													}) => (
														<div
															key={column}
														>{`${column} (${aggregation}): ${formatValue(d[`_tooltip_${column}`], column, fmtRules)}`}</div>
													),
												)}
											</div>
										)}
									</div>
								);
							}}
						/>
						{colorCategories.length > 0 ? (
							colorCategories.map((category, idx) => (
								<Scatter
									key={String(category)}
									name={String(category)}
									isAnimationActive={false}
									data={scatterData.filter(
										(d) => d.colorCategory === category,
									)}
									fill={COLORS[idx % COLORS.length]}
									fillOpacity={0.75}
									shape={(props: any) => {
										const { cx, cy, payload } = props;
										const r = payload.size || 5;
										return (
											<circle
												cx={cx}
												cy={cy}
												r={r}
												fill={
													COLORS[idx % COLORS.length]
												}
												fillOpacity={0.75}
												stroke="#fff"
												strokeWidth={1}
											/>
										);
									}}
								/>
							))
						) : (
							<Scatter
								data={scatterData}
								isAnimationActive={false}
								fill={COLORS[0]}
								fillOpacity={0.75}
								shape={(props: any) => {
									const { cx, cy, payload } = props;
									const r = payload.size || 5;
									return (
										<circle
											cx={cx}
											cy={cy}
											r={r}
											fill={COLORS[0]}
											fillOpacity={0.75}
											stroke="#fff"
											strokeWidth={1}
										/>
									);
								}}
							/>
						)}
						{colorCategories.length > 1 && (
							<Legend
								content={<PaginatedLegend />}
								wrapperStyle={{
									fontSize: 11,
									color: "#64748b",
									paddingTop: 8,
								}}
							/>
						)}
					</ScatterChart>
				</ResponsiveContainer>
			</div>
		);
	}

	if (vizType === "heatmap") {
		return (
			<div className="h-full w-full">
				<HeatmapChart
					data={data}
					config={config as any}
					formatRules={(config as any)?.styling?.formatRules ?? []}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "halfdonut") {
		return (
			<div className="h-full w-full">
				<HalfDonutChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "boxplot") {
		return (
			<div className="h-full w-full">
				<BoxPlotChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "polarbar") {
		return (
			<div className="h-[380px]">
				<PolarBarChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "cluster") {
		return (
			<div className="h-full w-full">
				<ClusterChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "multiline") {
		return (
			<div className="h-full w-full">
				<MultiLineChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "worldmap") {
		return (
			<div className="h-full w-full">
				<WorldMapChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "htmlblock") {
		return (
			<div className="h-full w-full">
				<HtmlBlockVisualization config={config as any} />
			</div>
		);
	}

	if (vizType === "wordcloud") {
		// Self-contained wordcloud2.js renderer; uses its own canvas, no recharts wrapper.
		return (
			<div className="h-full w-full">
				<WordCloud
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "bubble") {
		// Self-contained SVG renderer; uses its own layout + popover, no recharts wrapper.
		return (
			<div className="h-full w-full">
				<BubbleChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "sunburst") {
		return (
			<div className="h-full w-full">
				<SunburstChart
					data={data}
					config={config as any}
					formatRules={(config as any)?.styling?.formatRules}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "puck") {
		return (
			<div className="h-full w-full">
				<PuckChart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "pie") {
		return (
			<div className="h-full w-full">
				<Pie_Chart
					data={data}
					rawData={rawData}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "line") {
		return (
			<div className="h-full w-full">
				<Line_Chart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "bar") {
		return (
			<div className="h-full w-full">
				<Bar_Chart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "stackbar") {
		return (
			<div className="h-full w-full">
				<Bar_Chart
					data={data}
					config={config as any}
					stacked
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	const [xKey, ...valueKeys] = result.headers;

	if (vizType === "combo") {
		return (
			<div className="h-full w-full">
				<Combo_Chart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	if (vizType === "area") {
		return (
			<div className="h-full w-full">
				<Area_Chart
					data={data}
					config={config as any}
					onTrigger={onTrigger}
				/>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
				<YAxis tick={{ fontSize: 12 }} />
				<Tooltip />
				<Legend />
				{valueKeys.map((k, i) => (
					<Bar
						key={k}
						dataKey={k}
						fill={COLORS[i % COLORS.length]}
						isAnimationActive={false}
					/>
				))}
			</BarChart>
		</ResponsiveContainer>
	);
}

function DataTable({
	result,
	config,
}: {
	result: QueryResult;
	config?: VizConfig;
}) {
	const rows = toChartData(result);
	return <TableView data={rows} config={config as any} />;
}

// Pivot view
// Renders the shared PivotTable component with the saved styling. Converts the
// raw QueryResult into row objects and runs the shared pivot transform.
function PivotView({
	result,
	config,
}: {
	result: QueryResult;
	config?: VizConfig;
}) {
	const rows = toChartData(result);
	// Cast: portal's VisualizationConfig is a structural subset of the shared dashboard config
	const pivot = usePivotTransform(rows, config as any);

	// Note: do NOT use negative margins here. The published portal's panel body
	// has no horizontal padding, so `-mx-*` would push the pivot past the
	// container edge and break auto-fit width measurement.
	return (
		<div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
			<PivotTable
				pivot={pivot}
				styling={(config as VisualizationConfig | undefined)?.styling}
			/>
		</div>
	);
}

// KPI view
// Renders the shared KPI component.
function KpiView({
	result,
	config,
}: {
	result: QueryResult;
	config?: VizConfig;
}) {
	const rows = toChartData(result);
	return (
		<div className="flex h-full min-h-[160px] flex-col overflow-hidden">
			<KPI data={rows} config={config as any} />
		</div>
	);
}
