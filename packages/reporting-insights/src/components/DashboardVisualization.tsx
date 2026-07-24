import {
	AlertCircle,
	AreaChart as AreaChartIcon,
	BarChart2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Download,
	Loader2,
	Radar as RadarIcon,
	RefreshCw,
	ScatterChart as ScatterChartIcon,
	SlidersHorizontal,
	TreeDeciduous,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	AreaChart,
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
	Treemap,
	XAxis,
	YAxis,
} from "recharts";
import { useInsight } from "@semoss/sdk-react";
import { formatSqlList } from "@/components/ParamControl";
import { PhiExportWarningModal } from "@/components/PhiExportWarningModal";
import { useQueryRunner } from "@/components/QueryRunner";
import { Bar_Chart } from "@/components/visualizations/Bar_Chart";
import { BoxPlotChart } from "@/components/visualizations/BoxPlotChart";
import { BubbleChart } from "@/components/visualizations/BubbleChart";
import { ClusterChart } from "@/components/visualizations/ClusterChart";
import { HalfDonutChart } from "@/components/visualizations/HalfDonutChart";
import { HeatmapChart } from "@/components/visualizations/HeatmapChart";
import { HtmlBlockVisualization } from "@/components/visualizations/HtmlBlockVisualization";
import { KPI } from "@/components/visualizations/KPI";
import { Line_Chart } from "@/components/visualizations/Line_Chart";
import { MultiLineChart } from "@/components/visualizations/MultiLineChart";
import { Pie_Chart } from "@/components/visualizations/Pie_Chart";
import { PivotTable } from "@/components/visualizations/PivotTable";
import { PolarBarChart } from "@/components/visualizations/PolarBarChart";
import { PuckChart } from "@/components/visualizations/PuckChart";
import { StretchFill } from "@/components/visualizations/StretchFill";
import { SunburstChart } from "@/components/visualizations/SunburstChart";
import { TableView } from "@/components/visualizations/TableView";
import { WordCloud } from "@/components/visualizations/WordCloud";
import { WorldMapChart } from "@/components/visualizations/WorldMapChart";
import { CsvExportButton } from "@/components/widgets/CsvExportButton";
import { FilterWidget } from "@/components/widgets/FilterWidget";
import { usePivotTransform } from "@/hooks/usePivotTransform";
import {
	applyFilters,
	useAppliedFilters,
	useFilterStore,
} from "@/lib/dashboardFilters";
import { escapeSqlForPixel } from "@/lib/pixel";
import {
	buildQueryPixel,
	isDataProduct,
	lastPixelOutput,
	sourcesSignature,
} from "@/lib/queryPixel";
import type { QuerySource } from "@/lib/resolveQuery";
import { aggregateTableRows } from "@/lib/tableAggregate";
import { applyVizFilter } from "@/lib/vizFilter";
import { contentSizeStyles, hasContentSize } from "@/lib/vizSize";
import { applyVizSort } from "@/lib/vizSort";
import type { Visualization } from "@/types/dashboard";

// ── Chart palette ─────────────────────────────────────────────────────────────
export const CHART_COLORS = [
	"#6366f1",
	"#0ea5e9",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
	"#f97316",
];

