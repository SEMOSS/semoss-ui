import { Layout, type Model, type TabNode } from "flexlayout-react";
import {
	ArrowLeft,
	Edit,
	Loader2,
	Share2,
	SlidersHorizontal,
	Trash2,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardVisualization } from "@/components/DashboardVisualization";
import { isParamSatisfied } from "@/components/ParamControl";
import { ParamSheet } from "@/components/ParamSheet";
import { QueryRunnerProvider } from "@/components/QueryRunner";
import { ShareDialog } from "@/components/ShareDialog";
import { Button, buttonClasses, ConfirmDialog } from "@/components/ui";
import { DashboardFilterProvider } from "@/lib/dashboardFilters";
import { isEmbedded } from "@/lib/embed";
import { fullTimestamp, timeAgo } from "@/lib/format";
import { publishedPortalUrl } from "@/lib/portalUrl";
import {
	computeParamGroups,
	ensureParamSheet,
	migrateSheetsToSharedQueries,
	resolveQuery,
} from "@/lib/resolveQuery";
import { useTabColors } from "@/lib/tabColors";
import type { Dashboard, DashboardQuery, Sheet } from "@/types/dashboard";
import {
	buildFlexModel,
	isViewOnlyLayoutAction,
} from "@/utils/dashboardLayout";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

function getDashboardSheets(dashboard: Dashboard): Sheet[] {
	if (dashboard.sheets?.length) return dashboard.sheets;
	return [
		{
			id: "sheet-legacy-1",
			name: "Sheet 1",
			visualizations: dashboard.visualizations ?? [],
			layout: dashboard.layout ?? [],
		},
	];
}

/**
 * One sheet's flexlayout canvas, MEMOIZED. With keep-alive, all visited sheets are
 * mounted at once; without this memo, changing the active sheet re-renders the
 * parent and thus EVERY chart on EVERY sheet. React.memo + referentially-stable
 * props means a sheet switch (which only flips the wrapper's visibility) re-renders
 * NOTHING inside — the charts stay exactly as they were. It re-renders only when its
 * own inputs (params/run for its charts, its sheet, its model) actually change.
 */
