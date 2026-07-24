import Editor from "@monaco-editor/react";
import {
	AlertCircle,
	BarChart3,
	Check,
	ChevronDown,
	CopyPlus,
	Crown,
	Database as DatabaseIcon,
	GitMerge,
	Loader2,
	Paintbrush,
	PanelRight,
	Pencil,
	Play,
	Plus,
	ShieldAlert,
	SlidersHorizontal,
	Table,
	Table2,
	Trash2,
	Wrench,
	X,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
/**
 * VizEditor — the live single-canvas visualization editor shared by the main app
 * and the portal EditMode.
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ Toolbar:  [Title] [Type]                  rows · [Run] [+Layout]│
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ QUERY  [Data source ▾]                  [Parameters] [Expand]   │
 *   │ ┌───────────────────────────────────────────────────────────┐ │
 *   │ │  SQL editor — full width, the focus, drag the divider to    │ │
 *   │ │  give it even more room                                      │ │
 *   │ └───────────────────────────────────────────────────────────┘ │
 *   ├═══════════════════════ drag to resize ════════════════════════┤
 *   │  LIVE PREVIEW (hero)                          │  CONFIG         │
 *   └───────────────────────────────────────────────┴────────────────┘
 *
 * It is purely presentational: the parent computes the drop-zone data, columns,
 * preview node, and run state, and supplies handlers. HTML Block swaps the whole
 * body for the dedicated HtmlBlockEditor (which has its own editor + preview).
 */
import { CsvExportConfigPanel } from "@/components/editor/CsvExportConfigPanel";
import {
	DataProductModal,
	type DPJoin,
	type DPLeg,
} from "@/components/editor/DataProductModal";
import { QueryBuilderModal } from "@/components/editor/QueryBuilderModal";
import { VizTypeSelect } from "@/components/editor/VizTypeSelect";
import { HtmlBlockEditor } from "@/components/HtmlBlockEditor";
import { QueryParameters } from "@/components/QueryParameters";
import { ColorPicker } from "@/components/tools/shared/ColorPicker";
import {
	Button,
	Checkbox,
	cx,
	Input,
	SearchableSelect,
	Select,
} from "@/components/ui";
import {
	type Column,
	type DropZoneDataWithTable,
	VizConfigTabs,
} from "@/components/VizConfigTabs";
import { placeholderNames } from "@/lib/paramInference";
import { isDataProduct } from "@/lib/queryPixel";

const SQL_EDITOR_OPTIONS = {
	minimap: { enabled: false },
	fontSize: 13,
	lineNumbers: "on" as const,
	scrollBeyondLastLine: false,
	wordWrap: "on" as const,
	automaticLayout: true,
	tabSize: 2,
	padding: { top: 10, bottom: 10 },
	renderLineHighlight: "line" as const,
	overviewRulerLanes: 0,
	scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
};

/** Minimal shape of a visualization the editor reads/writes (app + portal compatible). */
export interface VizLike {
	title: string;
	visualizationType: string;
	databaseId: string;
	databaseName?: string;
	query: string;
	parameters: Array<{
		id: string;
		name: string;
		label: string;
		defaultValue: string;
	}>;
	config?: any;
	/** When true, the visualization's tab header is flagged as PHI/PII (red). */
	phi?: boolean;
	/** Hex color for this visualization's FlexLayout tab background. */
	tabColor?: string;
	/** Cross-source data-product legs (≥2 ⇒ this query is a multi-frame join). */
	sources?: DataProductLeg[];
	/** Joins that merge the {@link sources} legs. */
	joins?: DataProductJoin[];
}

/** Minimal data-product types (structurally match src/types/dashboard.ts). */
export interface DataProductLeg {
	id: string;
	alias: string;
	databaseId: string;
	databaseName: string;
	query: string;
}
export interface DataProductJoin {
	id: string;
	leftAlias: string;
	leftColumn: string;
	rightAlias: string;
	rightColumn: string;
	type: "inner" | "left" | "right";
}

export interface VizEditorProps {
	viz: VizLike;
	onUpdate: (patch: Partial<VizLike>) => void;
	typeOptions: { value: string; label: string }[];
	databases: { id: string; label: string }[];
	columns: Column[];
	dropZoneData: DropZoneDataWithTable;
	onDropZoneChange: (d: DropZoneDataWithTable) => void;
	onRunQuery: () => void;
	running: boolean;
	/** Run every query across all visualizations (Parameters-aware). Shows a toolbar button when set. */
	onRunAllQueries?: () => void;
	/** True while onRunAllQueries is executing. */
	runningAllQueries?: boolean;
	/** Row count from the last successful run, or null if not yet run. */
	rowCount: number | null;
	queryError?: string | null;
	hasData: boolean;
	/** Renders the live chart for the center pane (parent owns the preview component). */
	renderPreview: () => ReactNode;
	/** Raw query result rows (objects keyed by column) — drives the Data grid view (1:1 with the query). */
	previewRows?: Array<Record<string, unknown>>;
	inLayout: boolean;
	onAddToLayout: () => void;
	/** Runs a pixel — used by the HTML Block AI generator + the table browser. */
	runPixel: (pixel: string) => Promise<any>;
	/** Other visualizations in this dashboard (across ALL sheets) — the Filter widget targets these. */
	siblings?: {
		id: string;
		title: string;
		visualizationType: string;
		sheetName?: string;
		columns?: string[];
		queryName?: string;
	}[];
	/**
	 * Shared query registry for the data-source picker. When provided (with the
	 * handlers below), the toolbar shows a "Query" selector so a viz can reuse an
	 * existing query or start a new one. Omit to keep legacy embedded-only editing.
	 */
	queries?: {
		id: string;
		name: string;
		paramCount: number;
		usageCount: number;
	}[];
	/** Id of the shared query this viz is currently bound to (if any). */
	boundQueryId?: string;
	/** Bind this viz to an existing shared query. */
	onSelectQuery?: (queryId: string) => void;
	/** Create a fresh empty query and bind this viz to it. */
	onNewQuery?: () => void;
	/** Rename the bound shared query (independent of the visualization title). */
	onRenameQuery?: (name: string) => void;
	/** Delete an unused shared query (only offered for queries no chart uses). */
	onDeleteQuery?: (queryId: string) => void;
	/** Whether this viz is the "master" of its (shared, parameterized) query. */
	isQueryMaster?: boolean;
	/** Make this viz the master that owns the parameter form for its shared query. */
	onSetAsMaster?: () => void;
	/** When true, a Parameters sheet centralises param inputs — Crown and gear overlay suppressed. */
	hasParamSheet?: boolean;
	/** Whether the bound query is set to load after the param sheet's Run (non-param queries only). */
	loadAfterParams?: boolean;
	/** Toggle `loadAfterParams` on the bound query. */
	onToggleLoadAfterParams?: () => void;
	/** Show the PHI/PII shield toggle in the header. Default true; the app hides it (the navigator owns it). */
	showPhiToggle?: boolean;
	/** Reuse this viz's query as a new chart in an existing/new sheet (renders a Reuse button by the query picker). */
	reuse?: {
		canReuse: boolean;
		sheets: { id: string; name: string; color?: string }[];
		activeSheetId: string;
		onReuse: (target: string | "new") => void;
	};
}

interface BrowserTable {
	table: string;
	columns: { column: string; type: string }[];
}

// Chart types that don't take a free X/Y axis label (radial, tabular, single-value, etc.)
const NO_AXIS_LABELS = new Set([
	"table",
	"pivot",
	"pie",
	"treemap",
	"kpi",
	"worldmap",
	"heatmap",
	"halfdonut",
	"boxplot",
	"polarbar",
	"cluster",
	"htmlblock",
	"multiline",
	"wordcloud",
	"bubble",
	"puck",
	"bar",
	"stackbar",
	"line",
	"sunburst",
	"csvexport",
	"filter",
]);

/**
 * When switching between table ↔ csvexport, carry the column list and
 * aggregations across instead of losing them. Aggregation values are
 * remapped where the two viz types use different semantics:
 *   table uses 'group'/'none' for raw columns; csvexport uses '' (empty).
 *   table-only fns (countUnique, avgUnique, stddev, median) collapse to ''.
 */
function migrateConfigOnTypeChange(
	fromType: string,
	toType: string,
	config: Record<string, any> | undefined,
): Record<string, any> | undefined {
	if (!config) return config;

	if (fromType === "table" && toType === "csvexport") {
		const cols: string[] | undefined = config.tableColumns;
		if (!cols?.length) return config;
		const SUPPORTED = new Set(["sum", "count", "avg", "min", "max"]);
		const tableAggs: Record<string, string> =
			config.columnAggregations ?? {};
		const exportAggs: Record<string, string> = {};
		for (const col of cols) {
			if (SUPPORTED.has(tableAggs[col])) exportAggs[col] = tableAggs[col];
		}
		return {
			...config,
			exportColumns: cols,
			exportAggregations:
				Object.keys(exportAggs).length > 0 ? exportAggs : undefined,
		};
	}

	if (fromType === "csvexport" && toType === "table") {
		const cols: string[] | undefined = config.exportColumns;
		if (!cols?.length) return config;
		const csvAggs: Record<string, string> = config.exportAggregations ?? {};
		const tableAggs: Record<string, string> = {};
		for (const col of cols) {
			// '' (Raw) maps to 'none'; all other values (avg, sum, etc.) pass through unchanged.
			tableAggs[col] = csvAggs[col] || "none";
		}
		return {
			...config,
			tableColumns: cols,
			columnAggregations: tableAggs,
		};
	}

	return config;
}

/** Color picker for the FlexLayout tab background. Opens a portal popover with the shared ColorPicker. */
function TabColorPicker({
	value,
	onChange,
	disabled,
}: {
	value?: string;
	onChange: (v: string | undefined) => void;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const btnRef = useRef<HTMLButtonElement>(null);

	const handleOpen = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (disabled) return;
		if (btnRef.current) {
			const r = btnRef.current.getBoundingClientRect();
			setPos({ top: r.bottom + 4, left: r.left });
		}
		setOpen((v) => !v);
	};

	useEffect(() => {
		if (!open) return;
		const close = () => setOpen(false);
		window.addEventListener("scroll", close, true);
		window.addEventListener("resize", close);
		return () => {
			window.removeEventListener("scroll", close, true);
			window.removeEventListener("resize", close);
		};
	}, [open]);

	return (
		<>
			<button
				ref={btnRef}
				type="button"
				onClick={handleOpen}
				disabled={disabled}
				title={
					disabled
						? "Tab color overridden by PHI/PII flag"
						: "Tab color"
				}
				className={cx(
					"inline-flex items-center gap-1 rounded-md border px-2 py-1.5 font-semibold text-[11px] transition-colors",
					disabled
						? "cursor-not-allowed border-transparent text-stone-400 opacity-40"
						: value
							? "border-transparent text-stone-700 hover:bg-stone-100"
							: "border-transparent text-stone-400 hover:bg-stone-100 hover:text-stone-600",
				)}
			>
				<span
					className="h-3 w-3 flex-shrink-0 rounded-full border border-stone-300"
					style={{ backgroundColor: value || "transparent" }}
				/>
				<Paintbrush className="h-3.5 w-3.5" />
			</button>
			{open &&
				pos &&
				createPortal(
					<>
						<div
							className="fixed inset-0 z-[998]"
							onClick={() => setOpen(false)}
						/>
						<div
							className="fixed z-[999] rounded-xl border border-stone-200 bg-white p-3 shadow-lg"
							style={{
								top: pos.top,
								left: pos.left,
								minWidth: "200px",
							}}
							onClick={(e) => e.stopPropagation()}
						>
							<ColorPicker
								label="Tab Color"
								value={value ?? "#ffffff"}
								onChange={(hex) => onChange(hex)}
								defaultColor="#ffffff"
							/>
							{value && (
								<button
									type="button"
									onClick={() => {
										onChange(undefined);
										setOpen(false);
									}}
									className="mt-2 w-full rounded py-1 text-[11px] text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
								>
									Clear color
								</button>
							)}
						</div>
					</>,
					document.body,
				)}
		</>
	);
}

export function VizEditor(props: VizEditorProps) {
	const {
		viz,
		onUpdate,
		typeOptions,
		databases,
		columns,
		dropZoneData,
		onDropZoneChange,
		onRunAllQueries,
		runningAllQueries = false,
		onRunQuery,
		running,
		rowCount,
		queryError,
		hasData,
		renderPreview,
		previewRows,
		inLayout,
		onAddToLayout,
		runPixel,
		siblings = [],
		queries,
		boundQueryId,
		onSelectQuery,
		onNewQuery,
		onRenameQuery,
		onDeleteQuery,
		isQueryMaster,
		onSetAsMaster,
		hasParamSheet = false,
		loadAfterParams = false,
		onToggleLoadAfterParams,
		showPhiToggle = true,
		reuse,
	} = props;

	const [reuseOpen, setReuseOpen] = useState(false);

	const showQueryPicker = !!queries && !!onSelectQuery && !!onNewQuery;
	const boundQueryMeta = queries?.find((q) => q.id === boundQueryId);
	// The master toggle is only meaningful when a parameterized query is shared by
	// more than one chart — and suppressed when the param sheet centralises inputs.
	const showMasterToggle =
		!hasParamSheet &&
		showQueryPicker &&
		!!onSetAsMaster &&
		!!boundQueryMeta &&
		boundQueryMeta.paramCount > 0 &&
		boundQueryMeta.usageCount > 1;

	// Show the load-after-params toggle when a param sheet exists and this query has no params.
	const showLoadAfterToggle =
		hasParamSheet &&
		showQueryPicker &&
		!!boundQueryId &&
		(boundQueryMeta?.paramCount ?? 0) === 0 &&
		!!onToggleLoadAfterParams;

	const isHtml = viz.visualizationType === "htmlblock";
	const canRun = !!viz.databaseId && !!viz.query.trim();
	const patchConfig = (patch: Record<string, unknown>) =>
		onUpdate({ config: { ...viz.config, ...patch } });

	const [paramsOpen, setParamsOpen] = useState(false);
	const [queryBuilderOpen, setQueryBuilderOpen] = useState(false);
	const [dataProductOpen, setDataProductOpen] = useState(false);
	const isDP = isDataProduct(viz);
	const [tablesOpen, setTablesOpen] = useState(false);
	const [resultView, setResultView] = useState<"chart" | "data">("chart");

	// ── Table browser: list tables + columns for the selected database ──────────
	const [tables, setTables] = useState<BrowserTable[]>([]);
	const [tablesLoading, setTablesLoading] = useState(false);
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});
	const tablesCacheRef = useRef<Record<string, BrowserTable[]>>({});
	const runPixelRef = useRef(runPixel);
	runPixelRef.current = runPixel;

	useEffect(() => {
		if (!tablesOpen || !viz.databaseId) return;
		const dbId = viz.databaseId;
		if (tablesCacheRef.current[dbId]) {
			setTables(tablesCacheRef.current[dbId]);
			return;
		}
		let cancelled = false;
		setTablesLoading(true);
		// Use the database METAMODEL (curated concepts), not the full physical schema —
		// tables/columns that aren't modeled (no metamodel) are intentionally hidden.
		runPixelRef
			.current(
				`GetDatabaseMetamodel(database=["${dbId}"], options=["physicalTypes","dataTypes"]);`,
			)
			.then((out: any) => {
				const nodes: any[] = Array.isArray(out?.nodes) ? out.nodes : [];
				const physTypes: Record<string, string> =
					out?.physicalTypes ?? {};
				const dataTypes: Record<string, string> = out?.dataTypes ?? {};
				// Column ids may be "Concept__Property"; show just the property.
				const colName = (p: string) =>
					p.includes("__") ? p.split("__").slice(1).join("__") : p;
				const result: BrowserTable[] = nodes
					.map((n) => ({
						table: String(n?.conceptualName ?? ""),
						columns: (Array.isArray(n?.propSet) ? n.propSet : [])
							.map((p: string) => ({
								column: colName(String(p)),
								type: String(
									physTypes[p] ?? dataTypes[p] ?? "",
								),
							}))
							.filter((c: { column: string }) => c.column),
					}))
					.filter((t) => t.table);
				tablesCacheRef.current[dbId] = result;
				if (!cancelled) setTables(result);
			})
			.catch(() => {
				if (!cancelled) setTables([]);
			})
			.finally(() => {
				if (!cancelled) setTablesLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [tablesOpen, viz.databaseId]);

	const insertAtEnd = (text: string) => {
		const q = viz.query;
		onUpdate({
			query:
				q && !q.endsWith(" ") && !q.endsWith("\n")
					? `${q} ${text}`
					: `${q}${text}`,
		});
	};

	// Resizable split between the query zone (top) and the result zone (bottom).
	const bodyRef = useRef<HTMLDivElement>(null);
	const [queryPct, setQueryPct] = useState(40);
	const draggingRef = useRef(false);
	const onSplitDown = (e: React.PointerEvent) => {
		draggingRef.current = true;
		(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
	};
	const onSplitMove = (e: React.PointerEvent) => {
		if (!draggingRef.current || !bodyRef.current) return;
		const rect = bodyRef.current.getBoundingClientRect();
		const pct = ((e.clientY - rect.top) / rect.height) * 100;
		setQueryPct(Math.min(82, Math.max(15, pct)));
	};
	const onSplitUp = (e: React.PointerEvent) => {
		draggingRef.current = false;
		try {
			(e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
		} catch {
			/* noop */
		}
	};

	// Data / Tools config lives in a slide-in panel (drawer) opened from the query row,
	// so the preview stays full-width and uncluttered until you choose to shape the chart.
	const [configOpen, setConfigOpen] = useState(false);

	// Running the query surfaces the results and opens the Configure panel so the
	// user can immediately shape the chart from the columns that just came back.
	const handleRun = () => {
		onRunQuery();
		setResultView("chart");
		setConfigOpen(true);
	};

	// Keep ⌘↵ "run" wired to the latest handler without re-registering on every keystroke.
	const runRef = useRef(handleRun);
	runRef.current = handleRun;
	const canRunRef = useRef(canRun);
	canRunRef.current = canRun;
	const registerRun = (editor: any, monaco: any) => {
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			if (canRunRef.current) runRef.current();
		});
	};

	const sqlEditor = (
		<Editor
			language="sql"
			theme="vs-light"
			value={viz.query}
			onChange={(v) => onUpdate({ query: v ?? "" })}
			onMount={registerRun}
			options={SQL_EDITOR_OPTIONS}
		/>
	);

	// Data / Tools config — rendered inside the push-in drawer. Fixed inner width so
	// its contents don't reflow while the drawer's width animates open/closed.
	const configPanel = (
		<div className="flex h-full w-full flex-col lg:w-[500px]">
			<div className="flex h-9 flex-shrink-0 items-center justify-between border-stone-200 border-b bg-stone-100/70 px-3">
				<span className="font-semibold text-[11px] text-stone-500 uppercase tracking-widest">
					Configure
				</span>
				<button
					type="button"
					onClick={() => setConfigOpen(false)}
					title="Close"
					className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			</div>
			<div className="min-h-0 flex-1 overflow-auto">
				{viz.visualizationType === "filter" ? (
					<FilterConfigPanel
						viz={viz}
						columns={columns}
						siblings={siblings}
						onUpdate={onUpdate}
					/>
				) : viz.visualizationType === "csvexport" ? (
					<CsvExportConfigPanel
						viz={viz}
						columns={columns}
						onUpdate={onUpdate}
					/>
				) : (
					<VizConfigTabs
						columns={columns}
						visualizationType={viz.visualizationType as any}
						value={dropZoneData}
						onChange={onDropZoneChange}
						rows={previewRows}
					/>
				)}
			</div>

			{/* Axis labels + KPI format — compact, contextual */}
			{!NO_AXIS_LABELS.has(viz.visualizationType) && (
				<div className="flex-shrink-0 space-y-2 border-stone-200 border-t px-3 py-2.5">
					<SubLabel>Axis Labels</SubLabel>
					<div className="grid grid-cols-2 gap-2">
						<Input
							placeholder="X label"
							value={viz.config?.xLabel ?? ""}
							onChange={(e) =>
								patchConfig({
									xLabel: e.target.value || undefined,
								})
							}
							className="py-1.5 text-xs"
						/>
						<Input
							placeholder="Y label"
							value={viz.config?.yLabel ?? ""}
							onChange={(e) =>
								patchConfig({
									yLabel: e.target.value || undefined,
								})
							}
							className="py-1.5 text-xs"
						/>
					</div>
				</div>
			)}
			{viz.visualizationType === "kpi" && (
				<div className="flex-shrink-0 space-y-2 border-stone-200 border-t px-3 py-2.5">
					<SubLabel>KPI Format</SubLabel>
					<div className="grid grid-cols-3 gap-2">
						<Select
							value={viz.config?.kpiFormat ?? "auto"}
							onChange={(e) =>
								patchConfig({ kpiFormat: e.target.value })
							}
							className="py-1.5 text-xs"
						>
							{["auto", "number", "currency", "percent"].map(
								(f) => (
									<option key={f} value={f}>
										{f}
									</option>
								),
							)}
						</Select>
						<Input
							placeholder="Prefix"
							value={viz.config?.kpiPrefix ?? ""}
							onChange={(e) =>
								patchConfig({
									kpiPrefix: e.target.value || undefined,
								})
							}
							className="py-1.5 text-xs"
						/>
						<Input
							placeholder="Suffix"
							value={viz.config?.kpiSuffix ?? ""}
							onChange={(e) =>
								patchConfig({
									kpiSuffix: e.target.value || undefined,
								})
							}
							className="py-1.5 text-xs"
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<label className="flex flex-col gap-1">
							<span className="font-medium text-[10px] text-stone-500">
								Notation
							</span>
							<Select
								value={viz.config?.kpiNotation ?? "standard"}
								onChange={(e) =>
									patchConfig({
										kpiNotation: e.target.value as
											| "standard"
											| "compact",
									})
								}
								className="py-1.5 text-xs"
							>
								<option value="standard">Full number</option>
								<option value="compact">Metric (100K)</option>
							</Select>
						</label>
						<label className="flex flex-col gap-1">
							<span className="font-medium text-[10px] text-stone-500">
								Decimal places
							</span>
							<Select
								value={String(
									viz.config?.kpiDecimals ?? "auto",
								)}
								onChange={(e) =>
									patchConfig({
										kpiDecimals:
											e.target.value === "auto"
												? "auto"
												: Number(e.target.value),
									})
								}
								className="py-1.5 text-xs"
							>
								<option value="auto">Auto</option>
								{[0, 1, 2, 3, 4].map((d) => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</Select>
						</label>
						<label className="flex flex-col gap-1">
							<span className="font-medium text-[10px] text-stone-500">
								Thousands
							</span>
							<Select
								value={viz.config?.kpiThousandsSep ?? ","}
								onChange={(e) =>
									patchConfig({
										kpiThousandsSep: e.target.value as
											| ","
											| "."
											| " "
											| "none",
									})
								}
								className="py-1.5 text-xs"
							>
								<option value=",">Comma (1,000)</option>
								<option value=".">Period (1.000)</option>
								<option value=" ">Space (1 000)</option>
								<option value="none">None (1000)</option>
							</Select>
						</label>
						<label className="flex flex-col gap-1">
							<span className="font-medium text-[10px] text-stone-500">
								Decimal mark
							</span>
							<Select
								value={viz.config?.kpiDecimalSep ?? "."}
								onChange={(e) =>
									patchConfig({
										kpiDecimalSep: e.target.value as
											| "."
											| ",",
									})
								}
								className="py-1.5 text-xs"
							>
								<option value=".">Period (1.5)</option>
								<option value=",">Comma (1,5)</option>
							</Select>
						</label>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<>
			<div className="relative flex h-full min-h-0 bg-white">
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					{/* ── Row A: identity + output ── */}
					<div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-stone-200 border-b bg-stone-100/70 px-3 py-1.5 sm:h-11 sm:flex-nowrap sm:py-0">
						{/* Visualization title + PHI/PII shield toggle */}
						<input
							type="text"
							value={viz.title}
							onChange={(e) =>
								onUpdate({ title: e.target.value })
							}
							placeholder="Untitled visualization"
							aria-label="Visualization title"
							className="min-w-0 max-w-xs flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold text-[14px] text-stone-800 placeholder:font-normal placeholder:text-stone-400 hover:border-stone-300 hover:bg-white focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
						{showPhiToggle && (
							<button
								type="button"
								onClick={() =>
									onUpdate({ phi: !viz.phi || undefined })
								}
								title={
									viz.phi
										? "PHI/PII flagged — click to remove"
										: "Flag as PHI/PII"
								}
								aria-label="Toggle PHI/PII flag"
								className={cx(
									"inline-flex flex-shrink-0 items-center justify-center rounded-md border p-1.5 transition-colors",
									viz.phi
										? "border-red-300 bg-red-50 text-red-600"
										: "border-transparent text-stone-400 hover:bg-white hover:text-stone-600",
								)}
							>
								<ShieldAlert className="h-4 w-4" />
							</button>
						)}

						{/* Tab background color picker (disabled while flagged PHI/PII) */}
						<TabColorPicker
							value={viz.tabColor}
							onChange={(v) => onUpdate({ tabColor: v })}
							disabled={!!viz.phi}
						/>

						<div className="flex-1" />

						{/* Run every query across all visualizations */}
						{onRunAllQueries && (
							<button
								type="button"
								onClick={onRunAllQueries}
								disabled={runningAllQueries}
								title="Run every query across all visualizations (uses the Parameters form values)"
								className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 font-semibold text-[11px] text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{runningAllQueries ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Play className="h-3.5 w-3.5" />
								)}
								Run All Queries
							</button>
						)}

						{/* Chart type */}
						<div className="inline-flex items-center gap-1.5">
							<span className="hidden font-medium text-[11px] text-stone-400 xl:inline">
								Display as
							</span>
							<VizTypeSelect
								value={viz.visualizationType}
								allowedTypes={typeOptions.map((t) => t.value)}
								onChange={(v) => {
									const migratedConfig =
										migrateConfigOnTypeChange(
											viz.visualizationType,
											v,
											viz.config,
										);
									onUpdate({
										visualizationType: v,
										...(migratedConfig !== viz.config
											? { config: migratedConfig }
											: {}),
									});
								}}
							/>
						</div>
					</div>

					{/* ── Row B: query controls (source · reuse · configure · run) ── */}
					{!isHtml && (
						<div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-stone-100 border-b bg-white px-3 pt-3 pb-2">
							{showQueryPicker && (
								<QueryPicker
									queries={queries!}
									boundQueryId={boundQueryId}
									onSelect={onSelectQuery!}
									onNew={onNewQuery!}
									onRename={onRenameQuery}
									onDelete={onDeleteQuery}
								/>
							)}
							{reuse && (
								<Popover
									open={reuseOpen && reuse.canReuse}
									onOpenChange={setReuseOpen}
								>
									<PopoverTrigger asChild>
										<button
											type="button"
											disabled={!reuse.canReuse}
											title={
												reuse.canReuse
													? "Reuse this query as another chart"
													: "Write a query first"
											}
											className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1.5 font-medium text-[11px] text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
										>
											<CopyPlus className="h-3.5 w-3.5" />{" "}
											Reuse
										</button>
									</PopoverTrigger>
									<PopoverContent
										align="start"
										className="w-52 overflow-hidden p-1 py-1"
									>
										<p className="px-3 py-1 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
											Add to sheet
										</p>
										<div className="max-h-56 overflow-y-auto">
											{reuse.sheets.map((s) => (
												<button
													key={s.id}
													type="button"
													onClick={() => {
														reuse.onReuse(s.id);
														setReuseOpen(false);
													}}
													className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-stone-700 hover:bg-stone-50"
												>
													<span
														className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
														style={{
															backgroundColor:
																s.color ??
																"#94a3b8",
														}}
													/>
													<span className="min-w-0 flex-1 truncate">
														{s.name}
													</span>
													{s.id ===
														reuse.activeSheetId && (
														<span className="text-[10px] text-stone-400">
															current
														</span>
													)}
												</button>
											))}
										</div>
										<div className="mt-1 border-stone-100 border-t pt-1">
											<button
												type="button"
												onClick={() => {
													reuse.onReuse("new");
													setReuseOpen(false);
												}}
												className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-semibold text-[13px] text-indigo-600 hover:bg-indigo-50"
											>
												<Plus className="h-3.5 w-3.5" />{" "}
												New sheet
											</button>
										</div>
									</PopoverContent>
								</Popover>
							)}
							{showMasterToggle && (
								<button
									type="button"
									onClick={() => {
										if (!isQueryMaster) onSetAsMaster!();
									}}
									disabled={isQueryMaster}
									aria-label={
										isQueryMaster
											? "Master query chart"
											: "Set as master"
									}
									title={
										isQueryMaster
											? "Master — this chart owns the parameter form for its shared query"
											: "Set as master — make this chart enter the parameters for the shared query"
									}
									className={cx(
										"inline-flex items-center justify-center rounded-md border p-1.5 transition-colors disabled:cursor-default",
										isQueryMaster
											? "border-indigo-300 bg-indigo-50 text-indigo-700"
											: "border-stone-200 text-stone-400 hover:bg-stone-100 hover:text-stone-700",
									)}
								>
									<Crown className="h-3.5 w-3.5" />
								</button>
							)}
							{showLoadAfterToggle && (
								<>
									<label
										className="inline-flex cursor-pointer select-none items-center gap-1.5 text-stone-500 text-xs"
										title="Load this query only after the Parameters tab's Run button is clicked"
									>
										<input
											type="checkbox"
											checked={loadAfterParams}
											onChange={onToggleLoadAfterParams}
											className="h-3.5 w-3.5 cursor-pointer accent-indigo-600"
										/>
										Wait for param run
									</label>
									<div className="h-5 w-px bg-stone-200" />
								</>
							)}
							<div className="h-5 w-px bg-stone-200" />
							<div className="flex min-w-0 items-center gap-1.5">
								<DatabaseIcon className="h-4 w-4 flex-shrink-0 text-stone-400" />
								<Select
									value={viz.databaseId}
									onChange={(e) => {
										const db = databases.find(
											(d) => d.id === e.target.value,
										);
										onUpdate({
											databaseId: db?.id ?? "",
											databaseName: db?.label ?? "",
										});
									}}
									className="w-44 py-1 text-[13px]"
								>
									<option value="">Select a database…</option>
									{databases.map((db) => (
										<option key={db.id} value={db.id}>
											{db.label}
										</option>
									))}
									{viz.databaseId &&
										!databases.some(
											(d) => d.id === viz.databaseId,
										) && (
											<option value={viz.databaseId}>
												{viz.databaseName ||
													viz.databaseId}
											</option>
										)}
								</Select>
							</div>
							<button
								type="button"
								onClick={() => setTablesOpen((v) => !v)}
								disabled={!viz.databaseId}
								className={cx(
									"inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-[11px] transition-colors disabled:opacity-40",
									tablesOpen
										? "bg-indigo-50 text-indigo-600"
										: "text-stone-500 hover:bg-stone-100 hover:text-stone-700",
								)}
								title={
									viz.databaseId
										? "Browse tables in this database"
										: "Select a database first"
								}
							>
								<Table2 className="h-3.5 w-3.5" /> Tables
							</button>
							<button
								type="button"
								onClick={() => setQueryBuilderOpen(true)}
								disabled={!viz.databaseId}
								className={cx(
									"inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-[11px] transition-colors disabled:opacity-40",
									"text-stone-500 hover:bg-stone-100 hover:text-stone-700",
								)}
								title={
									viz.databaseId
										? "Build a query visually (columns, aggregations, filters, joins)"
										: "Select a database first"
								}
							>
								<Wrench className="h-3.5 w-3.5" /> Query Builder
							</button>
							<button
								type="button"
								onClick={() => setDataProductOpen(true)}
								className={cx(
									"inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-[11px] transition-colors",
									isDP
										? "bg-indigo-50 text-indigo-600"
										: "text-stone-500 hover:bg-stone-100 hover:text-stone-700",
								)}
								title="Join two or more sources (even across databases) into one dataset"
							>
								<GitMerge className="h-3.5 w-3.5" />{" "}
								{isDP
									? `Data product · ${viz.sources?.length ?? 0}`
									: "Join sources"}
							</button>
							{isDP && (
								<button
									type="button"
									onClick={() =>
										onUpdate({
											sources: undefined,
											joins: undefined,
										} as any)
									}
									className="inline-flex items-center gap-1 rounded-md px-1.5 py-1.5 font-medium text-[11px] text-stone-400 hover:bg-red-50 hover:text-red-500"
									title="Remove the data product (revert to a single query)"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
							<button
								type="button"
								onClick={() => setParamsOpen(true)}
								className={cx(
									"inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-[11px] transition-colors",
									paramsOpen
										? "bg-indigo-50 text-indigo-600"
										: "text-stone-500 hover:bg-stone-100 hover:text-stone-700",
								)}
								title="Query parameters"
							>
								<SlidersHorizontal className="h-3.5 w-3.5" />
								Parameters
								{viz.parameters.length > 0
									? ` (${viz.parameters.length})`
									: ""}
							</button>

							<div className="flex-1" />

							{/* Configure — opens the Data / Tools panel (drawer) so the preview stays uncluttered */}
							<button
								type="button"
								onClick={() => {
									setResultView("chart");
									setConfigOpen((v) => !v);
								}}
								title="Configure the chart — map columns, styling, tools"
								className={cx(
									"inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium text-[11px] transition-colors",
									configOpen
										? "border-indigo-300 bg-indigo-50 text-indigo-600"
										: "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50",
								)}
							>
								<PanelRight className="h-3.5 w-3.5" /> Configure
							</button>

							{/* Run — sits with the query it executes (kept off the header so it doesn't stack under Save) */}
							<Button
								variant={hasData ? "outline" : "primary"}
								size="sm"
								onClick={handleRun}
								disabled={running || !canRun}
								title={
									canRun
										? "Run query (⌘↵)"
										: "Select a database and enter a query"
								}
							>
								{running ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Play className="h-3.5 w-3.5" />
								)}
								{running
									? "Running"
									: hasData
										? "Re-run"
										: "Run"}
							</Button>
						</div>
					)}

					{/* ── Body ── */}
					{isHtml ? (
						<div className="min-h-0 flex-1">
							<HtmlBlockEditor
								viz={viz as any}
								onUpdate={(u) => onUpdate(u as any)}
								runPixel={runPixel}
							/>
						</div>
					) : (
						<div
							ref={bodyRef}
							className="flex min-h-0 flex-1 flex-col"
						>
							{/* ── QUERY ZONE (SQL — prominent, resizable) ── */}
							<div
								className="flex min-h-0 flex-col"
								style={{ flex: `0 0 ${queryPct}%` }}
							>
								<div className="flex min-h-0 flex-1">
									{tablesOpen && (
										<TableBrowser
											tables={tables}
											loading={tablesLoading}
											hasDb={!!viz.databaseId}
											expanded={expandedTables}
											onToggle={(t) =>
												setExpandedTables((m) => ({
													...m,
													[t]: !m[t],
												}))
											}
											onInsert={insertAtEnd}
										/>
									)}
									<div className="min-h-0 min-w-0 flex-1">
										{sqlEditor}
									</div>
								</div>
								<p className="flex-shrink-0 border-stone-100 border-t bg-stone-50/50 px-3 py-1 text-[10px] text-stone-400">
									<kbd className="font-sans">⌘↵</kbd> to run ·
									reference params with{" "}
									<code className="rounded bg-stone-100 px-1 font-mono text-indigo-500">
										{"{{param}}"}
									</code>
								</p>
							</div>

							{/* ── Splitter ── */}
							<div
								onPointerDown={onSplitDown}
								onPointerMove={onSplitMove}
								onPointerUp={onSplitUp}
								className="group flex h-2 flex-shrink-0 cursor-row-resize items-center justify-center bg-stone-100 transition-colors hover:bg-indigo-100"
								title="Drag to resize"
							>
								<div className="h-0.5 w-8 rounded-full bg-stone-300 transition-colors group-hover:bg-indigo-400" />
							</div>

							{/* ── RESULT ZONE ── */}
							<div className="flex min-h-0 flex-1 flex-col">
								{/* Result toolbar */}
								<div className="flex h-9 flex-shrink-0 items-center gap-2 border-stone-200 border-b bg-stone-100/70 px-3">
									<div className="inline-flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5">
										<button
											type="button"
											onClick={() =>
												setResultView("chart")
											}
											className={cx(
												"inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium text-[11px] transition-colors",
												resultView === "chart"
													? "bg-white text-stone-800 shadow-soft"
													: "text-stone-500 hover:text-stone-700",
											)}
										>
											<BarChart3 className="h-3.5 w-3.5" />{" "}
											Chart
										</button>
										<button
											type="button"
											onClick={() =>
												setResultView("data")
											}
											className={cx(
												"inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium text-[11px] transition-colors",
												resultView === "data"
													? "bg-white text-stone-800 shadow-soft"
													: "text-stone-500 hover:text-stone-700",
											)}
										>
											<Table className="h-3.5 w-3.5" />{" "}
											Data
										</button>
									</div>
									<div className="flex-1" />
									{rowCount !== null &&
										!running &&
										!queryError && (
											<span className="text-[11px] text-stone-400 tabular-nums">
												{rowCount.toLocaleString()} rows
											</span>
										)}
									{/* Add to layout lives with the result it adds — off the header/action columns */}
									<Button
										variant={
											inLayout ? "secondary" : "success"
										}
										size="sm"
										onClick={onAddToLayout}
										disabled={inLayout}
									>
										{inLayout ? (
											<Check className="h-3.5 w-3.5" />
										) : (
											<Plus className="h-3.5 w-3.5" />
										)}
										{inLayout
											? "In layout"
											: "Add to layout"}
									</Button>
								</div>

								{resultView === "data" ? (
									/* Data grid — raw query rows, 1:1 with the query (ORDER BY preserved) */
									<div className="min-h-0 flex-1 overflow-auto bg-white">
										{queryError ? (
											<CenterState
												icon={AlertCircle}
												tone="error"
												title="Query failed"
												detail={queryError}
											/>
										) : running ? (
											<CenterState
												icon={Loader2}
												spinning
												title="Running query…"
											/>
										) : !hasData ? (
											<CenterState
												icon={Table}
												title={
													canRun
														? "Run to see results"
														: "Connect data to begin"
												}
												detail={
													canRun
														? "Press Run (top-right) or ⌘↵ to load the result rows."
														: "Pick a database and write a query above."
												}
											/>
										) : (
											<DataGrid
												columns={columns}
												rows={previewRows ?? []}
											/>
										)}
									</div>
								) : (
									<div className="flex min-h-0 flex-1">
										{/* Preview (hero) — full width; config lives in the drawer */}
										<div className="min-h-0 min-w-0 flex-1 overflow-hidden">
											{queryError ? (
												<CenterState
													icon={AlertCircle}
													tone="error"
													title="Query failed"
													detail={queryError}
												/>
											) : running ? (
												<CenterState
													icon={Loader2}
													spinning
													title="Running query…"
												/>
											) : !hasData ? (
												<CenterState
													icon={Play}
													title={
														canRun
															? "Run to preview"
															: "Connect data to begin"
													}
													detail={
														canRun
															? "Press Run or ⌘↵ to load your data, then Configure to shape the chart."
															: "Pick a database and write a query above."
													}
													action={
														canRun ? (
															<button
																type="button"
																onClick={() =>
																	setConfigOpen(
																		true,
																	)
																}
																className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-1.5 font-medium text-indigo-600 text-xs transition-colors hover:bg-indigo-50"
															>
																<PanelRight className="h-3.5 w-3.5" />{" "}
																Configure chart
															</button>
														) : undefined
													}
												/>
											) : (
												<div className="h-full w-full">
													{renderPreview()}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Mobile backdrop for the config overlay */}
				{configOpen && !isHtml && (
					<div
						className="absolute inset-0 z-20 bg-black/20 lg:hidden"
						onClick={() => setConfigOpen(false)}
						aria-hidden
					/>
				)}
				{/* Configure drawer — overlay on mobile, push-in column from lg up. */}
				<div
					className={cx(
						"bg-white transition-[width] duration-200 ease-out",
						"absolute inset-y-0 right-0 z-30 shadow-xl lg:static lg:z-auto lg:flex-shrink-0 lg:overflow-hidden lg:shadow-none",
						configOpen && !isHtml
							? "w-[90vw] max-w-[440px] border-stone-200 border-l lg:w-[500px] lg:max-w-none"
							: "w-0 overflow-hidden",
					)}
				>
					{configPanel}
				</div>
			</div>

			{/* Parameters — roomy modal so inputs are never cramped */}
			<Dialog
				open={paramsOpen && !isHtml}
				onOpenChange={(o) => {
					if (!o) setParamsOpen(false);
				}}
			>
				<DialogContent className="flex max-h-[80vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
					<DialogTitle className="flex h-11 flex-shrink-0 items-center border-stone-200 border-b px-4 font-semibold text-sm text-stone-700">
						Query Parameters{viz.title ? ` — ${viz.title}` : ""}
					</DialogTitle>
					<div className="min-h-0 flex-1 overflow-y-auto p-4">
						<QueryParameters
							query={viz.query}
							parameters={viz.parameters}
							onChange={(parameters) => onUpdate({ parameters })}
							onInsertToken={(name) =>
								onUpdate({ query: `${viz.query}{{${name}}}` })
							}
							databaseId={viz.databaseId}
							databases={databases}
							runPixel={runPixel}
						/>
					</div>
				</DialogContent>
			</Dialog>

			<QueryBuilderModal
				open={queryBuilderOpen}
				onClose={() => setQueryBuilderOpen(false)}
				databaseId={viz.databaseId}
				databaseName={viz.databaseName ?? ""}
				databases={databases}
				runPixel={runPixel}
				onApply={(generatedSql, dbId, dbName) =>
					onUpdate({
						query: generatedSql,
						databaseId: dbId,
						databaseName: dbName,
					})
				}
			/>

			<DataProductModal
				open={dataProductOpen}
				onClose={() => setDataProductOpen(false)}
				databases={databases}
				runPixel={runPixel}
				value={{
					sources: viz.sources as DPLeg[] | undefined,
					joins: viz.joins as DPJoin[] | undefined,
				}}
				onApply={(sources, joins) => {
					// Params = union of {{tokens}} across every leg. Reuse existing param
					// specs by name; new tokens get a blank-default param (filled in the
					// Parameters panel — the app requires a default before saving).
					const names = new Set<string>();
					sources.forEach((l) =>
						placeholderNames(l.query).forEach((n) => names.add(n)),
					);
					const existing = new Map(
						(viz.parameters ?? []).map((p) => [p.name, p]),
					);
					const parameters = Array.from(names).map(
						(n) =>
							existing.get(n) ?? {
								id: `param-${n}-${Math.random().toString(36).slice(2, 8)}`,
								name: n,
								label: n,
								defaultValue: "",
							},
					);
					const desc = `-- Data product: ${sources.map((s) => s.alias).join(" + ")}`;
					onUpdate({
						sources,
						joins,
						parameters,
						// Keep the single-source fields pointed at the first leg (ignored while
						// this is a data product) so nothing downstream sees an empty database.
						databaseId: sources[0]?.databaseId ?? viz.databaseId,
						databaseName:
							sources[0]?.databaseName ?? viz.databaseName,
						query: desc,
					} as any);
				}}
			/>
		</>
	);
}

// ── Query picker: choose / rename / delete shared queries ──────────────────────
interface QueryPickerItem {
	id: string;
	name: string;
	paramCount: number;
	usageCount: number;
}
function QueryPicker({
	queries,
	boundQueryId,
	onSelect,
	onNew,
	onRename,
	onDelete,
}: {
	queries: QueryPickerItem[];
	boundQueryId?: string;
	onSelect: (id: string) => void;
	onNew: () => void;
	onRename?: (name: string) => void;
	onDelete?: (id: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [draft, setDraft] = useState("");
	const bound = queries.find((q) => q.id === boundQueryId);

	const startRename = () => {
		setDraft(bound?.name ?? "");
		setRenaming(true);
		setOpen(false);
	};
	const commitRename = () => {
		const v = draft.trim();
		if (v && onRename) onRename(v);
		setRenaming(false);
	};

	// Inline rename — replaces the trigger with an editable field.
	if (renaming && bound) {
		return (
			<div className="flex min-w-0 items-center gap-1.5">
				<span className="hidden font-medium text-[11px] text-stone-400 xl:inline">
					Query
				</span>
				<Input
					autoFocus
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commitRename}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							commitRename();
						} else if (e.key === "Escape") {
							e.preventDefault();
							setRenaming(false);
						}
					}}
					placeholder="Query name"
					className="w-44 rounded-md border border-indigo-300 bg-white px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
				<button
					type="button"
					onMouseDown={(e) => e.preventDefault()}
					onClick={commitRename}
					title="Save name"
					className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-indigo-600"
				>
					<Check className="h-3.5 w-3.5" />
				</button>
				<div className="h-5 w-px bg-stone-200" />
			</div>
		);
	}

	return (
		<div className="flex min-w-0 items-center gap-1.5">
			<span className="hidden font-medium text-[11px] text-stone-400 xl:inline">
				Query
			</span>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						title="Reuse a saved query across charts, or create a new one"
						className="inline-flex w-44 items-center justify-between gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1 text-[13px] text-stone-700 hover:border-stone-300"
					>
						<span className="truncate">
							{bound ? bound.name : "New query…"}
							{bound && bound.usageCount > 1
								? ` · ${bound.usageCount}`
								: ""}
						</span>
						<ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-64 overflow-hidden p-1 py-1"
				>
					{queries.length === 0 ? (
						<p className="px-2.5 py-2 text-[12px] text-stone-400">
							No saved queries yet.
						</p>
					) : (
						<div className="max-h-64 overflow-y-auto">
							{queries.map((q) => {
								const active = q.id === boundQueryId;
								const removable =
									q.usageCount === 0 && !!onDelete;
								return (
									<div
										key={q.id}
										className={cx(
											"group flex items-center gap-2 px-2.5 py-1.5 text-[13px]",
											active
												? "bg-indigo-50/60"
												: "hover:bg-stone-50",
										)}
									>
										<button
											type="button"
											onClick={() => {
												onSelect(q.id);
												setOpen(false);
											}}
											className="flex min-w-0 flex-1 items-center gap-2 text-left"
										>
											<span
												className={cx(
													"min-w-0 flex-1 truncate",
													active
														? "font-semibold text-indigo-700"
														: "text-stone-700",
												)}
											>
												{q.name}
											</span>
											<span className="flex-shrink-0 text-[10px] text-stone-400">
												{q.usageCount === 0
													? "unused"
													: `· ${q.usageCount} chart${q.usageCount > 1 ? "s" : ""}`}
											</span>
										</button>
										{removable && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													onDelete!(q.id);
												}}
												title="Delete this unused query"
												className="flex-shrink-0 rounded p-1 text-stone-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								);
							})}
						</div>
					)}
					<div className="mt-1 border-stone-100 border-t pt-1">
						<button
							type="button"
							onClick={() => {
								onNew();
								setOpen(false);
							}}
							className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left font-semibold text-[13px] text-indigo-600 hover:bg-indigo-50"
						>
							<Plus className="h-3.5 w-3.5" /> New query
						</button>
					</div>
				</PopoverContent>
			</Popover>
			{bound && onRename && (
				<button
					type="button"
					onClick={startRename}
					title="Rename this query"
					className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-indigo-600"
				>
					<Pencil className="h-3.5 w-3.5" />
				</button>
			)}
			<div className="h-5 w-px bg-stone-200" />
		</div>
	);
}

// ── small internal bits ───────────────────────────────────────────────────────
function SubLabel({ children }: { children: ReactNode }) {
	return (
		<p className="mb-1.5 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
			{children}
		</p>
	);
}

/** Config rail for the Filter widget — pick a column and the visualizations it targets. */
function FilterConfigPanel({
	viz,
	columns,
	siblings,
	onUpdate,
}: {
	viz: VizLike;
	columns: Column[];
	siblings: {
		id: string;
		title: string;
		visualizationType: string;
		sheetName?: string;
		columns?: string[];
		queryName?: string;
	}[];
	onUpdate: (p: Partial<VizLike>) => void;
}) {
	const patch = (p: Record<string, unknown>) =>
		onUpdate({ config: { ...viz.config, ...p } });
	const targets: string[] = viz.config?.filterTargets ?? [];
	const toggleTarget = (id: string) =>
		patch({
			filterTargets: targets.includes(id)
				? targets.filter((t) => t !== id)
				: [...targets, id],
		});

	// Filterable siblings = anything that holds data (exclude other filters / export buttons).
	// Include export buttons so filters apply to downloads too; exclude other filter widgets.
	const targetable = siblings.filter((s) => s.visualizationType !== "filter");
	// Group by sheet so the picker makes clear a filter can target other sheets.
	const bySheet = new Map<string, typeof targetable>();
	for (const s of targetable) {
		const key = s.sheetName || "Sheet";
		const arr = bySheet.get(key) ?? [];
		arr.push(s);
		bySheet.set(key, arr);
	}

	// The filter column comes from the TARGETED visualizations' columns (the filter
	// applies to THEIR loaded rows) — no query of its own is needed. Union the columns
	// of the selected targets; if none are selected yet, offer all targetable columns.
	const sourceVizs = targets.length
		? targetable.filter((s) => targets.includes(s.id))
		: targetable;
	const columnOptions = (() => {
		const seen = new Set<string>();
		const out: string[] = [];
		for (const s of sourceVizs)
			for (const c of s.columns ?? []) {
				if (c && !seen.has(c)) {
					seen.add(c);
					out.push(c);
				}
			}
		// Fall back to the widget's own columns only if targets expose none.
		if (!out.length)
			for (const c of columns) {
				if (c.name && !seen.has(c.name)) {
					seen.add(c.name);
					out.push(c.name);
				}
			}
		return out;
	})();

	return (
		<div className="space-y-4 p-3">
			<div>
				<SubLabel>Filter column</SubLabel>
				<SearchableSelect
					value={viz.config?.filterColumn ?? ""}
					ariaLabel="Filter column"
					placeholder="Select a column…"
					onChange={(v) => patch({ filterColumn: v || undefined })}
					options={(() => {
						const opts = columnOptions.map((name) => ({
							value: name,
							label: name,
						}));
						const cur = viz.config?.filterColumn;
						if (cur && !columnOptions.includes(cur))
							opts.unshift({ value: cur, label: cur });
						return opts;
					})()}
				/>
				<p className="mt-1 text-[11px] text-stone-400">
					{targets.length
						? "Columns come from the visualizations this filter targets. Distinct values from their loaded rows become the options — no query needed here."
						: "Pick the target visualizations below — the filter column is chosen from their columns. No query needed on this widget."}
				</p>
			</div>

			<div>
				<div className="mb-1.5 flex items-center justify-between">
					<SubLabel>
						Apply to visualizations
						{targets.length > 0
							? ` · ${targets.length} selected`
							: ""}
					</SubLabel>
					{targetable.length > 0 && (
						<button
							type="button"
							onClick={() =>
								patch({
									filterTargets:
										targets.length === targetable.length
											? []
											: targetable.map((s) => s.id),
								})
							}
							className="font-semibold text-[11px] text-indigo-600 hover:text-indigo-700"
						>
							{targets.length === targetable.length
								? "Clear all"
								: "Select all"}
						</button>
					)}
				</div>
				{targetable.length === 0 ? (
					<p className="text-[12px] text-stone-400">
						Add other visualizations to this dashboard to target
						them.
					</p>
				) : (
					<div className="space-y-2">
						{[...bySheet.entries()].map(([sheetName, vizs]) => (
							<div key={sheetName}>
								<p className="px-2 pb-0.5 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
									{sheetName}
								</p>
								<div className="space-y-0.5">
									{vizs.map((s) => (
										<label
											key={s.id}
											className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-stone-700 hover:bg-stone-50"
										>
											<Checkbox
												type="checkbox"
												checked={targets.includes(s.id)}
												onChange={() =>
													toggleTarget(s.id)
												}
												className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
											/>
											<span className="truncate">
												{s.title || "Untitled"}
											</span>
											{s.queryName && (
												<span
													className="truncate text-[11px] text-stone-400/70"
													title={`Query: ${s.queryName}`}
												>
													· {s.queryName}
												</span>
											)}
										</label>
									))}
								</div>
							</div>
						))}
					</div>
				)}
				<p className="mt-1.5 text-[11px] text-stone-400">
					Tick every visualization this filter should control — across
					any sheet. The chosen column must exist in each one's result
					for the filter to match.
				</p>
			</div>
		</div>
	);
}

function CenterState({
	icon: Icon,
	title,
	detail,
	action,
	tone,
	spinning,
}: {
	icon: React.ElementType;
	title: string;
	detail?: string;
	action?: ReactNode;
	tone?: "error";
	spinning?: boolean;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-white to-stone-50/60 px-8 text-center">
			<div
				className={cx(
					"mb-3.5 grid h-12 w-12 place-items-center rounded-2xl ring-1",
					tone === "error"
						? "bg-red-50 text-red-500 ring-red-100"
						: "bg-indigo-50 text-indigo-500 ring-indigo-100",
				)}
			>
				<Icon className={cx("h-5 w-5", spinning && "animate-spin")} />
			</div>
			<p
				className={cx(
					"font-semibold text-sm",
					tone === "error" ? "text-red-600" : "text-stone-700",
				)}
			>
				{title}
			</p>
			{detail && (
				<p className="mt-1 max-w-xs break-words text-stone-400 text-xs leading-relaxed">
					{detail}
				</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

// ── Data grid: raw query rows, 1:1 with the query output ───────────────────────
const DATA_GRID_MAX = 200;
function fmtCell(v: unknown): string {
	if (v === null || v === undefined) return "";
	if (typeof v === "object") return JSON.stringify(v);
	return String(v);
}
function DataGrid({
	columns,
	rows,
}: {
	columns: Column[];
	rows: Array<Record<string, unknown>>;
}) {
	const headers = columns.length
		? columns.map((c) => c.name)
		: rows[0]
			? Object.keys(rows[0])
			: [];
	const shown = rows.slice(0, DATA_GRID_MAX);
	if (!headers.length) {
		return (
			<div className="flex h-full items-center justify-center text-stone-400 text-xs">
				No columns returned.
			</div>
		);
	}
	return (
		<div className="text-xs">
			<table className="min-w-full border-collapse">
				<thead className="sticky top-0 z-10">
					<tr className="bg-stone-50 text-left">
						{headers.map((h) => (
							<th
								key={h}
								className="whitespace-nowrap border-stone-200 border-b px-3 py-2 font-semibold text-stone-600"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{shown.map((row, i) => (
						<tr key={i} className="hover:bg-stone-50/70">
							{headers.map((h) => (
								<td
									key={h}
									className="max-w-[280px] truncate whitespace-nowrap border-stone-100 border-b px-3 py-1.5 text-stone-700"
									title={fmtCell(row[h])}
								>
									{fmtCell(row[h])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			{rows.length > DATA_GRID_MAX && (
				<p className="px-3 py-2 text-[11px] text-stone-400">
					Showing first {DATA_GRID_MAX.toLocaleString()} of{" "}
					{rows.length.toLocaleString()} rows.
				</p>
			)}
		</div>
	);
}

// ── Table browser: browse tables + columns from the selected data source ───────
function TableBrowser({
	tables,
	loading,
	hasDb,
	expanded,
	onToggle,
	onInsert,
}: {
	tables: BrowserTable[];
	loading: boolean;
	hasDb: boolean;
	expanded: Record<string, boolean>;
	onToggle: (table: string) => void;
	onInsert: (text: string) => void;
}) {
	return (
		<div className="w-56 flex-shrink-0 overflow-y-auto border-stone-200 border-r bg-stone-50/50">
			<div className="sticky top-0 z-10 flex items-center gap-1.5 border-stone-200 border-b bg-stone-50 px-3 py-2">
				<Table2 className="h-3.5 w-3.5 text-stone-400" />
				<span className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
					Tables
				</span>
			</div>
			{!hasDb ? (
				<p className="px-3 py-3 text-[11px] text-stone-400">
					Select a database to browse its tables.
				</p>
			) : loading ? (
				<div className="flex items-center gap-2 px-3 py-3 text-[11px] text-stone-400">
					<Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
				</div>
			) : tables.length === 0 ? (
				<p className="px-3 py-3 text-[11px] text-stone-400">
					No tables found.
				</p>
			) : (
				<div className="py-1">
					{tables.map((t) => (
						<div key={t.table}>
							<div className="group flex items-center">
								<button
									onClick={() => onToggle(t.table)}
									className="flex min-w-0 flex-1 items-center gap-1 rounded px-2 py-1 text-left font-medium text-[12px] text-stone-700 hover:bg-stone-100"
								>
									<ChevronDown
										className={cx(
											"h-3 w-3 flex-shrink-0 text-stone-400 transition-transform",
											!expanded[t.table] && "-rotate-90",
										)}
									/>
									<span className="min-w-0 flex-1 truncate">
										{t.table}
									</span>
								</button>
								<button
									onClick={() => onInsert(t.table)}
									title="Insert table name"
									className="px-1.5 py-1 text-stone-300 opacity-0 hover:text-indigo-600 group-hover:opacity-100"
								>
									<Plus className="h-3 w-3" />
								</button>
							</div>
							{expanded[t.table] && (
								<div className="pb-1">
									{t.columns.map((c) => (
										<button
											key={c.column}
											onClick={() => onInsert(c.column)}
											title={`${c.column} · ${c.type}`}
											className="flex w-full items-center gap-1.5 rounded py-0.5 pr-2 pl-7 text-left text-[11px] text-stone-500 hover:bg-stone-100 hover:text-indigo-600"
										>
											<span className="min-w-0 flex-1 truncate font-mono">
												{c.column}
											</span>
											<span className="flex-shrink-0 text-[9px] text-stone-300 uppercase">
												{(c.type || "").slice(0, 4)}
											</span>
										</button>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