// ── PERF DIAGNOSTIC flag (temporary) ──────────────────────────────────────────
const PERF = true;

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({
	active,
	payload,
	label,
	config,
}: {
	active?: boolean;
	payload?: any[];
	label?: string;
	config?: any;
}) {
	if (!active || !payload?.length) return null;
	const tooltipCols: Array<{ column: string; aggregation: string }> = config
		?.tooltips?.length
		? config.tooltips
		: config?.tooltip
			? [
					{
						column: config.tooltip,
						aggregation:
							config.tooltipAggregation ||
							config?.columnAggregations?.[config.tooltip] ||
							"count",
					},
				]
			: [];
	const rowData = payload[0].payload;
	const activeTooltips = tooltipCols.filter(
		({ column }) => rowData[`_tooltip_${column}`] !== undefined,
	);

	return (
		<div className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
			{label !== undefined && (
				<p className="mb-2 max-w-[200px] truncate border-slate-100 border-b pb-2 font-semibold text-slate-700">
					{String(label)}
				</p>
			)}
			<div className="space-y-1">
				{payload.map((entry: any) => (
					<div
						key={entry.dataKey}
						className="flex items-center justify-between gap-4"
					>
						<div className="flex items-center gap-1.5">
							<span
								className="h-2 w-2 flex-shrink-0 rounded-full"
								style={{ background: entry.color }}
							/>
							<span className="text-slate-500 text-xs">
								{entry.dataKey}
							</span>
						</div>
						<span className="font-semibold text-slate-900 text-xs tabular-nums">
							{typeof entry.value === "number"
								? entry.value.toLocaleString()
								: String(entry.value)}
						</span>
					</div>
				))}
			</div>
			{activeTooltips.length > 0 && (
				<div className="mt-2 space-y-1 border-slate-100 border-t pt-2">
					{activeTooltips.map(({ column, aggregation }) => (
						<div
							key={column}
							className="flex items-center justify-between gap-4"
						>
							<span className="text-slate-500 text-xs capitalize">
								{aggregation} of {column}:
							</span>
							<span className="font-semibold text-slate-700 text-xs tabular-nums">
								{typeof rowData[`_tooltip_${column}`] ===
								"number"
									? rowData[
											`_tooltip_${column}`
										].toLocaleString(undefined, {
											maximumFractionDigits: 2,
										})
									: String(rowData[`_tooltip_${column}`])}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// Shared axis/grid styles
const AXIS_STYLE = { fontSize: 11, fill: "#94a3b8" };
const GRID_STYLE = { stroke: "#f1f5f9", strokeDasharray: "0" };

function downloadCsv(data: any[], filename: string) {
	if (!data.length) return;
	const cols = Object.keys(data[0]);
	const escape = (v: any) => {
		const s = v != null ? String(v) : "";
		return s.includes(",") || s.includes('"') || s.includes("\n")
			? `"${s.replace(/"/g, '""')}"`
			: s;
	};
	const csv = [
		cols.join(","),
		...data.map((row) => cols.map((c) => escape(row[c])).join(",")),
	].join("\n");
	const a = Object.assign(document.createElement("a"), {
		href: URL.createObjectURL(
			new Blob([csv], { type: "text/csv;charset=utf-8;" }),
		),
		download: filename,
	});
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

interface Props {
	visualization: Visualization;
	/**
	 * The effective data source (database + query + parameters). When the viz is
	 * bound to a shared query this is the resolved query, so multiple charts fetch
	 * once via the shared cache. Falls back to the viz's own embedded fields.
	 */
	dataSource?: QuerySource;
	parameterValues?: Record<string, string>;
	runKey?: number;
	fillContainer?: boolean;
	headerActions?: React.ReactNode;
	/** Skip API call and render supplied data directly (editor preview) */
	preloadedData?: any[];
	/**
	 * When true, the dashboard has a centralized Parameters sheet. All "waiting"
	 * states redirect the user to that sheet instead of showing inline forms or
	 * master-pointer messages. The per-viz gear overlay is also suppressed.
	 */
	hasParamSheet?: boolean;
	/**
	 * When true, this visualization's query has no parameters of its own but is
	 * configured to defer loading until the param sheet's Run All is clicked.
	 * Mirrors the hasParams waiting gate using the same runKey mechanism.
	 */
	loadAfterParams?: boolean;
	/**
	 * Called when the user changes a filter widget selection in the editor preview,
	 * so the editor can persist the selection as the default for view mode.
	 */
	onFilterDefaultValuesChange?: (vizId: string, values: string[]) => void;
}

// Facet navigation bar
function FacetSelect({
	value,
	options,
	onChange,
}: {
	value: string;
	options: string[];
	onChange: (v: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const filtered = useMemo(
		() =>
			q.trim()
				? options.filter((o) =>
						o.toLowerCase().includes(q.toLowerCase()),
					)
				: options,
		[options, q],
	);
	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => {
					setOpen((o) => !o);
					setQ("");
				}}
				className="flex max-w-[180px] items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-200"
			>
				<span className="truncate">{value}</span>
				<ChevronDown className="h-3 w-3 flex-shrink-0 text-slate-400" />
			</button>
			{open && (
				<>
					<div
						className="fixed inset-0 z-30"
						onClick={() => setOpen(false)}
					/>
					<div className="-translate-x-1/2 absolute bottom-full left-1/2 z-40 mb-1.5 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
						<div className="border-slate-100 border-b p-2">
							<input
								autoFocus
								value={q}
								onChange={(e) => setQ(e.target.value)}
								placeholder="Search…"
								className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
							/>
						</div>
						<ul className="max-h-44 overflow-y-auto py-1">
							{filtered.length === 0 && (
								<li className="px-3 py-1.5 text-slate-400 text-xs">
									No matches
								</li>
							)}
							{filtered.map((o) => (
								<li key={o}>
									<button
										type="button"
										onClick={() => {
											onChange(o);
											setOpen(false);
											setQ("");
										}}
										className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 ${o === value ? "font-semibold text-blue-600" : "text-slate-700"}`}
									>
										{o}
									</button>
								</li>
							))}
						</ul>
					</div>
				</>
			)}
		</div>
	);
}

function FacetNavBar({
	column,
	values,
	index,
	onIndexChange,
}: {
	column: string;
	values: string[];
	index: number;
	onIndexChange: (i: number) => void;
}) {
	const prev = () =>
		onIndexChange((index - 1 + values.length) % values.length);
	const next = () => onIndexChange((index + 1) % values.length);
	return (
		<div className="flex flex-shrink-0 items-center justify-center gap-2 border-slate-100 border-t bg-white px-3 py-2">
			<button
				type="button"
				onClick={prev}
				className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
				title="Previous value"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>
			<div className="flex min-w-0 items-center gap-1.5">
				<span className="flex-shrink-0 font-semibold text-slate-500 text-xs">
					{column}:
				</span>
				<FacetSelect
					value={values[index] ?? ""}
					options={values}
					onChange={(v) => onIndexChange(values.indexOf(v))}
				/>
			</div>
			<div className="flex-shrink-0 text-[10px] text-slate-400 tabular-nums">
				{index + 1} / {values.length}
			</div>
			<button
				type="button"
				onClick={next}
				className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
				title="Next value"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</div>
	);
}

/** Distinct first-column values from a SEMOSS query result (for dropdown options). */
function firstColumnValues(output: any): string[] {
	const values =
		output?.data?.values ??
		output?.values ??
		(Array.isArray(output?.data) ? output.data : []);
	if (!Array.isArray(values)) return [];
	const out: string[] = [];
	const seen = new Set<string>();
	for (const row of values) {
		const v = Array.isArray(row) ? row[0] : row;
		const s = v == null ? "" : String(v);
		if (s && !seen.has(s)) {
			seen.add(s);
			out.push(s);
		}
	}
	return out;
}

/** A single parameter input — free text or a dropdown (when configured). */
export function DashboardVisualization({
	visualization,
	dataSource,
	parameterValues = {},
	runKey = 0,
	fillContainer = false,
	headerActions,
	preloadedData,
	hasParamSheet = false,
	loadAfterParams = false,
	onFilterDefaultValuesChange,
}: Props) {
	// ── PERF DIAGNOSTIC (temporary) ───────────────────────────────────────────
	// Counts how many times THIS viz re-renders. If switching sheets logs a render
	// for every viz across ALL sheets (not just the active one), the slowness is
	// "all kept-alive charts re-render on switch" → needs memoization.
	const __renderCount = useRef(0);
	__renderCount.current += 1;
	if (PERF)
		console.log(
			`[perf] render #${__renderCount.current}`,
			visualization.title || visualization.id,
		);

	const { actions } = useInsight();
	const sharedRun = useQueryRunner();
	// Effective data source: the resolved shared query when provided, else the
	// viz's own embedded query/database/parameters (legacy / not-yet-migrated).
	const src: QuerySource = dataSource ?? visualization;
	const [rawData, setRawData] = useState<any[]>(() => preloadedData ?? []);
	const [showPhiModal, setShowPhiModal] = useState(false);
	// Cross-frame filters targeting this visualization (re-renders only when its
	// own applicable filters change). Applied client-side to the loaded rows.
	const appliedFilters = useAppliedFilters(visualization.id);
	// Publish loaded rows so Filter widgets can build their options from this
	// viz's data — no query of their own required.
	const filterStore = useFilterStore();
	useEffect(() => {
		if (!filterStore) return;
		if (
			visualization.visualizationType === "filter" ||
			visualization.visualizationType === "csvexport"
		)
			return;
		const headers = rawData.length ? Object.keys(rawData[0]) : [];
		filterStore.publishVizData(visualization.id, headers, rawData);
	}, [
		filterStore,
		visualization.id,
		visualization.visualizationType,
		rawData,
	]);
	// Author-defined per-viz filter (Filter Visualization tool), then cross-frame
	// widget filters — both client-side, before the chart aggregates.
	const vizFilter = visualization.config?.styling?.vizFilter;
	const sortRules = visualization.config?.styling?.sortValues;
	const data = useMemo(
		() =>
			applyVizSort(
				applyVizFilter(
					applyFilters(rawData, appliedFilters),
					vizFilter,
				),
				sortRules,
			),
		[rawData, appliedFilters, vizFilter, sortRules],
	);

	// Facet navigation
	const facetColumn = visualization.config?.facetColumn;
	const [facetIndex, setFacetIndex] = useState(0);

	const facetValues = useMemo(() => {
		if (!facetColumn) return [];
		const seen = new Set<string>();
		const vals: string[] = [];
		for (const row of rawData) {
			const v = String(row[facetColumn] ?? "");
			if (v && !seen.has(v)) {
				seen.add(v);
				vals.push(v);
			}
		}
		return vals;
	}, [rawData, facetColumn]);

	useEffect(() => {
		setFacetIndex(0);
	}, [facetColumn, rawData]);

	const facetValue = facetValues[facetIndex];
	const facetData = useMemo(
		() =>
			facetColumn && facetValue
				? data.filter(
						(row) => String(row[facetColumn] ?? "") === facetValue,
					)
				: data,
		[data, facetColumn, facetValue],
	);

	const [loading, setLoading] = useState(!preloadedData);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0);
	// Initial rows-per-page: the configured value (styling.table.pageSize, with the
	// legacy config.tablePageSize as fallback), else 50. '' / invalid → 50 at runtime.
	const configuredPageSize =
		visualization.config?.styling?.table?.pageSize ??
		visualization.config?.tablePageSize;
	const [pageSize, setPageSize] = useState<number | "">(
		typeof configuredPageSize === "number" && configuredPageSize > 0
			? configuredPageSize
			: 50,
	);
	// ── Table server-side pagination (via SEMOSS Collect, exact query) ──────────
	// Only TABLES paginate — and ONLY when NOT aggregating. Client-side aggregation
	// (group-by / Average-of-X) must see the FULL result to be correct; paging would
	// aggregate over just the loaded rows and change as you load more. So an aggregated
	// table fetches all rows (-1) and then displays/paginates the small grouped output.
	const tableAggs = visualization.config?.columnAggregations ?? {};
	const hasTableAggregation =
		visualization.visualizationType === "table" &&
		Object.values(tableAggs).some(
			(a) => a && a !== "none" && a !== "group",
		);
	const isTablePaged =
		visualization.visualizationType === "table" &&
		!preloadedData &&
		!hasTableAggregation;
	const tableTaskId = useRef<string | null>(null);
	// When true, the next `data` change is an APPEND (Load more) — don't reset to page 1.
	const keepPageRef = useRef(false);
	const [dbHasMore, setDbHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const hasParams = (src.parameters?.length ?? 0) > 0;
	const [waiting, setWaiting] = useState(
		(hasParams || loadAfterParams) && !preloadedData,
	);

	// ── Dropdown parameter options (SQL-sourced) ────────────────────────────────
	const [paramOptions, setParamOptions] = useState<Record<string, string[]>>(
		{},
	);
	const paramOptionsKey = JSON.stringify(
		(src.parameters ?? []).map((p) => [
			p.id,
			p.inputType,
			p.optionsQuery,
			p.optionsDatabaseId,
		]),
	);
	useEffect(() => {
		const toFetch = (src.parameters ?? []).filter(
			(p) =>
				(p.inputType === "dropdown" || p.inputType === "multiselect") &&
				p.optionsQuery &&
				(p.optionsDatabaseId || src.databaseId),
		);
		if (!toFetch.length) return;
		let cancelled = false;
		void (async () => {
			const next: Record<string, string[]> = {};
			for (const p of toFetch) {
				try {
					const db = p.optionsDatabaseId || src.databaseId;
					let outputRaw: any;
					if (sharedRun) {
						// Route through the shared cache so charts that reuse the same query
						// (and thus the same dropdown options) fetch the options list once.
						const r = await sharedRun(
							db,
							p.optionsQuery ?? "",
							1000,
						);
						outputRaw = r.raw;
					} else {
						const q = escapeSqlForPixel(p.optionsQuery ?? "");
						const { pixelReturn } = await actions.run<
							[{ output: any; operationType?: string[] }]
						>(
							`Database(database=["${db}"]) | Query("${q}") | Collect(1000);`,
						);
						const pr = pixelReturn[0];
						if (
							Array.isArray(pr.operationType) &&
							pr.operationType.includes("ERROR")
						)
							continue;
						outputRaw = pr.output;
					}
					next[p.id] = firstColumnValues(outputRaw);
				} catch {
					/* leave options empty; manual options still apply */
				}
			}
			if (!cancelled && Object.keys(next).length)
				setParamOptions((prev) => ({ ...prev, ...next }));
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [src.databaseId, paramOptionsKey]);

	useEffect(() => {
		if (preloadedData) {
			setRawData(preloadedData);
			setLoading(false);
			setWaiting(false);
			setError(null);
		}
	}, [preloadedData]);

	useEffect(() => {
		// A "Load more" append grows the dataset but should keep the user on their page
		// (the seamless Next handler advances explicitly). A fresh load / filter change
		// resets to page 1.
		if (keepPageRef.current) {
			keepPageRef.current = false;
			return;
		}
		setCurrentPage(0);
	}, [data]);

	// Sync pageSize when the configured rows-per-page changes (editor edit).
	const cfgPageSize =
		visualization.config?.styling?.table?.pageSize ??
		visualization.config?.tablePageSize;
	useEffect(() => {
		if (typeof cfgPageSize === "number" && cfgPageSize > 0) {
			setPageSize(cfgPageSize);
			setCurrentPage(0);
		}
	}, [cfgPageSize]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (preloadedData) return;
		// HTML blocks render from config — no database query needed
		if (visualization.visualizationType === "htmlblock") {
			setLoading(false);
			return;
		}
		// The Filter widget holds no data of its own — it reads its targets' rows.
		// Skip loading so it renders without requiring a query.
		if (visualization.visualizationType === "filter") {
			setLoading(false);
			setWaiting(false);
			return;
		}
		if ((hasParams || loadAfterParams) && runKey === 0) {
			setLoading(false);
			setWaiting(true);
			return;
		}
		setWaiting(false);
		// runKey is folded into the shared-cache version, so a re-run (bumped runKey)
		// is already a fresh fetch — and every chart bound to the same query collapses
		// onto that one fetch. No per-chart bust here.
		void loadData(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		src.query,
		src.databaseId,
		sourcesSignature(src),
		runKey,
		visualization.visualizationType,
		loadAfterParams,
	]);

	// Tables fetch ONE display page per Collect (next pages continue the task iterator).
	// The page size is capped at MAX_DB_PAGE so a single DB call can't be huge — but
	// there's NO total cap: "Load more" keeps pulling another page until the query is
	// exhausted. Every other viz collects ALL rows (-1) of the exact query.
	const MAX_DB_PAGE = 1000; // max rows per single Collect (caps DB call size, not the total)
	const requestedPageRows =
		typeof pageSize === "number" && pageSize > 0 ? pageSize : 50;
	const tablePageRows = Math.min(requestedPageRows, MAX_DB_PAGE); // rows fetched per Collect
	// Data products (multi-source frame merges) can't use the DB task-paging iterator,
	// so they always collect all rows.
	const dp = isDataProduct(src);
	const batchSize = isTablePaged && !dp ? tablePageRows : -1;

	const interpolateQuery = (q: string) => {
		let r = q;
		const m: Record<string, string> = {};
		src.parameters?.forEach((p) => {
			m[p.name] = p.defaultValue;
		});
		Object.assign(m, parameterValues);
		// Empty multiselect = "all options" → substitute every known option so
		// IN ({{param}}) matches all rows instead of generating invalid IN ().
		src.parameters?.forEach((p) => {
			if (p.inputType !== "multiselect") return;
			if ((m[p.name] ?? "").trim()) return; // already has selections
			const allOpts = [
				...(paramOptions[p.id] ?? []),
				...(p.options ?? []),
			];
			if (allOpts.length > 0) m[p.name] = formatSqlList(allOpts);
		});
		Object.entries(m).forEach(([k, v]) => {
			r = r.replaceAll(`{{${k}}}`, v);
		});
		return r;
	};

	// Manual single-card refresh bumps a local nonce to bust just this card's cache
	// entry (siblings keep their shared cached rows until their own next run).
	const refreshNonce = useRef(0);

	/** Map SEMOSS [headers, values[][]] into row objects. */
	const toRows = (
		headers: string[],
		values: any[][],
	): Record<string, any>[] =>
		values.map((row) => {
			const obj: any = {};
			headers.forEach((h, i) => {
				obj[h] = row[i];
			});
			return obj;
		});

	/**
	 * Extract the page's row count + task id from a Collect pixel return, tolerant of
	 * where SEMOSS puts them: either as top-level fields of pixelReturn[0].output
	 * (data / numCollected / taskId), or as separate pixel outputs at [1]/[2].
	 */
	const readTaskMeta = (out: any, pixelReturn: any[], rowCount: number) => {
		const numCollected = Number(
			out?.numCollected ?? pixelReturn?.[1]?.output ?? rowCount,
		);
		const taskRaw =
			out?.taskId ??
			out?.taskOptions?.taskId ??
			pixelReturn?.[2]?.output ??
			null;
		return {
			numCollected,
			taskId: taskRaw != null ? String(taskRaw) : null,
		};
	};

	const loadData = async (_offset = 0, bust = false) => {
		if (bust) refreshNonce.current += 1;
		setLoading(true);
		setError(null);
		tableTaskId.current = null;
		setDbHasMore(false);
		try {
			const q = interpolateQuery(src.query);
			// Data product: interpolate each leg's SQL with the same param values.
			const runSource = dp
				? {
						sources: (src.sources ?? []).map((l) => ({
							...l,
							query: interpolateQuery(l.query),
						})),
						joins: src.joins,
					}
				: undefined;
			// TABLES: run the EXACT query and Collect the first page, capturing the
			// task id + numCollected so we can page forward via the iterator. We hit
			// the SDK directly (not the shared cache) because the task is per-card.
			// (Data products skip paging — they always collect all merged rows.)
			if (isTablePaged && !dp) {
				const n = tablePageRows; // one page (already capped at MAX_DB_PAGE)
				const pixel = `Database(database=["${src.databaseId}"]) | Query("${escapeSqlForPixel(q)}") | Collect(${n});`;
				const { pixelReturn } =
					await actions.run<
						[{ output: any; operationType?: string[] }]
					>(pixel);
				const pr = pixelReturn[0];
				if (
					Array.isArray(pr.operationType) &&
					pr.operationType.includes("ERROR")
				) {
					throw new Error(String(pr.output ?? "Query failed."));
				}
				// SEMOSS Collect output carries `data`, `numCollected`, and `taskId` as
				// TOP-LEVEL fields of pixelReturn[0].output (not separate pixel steps).
				const out = pr.output as any;
				const headers = out?.data?.headers ?? out?.headers ?? [];
				const values = out?.data?.values ?? out?.values ?? [];
				const { taskId } = readTaskMeta(
					out,
					pixelReturn as any[],
					values.length,
				);
				tableTaskId.current = taskId;
				setRawData(toRows(headers, values));
				// END SIGNAL: a page returning FEWER rows than requested is the last page.
				// (We use rows-returned-this-page, NOT `numCollected`, which is cumulative
				// across the task and so would never look "short".) No total cap → a full
				// page means there's more to load.
				const fullPage = values.length >= n;
				setDbHasMore(!!tableTaskId.current && fullPage);
				return;
			}

			// EVERYTHING ELSE: collect all rows (-1) of the exact query via the shared
			// cache (charts sharing a query fetch once). A too-large result will throw.
			const version = `${runKey}:${refreshNonce.current}`;
			let headers: any, values: any, raw: any;
			if (sharedRun) {
				const r = await sharedRun(
					src.databaseId,
					q,
					batchSize,
					version,
					runSource,
				);
				headers = r.headers;
				values = r.values;
				raw = r.raw;
			} else {
				const pixel = buildQueryPixel(
					{
						databaseId: src.databaseId,
						query: q,
						sources: runSource?.sources,
						joins: runSource?.joins,
					},
					{ collect: batchSize },
				);
				const { pixelReturn } =
					await actions.run<
						[{ output: any; operationType?: string[] }]
					>(pixel);
				const { output, error } = lastPixelOutput(pixelReturn);
				if (error) throw new Error(error);
				raw = output;
				values = raw?.data?.values ?? raw?.values ?? raw?.data ?? null;
				headers = raw?.data?.headers ?? raw?.headers ?? null;
			}
			if (
				values &&
				headers &&
				Array.isArray(values) &&
				Array.isArray(headers)
			) {
				setRawData(toRows(headers, values));
			} else if (Array.isArray(raw) && raw.length > 0) {
				setRawData(raw);
			} else {
				setError("Unexpected data format returned from query.");
			}
		} catch (err: any) {
			// Surface the real database/pixel message so users can fix the SQL.
			const msg = String(err?.message ?? err ?? "").trim();
			setError(msg || "Failed to load data. Please check your query.");
		} finally {
			setLoading(false);
		}
	};

	/** Tables only: fetch the next page from the open task iterator and append. */
	const loadMore = async () => {
		if (!tableTaskId.current || loadingMore) return;
		const n = tablePageRows; // one page (capped at MAX_DB_PAGE); no total limit
		setLoadingMore(true);
		try {
			const pixel = `Task(${tableTaskId.current}) | Collect(${n});`;
			const { pixelReturn } =
				await actions.run<[{ output: any; operationType?: string[] }]>(
					pixel,
				);
			const pr = pixelReturn[0];
			if (
				Array.isArray(pr.operationType) &&
				pr.operationType.includes("ERROR")
			) {
				throw new Error(
					String(pr.output ?? "Failed to load more rows."),
				);
			}
			const out = pr.output as any;
			const headers = out?.data?.headers ?? out?.headers ?? [];
			const values = out?.data?.values ?? out?.values ?? [];
			const { taskId } = readTaskMeta(
				out,
				pixelReturn as any[],
				values.length,
			);
			// Keep the (possibly refreshed) task id for the next page.
			if (taskId) tableTaskId.current = taskId;
			keepPageRef.current = true; // this data change is an append — don't reset the page
			setRawData((prev) => [...prev, ...toRows(headers, values)]);
			// END SIGNAL: fewer rows than requested this page → the task is exhausted.
			// No total cap — a full page means there's still more to load.
			setDbHasMore(values.length >= n);
		} catch (err: any) {
			setError(
				String(err?.message ?? err ?? "").trim() ||
					"Failed to load more rows.",
			);
		} finally {
			setLoadingMore(false);
		}
	};

	// Axis derivation
	const { xKey, yKeys } = useMemo(() => {
		if (!data.length) return { xKey: "", yKeys: [] as string[] };
		const cols = Object.keys(data[0]);
		const cfg = visualization.config;
		const vt = visualization.visualizationType;

		// For all visualization types, ONLY use explicitly configured keys - no auto-derivation
		// Exception: Table can show all columns by default
		if (vt !== "table") {
			// KPI: only yKeys
			if (vt === "kpi") {
				if (cfg?.yKeys?.length) {
					return {
						xKey: "",
						yKeys: cfg.yKeys.filter((k) => cols.includes(k)),
					};
				}
				return { xKey: "", yKeys: [] };
			}

			// All other charts: need explicit xKey and yKeys
			const x = cfg?.xKey && cols.includes(cfg.xKey) ? cfg.xKey : "";
			const y = cfg?.yKeys?.length
				? cfg.yKeys.filter((k) => cols.includes(k))
				: [];
			return { xKey: x, yKeys: y };
		}

		// Table: use config if available, otherwise allow all columns (for backward compat)
		if (cfg?.xKey && cols.includes(cfg.xKey)) {
			const x = cfg.xKey;
			const y = (
				cfg.yKeys?.length
					? cfg.yKeys.filter((k) => cols.includes(k))
					: cols.filter((k) => k !== x)
			).slice(0, 8);
			return { xKey: x, yKeys: y };
		}
		// Fallback for table: show all columns
		return { xKey: cols[0] ?? "", yKeys: cols.slice(1, 9) };
	}, [data, visualization.config, visualization.visualizationType]);

	// More rows available from the open table task (server-side pagination).
	const hasMoreInDb = dbHasMore;

	// Pivot transform (multi-dimensional crosstab with totals)
	const pivotResult = usePivotTransform(
		visualization.visualizationType === "pivot" ? data : [],
		visualization.config,
	);

	// Generic aggregation helper (for all chart types)
	const aggregateValue = (values: any[], aggType: string): number => {
		if (aggType === "count") {
			return values.length;
		}
		if (aggType === "countUnique") {
			return new Set(values).size;
		}

		// For numeric aggregations, filter to valid numbers
		const numVals = values.map((v) => Number(v)).filter((v) => !isNaN(v));
		if (!numVals.length) return 0;

		switch (aggType) {
			case "avg":
				return numVals.reduce((a, b) => a + b, 0) / numVals.length;
			case "sum":
				return numVals.reduce((a, b) => a + b, 0);
			case "max":
				return Math.max(...numVals);
			case "min":
				return Math.min(...numVals);
			case "median": {
				const sorted = [...numVals].sort((a, b) => a - b);
				const mid = Math.floor(sorted.length / 2);
				return sorted.length % 2 === 0
					? (sorted[mid - 1] + sorted[mid]) / 2
					: sorted[mid];
			}
			case "last":
				return numVals[numVals.length - 1];
			default:
				return numVals.reduce((a, b) => a + b, 0); // sum
		}
	};

	// Group and aggregate data by xKey for charts (uses facetData so facet filter applies)
	const chartData = useMemo(() => {
		const vt = visualization.visualizationType;
		// Only apply grouping/aggregation for chart types (not table/kpi)
		if (
			!facetData.length ||
			vt === "table" ||
			vt === "kpi" ||
			vt === "pivot"
		)
			return facetData;
		if (!xKey || !yKeys.length) return facetData;

		const cfg = visualization.config ?? {};
		const tooltipCols: Array<{ column: string; aggregation: string }> = cfg
			.tooltips?.length
			? cfg.tooltips
			: cfg.tooltip
				? [
						{
							column: cfg.tooltip,
							aggregation:
								cfg.tooltipAggregation ||
								cfg.columnAggregations?.[cfg.tooltip] ||
								"count",
						},
					]
				: [];
		const grouped = new Map<string, any>();

		facetData.forEach((row) => {
			const key = String(row[xKey] ?? "");
			if (!grouped.has(key)) {
				grouped.set(key, {
					[xKey]: key,
					_values: {} as Record<string, any[]>,
				});
			}
			const g = grouped.get(key)!;
			yKeys.forEach((k) => {
				if (!g._values[k]) g._values[k] = [];
				g._values[k].push(row[k]);
			});
			tooltipCols.forEach(({ column }) => {
				if (!g._values[column]) g._values[column] = [];
				g._values[column].push(row[column]);
			});
		});

		return Array.from(grouped.values()).map((g) => {
			const result: any = { [xKey]: g[xKey] };
			yKeys.forEach((k) => {
				const values = g._values[k] || [];
				const aggType = cfg.columnAggregations?.[k] || "sum";
				result[k] = aggregateValue(values, aggType);
			});
			tooltipCols.forEach(({ column, aggregation }) => {
				const vals = g._values[column];
				if (vals)
					result[`_tooltip_${column}`] = aggregateValue(
						vals,
						aggregation,
					);
			});
			return result;
		});
	}, [
		facetData,
		xKey,
		yKeys,
		visualization.visualizationType,
		visualization.config,
	]);

	const renderContent = () => {
		// HTML block renders directly from config — no data loading needed
		if (visualization.visualizationType === "htmlblock") {
			return <HtmlBlockVisualization config={visualization.config} />;
		}

		// When a param sheet exists, ALL waiting charts point there — no inline form,
		// no master pointer. The param sheet is the single source of truth.
		if (waiting && hasParamSheet)
			return (
				<div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
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
			);

		if (loading)
			return (
				<div className="flex h-full flex-col items-center justify-center py-8">
					<Loader2 className="mb-3 h-7 w-7 animate-spin text-blue-500" />
					<p className="text-slate-400 text-sm">Loading data…</p>
				</div>
			);
		if (error)
			return (
				<div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4">
					<AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
					<div>
						<p className="font-semibold text-red-800 text-sm">
							Error loading data
						</p>
						<p className="mt-0.5 font-mono text-red-600 text-xs">
							{error}
						</p>
					</div>
				</div>
			);
		// Button / control widgets render even with empty data.
		if (visualization.visualizationType === "csvexport") {
			return (
				<CsvExportButton
					rows={facetData}
					title={visualization.title || "export"}
					label={visualization.config?.csvExportLabel}
					config={visualization.config}
					phi={visualization.phi}
				/>
			);
		}
		if (visualization.visualizationType === "filter") {
			return (
				<FilterWidget
					vizId={visualization.id}
					title={visualization.title}
					column={visualization.config?.filterColumn ?? ""}
					targets={visualization.config?.filterTargets ?? []}
					rows={data}
					defaultValues={visualization.config?.filterDefaultValues}
					onDefaultValuesChange={
						onFilterDefaultValuesChange
							? (vals) =>
									onFilterDefaultValuesChange(
										visualization.id,
										vals,
									)
							: undefined
					}
				/>
			);
		}
		if (!facetData.length)
			return (
				<div className="flex h-full items-center justify-center py-8">
					<p className="text-slate-400 text-sm">No data returned</p>
				</div>
			);
		return renderChart();
	};

	// Render title if configured (skip for KPI - it uses per-card titles)
	const renderTitle = () => {
		const titleConfig = visualization.config?.styling?.title;
		const vt = visualization.visualizationType;

		// Skip title rendering for KPI - titles are per-card
		if (vt === "kpi") return null;

		if (!titleConfig?.text) return null;

		// Map font weight values to CSS
		const fontWeightMap: Record<string, number> = {
			normal: 400,
			medium: 500,
			semibold: 600,
			bold: 700,
		};

		return (
			<div
				style={{
					fontSize: `${titleConfig?.fontSize ?? 18}px`,
					color: titleConfig?.color ?? "#0f172a",
					textAlign: titleConfig?.textAlign || "left",
					fontWeight:
						fontWeightMap[titleConfig?.fontWeight || "bold"] || 700,
					fontFamily: titleConfig?.fontFamily || "inherit",
				}}
				className="px-1 pt-1 pb-2"
			>
				{titleConfig.text}
			</div>
		);
	};

	const chartHeight = fillContainer ? "100%" : 360;

	const renderChart = () => {
		const { visualizationType: vt } = visualization;

		// Guard: scatter/bubble/cluster/heatmap render one SVG node per RAW row. With a
		// very large result (charts collect all rows) that explodes the DOM and crashes
		// the renderer. Refuse to plot and ask the user to aggregate. Aggregating charts
		// (bar/line/pie/…) collapse rows first, so they're exempt.
		const RAW_POINT_TYPES = ["scatter", "bubble", "cluster", "heatmap"];
		if (RAW_POINT_TYPES.includes(vt) && facetData.length > 20_000) {
			return (
				<div className="flex h-full w-full items-center justify-center p-6 text-center">
					<div className="max-w-sm text-slate-500 text-sm">
						<p className="font-medium text-slate-700">
							Too many points to chart
						</p>
						<p className="mt-1">
							This returned {data.length.toLocaleString()} rows.
							Add a GROUP BY / aggregation to your query (or use a
							Table) to plot it.
						</p>
					</div>
				</div>
			);
		}

		// World Map
		// ── Polar Bar ────────────────────────────────────────────────────────
		if (vt === "polarbar") {
			return (
				<PolarBarChart data={facetData} config={visualization.config} />
			);
		}

		// ── World Map ─────────────────────────────────────────────────────────
		// Self-contained component handles its own no-data guard, aggregation,
		// tooltip, and legend. Reused by the portal preview / view.
		if (vt === "heatmap") {
			return (
				<HeatmapChart data={facetData} config={visualization.config} />
			);
		}
		// ── Half Donut ────────────────────────────────────────────────────────────
		if (vt === "halfdonut") {
			return (
				<HalfDonutChart
					data={facetData}
					config={visualization.config}
				/>
			);
		}

		if (vt === "cluster") {
			return (
				<ClusterChart data={facetData} config={visualization.config} />
			);
		}

		if (vt === "multiline") {
			return (
				<MultiLineChart
					data={facetData}
					config={visualization.config}
				/>
			);
		}

		if (vt === "worldmap") {
			return (
				<WorldMapChart data={facetData} config={visualization.config} />
			);
		}

		// Word Cloud
		// Self-contained d3-cloud renderer with its own aggregation, color, and
		// tooltip handling. Reused by the portal preview / view.
		if (vt === "wordcloud") {
			return <WordCloud data={facetData} config={visualization.config} />;
		}

		// Bubble chart
		// Self-contained SVG renderer; reuses palette + ColorRule logic from
		// WorldMap / WordCloud. Drop zones: Bubbles (xKey) / Size (yKeys[0]) / Tooltip.
		if (vt === "bubble") {
			return (
				<BubbleChart data={facetData} config={visualization.config} />
			);
		}

		if (vt === "sunburst") {
			return (
				<SunburstChart data={facetData} config={visualization.config} />
			);
		}

		if (vt === "puck") {
			return <PuckChart data={facetData} config={visualization.config} />;
		}

		// KPI
		// ── Box Plot ──────────────────────────────────────────────────────────
		if (vt === "boxplot") {
			return (
				<BoxPlotChart data={facetData} config={visualization.config} />
			);
		}

		// ── KPI ───────────────────────────────────────────────────────────────
		if (vt === "kpi") {
			return <KPI data={facetData} config={visualization.config} />;
		}

		// Bar
		if (vt === "bar") {
			return <Bar_Chart data={facetData} config={visualization.config} />;
		}

		// Stacked bar
		if (vt === "stackbar") {
			if (!xKey || !yKeys.length || !visualization.config?.facetKey) {
				return (
					<div className="flex h-full items-center justify-center">
						<div className="px-6 text-center text-slate-400">
							<BarChart2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
							<p className="font-medium text-sm">
								No data configured
							</p>
							<p className="mt-1 text-xs">
								Drag columns to X-Axis, Y-Axis, and Category
								drop zones
							</p>
						</div>
					</div>
				);
			}
			return (
				<Bar_Chart
					data={facetData}
					config={visualization.config}
					stacked
				/>
			);
		}

		// Line
		if (vt === "line") {
			return (
				<Line_Chart data={facetData} config={visualization.config} />
			);
		}

		// Area
		if (vt === "area") {
			if (!xKey || !yKeys.length) {
				return (
					<div className="flex h-full items-center justify-center">
						<div className="px-6 text-center text-slate-400">
							<AreaChartIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
							<p className="font-medium text-sm">
								No data configured
							</p>
							<p className="mt-1 text-xs">
								Drag columns to X-Axis and Y-Axis drop zones
							</p>
						</div>
					</div>
				);
			}
			return (
				<ResponsiveContainer width="100%" height={chartHeight}>
					<AreaChart
						data={chartData}
						margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
					>
						<defs>
							{yKeys.map((_, i) => (
								<linearGradient
									key={i}
									id={`grad-${i}`}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor={
											CHART_COLORS[
												i % CHART_COLORS.length
											]
										}
										stopOpacity={0.15}
									/>
									<stop
										offset="95%"
										stopColor={
											CHART_COLORS[
												i % CHART_COLORS.length
											]
										}
										stopOpacity={0}
									/>
								</linearGradient>
							))}
						</defs>
						<CartesianGrid {...GRID_STYLE} vertical={false} />
						<XAxis
							dataKey={xKey}
							tick={AXIS_STYLE}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							tick={AXIS_STYLE}
							axisLine={false}
							tickLine={false}
							width={48}
						/>
						<Tooltip
							content={
								<ChartTooltip config={visualization.config} />
							}
						/>
						{yKeys.length > 1 && (
							<Legend
								wrapperStyle={{
									fontSize: 11,
									color: "#64748b",
									paddingTop: 8,
								}}
							/>
						)}
						{yKeys.map((k, i) => (
							<Area
								key={k}
								type="monotone"
								dataKey={k}
								isAnimationActive={false}
								stroke={CHART_COLORS[i % CHART_COLORS.length]}
								strokeWidth={2}
								fill={`url(#grad-${i})`}
								dot={false}
								activeDot={{ r: 5, strokeWidth: 0 }}
							/>
						))}
					</AreaChart>
				</ResponsiveContainer>
			);
		}

		// Scatter
		if (vt === "scatter") {
			if (!xKey || !yKeys.length) {
				return (
					<div className="flex h-full items-center justify-center">
						<div className="px-6 text-center text-slate-400">
							<ScatterChartIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
							<p className="font-medium text-sm">
								No data configured
							</p>
							<p className="mt-1 text-xs">
								Drag columns to X-Axis and Y-Axis drop zones
							</p>
						</div>
					</div>
				);
			}

			const cfg = visualization.config ?? {};
			const labelKey = cfg.label || "";
			const sizeKey = cfg.size || "";
			const colorKey = cfg.color || "";
			const scatterTooltipCols: Array<{
				column: string;
				aggregation: string;
			}> = cfg.tooltips?.length
				? cfg.tooltips
				: cfg.tooltip
					? [
							{
								column: cfg.tooltip,
								aggregation:
									cfg.tooltipAggregation ||
									cfg.columnAggregations?.[cfg.tooltip] ||
									"count",
							},
						]
					: [];

			// For scatter, we need to group by label and aggregate the numeric columns
			let scatterData: any[] = [];

			if (labelKey && facetData.length > 0) {
				const grouped = new Map<string, any>();

				facetData.forEach((row) => {
					const labelValue = String(row[labelKey] ?? "");
					if (!grouped.has(labelValue)) {
						const _scatterTooltipValues: Record<string, any[]> = {};
						for (const { column } of scatterTooltipCols)
							_scatterTooltipValues[column] = [];
						grouped.set(labelValue, {
							label: labelValue,
							_xValues: [] as any[],
							_yValues: [] as any[],
							_sizeValues: [] as any[],
							_scatterTooltipValues,
							colorCategory: colorKey ? row[colorKey] : undefined,
						});
					}
					const g = grouped.get(labelValue)!;
					g._xValues.push(row[xKey]);
					g._yValues.push(row[yKeys[0]]);
					if (sizeKey) g._sizeValues.push(row[sizeKey]);
					for (const { column } of scatterTooltipCols)
						g._scatterTooltipValues[column].push(row[column]);
				});

				scatterData = Array.from(grouped.values()).map((g) => {
					const point: any = { label: g.label };

					const xAgg = cfg.columnAggregations?.[xKey] || "avg";
					point[xKey] = aggregateValue(g._xValues, xAgg);

					const yAgg = cfg.columnAggregations?.[yKeys[0]] || "avg";
					point[yKeys[0]] = aggregateValue(g._yValues, yAgg);

					if (sizeKey && g._sizeValues.length > 0) {
						const sizeAgg =
							cfg.columnAggregations?.[sizeKey] || "avg";
						point[sizeKey] = aggregateValue(g._sizeValues, sizeAgg);
						point.sizeValue = point[sizeKey];
					}

					for (const { column, aggregation } of scatterTooltipCols) {
						const vals = g._scatterTooltipValues[column] ?? [];
						if (vals.length)
							point[`_tooltip_${column}`] = aggregateValue(
								vals,
								aggregation,
							);
					}

					if (colorKey) point.colorCategory = g.colorCategory;

					return point;
				});
			} else {
				// No label specified, use chartData as-is
				scatterData = chartData.map((row) => {
					const point: any = {
						[xKey]: row[xKey],
						[yKeys[0]]: row[yKeys[0]],
					};

					if (sizeKey && row[sizeKey] != null) {
						point[sizeKey] = Number(row[sizeKey]);
						point.sizeValue = point[sizeKey];
					}

					if (colorKey && row[colorKey]) {
						point.colorCategory = row[colorKey];
					}

					return point;
				});
			}

			// Group by color category if color is specified
			const colorCategories = colorKey
				? Array.from(
						new Set(
							scatterData
								.map((d) => d.colorCategory)
								.filter(Boolean),
						),
					)
				: [];

			// Normalize sizes if size column is specified
			if (sizeKey) {
				const sizes = scatterData
					.map((d) => d[sizeKey])
					.filter((s) => s != null);
				if (sizes.length > 0) {
					const minSize = Math.min(...sizes);
					const maxSize = Math.max(...sizes);
					const range = maxSize - minSize || 1;
					scatterData.forEach((d) => {
						if (d[sizeKey] != null) {
							d.size = 3 + ((d[sizeKey] - minSize) / range) * 12; // Scale to 3-15 range
						} else {
							d.size = 5; // Default size
						}
					});
				} else {
					scatterData.forEach((d) => (d.size = 5));
				}
			} else {
				scatterData.forEach((d) => (d.size = 5));
			}

			return (
				<ResponsiveContainer width="100%" height={chartHeight}>
					<ScatterChart
						margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
					>
						<CartesianGrid {...GRID_STYLE} />
						<XAxis
							type="number"
							dataKey={xKey}
							tick={AXIS_STYLE}
							axisLine={false}
							tickLine={false}
							name={xKey}
							label={
								cfg.xLabel
									? {
											value: cfg.xLabel,
											position: "insideBottom",
											offset: -4,
											fontSize: 11,
											fill: "#64748b",
										}
									: undefined
							}
						/>
						<YAxis
							type="number"
							dataKey={yKeys[0]}
							tick={AXIS_STYLE}
							axisLine={false}
							tickLine={false}
							width={48}
							name={yKeys[0]}
							label={
								cfg.yLabel
									? {
											value: cfg.yLabel,
											angle: -90,
											position: "insideLeft",
											fontSize: 11,
											fill: "#64748b",
										}
									: undefined
							}
						/>
						<Tooltip
							cursor={{ strokeDasharray: "3 3" }}
							content={({ payload }) => {
								if (!payload?.length) return null;
								const data = payload[0].payload;
								const xAgg =
									cfg.columnAggregations?.[xKey] || "avg";
								const yAgg =
									cfg.columnAggregations?.[yKeys[0]] || "avg";
								const sizeAgg = sizeKey
									? cfg.columnAggregations?.[sizeKey] || "avg"
									: "";
								const activeTtCols = scatterTooltipCols.filter(
									({ column }) =>
										data[`_tooltip_${column}`] !==
										undefined,
								);
								return (
									<div className="rounded border border-slate-200 bg-white p-2 text-xs shadow-lg">
										{labelKey && data.label && (
											<div className="mb-1 font-semibold">
												{data.label}
											</div>
										)}
										<div>{`${xKey} (${xAgg}): ${Number(data[xKey]).toFixed(2)}`}</div>
										<div>{`${yKeys[0]} (${yAgg}): ${Number(data[yKeys[0]]).toFixed(2)}`}</div>
										{sizeKey && data[sizeKey] != null && (
											<div>{`${sizeKey} (${sizeAgg}): ${Number(data[sizeKey]).toFixed(2)}`}</div>
										)}
										{colorKey && data.colorCategory && (
											<div>{`${colorKey}: ${data.colorCategory}`}</div>
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
														>{`${column} (${aggregation}): ${
															typeof data[
																`_tooltip_${column}`
															] === "number"
																? data[
																		`_tooltip_${column}`
																	].toFixed(2)
																: data[
																		`_tooltip_${column}`
																	]
														}`}</div>
													),
												)}
											</div>
										)}
									</div>
								);
							}}
						/>
						{colorCategories.length > 0 ? (
							// Render separate scatter series for each color category
							colorCategories.map((category, idx) => (
								<Scatter
									key={category}
									name={String(category)}
									isAnimationActive={false}
									data={scatterData.filter(
										(d) => d.colorCategory === category,
									)}
									fill={
										CHART_COLORS[idx % CHART_COLORS.length]
									}
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
													CHART_COLORS[
														idx %
															CHART_COLORS.length
													]
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
							// Single scatter series without color grouping
							<Scatter
								data={scatterData}
								isAnimationActive={false}
								fill={CHART_COLORS[0]}
								fillOpacity={0.75}
								shape={(props: any) => {
									const { cx, cy, payload } = props;
									const r = payload.size || 5;
									return (
										<circle
											cx={cx}
											cy={cy}
											r={r}
											fill={CHART_COLORS[0]}
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
								wrapperStyle={{
									fontSize: 11,
									color: "#64748b",
									paddingTop: 8,
								}}
							/>
						)}
					</ScatterChart>
				</ResponsiveContainer>
			);
		}

		// Radar
		if (vt === "radar") {
			if (!xKey || !yKeys.length) {
				return (
					<div className="flex h-full items-center justify-center">
						<div className="px-6 text-center text-slate-400">
							<RadarIcon className="mx-auto mb-3 h-12 w-12 opacity-30" />
							<p className="font-medium text-sm">
								No data configured
							</p>
							<p className="mt-1 text-xs">
								Drag columns to X-Axis and Y-Axis drop zones
							</p>
						</div>
					</div>
				);
			}
			return (
				<ResponsiveContainer width="100%" height={chartHeight}>
					<RadarChart data={chartData}>
						<PolarGrid stroke="#f1f5f9" />
						<PolarAngleAxis dataKey={xKey} tick={AXIS_STYLE} />
						<PolarRadiusAxis
							tick={{ fontSize: 10, fill: "#94a3b8" }}
							axisLine={false}
						/>
						{yKeys.map((k, i) => (
							<Radar
								key={k}
								name={k}
								dataKey={k}
								isAnimationActive={false}
								stroke={CHART_COLORS[i % CHART_COLORS.length]}
								fill={CHART_COLORS[i % CHART_COLORS.length]}
								fillOpacity={0.25}
							/>
						))}
						{yKeys.length > 1 && (
							<Legend
								wrapperStyle={{
									fontSize: 11,
									color: "#64748b",
								}}
							/>
						)}
						<Tooltip
							content={
								<ChartTooltip config={visualization.config} />
							}
						/>
					</RadarChart>
				</ResponsiveContainer>
			);
		}

		// Treemap
		if (vt === "treemap") {
			if (!xKey || !yKeys.length) {
				return (
					<div className="flex h-full items-center justify-center">
						<div className="px-6 text-center text-slate-400">
							<TreeDeciduous className="mx-auto mb-3 h-12 w-12 opacity-30" />
							<p className="font-medium text-sm">
								No data configured
							</p>
							<p className="mt-1 text-xs">
								Drag columns to Category and Value drop zones
							</p>
						</div>
					</div>
				);
			}
			const tmData = chartData
				.map((r) => {
					const d: Record<string, any> = {
						name: String(r[xKey] ?? ""),
						size: Math.max(0, Number(r[yKeys[0]]) || 0),
					};
					for (const k of Object.keys(r)) {
						if (k.startsWith("_tooltip_")) d[k] = r[k];
					}
					return d;
				})
				.filter((d) => d.size > 0)
				.sort((a, b) => b.size - a.size);
			return (
				<ResponsiveContainer width="100%" height={chartHeight}>
					<Treemap
						data={tmData}
						dataKey="size"
						isAnimationActive={false}
						stroke="#fff"
						content={({
							x,
							y,
							width,
							height,
							name,
							value,
							index,
						}: any) => (
							<g>
								<rect
									x={x}
									y={y}
									width={width}
									height={height}
									fill={
										CHART_COLORS[
											(index ?? 0) % CHART_COLORS.length
										]
									}
									rx={3}
								/>
								{width > 40 && height > 24 && (
									<>
										<text
											x={x + 6}
											y={y + 15}
											fill="#fff"
											fontSize={11}
											fontWeight={600}
											style={{ pointerEvents: "none" }}
										>
											{String(name).length > 14
												? String(name).slice(0, 12) +
													"…"
												: name}
										</text>
										{height > 34 && (
											<text
												x={x + 6}
												y={y + 28}
												fill="rgba(255,255,255,.75)"
												fontSize={10}
												style={{
													pointerEvents: "none",
												}}
											>
												{Number(value).toLocaleString()}
											</text>
										)}
									</>
								)}
							</g>
						)}
					>
						<Tooltip
							content={
								<ChartTooltip config={visualization.config} />
							}
						/>
					</Treemap>
				</ResponsiveContainer>
			);
		}

		// Pie
		if (vt === "pie") {
			return <Pie_Chart data={data} config={visualization.config} />;
		}

		//Pivot table (multi-dimensional crosstab)
		if (vt === "pivot") {
			return (
				<PivotTable
					pivot={pivotResult}
					styling={visualization.config?.styling}
				/>
			);
		}

		// Table (default)
		return (
			<TableView
				data={facetData}
				config={visualization.config}
				pageSize={pageSize}
				onPageSizeChange={setPageSize}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
				hasMoreRows={hasMoreInDb}
				onLoadMore={() => void loadMore()}
				loadingMore={loadingMore}
				showEmptyColumnsGuard
				footerExtra={
					hasMoreInDb ? (
						<button
							onClick={() => void loadMore()}
							disabled={loadingMore}
							title="Fetch the next page of rows from the database"
							className="ml-1 whitespace-nowrap font-medium text-blue-600 text-xs hover:text-blue-700 hover:underline disabled:opacity-50"
						>
							{loadingMore ? "Loading…" : "Load more ↓"}
						</button>
					) : null
				}
			/>
		);
	};

	// CSV export indicator
	const isExportable = ["table", "pivot", "kpi"].includes(
		visualization.visualizationType,
	);
	const exportData = useMemo(() => {
		if (visualization.visualizationType === "table") {
			// Mirror the rendered table: export aggregated/grouped rows when configured.
			const cols = visualization.config?.tableColumns?.length
				? visualization.config.tableColumns
				: data[0]
					? Object.keys(data[0])
					: [];
			return (
				aggregateTableRows(
					data as Record<string, any>[],
					cols,
					visualization.config?.columnAggregations ?? {},
				) ?? data
			);
		}
		if (visualization.visualizationType !== "pivot") return data;
		// Flatten the pivot result into rows for CSV
		const rowFields = pivotResult.rowFields;
		const out: any[] = [];
		const flatten = (row: (typeof pivotResult.rows)[number]) => {
			const flat: Record<string, any> = {};
			rowFields.forEach(
				(f, idx) => (flat[f] = row.rowHeaders[idx] ?? ""),
			);
			pivotResult.columns.forEach((col) => {
				const header = col.columnHeaders.length
					? `${col.columnHeaders.join(" / ")} - ${col.valueField}`
					: col.valueField;
				flat[header] = row.cells[col.key];
			});
			if (pivotResult.hasGrandTotalColumn) {
				pivotResult.valueFields.forEach((vf) => {
					flat[`Total ${vf}`] = row.rowTotals[vf];
				});
			}
			return flat;
		};
		pivotResult.rows.forEach((r) => out.push(flatten(r)));
		if (pivotResult.grandTotalRow)
			out.push(flatten(pivotResult.grandTotalRow));
		return out;
	}, [
		data,
		visualization.visualizationType,
		visualization.config,
		pivotResult,
	]);

	return (
		<div
			className={
				fillContainer
					? "group relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
					: "group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
			}
		>
			{/* Action controls float in the top-right as a hover overlay instead of
                occupying their own header row — the layout tab already shows the title,
                so no full-width header bar is needed. Reveals on panel hover. */}
			<div className="absolute top-1 right-1 z-20 flex items-center gap-0.5 rounded-lg bg-white/85 px-0.5 py-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100">
				{headerActions}
				{isExportable &&
					data.length > 0 &&
					((visualization.visualizationType === "table" &&
						(visualization.config?.styling?.table?.showExport ??
							true)) ||
						(visualization.visualizationType === "kpi" &&
							(visualization.config?.styling?.kpi?.showExport ??
								true)) ||
						(visualization.visualizationType !== "table" &&
							visualization.visualizationType !== "kpi")) && (
						<button
							onClick={() =>
								visualization.phi
									? setShowPhiModal(true)
									: downloadCsv(
											exportData,
											`${visualization.title || "export"}.csv`,
										)
							}
							title="Export to CSV"
							className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
						>
							<Download className="h-3.5 w-3.5" />
						</button>
					)}
				{showPhiModal && (
					<PhiExportWarningModal
						onConfirm={() => {
							downloadCsv(
								exportData,
								`${visualization.title || "export"}.csv`,
							);
							setShowPhiModal(false);
						}}
						onCancel={() => setShowPhiModal(false)}
					/>
				)}
				<button
					onClick={() => void loadData(0, true)}
					title="Refresh"
					className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
				>
					<RefreshCw className="h-3.5 w-3.5" />
				</button>
			</div>

			{/* Content — fills the panel edge-to-edge with only a slim uniform pad so
                nothing clips against the border. When the author has pinned a Size &
                Position, the content is boxed to that size and aligned within the panel;
                otherwise it fills. The flexlayout panel itself is untouched. */}
			{(() => {
				const size = visualization.config?.styling?.size;
				const sized = hasContentSize(size);
				const styles = sized ? contentSizeStyles(size) : null;
				// "Stretch to fill" distorts the chart to fill its box. Excluded types
				// (table/pivot/kpi/button/filter/html) manage their own fill and would
				// look wrong under a visual scale, so they skip the transform.
				const NO_STRETCH = [
					"table",
					"pivot",
					"kpi",
					"csvexport",
					"filter",
					"htmlblock",
				];
				const stretch =
					!!size?.stretch &&
					!NO_STRETCH.includes(visualization.visualizationType);
				const content = stretch ? (
					<StretchFill>{renderContent()}</StretchFill>
				) : (
					renderContent()
				);
				return (
					<div
						className={
							fillContainer
								? "flex min-h-0 flex-1 flex-col overflow-hidden p-1.5"
								: "p-1.5"
						}
					>
						{renderTitle()}
						{sized ? (
							<div
								className={
									fillContainer ? "min-h-0 flex-1" : ""
								}
								style={styles!.outer}
							>
								<div style={styles!.inner}>{content}</div>
							</div>
						) : (
							<div
								className={
									fillContainer
										? "min-h-0 flex-1 overflow-hidden"
										: ""
								}
							>
								{content}
							</div>
						)}
						{/* Facet navigation bar */}
						{facetColumn && facetValues.length > 0 && (
							<FacetNavBar
								column={facetColumn}
								values={facetValues}
								index={facetIndex}
								onIndexChange={setFacetIndex}
							/>
						)}
					</div>
				);
			})()}
		</div>
	);
}
