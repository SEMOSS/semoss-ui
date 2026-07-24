import { Layout, type Model, type TabNode } from "flexlayout-react";
import { SlidersHorizontal } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	PolarAngleAxis,
	PolarGrid,
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
import { formatSqlList, isParamSatisfied } from "@/components/ParamControl";
import { ParamSheet } from "@/components/ParamSheet";
import { PhiExportWarningModal } from "@/components/PhiExportWarningModal";
import { Bar_Chart } from "@/components/visualizations/Bar_Chart";
import { BoxPlotChart } from "@/components/visualizations/BoxPlotChart";
import { BubbleChart } from "@/components/visualizations/BubbleChart";
import { ClusterChart } from "@/components/visualizations/ClusterChart";
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
import {
	aggregateChartData,
	ChartTooltip,
} from "@/components/visualizations/shared/chartShared";
import { TableView } from "@/components/visualizations/TableView";
import { WordCloud } from "@/components/visualizations/WordCloud";
import { WorldMapChart } from "@/components/visualizations/WorldMapChart";
import { CsvExportButton } from "@/components/widgets/CsvExportButton";
import { FilterWidget } from "@/components/widgets/FilterWidget";
import { pivotTransform, usePivotTransform } from "@/hooks/usePivotTransform";
import {
	type AppliedFilter,
	DashboardFilterProvider,
	useAppliedFilters,
	useFilterStore,
} from "@/lib/dashboardFilters";
import { isDataProduct } from "@/lib/queryPixel";
import {
	computeParamGroups,
	ensureParamSheet,
	migrateSheetsToSharedQueries,
	type QuerySource,
	resolveQuery,
} from "@/lib/resolveQuery";
import { useTabColors } from "@/lib/tabColors";
import { aggregateTableRows } from "@/lib/tableAggregate";
import { filterRowMatrix } from "@/lib/vizFilter";
import { contentSizeStyles, hasContentSize } from "@/lib/vizSize";
import { buildFlexModel } from "@/utils/dashboardLayout";
import { runDatabaseQuery } from "../api";
import { usePortalStore } from "../store";
import type {
	DashboardQuery,
	JoinSpec,
	QueryResult,
	QuerySourceLeg,
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

/** Convert a QueryResult into an array of row objects keyed by header name. */
function toChartData(result: QueryResult): Record<string, unknown>[] {
	return result.values.map((row) => {
		const obj: Record<string, unknown> = {};
		result.headers.forEach((h, i) => {
			obj[h] = row[i];
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
	const escape = (v: unknown) => {
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
			headers.map((h) => escape(r[h])).join(","),
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
				headers.map((h) => escape(r[h])).join(","),
			);
		} else {
			dataRows = result.values.map((row) => {
				const obj: Record<string, unknown> = {};
				result.headers.forEach((h, i) => {
					obj[h] = row[i];
				});
				return headers.map((h) => escape(obj[h])).join(",");
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
): string {
	return query.replace(/\{\{(\w+)\}\}/g, (_, name) => {
		const val = values[name] ?? "";
		const param = params.find((p) => p.name === name);
		// Empty multiselect = "all options" → substitute every known option so
		// IN ({{param}}) matches all rows instead of generating invalid IN ().
		if (param?.inputType === "multiselect" && !val.trim()) {
			const allOpts = [
				...(loadedOptions[param.id] ?? []),
				...(param.options ?? []),
			];
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
	// SQL-sourced dropdown options, keyed by parameter id.
	const [paramOptions, setParamOptions] = useState<Record<string, string[]>>(
		{},
	);

	// External parameter values that drive the dashboard when it's rendered as an
	// MCP tool: SEMOSS/playground either passes them as URL query params or via a
	// postMessage (SMSS_INIT_TOOL) when it iframes this portal. Keyed by param name.
	const [externalParams, setExternalParams] = useState<
		Record<string, string>
	>(() => {
		const out: Record<string, string> = {};
		try {
			new URLSearchParams(window.location.search).forEach((v, k) => {
				if (k) out[k] = v;
			});
		} catch {
			/* no search params */
		}
		// Params buffered by the early capture in main.tsx (posted on iframe load,
		// possibly before this component mounted).
		const buf = window.__SMSS_TOOL_PARAMS__;
		if (buf && typeof buf === "object")
			for (const [k, v] of Object.entries(buf))
				if (v != null) out[k] = String(v);
		return out;
	});
	// Re-read the early-capture buffer on mount: the SMSS_INIT_TOOL message may have
	// landed after this component's initial render but before its own listener below
	// was attached (bundle is large → effects run late).
	useEffect(() => {
		const buf = window.__SMSS_TOOL_PARAMS__;
		if (buf && Object.keys(buf).length)
			setExternalParams((prev) => ({ ...prev, ...buf }));
	}, []);
	useEffect(() => {
		const onMsg = (e: MessageEvent) => {
			const d = e.data as {
				type?: string;
				tool?: { parameters?: unknown };
				payload?: { parameters?: unknown };
				parameters?: unknown;
			} | null;
			if (!d || d.type !== "SMSS_INIT_TOOL") return;
			const raw = (d.tool?.parameters ??
				d.payload?.parameters ??
				d.parameters) as Record<string, unknown> | undefined;
			if (!raw || typeof raw !== "object") return;
			const norm: Record<string, string> = {};
			for (const [k, v] of Object.entries(raw))
				if (v != null) norm[k] = String(v);
			if (Object.keys(norm).length)
				setExternalParams((prev) => ({ ...prev, ...norm }));
		};
		window.addEventListener("message", onMsg);
		return () => window.removeEventListener("message", onMsg);
	}, []);

	// Shared query cache: charts built from the SAME query fetch it once. `force`
	// bypasses the cache for a manual re-run.
	const queryCache = useRef<Map<string, Promise<QueryResult>>>(new Map());
	const cachedQuery = (
		db: string,
		query: string,
		force = false,
		source?: { sources?: QuerySourceLeg[]; joins?: JoinSpec[] },
	): Promise<QueryResult> => {
		const sig = source?.sources?.length
			? source.sources
					.map((s) => `${s.databaseId}:${s.query}`)
					.join("|") + JSON.stringify(source.joins ?? [])
			: `${db}::${query}`;
		const key = sig;
		if (!force) {
			const hit = queryCache.current.get(key);
			if (hit) return hit;
		}
		const p = runDatabaseQuery(db, query, -1, source);
		queryCache.current.set(key, p);
		p.catch(() => queryCache.current.delete(key));
		return p;
	};

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
				// External (tool/URL) values take precedence over the param's default.
				paramValues[p.name] =
					externalParams[p.name] ?? p.defaultValue ?? "";
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

		// Auto-run queries. Parameter-less queries run once (unless the bound query is
		// set to loadAfterParams — then it waits for the Parameters sheet's Run).
		// Parameterized queries auto-run as soon as every REQUIRED param has a value —
		// from the param's default or from external tool/URL params — so the dashboard
		// shows data on load and re-runs with supplied values when opened as an MCP tool.
		const ranAuto = new Set<string>();
		allVizs.forEach((viz) => {
			const key = qKeyOf(viz);
			if (ranAuto.has(key)) return;
			const src = resolveQuery(viz, queries);
			if (!isDataProduct(src) && !(src.databaseId && src.query)) return;
			// Upstream: a query flagged loadAfterParams waits for the Parameters sheet's Run.
			const boundQ = queries.find((q) => q.id === viz.queryId);
			if (boundQ?.loadAfterParams) return;
			const params = src.parameters ?? [];
			const values = initial[key]?.paramValues ?? {};
			if (params.length) {
				const unmet = params.some(
					(p) => p.required && !(values[p.name] ?? "").trim(),
				);
				if (unmet) return;
				// Nothing to substitute (no values at all) → wait for the user / Parameters sheet.
				if (!Object.values(values).some((v) => (v ?? "").trim()))
					return;
			}
			ranAuto.add(key);
			const q = params.length
				? substituteParams(src.query, values)
				: src.query;
			const dpSrc = isDataProduct(src)
				? {
						sources: (src.sources ?? []).map((l) => ({
							...l,
							query: params.length
								? substituteParams(l.query, values)
								: l.query,
						})),
						joins: src.joins,
					}
				: undefined;
			setQueryStates((prev) => ({
				...prev,
				[key]: { ...prev[key], running: true, error: null },
			}));
			cachedQuery(src.databaseId, q, false, dpSrc)
				.then((r) =>
					setQueryStates((prev) => ({
						...prev,
						[key]: { ...prev[key], result: r, running: false },
					})),
				)
				.catch((e: unknown) =>
					setQueryStates((prev) => ({
						...prev,
						[key]: {
							...prev[key],
							error: String((e as Error)?.message ?? e),
							running: false,
						},
					})),
				);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config, externalParams]);

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

	const runQuery = async (src: QuerySource, key: string) => {
		const state = queryStates[key];
		if (!state) return;
		setQueryStates((prev) => ({
			...prev,
			[key]: { ...prev[key], running: true, error: null },
		}));
		try {
			const q = substituteParams(
				src.query,
				state.paramValues,
				src.parameters,
				paramOptions,
			);
			const dpSrc = isDataProduct(src)
				? {
						sources: (src.sources ?? []).map((l) => ({
							...l,
							query: substituteParams(
								l.query,
								state.paramValues,
								src.parameters,
								paramOptions,
							),
						})),
						joins: src.joins,
					}
				: undefined;
			const r = await cachedQuery(src.databaseId, q, true, dpSrc);
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
				const qKey = qKeyOf(viz);
				if (seen.has(qKey)) continue;
				const src = resolveQuery(viz, queries);
				const boundQ = queries.find((q) => q.id === viz.queryId);
				const hasQParams = (src.parameters ?? []).length > 0;
				if (hasQParams || (boundQ?.loadAfterParams ?? false)) {
					seen.add(qKey);
					keys.add(qKey);
					void runQuery(src, qKey);
				}
			}
		}
		runAllQueryKeysRef.current = keys;
		if (keys.size > 0) setRunAllInProgress(true);
	};

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
			const boundQuery = queries.find((q) => q.id === viz.queryId);
			const isLoadAfter = boundQuery?.loadAfterParams ?? false;
			// All parameterized / loadAfter queries are driven by the Parameters sheet;
			// non-parameterized charts auto-run on load and can be manually refreshed.
			const waitingMsg =
				hasParams || isLoadAfter
					? "Go to the Parameters tab and click Run All to load this chart."
					: "Click Refresh to load data";
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
						{/* The Filter widget holds no data of its own — it derives options from
                        its targets' loaded rows, so it renders without needing a result. */}
						{viz.visualizationType === "filter" ? (
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
									<div className="flex h-full items-center justify-center text-gray-500 text-sm">
										Loading...
									</div>
								)}
								{!state.running && state.result && (
									<VizContent
										viz={viz}
										result={state.result}
									/>
								)}
								{!state.running &&
									!state.result &&
									!state.error && (
										<div className="flex h-full items-center justify-center px-6 text-center text-gray-400 text-sm">
											{waitingMsg}
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

				{/* Sheet tabs — only when multiple sheets */}
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

/** Filter a QueryResult's rows by applied cross-frame filters (multi-value IN, by column name). */
function filterResult(
	result: QueryResult,
	filters: AppliedFilter[],
): QueryResult {
	if (!filters.length) return result;
	const idx: Record<string, number> = {};
	result.headers.forEach((h, i) => (idx[h] = i));
	const sets = filters.map((f) => ({
		i: idx[f.column],
		set: new Set(f.values.map(String)),
	}));
	const values = result.values.filter((row) =>
		sets.every((f) => {
			if (f.i == null) return true; // column not in this frame → leave untouched
			const cell = row[f.i];
			return cell != null && f.set.has(String(cell));
		}),
	);
	return { ...result, values };
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

function ChartOrTable({
	result,
	vizType,
	config,
}: {
	result: QueryResult;
	vizType: string;
	config?: VizConfig;
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
		return (
			<div className="h-full w-full">
				<ResponsiveContainer width="100%" height="100%">
					<RadarChart data={data}>
						<PolarGrid />
						<PolarAngleAxis dataKey={chartX} />
						{chartY.map((k, i) => (
							<Radar
								key={k}
								dataKey={k}
								isAnimationActive={false}
								stroke={COLORS[i % COLORS.length]}
								fill={COLORS[i % COLORS.length]}
								fillOpacity={0.25}
							/>
						))}
						<Tooltip />
						<Legend />
					</RadarChart>
				</ResponsiveContainer>
			</div>
		);
	}

	if (vizType === "treemap") {
		const aggregated = aggregateChartData(
			data,
			chartX,
			[chartY[0]],
			config as any,
		);
		const tm = aggregated.map((r) => {
			const d: Record<string, any> = {
				name: String(r[chartX]),
				size: Number(r[chartY[0]]) || 1,
			};
			for (const k of Object.keys(r)) {
				if (k.startsWith("_tooltip_")) d[k] = r[k];
			}
			return d;
		});
		return (
			<div className="h-full w-full">
				<ResponsiveContainer width="100%" height="100%">
					<Treemap
						data={tm}
						dataKey="size"
						nameKey="name"
						isAnimationActive={false}
						content={({
							x,
							y,
							width,
							height: h,
							name,
							index,
						}: any) => (
							<g>
								<rect
									x={x}
									y={y}
									width={width}
									height={h}
									style={{
										fill: COLORS[
											(index ?? 0) % COLORS.length
										],
										stroke: "#fff",
										strokeWidth: 2,
									}}
								/>
								{width > 40 && h > 20 && (
									<text
										x={x + width / 2}
										y={y + h / 2}
										textAnchor="middle"
										dominantBaseline="middle"
										fill="#fff"
										fontSize={11}
										fontWeight={600}
									>
										{name}
									</text>
								)}
							</g>
						)}
					>
						<Tooltip
							content={<ChartTooltip config={config as any} />}
						/>
					</Treemap>
				</ResponsiveContainer>
			</div>
		);
	}

	if (vizType === "scatter") {
		return (
			<div className="h-full w-full">
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart>
						<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
						<XAxis
							dataKey={chartX}
							name={chartX}
							tick={{ fontSize: 11 }}
							label={{
								value: (config as any)?.xLabel,
								position: "insideBottom",
								offset: -4,
								fontSize: 11,
							}}
						/>
						<YAxis
							dataKey={chartY[0]}
							name={chartY[0]}
							tick={{ fontSize: 11 }}
							label={{
								value: (config as any)?.yLabel,
								angle: -90,
								position: "insideLeft",
								fontSize: 11,
							}}
						/>
						<Tooltip cursor={{ strokeDasharray: "3 3" }} />
						<Scatter
							data={data}
							fill={COLORS[0]}
							isAnimationActive={false}
						/>
					</ScatterChart>
				</ResponsiveContainer>
			</div>
		);
	}

	if (vizType === "heatmap") {
		return (
			<div className="h-[340px]">
				<HeatmapChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "halfdonut") {
		return (
			<div className="h-[280px]">
				<HalfDonutChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "boxplot") {
		return (
			<div className="h-[380px]">
				<BoxPlotChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "polarbar") {
		return (
			<div className="h-[380px]">
				<PolarBarChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "cluster") {
		return (
			<div className="h-[380px]">
				<ClusterChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "multiline") {
		return (
			<div className="h-[380px]">
				<MultiLineChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "worldmap") {
		return (
			<div className="h-full w-full">
				<WorldMapChart data={data} config={config as any} />
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
				<WordCloud data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "bubble") {
		// Self-contained SVG renderer; uses its own layout + popover, no recharts wrapper.
		return (
			<div className="h-full w-full">
				<BubbleChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "sunburst") {
		return (
			<div className="h-[380px]">
				<SunburstChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "puck") {
		return (
			<div className="h-full w-full">
				<PuckChart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "pie") {
		return (
			<div className="h-full w-full">
				<Pie_Chart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "line") {
		return (
			<div className="h-full w-full">
				<Line_Chart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "bar") {
		return (
			<div className="h-full w-full">
				<Bar_Chart data={data} config={config as any} />
			</div>
		);
	}

	if (vizType === "stackbar") {
		return (
			<div className="h-full w-full">
				<Bar_Chart data={data} config={config as any} stacked />
			</div>
		);
	}

	const [xKey, ...valueKeys] = result.headers;

	return (
		<ResponsiveContainer width="100%" height="100%">
			{vizType === "area" ? (
				<AreaChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
					<YAxis tick={{ fontSize: 12 }} />
					<Tooltip />
					<Legend />
					{valueKeys.map((k, i) => (
						<Area
							key={k}
							type="monotone"
							dataKey={k}
							isAnimationActive={false}
							stroke={COLORS[i % COLORS.length]}
							fill={COLORS[i % COLORS.length]}
							fillOpacity={0.2}
						/>
					))}
				</AreaChart>
			) : (
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
			)}
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
