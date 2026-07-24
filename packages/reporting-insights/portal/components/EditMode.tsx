import {
	Actions,
	DockLocation,
	Layout,
	type Model,
	type TabNode,
} from "flexlayout-react";
import {
	ArrowLeft,
	BarChart2,
	CopyPlus,
	Pencil,
	Plus,
	Save,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SheetTabs } from "@/components/editor/SheetTabs";
import { VizEditor } from "@/components/editor/VizEditor";
import { buttonClasses } from "@/components/ui";
import type {
	Column,
	DropZoneDataWithTable,
} from "@/components/VizConfigDropZones";
import { DashboardFilterProvider } from "@/lib/dashboardFilters";
import { escapeSqlForPixel } from "@/lib/pixel";
import {
	migrateSheetsToSharedQueries,
	pruneQueries,
	resolveQuery,
} from "@/lib/resolveQuery";
import { useTabColors } from "@/lib/tabColors";
import { inferColumnType, normalizeDataType } from "@/lib/tableAggregate";
import { VIZ_TYPE_META } from "@/lib/vizMeta";
import {
	buildFlexModel,
	isViewOnlyLayoutAction,
} from "@/utils/dashboardLayout";
import { vizConfigColumns } from "@/utils/vizColumns";
import { loadDatabases, runDatabaseQuery, runPixel } from "../api";
import { usePortalStore } from "../store";
import type {
	ColSpan,
	DashboardConfig,
	DashboardQuery,
	Database,
	Sheet,
	Visualization,
	VisualizationConfig,
} from "../types";
import { ChartPreview } from "./ChartPreview";

// ── Viz type options for the chart type dropdown ─────────────────────────────
// Derived from the shared registry so the portal editor's type picker never
// drifts from the main app (auto-includes Export CSV, Filter, and future types).
const VIZ_TYPE_OPTIONS: { value: string; label: string }[] = Object.entries(
	VIZ_TYPE_META,
).map(([value, meta]) => ({
	value,
	label: (meta as { label: string }).label,
}));

function uid() {
	return Math.random().toString(36).slice(2, 10);
}

function makeViz(): Visualization {
	return {
		id: uid(),
		title: "New Visualization",
		databaseId: "",
		databaseName: "",
		query: "",
		parameters: [],
		visualizationType: "table",
		config: {},
	};
}

const SHEET_COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
];

function initSheets(cfg: DashboardConfig | null): Sheet[] {
	if (!cfg)
		return [
			{
				id: uid(),
				name: "Sheet 1",
				color: SHEET_COLORS[0],
				visualizations: [makeViz()],
				layout: [],
			},
		];
	if (cfg.sheets?.length) return cfg.sheets;
	const vizs = cfg.visualizations?.length ? cfg.visualizations : [makeViz()];
	const layout = cfg.layout?.length
		? cfg.layout
		: vizs.map((v, i) => ({
				vizId: v.id,
				colSpan: 12 as ColSpan,
				order: i,
				widthPct: 100,
			}));
	return [
		{
			id: uid(),
			name: "Sheet 1",
			color: SHEET_COLORS[0],
			visualizations: vizs,
			layout,
			flexLayout: cfg.flexLayout,
		},
	];
}