interface SheetCanvasProps {
	sheet: Sheet;
	model: Model;
	queries: DashboardQuery[];
	paramValues: Record<string, Record<string, string>>;
	runKeys: Record<string, number>;
	hasParamSheet: boolean;
	makeSaveModel: (sheetId: string) => (model: Model) => void;
}
const SheetCanvas = memo(function SheetCanvas({
	sheet,
	model,
	queries,
	paramValues,
	runKeys,
	hasParamSheet,
	makeSaveModel,
}: SheetCanvasProps) {
	const factory = useCallback(
		(node: TabNode) => {
			const cfg = node.getConfig() as { vizId?: string } | undefined;
			const viz = sheet.visualizations.find((v) => v.id === cfg?.vizId);
			if (!viz)
				return (
					<div className="flex h-full items-center justify-center text-sm text-stone-400">
						Viz not found
					</div>
				);
			const dataSource = resolveQuery(viz, queries);
			const qKey = viz.queryId ?? viz.id;
			const boundQuery = viz.queryId
				? queries.find((q) => q.id === viz.queryId)
				: undefined;
			const loadAfterParams = boundQuery?.loadAfterParams ?? false;
			return (
				<div className="h-full">
					<DashboardVisualization
						visualization={viz}
						dataSource={dataSource}
						parameterValues={paramValues[qKey] ?? {}}
						runKey={runKeys[qKey] ?? 0}
						fillContainer
						hasParamSheet={hasParamSheet}
						loadAfterParams={loadAfterParams}
					/>
				</div>
			);
		},
		[sheet, queries, paramValues, runKeys, hasParamSheet],
	);
	const onModelChange = useMemo(
		() => makeSaveModel(sheet.id),
		[makeSaveModel, sheet.id],
	);
	// Color the FlexLayout tab buttons by each viz's tabColor.
	useTabColors(sheet.visualizations);
	return (
		<Layout
			model={model}
			factory={factory}
			onModelChange={onModelChange}
			onRenderTab={(node, rv) => {
				const vizId = (
					node.getConfig() as { vizId?: string } | undefined
				)?.vizId;
				if (!vizId) return;
				const viz = sheet.visualizations.find((v) => v.id === vizId);
				if (viz?.phi) {
					rv.content = (
						<span
							data-pii="true"
							style={{
								display: "contents",
								color: "#b91c1c",
								fontWeight: 700,
							}}
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
			classNameMapper={(defaultName: string) => defaultName}
		/>
	);
});

// ── DashboardPage ─────────────────────────────────────────────────────────────

export function DashboardPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { getDashboard, loadDashboard, deleteDashboard, updateDashboard } =
		useWorkspace();

	// The listing only carries metadata; load the full definition (sheets) here.
	const meta = id ? getDashboard(id) : undefined;
	const [def, setDef] = useState<Dashboard | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [showShare, setShowShare] = useState(false);
	const dashboard = def ?? meta;
	const sheets = dashboard ? getDashboardSheets(dashboard) : [];

	// Permission (from the listing). Read-only users can't load the working copy
	// (GetAppAssets needs edit access) and get no management actions, so we send
	// them straight to the deployed portal instead of the in-app editor view.
	const perm = String(
		Array.isArray(dashboard?.permission)
			? (dashboard?.permission?.[0] ?? "")
			: (dashboard?.permission ?? ""),
	).toUpperCase();
	const isReadOnly =
		perm === "READ_ONLY" || perm === "VIEWER" || perm === "DISCOVERABLE";
	const canManage = !isReadOnly;
	const canEdit = !isReadOnly;

	useEffect(() => {
		if (id && isReadOnly) window.location.replace(publishedPortalUrl(id));
	}, [id, isReadOnly]);

	const [activeSheetId, setActiveSheetId] = useState<string>("");
	const [paramValues, setParamValues] = useState<
		Record<string, Record<string, string>>
	>({});
	const [runKeys, setRunKeys] = useState<Record<string, number>>({});
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [paramSheetRunning, setParamSheetRunning] = useState(false);

	// Load the definition + initialise sheet/param state once it arrives.
	// Skip for read-only users — they're redirected to the deployed portal.
	useEffect(() => {
		if (!id || isReadOnly) return;
		let cancelled = false;
		setDef(null);
		setLoadError(null);
		loadDashboard(id)
			.then((full) => {
				if (cancelled) return;
				// Migrate legacy embedded queries into shared queries in memory, so even
				// dashboards saved before the shared-query model fetch once per query.
				const { sheets: migratedSheets, queries: migratedQueries } =
					migrateSheetsToSharedQueries(
						getDashboardSheets(full),
						full.queries,
					);
				// View-time synthesis: legacy dashboards saved before the Parameters-sheet
				// feature had no `isParamSheet` sheet, so surface it on the fly so they get
				// the same UX. No-op when one already exists or no query has parameters.
				const finalSheets = ensureParamSheet(
					migratedSheets,
					migratedQueries,
				);
				setDef({
					...full,
					sheets: finalSheets,
					queries: migratedQueries,
				});
				setActiveSheetId(finalSheets[0]?.id ?? "");
				// Parameter state is keyed by the SHARED query id (falling back to the viz
				// id for unbound vizs), so every chart on a query shares one form + one run.
				const initial: Record<string, Record<string, string>> = {};
				for (const q of migratedQueries) {
					initial[q.id] = Object.fromEntries(
						q.parameters.map((p) => [p.name, p.defaultValue]),
					);
				}
				for (const viz of migratedSheets.flatMap(
					(s) => s.visualizations,
				)) {
					if (!viz.queryId) {
						initial[viz.id] = Object.fromEntries(
							viz.parameters.map((p) => [p.name, p.defaultValue]),
						);
					}
				}
				setParamValues(initial);
			})
			.catch(() => {
				// We couldn't load the working copy in-app — this is almost always a
				// read-only/no-edit-access user (GetAppAssets needs edit). Send them to
				// the deployed portal, which serves its own static dashboard.json.
				if (!cancelled && id)
					window.location.replace(publishedPortalUrl(id));
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, isReadOnly]);

	// ── flexlayout model — one per sheet, rebuilt when sheet changes ───────────
	const modelCacheRef = useRef<Record<string, Model>>({});
	const getModel = useCallback((sheet: Sheet): Model => {
		if (!modelCacheRef.current[sheet.id]) {
			modelCacheRef.current[sheet.id] = buildFlexModel(sheet);
		}
		return modelCacheRef.current[sheet.id];
	}, []);

	// NOTE: the flexlayout model is cached per sheet for the lifetime of this mount.
	// We intentionally do NOT invalidate it on re-render: doing so hands a brand-new
	// model to <Layout> on the next render, which remounts every panel and re-runs
	// ALL queries (the bug where running one parameter re-executed every other query).
	// Editing happens on a separate route, so returning here remounts the page and
	// rebuilds the model from the latest store data anyway.

	// ── Debounced save of model JSON back to store (per sheet) ────────────────
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const makeSaveModel = useCallback(
		(sheetId: string) => (model: Model, action?: { type?: string }) => {
			// Tab selection / active-tabset / maximize are view-only — never persist them
			// (saving overwrites the asset via DeleteAsset + PublishAsset). Only real
			// structural edits (move/resize/add/delete) should write back.
			if (isViewOnlyLayoutAction(action)) return;
			if (saveTimer.current) clearTimeout(saveTimer.current);
			saveTimer.current = setTimeout(() => {
				if (!dashboard) return;
				const flexLayout = model.toJson() as unknown as Record<
					string,
					unknown
				>;
				const newSheets = sheets.map((s) =>
					s.id === sheetId ? { ...s, flexLayout } : s,
				);
				// Persist the migrated query registry alongside the sheets so the saved
				// `queryId` references never dangle (they'd still fall back, but stay clean).
				updateDashboard(dashboard.id, {
					sheets: newSheets,
					queries: dashboard.queries,
				});
			}, 400);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[dashboard?.id, sheets],
	);

	// Keep-alive: sheets are mounted on first visit and kept mounted (toggled via
	// CSS) so switching back is instant and never re-runs queries or re-renders
	// every chart from scratch. Track which sheets have been activated.
	const [visitedSheetIds, setVisitedSheetIds] = useState<Set<string>>(
		() => new Set(),
	);
	useEffect(() => {
		if (!activeSheetId) return;
		setVisitedSheetIds((prev) =>
			prev.has(activeSheetId) ? prev : new Set(prev).add(activeSheetId),
		);
	}, [activeSheetId]);

	// ── PERF DIAGNOSTIC (temporary): time a sheet switch from click → painted ──
	const switchStartRef = useRef<number>(0);
	useEffect(() => {
		const t0 = switchStartRef.current;
		if (!t0) return;
		switchStartRef.current = 0;
		// two rAFs ≈ after React commit + browser paint
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				// eslint-disable-next-line no-console
				console.log(
					`[perf] sheet switch → painted in ${(performance.now() - t0).toFixed(0)}ms`,
				);
			}),
		);
	}, [activeSheetId]);

	// ── Param-sheet derivations ────────────────────────────────────────────────
	const hasParamSheet = sheets.some((s) => s.isParamSheet);
	const allQueries = dashboard?.queries ?? [];

	// One group per unique param name across all queries (deduped).
	const paramGroups = useMemo(
		() => computeParamGroups(allQueries),
		[allQueries],
	);

	// Flat param values keyed by param name (taken from the first query in each group).
	const sharedParamValues = useMemo(() => {
		const flat: Record<string, string> = {};
		for (const g of paramGroups) {
			flat[g.name] =
				paramValues[g.queryIds[0]]?.[g.name] ?? g.param.defaultValue;
		}
		return flat;
	}, [paramGroups, paramValues]);

	const allParamsSatisfied = useMemo(
		() =>
			paramGroups.every((g) =>
				isParamSatisfied(g.param, sharedParamValues[g.name] ?? ""),
			),
		[paramGroups, sharedParamValues],
	);

	// Fans a single param-name change out to every query that uses that name.
	const handleSharedParamChange = useCallback(
		(paramName: string, val: string) => {
			setParamValues((prev) => {
				const next = { ...prev };
				for (const q of allQueries) {
					if (q.parameters.some((p) => p.name === paramName)) {
						next[q.id] = {
							...(prev[q.id] ?? {}),
							[paramName]: val,
						};
					}
				}
				return next;
			});
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[allQueries],
	);

	// Bumps runKeys for every parameterized + loadAfterParams query, shows a brief spinner,
	// then navigates to the first non-param sheet so the user sees charts loading.
	const handleRunAll = useCallback(
		() => {
			setParamSheetRunning(true);
			setRunKeys((prev) => {
				const next = { ...prev };
				for (const q of allQueries) {
					if (q.parameters.length > 0 || q.loadAfterParams) {
						next[q.id] = (prev[q.id] ?? 0) + 1;
					}
				}
				return next;
			});
			const firstNonParam = sheets.find((s) => !s.isParamSheet);
			setTimeout(() => {
				if (firstNonParam) setActiveSheetId(firstNonParam.id);
				setParamSheetRunning(false);
			}, 600);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[allQueries, sheets],
	);

	if (isReadOnly) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-3 text-stone-500">
				<Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
				<p className="text-sm">Opening dashboard…</p>
			</div>
		);
	}
	if (loadError) {
		return (
			<div className="py-12 text-center">
				<h2 className="mb-2 font-bold text-2xl text-stone-900">
					Dashboard unavailable
				</h2>
				<p className="mb-4 text-sm text-stone-500">{loadError}</p>
				<Link
					to="/dashboards"
					className="text-indigo-600 hover:text-indigo-700"
				>
					Back to Dashboards
				</Link>
			</div>
		);
	}
	if (!def || !dashboard) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
			</div>
		);
	}

	const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? sheets[0];
	const totalVizCount = sheets.reduce(
		(sum, s) => sum + s.visualizations.length,
		0,
	);
	const hasVizs = (activeSheet?.visualizations.length ?? 0) > 0;
	// Playground/iframe embed → read-only preview: hide the management toolbar.
	const embedded = isEmbedded();
	// (perm / isReadOnly / canManage / canEdit computed above — read-only users are
	//  redirected to the deployed portal, so the code below only runs for editors.)

	return (
		<QueryRunnerProvider>
			<DashboardFilterProvider>
				<div className="flex h-full flex-col gap-3 p-3">
					{/* ── Toolbar — single slim row (hidden in embedded/preview mode) ── */}
					{!embedded && (
						<div className="flex h-14 flex-shrink-0 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 shadow-soft">
							<Link
								to="/dashboards"
								title="Back to dashboards"
								className="-ml-1 flex-shrink-0 rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
							>
								<ArrowLeft className="h-4 w-4" />
							</Link>
							<div className="min-w-0">
								<h1 className="truncate font-bold text-[15px] text-stone-900 leading-tight tracking-tight">
									{dashboard.name}
								</h1>
								<div className="flex items-center gap-1.5 text-[11px] text-stone-400 leading-tight">
									<span>
										{sheets.length} sheet
										{sheets.length !== 1 ? "s" : ""}
									</span>
									<span className="text-stone-300">·</span>
									<span>
										{totalVizCount} chart
										{totalVizCount !== 1 ? "s" : ""}
									</span>
									<span className="text-stone-300">·</span>
									<span
										title={fullTimestamp(
											dashboard.updatedAt,
										)}
									>
										updated {timeAgo(dashboard.updatedAt)}
									</span>
								</div>
							</div>

							<div className="flex-1" />

							<div className="flex flex-shrink-0 items-center gap-1.5">
								{canManage && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => setShowShare(true)}
										title="Manage access & folders"
									>
										<Share2 className="h-3.5 w-3.5" /> Share
									</Button>
								)}
								{canEdit && (
									<Link
										to={`/dashboard/${dashboard.id}/edit`}
										className={buttonClasses(
											"primary",
											"sm",
										)}
									>
										<Edit className="h-3.5 w-3.5" /> Edit
									</Link>
								)}
								{canManage && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setConfirmDelete(true)}
										className="text-stone-400 hover:bg-red-50 hover:text-red-500"
										title="Delete dashboard"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						</div>
					)}

					{/* ── flexlayout-react canvas ── */}
					<div className="relative min-h-0 flex-1">
						{/* Param sheet: rendered directly (not via keep-alive canvas) */}
						{hasParamSheet && activeSheet?.isParamSheet && (
							<div className="absolute inset-0 overflow-auto bg-stone-50 p-6">
								<ParamSheet
									paramGroups={paramGroups}
									values={sharedParamValues}
									onChangeValue={handleSharedParamChange}
									onRunAll={handleRunAll}
									allSatisfied={allParamsSatisfied}
									config={activeSheet.paramSheetConfig}
									isRunning={paramSheetRunning}
								/>
							</div>
						)}
						{!hasVizs && !activeSheet?.isParamSheet && (
							<div className="absolute inset-0 flex items-center justify-center text-stone-400">
								No visualizations in this sheet
							</div>
						)}
						{/* Keep-alive: skip param sheets (they have no visualizations and use
                            their own direct renderer above). For all other visited non-empty
                            sheets, toggle VISIBILITY (not display) so switching is instant. */}
						{sheets
							.filter(
								(s) =>
									!s.isParamSheet &&
									visitedSheetIds.has(s.id) &&
									s.visualizations.length > 0,
							)
							.map((sheet) => {
								const isActive = sheet.id === activeSheetId;
								return (
									<div
										key={sheet.id}
										className="absolute inset-0"
										style={
											isActive
												? {
														visibility: "visible",
														zIndex: 1,
													}
												: {
														visibility: "hidden",
														zIndex: 0,
														pointerEvents: "none",
													}
										}
									>
										<SheetCanvas
											sheet={sheet}
											model={getModel(sheet)}
											queries={dashboard.queries ?? []}
											paramValues={paramValues}
											runKeys={runKeys}
											hasParamSheet={hasParamSheet}
											makeSaveModel={makeSaveModel}
										/>
									</div>
								);
							})}
					</div>

					{/* ── Sheet tab bar ── */}
					{sheets.length > 0 && (
						<div className="flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft">
							<div className="flex items-stretch overflow-x-auto">
								{sheets.map((sheet) => {
									const isActive = sheet.id === activeSheetId;
									const tabColor = sheet.isParamSheet
										? "#6366f1"
										: (sheet.color ?? "#3b82f6");
									return (
										<button
											key={sheet.id}
											onClick={() => {
												if (sheet.id !== activeSheetId)
													switchStartRef.current =
														performance.now();
												setActiveSheetId(sheet.id);
											}}
											className={`-mt-px flex flex-shrink-0 select-none items-center gap-2 border-stone-200 border-t-2 border-r px-5 py-2.5 text-sm transition-colors ${
												isActive
													? "font-semibold text-stone-900"
													: "border-t-transparent text-stone-500 hover:text-stone-700"
											}`}
											style={
												isActive
													? {
															borderTopColor:
																tabColor,
															backgroundColor:
																tabColor + "26",
														}
													: {
															backgroundColor:
																tabColor + "14",
														}
											}
										>
											{sheet.isParamSheet ? (
												<SlidersHorizontal
													className={`h-3 w-3 flex-shrink-0 ${isActive ? "text-indigo-500" : "text-stone-400"}`}
												/>
											) : (
												<span
													className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
													style={{
														backgroundColor:
															tabColor,
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
													{
														sheet.visualizations
															.length
													}
												</span>
											)}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{showShare && (
						<ShareDialog
							dashboard={dashboard}
							onClose={() => setShowShare(false)}
						/>
					)}

					<ConfirmDialog
						open={confirmDelete}
						danger
						title="Delete dashboard?"
						message={
							<>
								<span className="font-medium">
									{dashboard.name}
								</span>{" "}
								will be permanently deleted for everyone it’s
								shared with. This can’t be undone.
							</>
						}
						confirmLabel="Delete dashboard"
						onCancel={() => setConfirmDelete(false)}
						onConfirm={() => {
							setConfirmDelete(false);
							deleteDashboard(dashboard.id);
							navigate("/dashboards");
						}}
					/>
				</div>
			</DashboardFilterProvider>
		</QueryRunnerProvider>
	);
}