// ── EditMode root ─────────────────────────────────────────────────────────────
export function EditMode() {
	const { config, setMode, saveEdits, saving, saveError } = usePortalStore();

	// Sheets-based state — mirrors NewDashboardPage architecture. Migrate legacy
	// embedded queries into shared DashboardQuery entities up front (behaviour-
	// preserving: embedded query fields remain as a fallback).
	const [initialMigration] = useState(() =>
		migrateSheetsToSharedQueries(initSheets(config), config?.queries),
	);
	const [sheets, setSheets] = useState<Sheet[]>(
		() => initialMigration.sheets,
	);
	const [activeSheetId, setActiveSheetId] = useState<string>(
		() => initialMigration.sheets[0]?.id ?? "",
	);
	const [queries, setQueries] = useState<DashboardQuery[]>(
		() => initialMigration.queries,
	);
	const [draftName, setDraftName] = useState(config?.name ?? "");
	const [draftDesc, setDraftDesc] = useState(config?.description ?? "");

	const [selectedVizId, setSelectedVizId] = useState<string>(
		() => initialMigration.sheets[0]?.visualizations[0]?.id ?? "",
	);
	const [editingVizId, setEditingVizId] = useState<string | null>(null);
	const [editorTab, setEditorTab] = useState<"visualize" | "layout">(
		"visualize",
	);
	const [sheetMenuOpen, setSheetMenuOpen] = useState(false);
	const [databases, setDatabases] = useState<Database[]>([]);
	const [testResults, setTestResults] = useState<Record<string, any>>({});
	const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});

	// Derived active-sheet data
	const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? sheets[0];
	const visualizations = activeSheet?.visualizations ?? [];
	useTabColors(visualizations);
	const layout = activeSheet?.layout ?? [];

	// Helper: update only the active sheet
	const updateActiveSheet = useCallback(
		(updater: (s: Sheet) => Sheet) => {
			setSheets((prev) =>
				prev.map((s) => (s.id === activeSheetId ? updater(s) : s)),
			);
		},
		[activeSheetId],
	);

	// Per-sheet flexlayout model cache
	const flexModelCacheRef = useRef<Record<string, Model>>({});
	const getFlexModel = useCallback(() => {
		if (!flexModelCacheRef.current[activeSheetId]) {
			const s = {
				id: activeSheetId,
				name: "",
				visualizations,
				layout,
				flexLayout: activeSheet?.flexLayout,
			};
			flexModelCacheRef.current[activeSheetId] = buildFlexModel(s as any);
		}
		return flexModelCacheRef.current[activeSheetId];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSheetId, visualizations.length, layout.length]);
	const invalidateFlexModel = useCallback(() => {
		delete flexModelCacheRef.current[activeSheetId];
	}, [activeSheetId]);

	// Build the save payload: always include sheets + flat fields for compat
	const buildSavePayload = useCallback(
		(): DashboardConfig => ({
			...config!,
			name: draftName,
			description: draftDesc,
			sheets,
			queries: pruneQueries(queries, sheets),
			visualizations: sheets.flatMap((s) => s.visualizations),
			layout: sheets[0]?.layout ?? [],
			flexLayout: sheets[0]?.flexLayout,
			updatedAt: new Date().toISOString(),
		}),
		[config, draftName, draftDesc, sheets, queries],
	);

	useEffect(() => {
		loadDatabases()
			.then(setDatabases)
			.catch(() => {});
	}, []);

	// ── Save (with query validation) ────────────────────────────────────────────
	const [queryError, setQueryError] = useState<string | null>(null);
	const [validating, setValidating] = useState(false);

	/** Run each DISTINCT query (cheap, default params); collect errors for invalid SQL. */
	const validateQueries = async (cfg: DashboardConfig): Promise<string[]> => {
		const errors: string[] = [];
		const sheetList = cfg.sheets?.length
			? cfg.sheets
			: [
					{
						name: "Sheet 1",
						visualizations: cfg.visualizations ?? [],
					} as Sheet,
				];
		const seen = new Set<string>();
		for (const sheet of sheetList) {
			for (const viz of sheet.visualizations ?? []) {
				if (viz.visualizationType === "htmlblock") continue;
				const source = resolveQuery(viz, cfg.queries);
				if (!source.databaseId || !source.query?.trim()) continue;
				let resolved = source.query;
				source.parameters?.forEach((p) => {
					if (p.name)
						resolved = resolved.replaceAll(
							`{{${p.name}}}`,
							p.defaultValue ?? "",
						);
				});
				const dedupeKey = `${source.databaseId}::${resolved}`;
				if (seen.has(dedupeKey)) continue;
				seen.add(dedupeKey);
				try {
					await runPixel(
						`Database(database=["${source.databaseId}"]) | Query("${escapeSqlForPixel(resolved)}") | Collect(1);`,
					);
				} catch (e: any) {
					errors.push(
						`“${viz.title || "Untitled"}” (${sheet.name ?? "Sheet"}): ${String(e?.message ?? e ?? "invalid query")}`,
					);
				}
			}
		}
		return errors;
	};

	const handleSaveClick = async () => {
		if (saving || validating) return;
		setQueryError(null);
		const payload = buildSavePayload();
		// Every parameter must have a default value (resolve shared queries first).
		for (const s of payload.sheets ?? []) {
			for (const v of s.visualizations ?? []) {
				const source = resolveQuery(v, payload.queries);
				const missing = (source.parameters ?? []).find(
					(p) => p.name && !String(p.defaultValue ?? "").trim(),
				);
				if (missing) {
					setQueryError(
						`Parameter "${missing.label || missing.name}" in "${v.title || "Untitled"}" needs a default value.`,
					);
					return;
				}
				// A table's rows-per-page may be blank while editing, but not saved blank
				// or out of range (1–1000; the page size is also the per-DB-call size).
				if (v.visualizationType === "table") {
					const ps = (v.config as any)?.styling?.table?.pageSize;
					if (
						ps === "" ||
						(ps !== undefined &&
							(!Number.isFinite(Number(ps)) ||
								Number(ps) <= 0 ||
								Number(ps) > 1000))
					) {
						setQueryError(
							`Set a valid rows-per-page (1–1000) for the table "${v.title || "Untitled"}".`,
						);
						return;
					}
				}
			}
		}
		setValidating(true);
		const errs = await validateQueries(payload);
		setValidating(false);
		if (errs.length) {
			setQueryError(
				errs[0] +
					(errs.length > 1 ? ` (+${errs.length - 1} more)` : ""),
			);
			return;
		}
		await saveEdits(payload);
	};

	// ── Sheet CRUD ────────────────────────────────────────────────────────────
	const addSheet = () => {
		const color = SHEET_COLORS[sheets.length % SHEET_COLORS.length];
		const v = makeViz();
		const s: Sheet = {
			id: uid(),
			name: `Sheet ${sheets.length + 1}`,
			color,
			visualizations: [v],
			layout: [],
		};
		setSheets((prev) => [...prev, s]);
		setActiveSheetId(s.id);
		setSelectedVizId(v.id);
		setEditorTab("visualize");
	};

	const switchSheet = (id: string) => {
		setActiveSheetId(id);
		const s = sheets.find((sh) => sh.id === id);
		setSelectedVizId(s?.visualizations[0]?.id ?? "");
	};

	// ── Query registry (shared, dashboard-level) ──────────────────────────────
	const createQuery = (init?: Partial<DashboardQuery>): DashboardQuery => {
		const q: DashboardQuery = {
			id: uid(),
			name: init?.name?.trim() || "Untitled query",
			databaseId: init?.databaseId ?? "",
			databaseName: init?.databaseName ?? "",
			query: init?.query ?? "",
			parameters: init?.parameters ?? [],
		};
		setQueries((prev) => [...prev, q]);
		return q;
	};
	const updateQuery = (qid: string, patch: Partial<DashboardQuery>) =>
		setQueries((prev) =>
			prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
		);
	/** Delete a query — refused if any visualization still uses it. */
	const deleteQuery = (qid: string) => {
		if (sheets.some((s) => s.visualizations.some((v) => v.queryId === qid)))
			return;
		setQueries((prev) => prev.filter((q) => q.id !== qid));
	};
	/** Ensure a viz is backed by a shared query, returning its id (seeds from embedded fields). */
	const ensureQueryForViz = (viz: Visualization): string => {
		if (viz.queryId) return viz.queryId;
		const q = createQuery({
			name: viz.title,
			databaseId: viz.databaseId,
			databaseName: viz.databaseName,
			query: viz.query,
			parameters: viz.parameters,
		});
		updateViz(viz.id, { queryId: q.id });
		return q.id;
	};

	// ── viz CRUD (on active sheet) ────────────────────────────────────────────
	const addViz = () => {
		const q = createQuery({ name: `Query ${queries.length + 1}` });
		const v: Visualization = { ...makeViz(), queryId: q.id };
		updateActiveSheet((s) => ({
			...s,
			visualizations: [...s.visualizations, v],
		}));
		setSelectedVizId(v.id);
	};

	/**
	 * Reuse one query across many charts: add a NEW visualization bound to the SAME
	 * shared query (no SQL clone), in a chosen sheet (existing or new), so the data
	 * is fetched once and shared.
	 */
	const addVizFromQuery = (vizId: string, target: string | "new") => {
		const src = visualizations.find((v) => v.id === vizId);
		if (!src) return;
		const queryId = ensureQueryForViz(src);
		const newViz: Visualization = {
			...structuredClone(src),
			id: uid(),
			queryId,
		};
		if (target === "new") {
			const color = SHEET_COLORS[sheets.length % SHEET_COLORS.length];
			const s: Sheet = {
				id: uid(),
				name: `Sheet ${sheets.length + 1}`,
				color,
				visualizations: [newViz],
				layout: [
					{
						vizId: newViz.id,
						colSpan: 12 as ColSpan,
						order: 0,
						widthPct: 100,
					},
				],
			};
			setSheets((prev) => [...prev, s]);
			setActiveSheetId(s.id);
		} else {
			delete flexModelCacheRef.current[target];
			setSheets((prev) =>
				prev.map((s) =>
					s.id === target
						? {
								...s,
								visualizations: [...s.visualizations, newViz],
								layout: [
									...s.layout,
									{
										vizId: newViz.id,
										colSpan: 12 as ColSpan,
										order: s.layout.length,
										widthPct: 100,
									},
								],
								flexLayout: undefined,
							}
						: s,
				),
			);
			setActiveSheetId(target);
		}
		setSelectedVizId(newViz.id);
		setEditorTab("visualize");
		setSheetMenuOpen(false);
	};

	const removeViz = (vizId: string) => {
		// Delete just this viz's tab from the existing model so the rest of the
		// arrangement is preserved (instead of wiping + rebuilding the whole canvas).
		let modelHandled = false;
		try {
			const model = flexModelCacheRef.current[activeSheetId];
			if (model && model.getNodeById(`tab-${vizId}`)) {
				model.doAction(Actions.deleteTab(`tab-${vizId}`));
				flexModelCacheRef.current[activeSheetId] = model;
				const flexLayout = model.toJson() as unknown as Record<
					string,
					unknown
				>;
				updateActiveSheet((s) => ({
					...s,
					visualizations: s.visualizations.filter(
						(v) => v.id !== vizId,
					),
					layout: s.layout
						.filter((l) => l.vizId !== vizId)
						.map((l, i) => ({ ...l, order: i })),
					flexLayout: flexLayout as any,
				}));
				modelHandled = true;
			}
		} catch {
			modelHandled = false;
		}
		if (!modelHandled) {
			updateActiveSheet((s) => ({
				...s,
				visualizations: s.visualizations.filter((v) => v.id !== vizId),
				layout: s.layout
					.filter((l) => l.vizId !== vizId)
					.map((l, i) => ({ ...l, order: i })),
				flexLayout: undefined,
			}));
			invalidateFlexModel();
		}
		setSelectedVizId((prev) =>
			prev !== vizId
				? prev
				: (visualizations.find((v) => v.id !== vizId)?.id ?? ""),
		);
	};

	const updateViz = (vizId: string, patch: Partial<Visualization>) => {
		updateActiveSheet((s) => ({
			...s,
			visualizations: s.visualizations.map((v) =>
				v.id === vizId ? { ...v, ...patch } : v,
			),
		}));
		// Keep the flexlayout panel header in sync live when the Title changes.
		if (patch.title !== undefined) {
			const model = flexModelCacheRef.current[activeSheetId];
			if (model?.getNodeById(`tab-${vizId}`)) {
				model.doAction(
					Actions.renameTab(
						`tab-${vizId}`,
						patch.title || "Untitled",
					),
				);
			}
		}
	};

	// Parameter editing is handled inline by the shared <QueryParameters> component
	// in Step 0, which replaces the whole parameters array via onUpdate({ parameters }).

	// ── layout (on active sheet) ──────────────────────────────────────────────
	const addToLayout = (vizId: string) => {
		if (layout.find((l) => l.vizId === vizId)) return;
		const viz = visualizations.find((v) => v.id === vizId);
		const tabJson = {
			type: "tab" as const,
			id: `tab-${vizId}`,
			name: viz?.title || "Untitled",
			component: "viz",
			config: { vizId },
			enableClose: false,
		};
		// Append to the EXISTING model so the current arrangement is preserved (instead
		// of wiping flexLayout and rebuilding the whole canvas on every add).
		try {
			const model = getFlexModel();
			const rootId = model.getRootRow().getId();
			model.doAction(
				Actions.addNode(
					tabJson,
					rootId,
					DockLocation.BOTTOM,
					-1,
					false,
				),
			);
			flexModelCacheRef.current[activeSheetId] = model;
			const flexLayout = model.toJson() as unknown as Record<
				string,
				unknown
			>;
			updateActiveSheet((s) => ({
				...s,
				layout: [
					...s.layout,
					{
						vizId,
						colSpan: 12 as ColSpan,
						order: s.layout.length,
						widthPct: 100,
					},
				],
				flexLayout: flexLayout as any,
			}));
		} catch {
			updateActiveSheet((s) => ({
				...s,
				layout: [
					...s.layout,
					{
						vizId,
						colSpan: 12 as ColSpan,
						order: s.layout.length,
						widthPct: 100,
					},
				],
				flexLayout: undefined,
			}));
			invalidateFlexModel();
		}
	};

	// ── test query ────────────────────────────────────────────────────────────
	const runTest = async (vizId: string) => {
		const viz = visualizations.find((v) => v.id === vizId);
		if (!viz) return;
		const source = resolveQuery(viz, queries);
		const qKey = viz.queryId ?? viz.id;
		if (!source.databaseId || !source.query) return;
		setTestLoading((t) => ({ ...t, [qKey]: true }));
		try {
			let q = source.query;
			source.parameters.forEach((p) => {
				if (p.name)
					q = q.replaceAll(`{{${p.name}}}`, p.defaultValue ?? "");
			});
			const r = await runDatabaseQuery(source.databaseId, q, 10); // editor preview = small sample
			setTestResults((prev) => ({ ...prev, [qKey]: r }));
			// Persist CORRECT types so they survive reloads. runDatabaseQuery returns
			// only {headers, values} (no headerInfo), so INFER each column's type from
			// the sampled values — the only reliable sample-derived source here.
			if (r.headers?.length) {
				const columnTypes: Record<string, string> = {};
				r.headers.forEach((h: string, i: number) => {
					const inferred = inferColumnType(
						(r.values ?? []).map((row: any[]) => row[i]),
					);
					if (inferred !== "STRING") columnTypes[h] = inferred;
				});
				if (Object.keys(columnTypes).length) {
					updateViz(vizId, {
						config: { ...(viz.config ?? {}), columnTypes },
					});
				}
			}
		} catch (e: any) {
			setTestResults((prev) => ({
				...prev,
				[qKey]: { error: String(e?.message ?? e) },
			}));
		} finally {
			setTestLoading((t) => ({ ...t, [qKey]: false }));
		}
	};

	const sortedLayout = [...layout].sort((a, b) => a.order - b.order);
	const visibleLayout = sortedLayout.filter((item) =>
		visualizations.some((v) => v.id === item.vizId),
	);
	const selectedViz = visualizations.find((v) => v.id === selectedVizId);

	return (
		<DashboardFilterProvider>
			<div className="flex h-screen flex-col overflow-hidden bg-stone-50">
				{/* ── Fixed top: header ── */}
				{/* ── Editor toolbar ── */}
				<div className="flex h-14 flex-shrink-0 items-center gap-3 border-stone-200 border-b bg-white px-4">
					<button
						onClick={() => setMode("view")}
						title="Back"
						className="-ml-1 flex-shrink-0 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800"
					>
						<ArrowLeft className="h-4 w-4" />
					</button>
					<div className="h-6 w-px flex-shrink-0 bg-stone-200" />
					{/* Title + description — clear, labelled fields so it's obvious they're
                    meant to be filled in. Title is required. */}
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<div className="relative min-w-0 max-w-xs flex-1">
							<input
								type="text"
								value={draftName}
								onChange={(e) => setDraftName(e.target.value)}
								placeholder="Dashboard title"
								aria-label="Dashboard title (required)"
								className={`w-full rounded-md border px-2.5 py-1.5 pr-16 font-semibold text-[14px] text-stone-800 placeholder:font-normal placeholder:text-stone-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
									draftName.trim()
										? "border-stone-200 bg-white"
										: "border-amber-300 bg-amber-50/50"
								}`}
							/>
							{!draftName.trim() && (
								<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 font-semibold text-[10px] text-amber-600 uppercase tracking-wide">
									Required
								</span>
							)}
						</div>
						<input
							type="text"
							value={draftDesc}
							onChange={(e) => setDraftDesc(e.target.value)}
							placeholder="Add a description (optional)"
							aria-label="Dashboard description"
							className="min-w-0 max-w-sm flex-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] text-stone-600 placeholder:text-stone-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
					</div>
					{(saveError || queryError) && (
						<span
							className="max-w-[260px] truncate text-red-600 text-xs"
							title={queryError ?? saveError ?? ""}
						>
							{queryError ?? saveError}
						</span>
					)}
					{/* Reuse this query as another chart — choose which sheet it lands on */}
					{(() => {
						const sel = visualizations.find(
							(v) => v.id === selectedVizId,
						);
						const canDup = !!(
							sel && resolveQuery(sel, queries).query?.trim()
						);
						return (
							<div className="relative">
								<button
									onClick={() =>
										canDup && setSheetMenuOpen((v) => !v)
									}
									disabled={!canDup}
									title={
										canDup
											? "Reuse this query to build another visualization"
											: "Write a query first"
									}
									className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
								>
									<CopyPlus className="h-3.5 w-3.5" /> Reuse
									Query
								</button>
								{sheetMenuOpen && canDup && (
									<>
										<div
											className="fixed inset-0 z-20"
											onClick={() =>
												setSheetMenuOpen(false)
											}
										/>
										<div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-soft-lg">
											<p className="px-3 py-1 font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
												Add to sheet
											</p>
											<div className="max-h-56 overflow-y-auto">
												{sheets.map((s) => (
													<button
														key={s.id}
														onClick={() =>
															addVizFromQuery(
																selectedVizId,
																s.id,
															)
														}
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
															activeSheetId && (
															<span className="text-[10px] text-stone-400">
																current
															</span>
														)}
													</button>
												))}
											</div>
											<div className="mt-1 border-stone-100 border-t pt-1">
												<button
													onClick={() =>
														addVizFromQuery(
															selectedVizId,
															"new",
														)
													}
													className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-semibold text-[13px] text-indigo-600 hover:bg-indigo-50"
												>
													<Plus className="h-3.5 w-3.5" />{" "}
													New sheet
												</button>
											</div>
										</div>
									</>
								)}
							</div>
						);
					})()}
					{/* Build / Layout mode toggle (merged into the toolbar) */}
					<div className="inline-flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
						<button
							onClick={() => setEditorTab("visualize")}
							className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-colors ${editorTab === "visualize" ? "bg-white text-stone-800 shadow-soft" : "text-stone-500 hover:text-stone-700"}`}
						>
							Build
							<span className="text-[10px] text-stone-400 tabular-nums">
								{visualizations.length}
							</span>
						</button>
						<button
							onClick={() => setEditorTab("layout")}
							className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-colors ${editorTab === "layout" ? "bg-white text-stone-800 shadow-soft" : "text-stone-500 hover:text-stone-700"}`}
						>
							Layout
							<span className="text-[10px] text-stone-400 tabular-nums">
								{visibleLayout.length}
							</span>
						</button>
					</div>
					<div className="mx-1 h-5 w-px bg-stone-200" />
					<button
						onClick={() => setMode("view")}
						disabled={saving}
						className={buttonClasses("secondary", "sm")}
					>
						Cancel
					</button>
					<button
						onClick={() => void handleSaveClick()}
						disabled={saving || validating}
						className={buttonClasses("primary", "sm")}
					>
						<Save className="h-3.5 w-3.5" />
						{validating ? "Checking…" : saving ? "Saving…" : "Save"}
					</button>
				</div>

				{/* ── Body ── */}
				<div className="flex min-h-0 flex-1 flex-col bg-white">
					{/* ── Visualize tab ── */}
					{editorTab === "visualize" && (
						<div className="flex min-h-0 flex-1 flex-col">
							{/* Visualization strip */}
							<div className="flex h-10 flex-shrink-0 items-stretch gap-1 overflow-x-auto border-stone-200 border-b bg-stone-50/60 px-2">
								{visualizations.map((viz) => {
									const active = viz.id === selectedVizId;
									const inL = layout.some(
										(l) => l.vizId === viz.id,
									);
									const VizIcon =
										VIZ_TYPE_META[viz.visualizationType]
											?.icon ?? BarChart2;
									return (
										<div
											key={viz.id}
											onClick={() =>
												setSelectedVizId(viz.id)
											}
											onDoubleClick={() => {
												setSelectedVizId(viz.id);
												setEditingVizId(viz.id);
											}}
											title="Double-click to rename"
											className={`group my-1.5 inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs transition-colors ${active ? "border border-stone-200 bg-white font-semibold text-indigo-700 shadow-soft" : "text-stone-500 hover:bg-white/70 hover:text-stone-700"}`}
										>
											<VizIcon
												className={`h-3.5 w-3.5 flex-shrink-0 ${active ? "text-indigo-500" : "text-stone-400"}`}
											/>
											{editingVizId === viz.id ? (
												<input
													autoFocus
													value={viz.title}
													onChange={(e) =>
														updateViz(viz.id, {
															title: e.target
																.value,
														})
													}
													onClick={(e) =>
														e.stopPropagation()
													}
													onBlur={() =>
														setEditingVizId(null)
													}
													onKeyDown={(e) => {
														if (
															e.key === "Enter" ||
															e.key === "Escape"
														) {
															e.preventDefault();
															setEditingVizId(
																null,
															);
														}
													}}
													placeholder="Untitled"
													className="w-28 rounded border border-indigo-300 bg-white px-1 py-0 font-semibold text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
												/>
											) : (
												<span className="max-w-[120px] truncate">
													{viz.title || "Untitled"}
												</span>
											)}
											{active &&
												editingVizId !== viz.id && (
													<button
														onClick={(e) => {
															e.stopPropagation();
															setEditingVizId(
																viz.id,
															);
														}}
														className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:text-indigo-600"
														title="Rename visualization"
													>
														<Pencil className="h-3 w-3" />
													</button>
												)}
											{inL && (
												<span
													className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"
													title="In layout"
												/>
											)}
											{visualizations.length > 1 && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														removeViz(viz.id);
													}}
													className="-mr-1 flex-shrink-0 rounded p-0.5 text-stone-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
												>
													<X className="h-3 w-3" />
												</button>
											)}
										</div>
									);
								})}
								<button
									onClick={addViz}
									className="my-1.5 inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-stone-300 border-dashed px-2.5 font-medium text-stone-500 text-xs transition-colors hover:border-indigo-300 hover:bg-white/70 hover:text-indigo-600"
								>
									<Plus className="h-3.5 w-3.5" /> Add
								</button>
							</div>

							{/* VizEditor — full width */}
							<div className="min-h-0 min-w-0 flex-1">
								{selectedViz ? (
									(() => {
										const qKey =
											selectedViz.queryId ??
											selectedViz.id;
										const allVizsFlat = sheets.flatMap(
											(s) => s.visualizations,
										);
										const queryUsage: Record<
											string,
											number
										> = {};
										for (const v of allVizsFlat)
											if (v.queryId)
												queryUsage[v.queryId] =
													(queryUsage[v.queryId] ??
														0) + 1;
										return (
											<VizCard
												key={selectedViz.id}
												viz={selectedViz}
												queries={queries}
												queryUsage={queryUsage}
												databases={databases}
												testResult={testResults[qKey]}
												testLoading={
													!!testLoading[qKey]
												}
												inLayout={layout.some(
													(l) =>
														l.vizId ===
														selectedViz.id,
												)}
												onUpdate={(patch) =>
													updateViz(
														selectedViz.id,
														patch,
													)
												}
												onUpdateQuery={updateQuery}
												onCreateQuery={createQuery}
												onDeleteQuery={deleteQuery}
												onSelectQuery={(qid) =>
													updateViz(selectedViz.id, {
														queryId: qid,
													})
												}
												onAddToLayout={() =>
													addToLayout(selectedViz.id)
												}
												onTestQuery={() =>
													void runTest(selectedViz.id)
												}
												siblings={sheets
													.flatMap((s) =>
														s.visualizations.map(
															(v) => ({
																v,
																sheetName:
																	s.name,
															}),
														),
													)
													.filter(
														({ v }) =>
															v.id !==
															selectedViz.id,
													)
													.map(
														({ v, sheetName }) => ({
															id: v.id,
															title: v.title,
															visualizationType:
																v.visualizationType,
															sheetName,
															columns:
																vizConfigColumns(
																	v,
																),
															queryName: v.queryId
																? queries.find(
																		(q) =>
																			q.id ===
																			v.queryId,
																	)?.name
																: undefined,
														}),
													)}
											/>
										);
									})()
								) : (
									<div className="flex h-full items-center justify-center text-sm text-stone-400">
										Select a visualization to edit
									</div>
								)}
							</div>
						</div>
					)}

					{/* ── Layout tab — flexlayout-react canvas ── */}
					{editorTab === "layout" && (
						<div className="relative min-h-0 flex-1">
							{/* Canvas — fills all space except the 52px footer */}
							<div className="absolute inset-0 bottom-[52px]">
								{visibleLayout.length === 0 ? (
									<div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-stone-400">
										<p>
											No visualizations in the layout yet.
										</p>
										<p className="text-xs">
											Add visualizations and click "Add to
											Layout" to start arranging.
										</p>
									</div>
								) : (
									<Layout
										model={getFlexModel()}
										factory={(node: TabNode) => {
											const cfg = node.getConfig() as
												| { vizId?: string }
												| undefined;
											const viz = visualizations.find(
												(v) => v.id === cfg?.vizId,
											);
											if (!viz)
												return (
													<div className="flex h-full items-center justify-center text-stone-400 text-xs">
														Viz not found
													</div>
												);
											const raw =
												testResults[
													viz.queryId ?? viz.id
												];
											const headers: string[] =
												raw?.headers ?? [];
											const values: any[][] =
												raw?.values ?? [];
											const preloadedData = headers.length
												? values.map((row) => {
														const obj: any = {};
														headers.forEach(
															(h, i) => {
																obj[h] = row[i];
															},
														);
														return obj;
													})
												: undefined;
											return preloadedData ? (
												<div className="h-full">
													<ChartPreview
														visualizationType={
															viz.visualizationType
														}
														config={viz.config}
														data={preloadedData}
														height="100%"
														filterDefaultValues={
															viz.config
																?.filterDefaultValues
														}
														onFilterDefaultValuesChange={(
															values,
														) =>
															updateViz(viz.id, {
																config: {
																	...(viz.config ??
																		{}),
																	filterDefaultValues:
																		values,
																},
															})
														}
													/>
												</div>
											) : (
												<div className="flex h-full flex-col items-center justify-center gap-1.5 bg-stone-50/80 text-stone-400">
													<p className="max-w-[80%] truncate px-2 text-center font-semibold text-stone-600 text-xs">
														{viz.title ||
															"Untitled"}
													</p>
													<p className="text-[10px]">
														Run query to preview
													</p>
												</div>
											);
										}}
										onModelChange={(
											model: Model,
											action?: { type?: string },
										) => {
											// Tab selection / active-tabset / maximize are view-only — don't
											// mark dirty or bake them into the saved layout.
											if (isViewOnlyLayoutAction(action))
												return;
											const flexLayout =
												model.toJson() as unknown as Record<
													string,
													unknown
												>;
											updateActiveSheet((s) => ({
												...s,
												flexLayout,
											}));
											flexModelCacheRef.current[
												activeSheetId
											] = model;
										}}
										onRenderTab={(node, rv) => {
											const vizId = (
												node.getConfig() as
													| { vizId?: string }
													| undefined
											)?.vizId;
											if (!vizId) return;
											const viz = visualizations.find(
												(v) => v.id === vizId,
											);
											if (viz?.phi) {
												rv.content = (
													<span
														data-pii="true"
														style={{
															display: "contents",
														}}
													>
														{rv.content}
													</span>
												);
											} else if (viz?.tabColor) {
												rv.content = (
													<span
														data-tab-id={vizId}
														style={{
															display: "contents",
														}}
													>
														{rv.content}
													</span>
												);
											}
										}}
									/>
								)}
							</div>
							{/* Footer: hint only — Save lives in the toolbar (matches the main editor) */}
							<div className="absolute right-0 bottom-0 left-0 flex h-[52px] items-center gap-2 border-stone-200 border-t bg-white px-5 shadow-[0_-2px_6px_rgba(0,0,0,0.04)]">
								<p className="text-stone-400 text-xs">
									Drag panels to resize &amp; rearrange ·
									changes save when you click “Save” above
								</p>
							</div>
						</div>
					)}
				</div>

				{/* ── Sheet tab bar — shared with the main app editor ── */}
				<SheetTabs
					sheets={sheets}
					activeId={activeSheetId}
					onSelect={switchSheet}
					onRename={(id, name) =>
						setSheets((prev) =>
							prev.map((s) => (s.id === id ? { ...s, name } : s)),
						)
					}
					onColorChange={(id, color) =>
						setSheets((prev) =>
							prev.map((s) =>
								s.id === id ? { ...s, color } : s,
							),
						)
					}
					onAdd={addSheet}
					onDelete={(id) => {
						setSheets((prev) => prev.filter((s) => s.id !== id));
						if (id === activeSheetId) {
							const remaining = sheets.filter((s) => s.id !== id);
							if (remaining.length) switchSheet(remaining[0].id);
						}
					}}
				/>
			</div>
		</DashboardFilterProvider>
	);
}

// ── VizCard (step-based editor) ───────────────────────────────────────────────
interface VizCardProps {
	viz: Visualization;
	queries: DashboardQuery[];
	queryUsage: Record<string, number>;
	databases: Database[];
	testResult: any;
	testLoading: boolean;
	inLayout: boolean;
	onUpdate: (patch: Partial<Visualization>) => void;
	onUpdateQuery: (queryId: string, patch: Partial<DashboardQuery>) => void;
	onCreateQuery: (init?: Partial<DashboardQuery>) => DashboardQuery;
	onDeleteQuery: (queryId: string) => void;
	onSelectQuery: (queryId: string) => void;
	onAddToLayout: () => void;
	onTestQuery: () => void;
	siblings: {
		id: string;
		title: string;
		visualizationType: string;
		sheetName?: string;
		queryName?: string;
	}[];
}

function VizCard({
	viz,
	queries,
	queryUsage,
	databases,
	testResult,
	testLoading,
	inLayout,
	onUpdate,
	onUpdateQuery,
	onCreateQuery,
	onDeleteQuery,
	onSelectQuery,
	onAddToLayout,
	onTestQuery,
	siblings,
}: VizCardProps) {
	// Authoritative column types come from the database METAMODEL (the schema), not
	// a raw SQL query's headerInfo (engines often report all-STRING for raw SQL).
	const [metaTypes, setMetaTypes] = useState<Record<string, string>>({});
	const metaDbId = viz.queryId
		? (queries.find((q) => q.id === viz.queryId)?.databaseId ??
			viz.databaseId)
		: viz.databaseId;
	useEffect(() => {
		if (!metaDbId) return;
		let cancelled = false;
		runPixel(
			`GetDatabaseMetamodel(database=["${metaDbId}"], options=["dataTypes","logicalNames"]);`,
		)
			.then((out: any) => {
				const dt = out?.dataTypes ?? out?.data?.dataTypes ?? {};
				const logical =
					out?.logicalNames ?? out?.data?.logicalNames ?? {};
				// Case-insensitive map keyed by full "CONCEPT__PROP", bare "PROP", and logical aliases.
				const map: Record<string, string> = {};
				const put = (k: unknown, v: string) => {
					if (k != null && k !== "") map[String(k).toLowerCase()] = v;
				};
				for (const [k, v] of Object.entries(dt)) {
					const type = String(v);
					put(k, type);
					put(
						k.includes("__")
							? k.split("__").slice(1).join("__")
							: k,
						type,
					);
					(Array.isArray(logical[k]) ? logical[k] : []).forEach(
						(alias: string) => put(alias, type),
					);
				}
				if (!cancelled) setMetaTypes(map);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [metaDbId]);

	// The viz's effective data source: the bound shared query, else embedded fields.
	const boundQuery = viz.queryId
		? queries.find((q) => q.id === viz.queryId)
		: undefined;
	const vizForEditor: Visualization = boundQuery
		? {
				...viz,
				databaseId: boundQuery.databaseId,
				databaseName: boundQuery.databaseName,
				query: boundQuery.query,
				parameters: boundQuery.parameters,
			}
		: viz;

	// Split editor patches: query fields update the shared query; everything else
	// stays on the viz. Lazily create + bind a query on first query-field edit.
	const QUERY_FIELDS = [
		"databaseId",
		"databaseName",
		"query",
		"parameters",
	] as const;
	const handleEditorUpdate = (patch: Partial<Visualization>) => {
		const queryPatch: Partial<DashboardQuery> = {};
		const vizPatch: Partial<Visualization> = {};
		for (const [k, v] of Object.entries(patch)) {
			if ((QUERY_FIELDS as readonly string[]).includes(k))
				(queryPatch as any)[k] = v;
			else (vizPatch as any)[k] = v;
		}
		if (Object.keys(queryPatch).length) {
			if (viz.queryId) {
				onUpdateQuery(viz.queryId, queryPatch);
			} else {
				const created = onCreateQuery({
					name: `Query ${queries.length + 1}`,
					databaseId: viz.databaseId,
					databaseName: viz.databaseName,
					query: viz.query,
					parameters: viz.parameters,
					...queryPatch,
				});
				vizPatch.queryId = created.id;
			}
		}
		if (Object.keys(vizPatch).length) onUpdate(vizPatch);
	};

	const onNewQuery = () => {
		const created = onCreateQuery({ name: `Query ${queries.length + 1}` });
		onSelectQuery(created.id);
	};
	const onRenameQuery = (queryName: string) => {
		if (viz.queryId) onUpdateQuery(viz.queryId, { name: queryName });
	};

	const queriesForPicker = queries.map((q) => ({
		id: q.id,
		name: q.name,
		paramCount: q.parameters.length,
		usageCount: queryUsage[q.id] ?? 0,
	}));

	const liveHeaders: string[] = testResult?.headers ?? [];
	const rawValues: unknown[][] = testResult?.values ?? [];
	const previewData = rawValues.map((row) => {
		const obj: any = {};
		liveHeaders.forEach((h, i) => {
			obj[h] = (row as any[])[i];
		});
		return obj;
	});
	const headerInfoTypes: Record<string, string> = {};
	(testResult?.headerInfo ?? []).forEach(
		(info: { header: string; type: string }) => {
			headerInfoTypes[info.header] = info.type;
		},
	);
	const savedTypes = viz.config?.columnTypes ?? {};
	// Columns ALWAYS come from the query result (or saved columns when there's no
	// live result) — never from the metamodel, which lists EVERY column in the whole
	// database. metaTypes is only a type lookup below.
	let headers = liveHeaders;
	if (!headers.length) {
		headers = [
			...new Set([
				...(viz.config?.tableColumns ?? []),
				...Object.keys(savedTypes),
			]),
		];
	}
	return (() => {
		// Resolve each column's type: metamodel (schema) → live headerInfo → saved → infer.
		const metaLookup = (h: string): string | undefined => {
			const low = (h ?? "").toLowerCase();
			const bare = low.includes("__")
				? low.split("__").pop()!
				: low.includes(".")
					? low.split(".").pop()!
					: low;
			return metaTypes[low] ?? metaTypes[bare];
		};
		const resolveType = (h: string): string => {
			for (const src of [
				metaLookup(h),
				headerInfoTypes[h],
				savedTypes[h],
			]) {
				if (!src) continue;
				const n = normalizeDataType(src);
				if (n !== "STRING") return n;
			}
			if (previewData.length) {
				const inferred = inferColumnType(previewData.map((r) => r[h]));
				if (inferred !== "STRING") return inferred;
			}
			return "STRING";
		};
		const typeMap: Record<string, string> = Object.fromEntries(
			headers.map((h) => [h, resolveType(h)]),
		);
		const columns: Column[] = headers.map((h) => ({
			name: h,
			dataType: typeMap[h],
		}));

		// Convert viz.config → DropZoneDataWithTable (same logic as NewDashboardPage)
		const getDropZoneData = (): DropZoneDataWithTable => {
			const data: DropZoneDataWithTable = {
				styling: viz.config?.styling,
			} as DropZoneDataWithTable;
			const vt = viz.visualizationType;
			if (vt === "kpi") {
				if (viz.config?.yKeys?.length)
					data.metrics = viz.config.yKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							viz.config?.columnAggregations?.[name] ||
							viz.config?.kpiAggregation ||
							"sum",
					}));
			} else if (vt === "pie") {
				if (viz.config?.xKey)
					data.name = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const c = viz.config.yKeys[0];
					data.value = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[c] ||
								(typeMap[c] === "NUMBER" ? "sum" : "count"),
						},
					];
				}
			} else if (vt === "treemap") {
				if (viz.config?.xKey)
					data.name = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const c = viz.config.yKeys[0];
					data.size = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[c] ||
								(typeMap[c] === "NUMBER" ? "sum" : "count"),
						},
					];
				}
			} else if (vt === "pivot") {
				if (viz.config?.xKey)
					data.groupBy = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.length)
					data.values = viz.config.yKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							viz.config?.columnAggregations?.[name] || "sum",
					}));
			} else if (vt === "table") {
				// Empty by default — the user assigns columns manually.
				data.tableColumns = viz.config?.tableColumns ?? [];
				data.columnAggregations = viz.config?.columnAggregations;
			} else if (vt === "heatmap") {
				// Heatmap: xAxis → xKey, yAxis → heatmapYKey, value → yKeys[0]
				if (viz.config?.xKey)
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.heatmapYKey)
					data.yAxis = [
						{
							name: viz.config.heatmapYKey,
							dataType:
								typeMap[viz.config.heatmapYKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.value = [
						{
							name: colName,
							dataType: typeMap[colName] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								"sum",
						},
					];
				}
			} else if (vt === "worldmap") {
				// World Map: label, latitude, longitude (required) + size/color/tooltip (optional)
				if (viz.config?.label)
					data.label = [
						{
							name: viz.config.label,
							dataType: typeMap[viz.config.label] || "STRING",
						},
					];
				if (viz.config?.latitudeKey)
					data.latitude = [
						{
							name: viz.config.latitudeKey,
							dataType:
								typeMap[viz.config.latitudeKey] || "NUMBER",
						},
					];
				if (viz.config?.longitudeKey)
					data.longitude = [
						{
							name: viz.config.longitudeKey,
							dataType:
								typeMap[viz.config.longitudeKey] || "NUMBER",
						},
					];
				if (viz.config?.size) {
					const c = viz.config.size;
					data.size = [
						{
							name: c,
							dataType: typeMap[c] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[c] ||
								(typeMap[c] === "NUMBER" ? "sum" : "count"),
						},
					];
				}
				if (viz.config?.color)
					data.color = [
						{
							name: viz.config.color,
							dataType: typeMap[viz.config.color] || "STRING",
						},
					];
			} else if (vt === "wordcloud") {
				// Word Cloud: words (xKey), size (yKeys[0]), tooltip (optional)
				if (viz.config?.xKey)
					data.words = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const c = viz.config.yKeys[0];
					data.size = [
						{
							name: c,
							dataType: typeMap[c] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[c] ||
								(typeMap[c] === "NUMBER" ? "sum" : "count"),
						},
					];
				}
				if (viz.config?.tooltip) {
					const c = viz.config.tooltip;
					data.tooltip = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.tooltipAggregation ||
								viz.config?.columnAggregations?.[c] ||
								"count",
						},
					];
				}
			} else if (vt === "bubble") {
				// Bubble: bubbles (xKey), size (yKeys[0]), tooltip (optional)
				if (viz.config?.xKey)
					data.bubbles = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const c = viz.config.yKeys[0];
					data.size = [
						{
							name: c,
							dataType: typeMap[c] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[c] ||
								(typeMap[c] === "NUMBER" ? "sum" : "count"),
						},
					];
				}
				if (viz.config?.tooltip) {
					const c = viz.config.tooltip;
					data.tooltip = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.tooltipAggregation ||
								viz.config?.columnAggregations?.[c] ||
								"count",
						},
					];
				}
			} else if (vt === "multiline") {
				// Multi-Line: xAxis → xKey, yAxis → yKeys[0], category → categoryKey
				if (viz.config?.xKey)
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.yAxis = [
						{
							name: colName,
							dataType: typeMap[colName] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								(typeMap[colName] === "NUMBER"
									? "sum"
									: "count"),
						},
					];
				}
				if (viz.config?.categoryKey)
					data.category = [
						{
							name: viz.config.categoryKey,
							dataType:
								typeMap[viz.config.categoryKey] || "STRING",
						},
					];
				if (viz.config?.tooltip) {
					const c = viz.config.tooltip;
					data.tooltip = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.tooltipAggregation ||
								viz.config?.columnAggregations?.[c] ||
								"count",
						},
					];
				}
			} else if (vt === "scatter") {
				// Scatter: label, xAxis, yAxis, size, color
				const numAgg = (colName: string) => ({
					name: colName,
					dataType: typeMap[colName] || "STRING",
					aggregation:
						viz.config?.columnAggregations?.[colName] ||
						(typeMap[colName] === "NUMBER" ? "avg" : "count"),
				});
				if (viz.config?.label)
					data.label = [
						{
							name: viz.config.label,
							dataType: typeMap[viz.config.label] || "STRING",
						},
					];
				if (viz.config?.xKey) data.xAxis = [numAgg(viz.config.xKey)];
				if (viz.config?.yKeys?.[0])
					data.yAxis = [numAgg(viz.config.yKeys[0])];
				if (viz.config?.size) data.size = [numAgg(viz.config.size)];
				if (viz.config?.color)
					data.color = [
						{
							name: viz.config.color,
							dataType: typeMap[viz.config.color] || "STRING",
						},
					];
			} else if (vt === "sunburst") {
				// Sunburst: levels (multi-column hierarchy) + value
				data.levels = (viz.config?.sunburstLevels ?? []).map(
					(name) => ({
						name,
						dataType: typeMap[name] || "STRING",
					}),
				);
				if (viz.config?.yKeys?.[0]) {
					const c = viz.config.yKeys[0];
					data.value = [
						{
							name: c,
							dataType: typeMap[c] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[c] ||
								(typeMap[c] === "NUMBER" ? "sum" : "count"),
						},
					];
				}
			} else {
				if (viz.config?.xKey)
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.length)
					data.yAxis = viz.config.yKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							viz.config?.columnAggregations?.[name] ||
							(typeMap[name] === "NUMBER" ? "avg" : "count"),
					}));
			}
			// Stacked bar: facet (stack-by) column → distinct values become stacks.
			if (vt === "stackbar" && viz.config?.facetKey) {
				data.facet = [
					{
						name: viz.config.facetKey,
						dataType: typeMap[viz.config.facetKey] || "STRING",
					},
				];
			}
			return data;
		};

		// Convert DropZoneDataWithTable → viz.config patch
		const handleDropZoneChange = (data: DropZoneDataWithTable) => {
			const vt = viz.visualizationType;
			const newCfg: VisualizationConfig = {
				...(viz.config ?? {}),
				styling: data.styling,
			};
			if (vt === "kpi") {
				newCfg.yKeys = data.metrics?.map((c: any) => c.name) || [];
				newCfg.columnAggregations = {};
				data.metrics?.forEach((c: any) => {
					if (c.aggregation)
						newCfg.columnAggregations![c.name] = c.aggregation;
				});
				if (data.metrics?.[0]?.aggregation)
					newCfg.kpiAggregation = data.metrics[0].aggregation as any;
			} else if (vt === "pie") {
				newCfg.xKey = data.name?.[0]?.name || "";
				newCfg.yKeys = data.value?.[0] ? [data.value[0].name] : [];
			} else if (vt === "treemap") {
				newCfg.xKey = data.name?.[0]?.name || "";
				newCfg.yKeys = data.size?.[0] ? [data.size[0].name] : [];
			} else if (vt === "pivot") {
				// Pivot: rows → pivotRows, columns → pivotColumns, values → pivotValues
				newCfg.pivotRows = data.rows?.map((c: any) => c.name) || [];
				newCfg.pivotColumns =
					data.columns?.map((c: any) => c.name) || [];
				newCfg.pivotValues = data.values?.map((c: any) => c.name) || [];
				newCfg.columnAggregations = {};
				data.values?.forEach((c: any) => {
					if (c.aggregation)
						newCfg.columnAggregations![c.name] = c.aggregation;
				});
				// Mirror to legacy yKeys for any code still reading it
				newCfg.yKeys = newCfg.pivotValues;
			} else if (vt === "table") {
				newCfg.tableColumns = data.tableColumns;
				newCfg.columnAggregations = data.columnAggregations ?? {};
			} else if (vt === "heatmap") {
				newCfg.xKey = data.xAxis?.[0]?.name || "";
				newCfg.heatmapYKey = data.yAxis?.[0]?.name || "";
				newCfg.yKeys = data.value?.[0] ? [data.value[0].name] : [];
				newCfg.columnAggregations = {};
				if (data.value?.[0]?.aggregation)
					newCfg.columnAggregations[data.value[0].name] =
						data.value[0].aggregation;
			} else if (vt === "worldmap") {
				// World Map: label, latitudeKey, longitudeKey + optional size (with aggregation) / color / tooltip
				newCfg.label = data.label?.[0]?.name || "";
				newCfg.latitudeKey = data.latitude?.[0]?.name || "";
				newCfg.longitudeKey = data.longitude?.[0]?.name || "";
				newCfg.size = data.size?.[0]?.name || "";
				newCfg.color = data.color?.[0]?.name || "";
				newCfg.columnAggregations = {};
				if (data.size?.[0]?.aggregation)
					newCfg.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				if (data.tooltip?.[0]) {
					newCfg.tooltip = data.tooltip[0].name;
					newCfg.tooltipAggregation =
						(data.tooltip[0].aggregation as any) || "count";
					newCfg.columnAggregations[data.tooltip[0].name] =
						data.tooltip[0].aggregation || "count";
				} else {
					newCfg.tooltip = undefined;
					newCfg.tooltipAggregation = undefined;
				}
				// Clear unused linear-chart fields so saved config stays clean
				newCfg.xKey = "";
				newCfg.yKeys = [];
			} else if (vt === "multiline") {
				// Multi-Line: xAxis → xKey, yAxis → yKeys[0], category → categoryKey
				newCfg.xKey = data.xAxis?.[0]?.name || "";
				newCfg.yKeys = data.yAxis?.[0] ? [data.yAxis[0].name] : [];
				newCfg.categoryKey = data.category?.[0]?.name || "";
				newCfg.tooltip = data.tooltip?.[0]?.name || "";
				newCfg.tooltipAggregation =
					data.tooltip?.[0]?.aggregation || "count";
				newCfg.columnAggregations = {};
				if (data.yAxis?.[0]?.aggregation)
					newCfg.columnAggregations[data.yAxis[0].name] =
						data.yAxis[0].aggregation;
				if (data.tooltip?.[0]?.aggregation)
					newCfg.columnAggregations[data.tooltip[0].name] =
						data.tooltip[0].aggregation;
			} else if (vt === "wordcloud") {
				// Word Cloud: words → xKey, size → yKeys[0] + columnAggregations, optional tooltip
				newCfg.xKey = data.words?.[0]?.name || "";
				newCfg.yKeys = data.size?.[0] ? [data.size[0].name] : [];
				newCfg.columnAggregations = {};
				if (data.size?.[0]?.aggregation)
					newCfg.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				if (data.tooltip?.[0]) {
					newCfg.tooltip = data.tooltip[0].name;
					newCfg.tooltipAggregation =
						(data.tooltip[0].aggregation as any) || "count";
					newCfg.columnAggregations[data.tooltip[0].name] =
						data.tooltip[0].aggregation || "count";
				} else {
					newCfg.tooltip = undefined;
					newCfg.tooltipAggregation = undefined;
				}
				// Clear fields only used by other chart types
				newCfg.label = "";
				newCfg.size = "";
				newCfg.color = "";
				newCfg.latitudeKey = "";
				newCfg.longitudeKey = "";
			} else if (vt === "bubble") {
				// Bubble: bubbles → xKey, size → yKeys[0] + columnAggregations, optional tooltip
				newCfg.xKey = data.bubbles?.[0]?.name || "";
				newCfg.yKeys = data.size?.[0] ? [data.size[0].name] : [];
				newCfg.columnAggregations = {};
				if (data.size?.[0]?.aggregation)
					newCfg.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				if (data.tooltip?.[0]) {
					newCfg.tooltip = data.tooltip[0].name;
					newCfg.tooltipAggregation =
						(data.tooltip[0].aggregation as any) || "count";
					newCfg.columnAggregations[data.tooltip[0].name] =
						data.tooltip[0].aggregation || "count";
				} else {
					newCfg.tooltip = undefined;
					newCfg.tooltipAggregation = undefined;
				}
				// Clear fields only used by other chart types
				newCfg.label = "";
				newCfg.size = "";
				newCfg.color = "";
				newCfg.latitudeKey = "";
				newCfg.longitudeKey = "";
			} else if (vt === "scatter") {
				// Scatter: label, xAxis, yAxis, size, color
				newCfg.label = data.label?.[0]?.name || "";
				newCfg.xKey = data.xAxis?.[0]?.name || "";
				newCfg.yKeys = data.yAxis?.[0] ? [data.yAxis[0].name] : [];
				newCfg.size = data.size?.[0]?.name || "";
				newCfg.color = data.color?.[0]?.name || "";
				newCfg.columnAggregations = {};
				[data.xAxis?.[0], data.yAxis?.[0], data.size?.[0]].forEach(
					(c: any) => {
						if (c?.aggregation)
							newCfg.columnAggregations![c.name] = c.aggregation;
					},
				);
			} else if (vt === "sunburst") {
				// Sunburst: hierarchy levels + value column
				newCfg.sunburstLevels =
					data.levels?.map((c: any) => c.name) || [];
				newCfg.yKeys = data.value?.[0] ? [data.value[0].name] : [];
				newCfg.columnAggregations = {};
				if (data.value?.[0]?.aggregation)
					newCfg.columnAggregations![data.value[0].name] =
						data.value[0].aggregation;
				newCfg.xKey = "";
			} else {
				newCfg.xKey = data.xAxis?.[0]?.name || "";
				newCfg.yKeys = data.yAxis?.map((c: any) => c.name) || [];
				newCfg.columnAggregations = {};
				data.yAxis?.forEach((c: any) => {
					if (c.aggregation)
						newCfg.columnAggregations![c.name] = c.aggregation;
				});
			}
			// Stacked bar: facet (stack-by) column.
			if (vt === "stackbar") {
				newCfg.facetKey = (data as any).facet?.[0]?.name || undefined;
			}
			onUpdate({ config: newCfg });
		};

		return (
			<VizEditor
				viz={vizForEditor}
				onUpdate={handleEditorUpdate as any}
				queries={queriesForPicker}
				boundQueryId={viz.queryId}
				onSelectQuery={onSelectQuery}
				onNewQuery={onNewQuery}
				onRenameQuery={onRenameQuery}
				onDeleteQuery={onDeleteQuery}
				typeOptions={VIZ_TYPE_OPTIONS.map((o) => ({
					value: o.value as string,
					label: o.label,
				}))}
				databases={databases.map((d) => ({
					id: d.app_id,
					label:
						d.engine_display_name ??
						d.engine_name ??
						d.app_name ??
						d.app_id,
				}))}
				columns={columns}
				dropZoneData={getDropZoneData()}
				onDropZoneChange={handleDropZoneChange}
				onRunQuery={onTestQuery}
				running={testLoading}
				rowCount={
					testResult && !testResult.error ? rawValues.length : null
				}
				queryError={testResult?.error ?? null}
				hasData={previewData.length > 0}
				renderPreview={() => (
					<ChartPreview
						visualizationType={viz.visualizationType}
						config={viz.config}
						data={previewData}
						height="100%"
						filterDefaultValues={viz.config?.filterDefaultValues}
						onFilterDefaultValuesChange={(values) =>
							onUpdate({
								config: {
									...(viz.config ?? {}),
									filterDefaultValues: values,
								},
							})
						}
					/>
				)}
				previewRows={previewData}
				inLayout={inLayout}
				onAddToLayout={onAddToLayout}
				runPixel={runPixel}
				siblings={siblings}
			/>
		);
	})();
}
