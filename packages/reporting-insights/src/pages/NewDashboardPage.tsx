import {
	Actions,
	DockLocation,
	type ILayoutApi,
	Layout,
	type Model,
	type TabNode,
} from "flexlayout-react";
import {
	ArrowLeft,
	BarChart2,
	BookOpen,
	CopyPlus,
	Globe,
	Loader2,
	Lock,
	Pencil,
	Plus,
	RefreshCw,
	Save,
	Sparkles,
	X,
} from "lucide-react";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useInsight } from "@semoss/sdk-react";
import { AiBuilderModal } from "@/components/AiBuilderModal";
import { DashboardVisualization } from "@/components/DashboardVisualization";
import { SheetTabs } from "@/components/editor/SheetTabs";
import { VizEditor } from "@/components/editor/VizEditor";
import { ParamSheetEditor } from "@/components/ParamSheetEditor";
import { UserSearchSelect } from "@/components/UserSearchSelect";
import { Button, buttonClasses, Input, Select } from "@/components/ui";
import { TagInput } from "@/components/ui/TagInput";
import { useToast } from "@/components/ui/Toast";
import type { Column, DropZoneDataWithTable } from "@/components/VizConfigTabs";
import { DashboardFilterProvider } from "@/lib/dashboardFilters";
import { escapeSqlForPixel } from "@/lib/pixel";
import {
	computeParamGroups,
	ensureParamSheet,
	migrateSheetsToSharedQueries,
	pruneQueries,
	resolveParamDefault,
	resolveQuery,
} from "@/lib/resolveQuery";
import { useTabColors } from "@/lib/tabColors";
import { inferColumnType, normalizeDataType } from "@/lib/tableAggregate";
import { VIZ_TYPE_META } from "@/lib/vizMeta";
import { aiEnabled } from "@/services/aiBuilder";
import {
	type DirectoryUser,
	type GroupInfo,
	getGroups,
	grantProjectGroup,
	grantProjectUser,
	type Role,
} from "@/services/permissionsApi";
import { LANDING_PAGE_TAG } from "@/services/projectStore";
import type {
	ColorPalette as ColorPaletteType,
	ColSpan,
	Dashboard,
	DashboardQuery,
	Database as IDatabase,
	LayoutItem,
	Sheet,
	Visualization,
	VisualizationType,
} from "@/types/dashboard";
import {
	buildFlexModel,
	isViewOnlyLayoutAction,
} from "@/utils/dashboardLayout";
import { vizConfigColumns } from "@/utils/vizColumns";
import { useWorkspace } from "@/workspace/WorkspaceProvider";

const VIZ_TYPES: VisualizationType[] = [
	"kpi",
	"bar",
	"stackbar",
	"line",
	"area",
	"combo",
	"scatter",
	"pie",
	"radar",
	"treemap",
	"pivot",
	"table",
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
	"sunburst",
	"puck",
	"csvexport",
	"filter",
];

const SHEET_COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#f97316",
];

const ACCESS_ROLES: Role[] = ["READ_ONLY", "EDIT", "OWNER"];
const roleLabel = (r: string) =>
	(
		({
			READ_ONLY: "Viewer",
			EDIT: "Editor",
			EDITOR: "Editor",
			OWNER: "Owner",
		}) as Record<string, string>
	)[r] ?? r;

// @ts-expect-error - Reserved for future use
const _COL_SPAN_OPTIONS: { value: ColSpan; label: string }[] = [
	{ value: 3, label: "25%" },
	{ value: 4, label: "33%" },
	{ value: 6, label: "50%" },
	{ value: 12, label: "100%" },
];

function makeVisualization(): Visualization {
	return {
		id: crypto.randomUUID(),
		title: "New Visualization",
		databaseId: "",
		databaseName: "",
		query: "",
		parameters: [],
		visualizationType: "table",
	};
}

function makeSheet(
	name: string,
	color?: string,
	id?: string,
	firstViz?: Visualization,
): Sheet {
	const viz = firstViz ?? makeVisualization();
	return {
		id: id ?? crypto.randomUUID(),
		name,
		color,
		visualizations: [viz],
		layout: [],
	};
}

/** Migrate old dashboard (no sheets) into sheets array */
function initSheets(existingDashboard: Dashboard | undefined): Sheet[] {
	if (!existingDashboard)
		return [makeSheet("Sheet 1", SHEET_COLORS[0], "sheet-1")];

	if (existingDashboard.sheets?.length) return existingDashboard.sheets;

	// Legacy: build one sheet from top-level vizs + layout
	const vizs = existingDashboard.visualizations ?? [];
	const layout = existingDashboard.layout ?? [];
	if (vizs.length) {
		return [
			{
				id: "sheet-1",
				name: "Sheet 1",
				color: SHEET_COLORS[0],
				visualizations: vizs,
				layout,
			},
		];
	}
	return [makeSheet("Sheet 1", SHEET_COLORS[0], "sheet-1")];
}

function collectVizLevelPalettes(sheets: Sheet[]): ColorPaletteType[] {
	const seen = new Set<string>();
	const result: ColorPaletteType[] = [];
	for (const sheet of sheets) {
		for (const viz of sheet.visualizations) {
			for (const p of viz.config?.styling?.customColorPalettes ?? []) {
				if (!seen.has(p.label)) {
					seen.add(p.label);
					result.push(p);
				}
			}
		}
	}
	return result;
}

export function NewDashboardPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { actions } = useInsight();
	const toast = useToast();
	const {
		createDashboard,
		updateDashboard,
		getDashboard,
		loadDashboard,
		folders,
		dashboards,
		isAdmin,
	} = useWorkspace();
	const tagSuggestions = useMemo(
		() => Array.from(new Set(folders.map((f) => f.name))).sort(),
		[folders],
	);

	const isEditing = !!id;
	const existingDashboard = isEditing && id ? getDashboard(id) : undefined;

	// A "new" dashboard may be seeded with an AI-generated draft passed via router
	// state (AI Dashboard Builder). It's un-persisted — the user reviews then saves.
	const location = useLocation();
	const seededDashboard = !isEditing
		? ((location.state as { dashboard?: Dashboard } | null)?.dashboard ??
			undefined)
		: undefined;
	// Source used to seed the editor's initial content (name/description/sheets/queries).
	const seedSource = existingDashboard ?? seededDashboard;

	// The title renames the SEMOSS project (SetProjectDisplayName), which is OWNER-only.
	// A new dashboard's creator is the owner; when editing someone else's, disable the
	// title so non-owners can't attempt a rename. (Unknown permission → allow; the
	// rename is best-effort and fails silently server-side for non-owners.)
	const ownerPerm = String(
		Array.isArray(existingDashboard?.permission)
			? existingDashboard?.permission?.[0]
			: (existingDashboard?.permission ?? ""),
	).toUpperCase();
	const canEditTitle =
		!isEditing ||
		!["EDIT", "EDITOR", "READ_ONLY", "VIEWER", "DISCOVERABLE"].includes(
			ownerPerm,
		);

	const [name, setName] = useState(seedSource?.name ?? "");
	const [description, setDescription] = useState(
		seedSource?.description ?? "",
	);
	const seedTags = (seedSource?.tags ?? []).filter(
		(t) => t !== LANDING_PAGE_TAG,
	);
	const [tags, setTags] = useState<string[]>(seedTags);
	// Mirror tags in a ref so a Save click reads the latest value synchronously —
	// even a tag just committed on blur in the same click (state would be stale).
	const tagsRef = useRef<string[]>(seedTags);
	const applyTags = useCallback((next: string[]) => {
		tagsRef.current = next;
		setTags(next);
	}, []);
	const [saving, setSaving] = useState(false);
	const [showAiModal, setShowAiModal] = useState(false);
	const [showPublishDialog, setShowPublishDialog] = useState(false);
	const [publishVisibility, setPublishVisibility] = useState<
		"public" | "private" | "landing"
	>("public");

	// When Landing Page type is selected, only suggest folders where every dashboard in that folder is also Landing Page type.
	const effectiveTagSuggestions = useMemo(() => {
		if (publishVisibility !== "landing") return tagSuggestions;
		return tagSuggestions.filter((tag) =>
			dashboards
				.filter((d) => (d.tags ?? []).includes(tag))
				.every((d) => (d.tags ?? []).includes(LANDING_PAGE_TAG)),
		);
	}, [publishVisibility, tagSuggestions, dashboards]);
	const [sheetMenuOpen, setSheetMenuOpen] = useState(false);
	// People granted access when creating a PRIVATE dashboard (applied after the
	// project is created, since grants need a real project id).
	const [grants, setGrants] = useState<
		{ id: string; role: Role; name?: string }[]
	>([]);
	const [pendingUser, setPendingUser] = useState<DirectoryUser | null>(null);
	const [addRole, setAddRole] = useState<Role>("READ_ONLY");
	// Teams granted View at creation (applied after the project exists).
	const [teamGrants, setTeamGrants] = useState<string[]>([]);
	const [allGroups, setAllGroups] = useState<GroupInfo[]>([]);
	const [addTeam, setAddTeam] = useState("");
	// When editing, the full sheet definition is loaded lazily from the project's
	// dashboard.json. Gate the editor until it's ready so we never start blank.
	const [defReady, setDefReady] = useState(!isEditing);
	const createdAtRef = useRef<string>(
		seedSource?.createdAt ?? new Date().toISOString(),
	);

	// Migrate legacy embedded queries into shared DashboardQuery entities up front,
	// so vizs carry `queryId` and the dashboard carries a `queries` registry. Kept
	// behaviour-preserving in Phase 1: embedded query fields remain as a fallback.
	// Also synthesize the Parameters sheet inline (like DashboardPage.tsx) so it's
	// present on first render — avoids a load-time race where the tab bar renders
	// before the auto-create effect below can prepend it.
	const [initialMigration] = useState(() => {
		const migrated = migrateSheetsToSharedQueries(
			initSheets(seedSource),
			seedSource?.queries,
		);
		return {
			sheets: ensureParamSheet(migrated.sheets, migrated.queries),
			queries: migrated.queries,
		};
	});
	const [sheets, setSheets] = useState<Sheet[]>(initialMigration.sheets);
	const [queries, setQueries] = useState<DashboardQuery[]>(
		initialMigration.queries,
	);
	const [customColorPalettes, setCustomColorPalettes] = useState<
		ColorPaletteType[]
	>(
		seedSource?.customColorPalettes ??
			collectVizLevelPalettes(initialMigration.sheets),
	);
	const [activeSheetId, setActiveSheetId] = useState<string>(
		initialMigration.sheets.find((s) => !s.isParamSheet)?.id ??
			initialMigration.sheets[0].id,
	);

	const [selectedVizId, setSelectedVizId] = useState<string>(
		initialMigration.sheets[0]?.visualizations[0]?.id ?? "",
	);
	const [editingVizId, setEditingVizId] = useState<string | null>(null);
	const layoutTabRef = useRef<ILayoutApi | null>(null);

	// Update the layout tab ref if editingVizId changes.
	// This ensures that the layout tab rerenders when editing the tab.
	useEffect(() => {
		layoutTabRef.current?.redraw();
	}, [editingVizId]);

	// Close the rename input field when the user clicks outside of the field.
	// Remove event listener when editing is done.
	useEffect(() => {
		if (!editingVizId) return;
		const dismiss = (e: PointerEvent) => {
			if (!(e.target as Element).closest?.("[data-viz-rename]")) {
				setEditingVizId(null);
			}
		};
		document.addEventListener("pointerdown", dismiss, true);
		return () => document.removeEventListener("pointerdown", dismiss, true);
	}, [editingVizId]);
	const [editorTab, setEditorTab] = useState<"visualize" | "layout">(
		"visualize",
	);
	const [layoutSelectedVizId, setLayoutSelectedVizId] = useState<
		string | null
	>(null);
	// Tracks raw height input strings so users can clear the field; validated at save time
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [heightStrings, _setHeightStrings] = useState<Record<string, string>>(
		{},
	);
	const [databases, setDatabases] = useState<IDatabase[]>([]);
	const [testResults, setTestResults] = useState<Record<string, any>>({});
	const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});
	const [runningAll, setRunningAll] = useState(false);
	const [_dragIndex, _setDragIndex] = useState<number | null>(null);
	const [_dragOverIndex, _setDragOverIndex] = useState<number | null>(null);
	// Preview values for the param sheet when shown in the editor
	const [paramPreviewValues, setParamPreviewValues] = useState<
		Record<string, string>
	>({});

	// flexlayout model cache — one Model per sheet, keyed by sheet ID
	const flexModelCacheRef = useRef<Record<string, Model>>({});
	const getFlexModel = useCallback((sheet: typeof activeSheet): Model => {
		if (!sheet)
			return buildFlexModel({
				id: "empty",
				name: "",
				visualizations: [],
				layout: [],
			} as any);
		if (!flexModelCacheRef.current[sheet.id]) {
			flexModelCacheRef.current[sheet.id] = buildFlexModel(sheet);
		}
		return flexModelCacheRef.current[sheet.id];
	}, []);
	const invalidateFlexModel = useCallback((sheetId: string) => {
		delete flexModelCacheRef.current[sheetId];
		// Also wipe the persisted flexLayout JSON so buildFlexModel rebuilds
		// from sheet.layout instead of an outdated saved model.  Without this,
		// adding/removing a viz leaves stale tabs ("Viz not found") in the canvas.
		setSheets((prev) =>
			prev.map((s) =>
				s.id === sheetId ? { ...s, flexLayout: undefined } : s,
			),
		);
	}, []);

	useEffect(() => {
		void loadDatabases();
	}, []);

	// Auto-create the Parameters sheet whenever any query has params; remove it when none do.
	const shouldHaveParamSheet = queries.some((q) => q.parameters.length > 0);
	useEffect(() => {
		if (shouldHaveParamSheet) {
			setSheets((prev) => ensureParamSheet(prev, queries));
		} else {
			setSheets((prev) => {
				const next = prev.filter((s) => !s.isParamSheet);
				return next.length === prev.length ? prev : next;
			});
			setActiveSheetId((prev) => {
				const activeIsParam = sheets.find(
					(s) => s.id === prev,
				)?.isParamSheet;
				return activeIsParam
					? (sheets.find((s) => !s.isParamSheet)?.id ?? "")
					: prev;
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shouldHaveParamSheet]);

	// Load the directory for the private-access picker (admins get the full list;
	// others fall back to free-text user ids). Fetched lazily when first needed.
	useEffect(() => {
		if (!showPublishDialog || publishVisibility !== "private") return;
		if (!allGroups.length)
			getGroups(isAdmin)
				.then(setAllGroups)
				.catch(() => setAllGroups([]));
	}, [showPublishDialog, publishVisibility, isAdmin, allGroups.length]);

	// Editing: fetch the full definition (sheets) from the backing project, then
	// hydrate the editor. New dashboards skip this (defReady starts true).
	useEffect(() => {
		if (!isEditing || !id) return;
		let cancelled = false;
		(async () => {
			try {
				const full = await loadDashboard(id);
				if (cancelled) return;
				setName(full.name ?? "");
				setDescription(full.description ?? "");
				applyTags(full.tags ?? []);
				createdAtRef.current = full.createdAt ?? createdAtRef.current;
				const { sheets: hydrated, queries: hydratedQueries } =
					migrateSheetsToSharedQueries(
						initSheets(full),
						full.queries,
					);
				// Synthesize the Parameters sheet inline so legacy dashboards (saved
				// before the param-sheet feature) surface it immediately in edit mode
				// — same treatment as DashboardPage.tsx's view path.
				const finalSheets = ensureParamSheet(hydrated, hydratedQueries);
				flexModelCacheRef.current = {};
				setSheets(finalSheets);
				setQueries(hydratedQueries);
				const dashLevel = full.customColorPalettes ?? [];
				const vizLevel = collectVizLevelPalettes(finalSheets);
				setCustomColorPalettes([
					...dashLevel,
					...vizLevel.filter(
						(p) => !dashLevel.some((d) => d.label === p.label),
					),
				]);
				setActiveSheetId(
					finalSheets.find((s) => !s.isParamSheet)?.id ??
						finalSheets[0].id,
				);
				setSelectedVizId(
					finalSheets.find((s) => !s.isParamSheet)?.visualizations[0]
						?.id ?? "",
				);
			} catch (e: any) {
				toast.error(e?.message ?? "Failed to load this dashboard.");
			} finally {
				if (!cancelled) setDefReady(true);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, isEditing]);

	const loadDatabases = async () => {
		try {
			const pixel = `MyEngines(metaKeys=["tag","domain","data classification","data restrictions","description"], engineTypes=['DATABASE'], metaFilters=[{}], sort=[{"ENGINENAME":"ASC"}], userT=[true], limit=[1000], offset=[0]);`;
			const { pixelReturn } = await actions.run(pixel);
			setDatabases((pixelReturn[0].output as IDatabase[]) ?? []);
		} catch (err) {
			console.error("Error loading databases:", err);
		}
	};

	// ── Active sheet helpers ─────────────────────────────────────────────────
	const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? sheets[0];
	const hasParamSheet = sheets.some((s) => s.isParamSheet);
	const paramGroups = useMemo(() => {
		const groups = computeParamGroups(queries);
		const order = sheets.find((s) => s.isParamSheet)?.paramSheetConfig
			?.paramGroupOrder;
		if (!order?.length) return groups;
		const orderMap = new Map(order.map((name, i) => [name, i]));
		return [...groups].sort(
			(a, b) =>
				(orderMap.get(a.name) ?? Infinity) -
				(orderMap.get(b.name) ?? Infinity),
		);
	}, [queries, sheets]);
	const visualizations = activeSheet?.visualizations ?? [];
	useTabColors(visualizations);
	const layout = activeSheet?.layout ?? [];

	const setVisualizations = (
		updater: (prev: Visualization[]) => Visualization[],
	) => {
		setSheets((prev) =>
			prev.map((s) =>
				s.id === activeSheetId
					? { ...s, visualizations: updater(s.visualizations) }
					: s,
			),
		);
	};

	const setLayout = (updater: (prev: LayoutItem[]) => LayoutItem[]) => {
		setSheets((prev) =>
			prev.map((s) =>
				s.id === activeSheetId
					? { ...s, layout: updater(s.layout) }
					: s,
			),
		);
	};

	// ── Sheet CRUD ───────────────────────────────────────────────────────────
	const addSheet = () => {
		// Sequential sheet-N IDs: find the highest existing sheet-N number and increment
		const usedNums = sheets
			.map((s) => {
				const m = s.id.match(/^sheet-(\d+)$/);
				return m ? parseInt(m[1], 10) : -1;
			})
			.filter((n) => n >= 0);
		const maxNum = usedNums.length ? Math.max(...usedNums) : 0;
		const newId = `sheet-${maxNum + 1}`;
		const nonParamSheets = sheets.filter((s) => !s.isParamSheet);
		const color = SHEET_COLORS[nonParamSheets.length % SHEET_COLORS.length];
		const sheet = makeSheet(
			`Sheet ${nonParamSheets.length + 1}`,
			color,
			newId,
		);
		setSheets((prev) => [...prev, sheet]);
		setActiveSheetId(newId);
		setSelectedVizId(sheet.visualizations[0]?.id ?? null);
		_setDragIndex(null);
		_setDragOverIndex(null);
	};

	const deleteSheet = (sheetId: string) => {
		const targetSheet = sheets.find((s) => s.id === sheetId);
		if (targetSheet?.isParamSheet) return;
		if (sheets.filter((s) => !s.isParamSheet).length <= 1) return;
		setSheets((prev) => {
			const next = prev.filter((s) => s.id !== sheetId);
			if (activeSheetId === sheetId) {
				const deletedIdx = prev.findIndex((s) => s.id === sheetId);
				const newActive = next[Math.min(deletedIdx, next.length - 1)];
				setActiveSheetId(newActive.id);
				setSelectedVizId(newActive.visualizations[0]?.id ?? "");
			}
			return next;
		});
	};

	const switchSheet = (sheetId: string) => {
		if (sheetId === activeSheetId) return;
		setLayoutSelectedVizId(null);
		setActiveSheetId(sheetId);
		const sheet = sheets.find((s) => s.id === sheetId);
		setSelectedVizId(sheet?.visualizations[0]?.id ?? "");
		// Param sheet has no Layout tab — always land on the visualize (editor) tab
		if (sheet?.isParamSheet) setEditorTab("visualize");
		_setDragIndex(null);
		_setDragOverIndex(null);
	};

	const changeSheetColor = (sheetId: string, color: string) => {
		setSheets((prev) =>
			prev.map((s) => (s.id === sheetId ? { ...s, color } : s)),
		);
	};

	// ── Query registry (shared, dashboard-level) ─────────────────────────────
	const createQuery = useCallback(
		(init?: Partial<DashboardQuery>): DashboardQuery => {
			const q: DashboardQuery = {
				id: crypto.randomUUID(),
				name: init?.name?.trim() || "Untitled query",
				databaseId: init?.databaseId ?? "",
				databaseName: init?.databaseName ?? "",
				query: init?.query ?? "",
				parameters: init?.parameters ?? [],
			};
			setQueries((prev) => [...prev, q]);
			return q;
		},
		[],
	);
	const updateQuery = useCallback(
		(qid: string, patch: Partial<DashboardQuery>) => {
			setQueries((prev) =>
				prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
			);
		},
		[],
	);
	/** Delete a query — refused if any visualization still uses it (UI only offers this for unused ones). */
	const deleteQuery = (qid: string) => {
		if (sheets.some((s) => s.visualizations.some((v) => v.queryId === qid)))
			return;
		setQueries((prev) => prev.filter((q) => q.id !== qid));
	};
	/** Ensure a viz is backed by a shared query, returning its id (creates one seeded from embedded fields). */
	const ensureQueryForViz = (viz: Visualization): string => {
		if (viz.queryId) return viz.queryId;
		const q = createQuery({
			name: viz.title,
			databaseId: viz.databaseId,
			databaseName: viz.databaseName,
			query: viz.query,
			parameters: viz.parameters,
		});
		updateVisualization(viz.id, { queryId: q.id });
		return q.id;
	};

	// ── Visualization CRUD ───────────────────────────────────────────────────
	const addVisualization = () => {
		// A new chart starts backed by its own fresh shared query, named generically
		// (independent of the chart title — rename it from the data-source row).
		const q = createQuery({ name: `Query ${queries.length + 1}` });
		const viz: Visualization = { ...makeVisualization(), queryId: q.id };
		setVisualizations((prev) => {
			const newVizId = viz.id;
			// Any filter viz on this sheet that already has filterTargets set should
			// automatically include the newly added viz so it applies immediately.
			return [...prev, viz].map((v) =>
				v.visualizationType === "filter" &&
				v.config?.filterTargets?.length
					? {
							...v,
							config: {
								...v.config,
								filterTargets: [
									...v.config.filterTargets,
									newVizId,
								],
							},
						}
					: v,
			);
		});
		setSelectedVizId(viz.id);
	};

	/**
	 * Reuse one query across many charts: add a NEW visualization bound to the SAME
	 * shared query (no SQL clone), in a chosen sheet — existing or brand-new. The
	 * data is fetched once at view time and shared across every chart built from it.
	 */
	const addVizFromQuery = (vizId: string, target: string | "new") => {
		const src = visualizations.find((v) => v.id === vizId);
		if (!src) return;
		const queryId = ensureQueryForViz(src);
		const newViz: Visualization = {
			...structuredClone(src),
			id: crypto.randomUUID(),
			queryId,
		};
		if (target === "new") {
			const color = SHEET_COLORS[sheets.length % SHEET_COLORS.length];
			const sheet: Sheet = {
				id: crypto.randomUUID(),
				name: `Sheet ${sheets.length + 1}`,
				color,
				visualizations: [newViz],
				layout: [
					{ vizId: newViz.id, colSpan: 12 as ColSpan, order: 0 },
				],
			};
			setSheets((prev) => [...prev, sheet]);
			setActiveSheetId(sheet.id);
		} else {
			// Append the new viz to the target sheet's existing flex model so the
			// user's current arrangement is preserved. Only fall back to a full
			// rebuild if the model operation throws.
			const targetSheet = sheets.find((s) => s.id === target);
			const tabJson = {
				type: "tab" as const,
				id: `tab-${newViz.id}`,
				name: newViz.title || "Untitled",
				component: "viz",
				config: { vizId: newViz.id },
				enableClose: false,
			};
			let newFlexLayout: Record<string, unknown> | undefined;
			try {
				const model = getFlexModel(targetSheet as Sheet);
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
				flexModelCacheRef.current[target] = model;
				newFlexLayout = model.toJson() as unknown as Record<
					string,
					unknown
				>;
			} catch {
				// Model operation failed — fall back to full rebuild below
			}
			setSheets((prev) =>
				prev.map((s) => {
					if (s.id !== target) return s;
					const newVizId = newViz.id;
					const updatedVizualizations = [
						...s.visualizations,
						newViz,
					].map((v) =>
						v.visualizationType === "filter" &&
						v.config?.filterTargets?.length
							? {
									...v,
									config: {
										...v.config,
										filterTargets: [
											...v.config.filterTargets,
											newVizId,
										],
									},
								}
							: v,
					);
					return {
						...s,
						visualizations: updatedVizualizations,
						layout: [
							...s.layout,
							{
								vizId: newViz.id,
								colSpan: 12 as ColSpan,
								order: s.layout.length,
							},
						],
						...(newFlexLayout ? { flexLayout: newFlexLayout } : {}),
					};
				}),
			);
			if (!newFlexLayout) invalidateFlexModel(target);
			setActiveSheetId(target);
		}
		setSelectedVizId(newViz.id);
		setEditorTab("visualize");
		setSheetMenuOpen(false);
	};

	const addVizToLayout = (vizId: string) => {
		if (layout.some((l) => l.vizId === vizId)) return;
		const viz = visualizations.find((v) => v.id === vizId);
		const tabJson = {
			type: "tab" as const,
			id: `tab-${vizId}`,
			name: viz?.title || "Untitled",
			component: "viz",
			config: { vizId },
			enableClose: false,
		};
		// Append the new viz as a node on the EXISTING flexlayout model so the user's
		// current arrangement (sizes, positions, splits) is PRESERVED. Wiping the model
		// and rebuilding from the grid (the old behavior) reset the whole canvas on every
		// add. The new tabset docks at the bottom as a full-width row.
		try {
			const model = getFlexModel(activeSheet);
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
			setSheets((prev) =>
				prev.map((s) =>
					s.id === activeSheetId
						? {
								...s,
								flexLayout,
								layout: [
									...s.layout,
									{
										vizId,
										colSpan: 12 as ColSpan,
										order: s.layout.length,
									},
								],
							}
						: s,
				),
			);
		} catch {
			// Fallback to the rebuild path if the model action fails for any reason.
			setLayout((prev) =>
				prev.some((l) => l.vizId === vizId)
					? prev
					: [
							...prev,
							{
								vizId,
								colSpan: 12 as ColSpan,
								order: prev.length,
							},
						],
			);
			invalidateFlexModel(activeSheetId);
		}
	};

	const removeVisualization = (vizId: string) => {
		// Delete just this viz's tab from the EXISTING model so the rest of the
		// arrangement is preserved (instead of wiping + rebuilding the whole canvas).
		let modelHandled = false;
		try {
			const model = flexModelCacheRef.current[activeSheetId];
			if (model?.getNodeById(`tab-${vizId}`)) {
				model.doAction(Actions.deleteTab(`tab-${vizId}`));
				flexModelCacheRef.current[activeSheetId] = model;
				const flexLayout = model.toJson() as unknown as Record<
					string,
					unknown
				>;
				setSheets((prev) =>
					prev.map((s) =>
						s.id === activeSheetId
							? {
									...s,
									flexLayout,
									visualizations: s.visualizations.filter(
										(v) => v.id !== vizId,
									),
									layout: s.layout
										.filter((l) => l.vizId !== vizId)
										.map((l, i) => ({ ...l, order: i })),
								}
							: s,
					),
				);
				modelHandled = true;
			}
		} catch {
			modelHandled = false;
		}
		if (!modelHandled) {
			setVisualizations((prev) => prev.filter((v) => v.id !== vizId));
			setLayout((prev) =>
				prev
					.filter((l) => l.vizId !== vizId)
					.map((l, i) => ({ ...l, order: i })),
			);
			invalidateFlexModel(activeSheetId);
		}
		if (selectedVizId === vizId) {
			const remaining = visualizations.filter((v) => v.id !== vizId);
			setSelectedVizId(remaining[0]?.id ?? "");
		}
	};

	const updateVisualization = (
		vizId: string,
		updates: Partial<Visualization>,
	) => {
		setVisualizations((prev) =>
			prev.map((v) => {
				if (v.id !== vizId) return v;
				const merged = { ...v, ...updates };
				// When switching to filter type for the first time, pre-select all same-sheet non-filter vizzes.
				if (
					updates.visualizationType === "filter" &&
					!v.config?.filterTargets?.length
				) {
					const sheetIds = prev
						.filter(
							(s) =>
								s.id !== vizId &&
								s.visualizationType !== "filter",
						)
						.map((s) => s.id);
					merged.config = {
						...(merged.config ?? {}),
						filterTargets: sheetIds,
					};
				}
				return merged;
			}),
		);
		// Keep the flexlayout panel header in sync live when the Title changes, so the
		// rename shows immediately (the cached model isn't rebuilt on every edit).
		if (updates.title !== undefined) {
			const model = flexModelCacheRef.current[activeSheetId];
			const node = model?.getNodeById(`tab-${vizId}`);
			if (node)
				model?.doAction(
					Actions.renameTab(
						`tab-${vizId}`,
						updates.title || "Untitled",
					),
				);
		}
	};

	// Parameter editing is handled inline by the shared <QueryParameters> component
	// in Step 0, which replaces the whole parameters array via onUpdate({ parameters }).

	// ── Layout ───────────────────────────────────────────────────────────────
	// @ts-expect-error - Reserved for future use
	const _updateColSpan = (vizId: string, colSpan: ColSpan) => {
		setLayout((prev) =>
			prev.map((l) => (l.vizId === vizId ? { ...l, colSpan } : l)),
		);
	};

	// Width/height are now managed by flexlayout-react drag/resize in the Layout tab.

	// @ts-expect-error - Reserved for future use
	const _updateHeightPx = (vizId: string, heightPx: number) => {
		setLayout((prev) =>
			prev.map((l) => (l.vizId === vizId ? { ...l, heightPx } : l)),
		);
	};

	// @ts-expect-error - Reserved for future use
	const _moveViz = (vizId: string, direction: "up" | "down") => {
		setLayout((prev) => {
			const sorted = [...prev].sort((a, b) => a.order - b.order);
			const idx = sorted.findIndex((l) => l.vizId === vizId);
			const swapIdx = direction === "up" ? idx - 1 : idx + 1;
			if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
			const next = [...sorted];
			[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
			return next.map((l, i) => ({ ...l, order: i }));
		});
	};

	// ── Test query ───────────────────────────────────────────────────────────
	const testQuery = async (vizId: string) => {
		const viz = visualizations.find((v) => v.id === vizId);
		if (!viz) return;
		// Run the resolved shared query and cache the sample under the query key,
		// so every chart bound to it previews from the same test result.
		const source = resolveQuery(viz, queries);
		const qKey = viz.queryId ?? viz.id;
		if (!source.databaseId || !source.query) {
			alert("Select a database and enter a query first.");
			return;
		}
		setTestLoading((prev) => ({ ...prev, [qKey]: true }));
		try {
			let resolved = source.query;
			source.parameters.forEach((p) => {
				if (p.name)
					resolved = resolved.replaceAll(
						`{{${p.name}}}`,
						resolveParamDefault(p),
					);
			});
			const pixel = `Database(database=["${source.databaseId}"]) | Query("${escapeSqlForPixel(resolved)}") | Collect(10);`;
			const { pixelReturn } =
				await actions.run<[{ output: any; operationType?: string[] }]>(
					pixel,
				);
			const pr = pixelReturn[0];
			// SEMOSS reports bad SQL as an ERROR operationType (it does not throw) —
			// surface the real database message instead of a generic alert.
			if (
				Array.isArray(pr.operationType) &&
				pr.operationType.includes("ERROR")
			) {
				throw new Error(String(pr.output ?? "Query failed."));
			}
			const output = pr.output as any;
			setTestResults((prev) => ({ ...prev, [qKey]: output }));

			// ── Build column type map ─────────────────────────────────────────
			// Persist CORRECT types so they survive reloads (when there's no live
			// result, these are the only sample-derived source). SEMOSS headerInfo
			// is unreliable (often all-STRING), so we INFER from the actual values
			// and only fall back to headerInfo when a column has no sampled data.
			const headers: string[] = output?.data?.headers ?? [];
			const values: any[][] = output?.data?.values ?? [];
			const headerInfo: Array<{
				header?: string;
				alias?: string;
				type?: string;
				dataType?: string;
			}> = output?.headerInfo ?? [];
			if (headers.length) {
				const headerInfoTypes: Record<string, string> = {};
				headerInfo.forEach((info) => {
					const key = info.header ?? info.alias;
					const t = info.type ?? info.dataType;
					if (key && t) headerInfoTypes[key] = t;
				});
				const columnTypes: Record<string, string> = {};
				headers.forEach((h, i) => {
					const colValues = values.map((row) => row[i]);
					const inferred = inferColumnType(colValues); // NUMBER / DATE / STRING
					// Prefer a concrete inferred type; otherwise trust headerInfo's schema type.
					columnTypes[h] =
						inferred !== "STRING"
							? inferred
							: normalizeDataType(headerInfoTypes[h]) || inferred;
				});

				// Auto-select sensible axis defaults (only if not already set)
				const numericCols = headers.filter(
					(h) => columnTypes[h] === "NUMBER",
				);
				const textCols = headers.filter(
					(h) => columnTypes[h] !== "NUMBER",
				);
				const autoX = textCols[0] ?? headers[0];
				const autoY = numericCols.filter((h) => h !== autoX);

				// Use a functional updater so the config merge reads the CURRENT
				// state rather than the stale `viz.config` snapshot captured before
				// the async SQL call. Without this, color rules or other styling
				// changes made while the query was running would be silently lost.
				setVisualizations((prev) =>
					prev.map((v) => {
						if (v.id !== vizId) return v;
						return {
							...v,
							config: {
								...v.config,
								columnTypes,
								xKey: v.config?.xKey ?? autoX,
								yKeys:
									v.config?.yKeys ??
									(autoY.length ? autoY : undefined),
							},
						};
					}),
				);
			}
		} catch (err: any) {
			console.error("Test query error:", err);
			toast.error(
				String(err?.message ?? err ?? "Query failed.").trim() ||
					"Query failed.",
			);
		} finally {
			setTestLoading((prev) => ({ ...prev, [qKey]: false }));
		}
	};

	// Run All Queries
	const handleRunAll = useCallback(async () => {
		setRunningAll(true);
		try {
			const seen = new Set<string>();
			const tasks: Array<() => Promise<void>> = [];
			for (const sheet of sheets) {
				for (const viz of sheet.visualizations) {
					const source = resolveQuery(viz, queries);
					const qKey = viz.queryId ?? viz.id;
					if (
						seen.has(qKey) ||
						!source.databaseId ||
						!source.query?.trim()
					)
						continue;
					seen.add(qKey);
					tasks.push(async () => {
						setTestLoading((prev) => ({ ...prev, [qKey]: true }));
						try {
							let resolved = source.query!;
							source.parameters.forEach((p) => {
								if (p.name)
									resolved = resolved.replaceAll(
										`{{${p.name}}}`,
										resolveParamDefault(p),
									);
							});
							const pixel = `Database(database=["${source.databaseId}"]) | Query("${escapeSqlForPixel(resolved)}") | Collect(10);`;
							const { pixelReturn } =
								await actions.run<
									[{ output: any; operationType?: string[] }]
								>(pixel);
							const pr = pixelReturn[0];
							if (
								Array.isArray(pr.operationType) &&
								pr.operationType.includes("ERROR")
							)
								return;
							setTestResults((prev) => ({
								...prev,
								[qKey]: pr.output,
							}));
						} finally {
							setTestLoading((prev) => ({
								...prev,
								[qKey]: false,
							}));
						}
					});
				}
			}
			await Promise.all(tasks.map((t) => t().catch(() => {})));
			setEditorTab("layout");
		} finally {
			setRunningAll(false);
		}
	}, [sheets, queries, actions]);

	// ── Save ─────────────────────────────────────────────────────────────────
	/** All save-blocking validation. Alerts + returns false on the first problem. */
	const validate = (): boolean => {
		if (!name.trim()) {
			alert("Enter a dashboard name.");
			return false;
		}
		for (const [, str] of Object.entries(heightStrings)) {
			const n = parseInt(str, 10);
			if (!str.trim() || Number.isNaN(n) || n <= 0) {
				alert(
					"All visualization heights must be a valid positive number.",
				);
				return false;
			}
		}
		if (!sheets.some((s) => s.layout.length > 0)) {
			alert("Add at least one visualization to the layout in any sheet.");
			return false;
		}
		for (const sheet of sheets) {
			const layoutVizIds = new Set(sheet.layout.map((l) => l.vizId));
			const layoutVizs = sheet.visualizations.filter((v) =>
				layoutVizIds.has(v.id),
			);
			// Resolve each viz's shared query before checking it has a database + SQL.
			if (
				layoutVizs.some((v) => {
					// HTML blocks render from config; Filter widgets read their targets'
					// loaded rows — neither needs a database/query of its own.
					if (
						v.visualizationType === "htmlblock" ||
						v.visualizationType === "filter"
					)
						return false;
					const s = resolveQuery(v, queries);
					return !s.databaseId || !s.query;
				})
			) {
				alert(
					`Each visualization in the layout needs a database and query (check "${sheet.name}").`,
				);
				return false;
			}
			// Every parameter must have a default value.
			for (const v of layoutVizs) {
				const s = resolveQuery(v, queries);
				const missing = (s.parameters ?? []).find((p) => {
					if (!p.name || p.useCurrentDate) return false;
					// Required text params satisfy the check via placeholder instead of defaultValue
					if (
						p.required &&
						(!p.inputType || p.inputType === "text")
					) {
						return !String(p.placeholder ?? "").trim();
					}
					return !String(p.defaultValue ?? "").trim();
				});
				if (missing) {
					toast.error(
						`"${missing.label || missing.name}" in "${v.title || "Untitled"}" requires a default value before saving.`,
						"Missing parameter default",
					);
					return false;
				}
			}
			// A table's rows-per-page may be left blank WHILE editing, but not saved blank
			// or out of range (1–1000; the page size is also the per-DB-call size).
			for (const v of layoutVizs) {
				if (v.visualizationType !== "table") continue;
				const ps = v.config?.styling?.table?.pageSize;
				if (
					ps === "" ||
					(ps !== undefined &&
						(!Number.isFinite(Number(ps)) ||
							Number(ps) <= 0 ||
							Number(ps) > 1000))
				) {
					alert(
						`Set a valid rows-per-page (1–1000) for the table "${v.title || "Untitled"}".`,
					);
					return false;
				}
			}
		}
		return true;
	};

	const buildDashboardData = (): Dashboard => {
		const cleanedSheets = sheets.map((sheet) => {
			const layoutVizIds = new Set(sheet.layout.map((l) => l.vizId));
			return {
				...sheet,
				visualizations: sheet.visualizations
					.filter((v) => layoutVizIds.has(v.id))
					.map((v) => {
						// Strip stale viz-level customColorPalettes — now stored at dashboard level.
						if (!v.config?.styling?.customColorPalettes) return v;
						const {
							customColorPalettes: _dropped,
							...restStyling
						} = v.config.styling;
						return {
							...v,
							config: { ...v.config, styling: restStyling },
						};
					}),
			};
		});
		return {
			id: id ?? "pending",
			name: name.trim(),
			description,
			tags: tagsRef.current,
			sheets: cleanedSheets,
			queries: pruneQueries(queries, cleanedSheets),
			customColorPalettes,
			createdAt: createdAtRef.current,
			updatedAt: new Date().toISOString(),
		};
	};

	/**
	 * Runs every layout visualization's query (cheap Collect(1), default params) and
	 * returns a list of human-readable errors for any that fail. Blocks save/publish.
	 */
	const validateQueries = async (data: Dashboard): Promise<string[]> => {
		const errors: string[] = [];
		// Validate each DISTINCT query once — charts bound to a shared query no longer
		// re-validate the same SQL N times.
		const seen = new Set<string>();
		for (const sheet of data.sheets) {
			for (const viz of sheet.visualizations) {
				if (viz.visualizationType === "htmlblock") continue;
				const source = resolveQuery(viz, data.queries);
				if (!source.databaseId || !source.query?.trim()) continue;
				let resolved = source.query;
				source.parameters?.forEach((p) => {
					if (p.name)
						resolved = resolved.replaceAll(
							`{{${p.name}}}`,
							resolveParamDefault(p),
						);
				});
				const dedupeKey = `${source.databaseId}::${resolved}`;
				if (seen.has(dedupeKey)) continue;
				seen.add(dedupeKey);
				const label = viz.title || "Untitled";
				try {
					const { pixelReturn } = await actions.run<
						[{ output: any; operationType?: string[] }]
					>(
						`Database(database=["${source.databaseId}"]) | Query("${escapeSqlForPixel(resolved)}") | Collect(1);`,
					);
					const pr = pixelReturn[0];
					if (
						Array.isArray(pr.operationType) &&
						pr.operationType.includes("ERROR")
					) {
						errors.push(
							`“${label}” (${sheet.name}): ${String(pr.output ?? "invalid query")}`,
						);
					}
				} catch (e: any) {
					errors.push(
						`“${label}” (${sheet.name}): ${String(e?.message ?? e ?? "invalid query")}`,
					);
				}
			}
		}
		return errors;
	};

	/** Performs the actual save (and publish for new dashboards). */
	const handleSave = () => {
		if (saving) return; // guard against double-submit
		if (!validate()) return;
		const dashboardData = buildDashboardData();
		setSaving(true);
		void (async () => {
			try {
				// Block save/publish if any visualization has an invalid SQL query.
				const queryErrors = await validateQueries(dashboardData);
				if (queryErrors.length) {
					toast.error(
						queryErrors[0] +
							(queryErrors.length > 1
								? ` (+${queryErrors.length - 1} more)`
								: ""),
						`Fix ${queryErrors.length} invalid quer${queryErrors.length > 1 ? "ies" : "y"} before saving`,
					);
					setSaving(false);
					setShowPublishDialog(false);
					return;
				}
				if (isEditing && id) {
					updateDashboard(id, dashboardData);
					toast.success("Dashboard saved.", "Saved");
					navigate(`/dashboard/${id}`);
				} else {
					if (
						publishVisibility === "landing" &&
						tagsRef.current.length === 0
					) {
						toast.error(
							"Add at least one folder tag so this insight appears in the correct Landing Page category.",
							"Folder required for Landing Page",
						);
						setSaving(false);
						return;
					}
					// Finishing a new dashboard saves it as a project. Public → everyone with
					// access sees it immediately; Private → only you until you share it with
					// specific people from the dashboard's Share dialog.
					const isPublic =
						publishVisibility === "public" ||
						publishVisibility === "landing";
					const saveTags = [
						...tagsRef.current,
						...(publishVisibility === "landing"
							? [LANDING_PAGE_TAG]
							: []),
					];
					console.log("[NewDashboardPage] creating dashboard", {
						publishVisibility,
						isPublic,
						userTags: tagsRef.current,
						saveTags,
						hasLandingPageTag: saveTags.includes(LANDING_PAGE_TAG),
					});
					const newId = await createDashboard(dashboardData, {
						published: isPublic,
						tags: saveTags,
					});
					console.log(
						"[NewDashboardPage] dashboard created, id:",
						newId,
					);
					// For a private dashboard, grant the chosen people + teams access to the
					// new project so they can see it (and its folder). Teams get View only.
					if (!isPublic && grants.length) {
						await Promise.all(
							grants.map((g) =>
								grantProjectUser(
									isAdmin,
									newId,
									g.id,
									g.role,
								).catch(() => null),
							),
						);
					}
					if (!isPublic && teamGrants.length) {
						await Promise.all(
							teamGrants.map((gid) =>
								grantProjectGroup(
									isAdmin,
									newId,
									gid,
									allGroups.find((g) => g.id === gid)?.type,
									"READ_ONLY",
								).catch(() => null),
							),
						);
					}
					toast.success(
						isPublic
							? "Dashboard saved & published."
							: grants.length
								? `Dashboard saved & shared with ${grants.length} ${grants.length === 1 ? "person" : "people"}.`
								: "Dashboard saved (private to you).",
						isPublic ? "Published" : "Saved",
					);
					navigate(`/dashboard/${newId}`);
				}
			} catch (e: any) {
				toast.error(e?.message ?? "Failed to save dashboard.");
				setSaving(false);
				setShowPublishDialog(false);
			}
		})();
	};

	/** Toolbar Save button: editing saves directly; a new dashboard opens the
	 *  publish dialog so the user can assign folders (tags) before going live. */
	const onSaveClick = () => {
		if (saving) return;
		if (!validate()) return;
		if (isEditing) {
			handleSave();
			return;
		}
		// Fresh publish dialog each time.
		setGrants([]);
		setPendingUser(null);
		setTeamGrants([]);
		setAddTeam("");
		setShowPublishDialog(true);
	};

	// Load an AI-generated draft into the editor (replaces the current in-progress
	// content; nothing is persisted until the user saves/publishes).
	const applyGeneratedDashboard = (d: Dashboard) => {
		setName(d.name ?? "");
		setDescription(d.description ?? "");
		applyTags(d.tags ?? []);
		createdAtRef.current = d.createdAt ?? createdAtRef.current;
		const { sheets: hydrated, queries: hydratedQueries } =
			migrateSheetsToSharedQueries(initSheets(d), d.queries);
		flexModelCacheRef.current = {};
		setSheets(hydrated);
		setQueries(hydratedQueries);
		setCustomColorPalettes(
			d.customColorPalettes ?? collectVizLevelPalettes(hydrated),
		);
		setActiveSheetId(hydrated[0].id);
		setSelectedVizId(hydrated[0]?.visualizations[0]?.id ?? "");
	};

	const sortedLayout = [...layout].sort((a, b) => a.order - b.order);
	const visibleLayout = sortedLayout.filter((item) =>
		visualizations.some((v) => v.id === item.vizId),
	);

	if (!defReady) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-white">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-indigo-500" />
			</div>
		);
	}

	return (
		<DashboardFilterProvider>
			<div className="flex h-full flex-col">
				{/* ── Editor toolbar ── */}
				<div className="flex h-14 flex-shrink-0 items-center gap-3 border-stone-200 border-b bg-white px-4">
					<Link
						to={isEditing ? `/dashboard/${id}` : "/dashboards"}
						title="Back"
						className="-ml-1 flex-shrink-0 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="h-6 w-px flex-shrink-0 bg-stone-200" />
					{/* Title + description — rendered as clear, labelled fields so it's obvious
                    they're meant to be filled in. Title is required. */}
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<div className="relative min-w-0 max-w-xs flex-1">
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Dashboard title"
								aria-label="Dashboard title (required)"
								disabled={!canEditTitle}
								title={
									canEditTitle
										? undefined
										: "Only the owner can rename this dashboard."
								}
								className={`w-full rounded-md border px-2.5 py-1.5 pr-16 font-semibold text-[14px] text-stone-800 placeholder:font-normal placeholder:text-stone-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500 ${
									!canEditTitle
										? "border-stone-200"
										: name.trim()
											? "border-stone-200 bg-white"
											: "border-amber-300 bg-amber-50/50"
								}`}
							/>
							{canEditTitle && !name.trim() && (
								<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 font-semibold text-[10px] text-amber-600 uppercase tracking-wide">
									Required
								</span>
							)}
						</div>
						<input
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add a description (optional)"
							aria-label="Dashboard description"
							className="min-w-0 max-w-sm flex-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] text-stone-600 placeholder:text-stone-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
					</div>
					{/* Tags/folders are NOT set here — only in the Publish dialog (create) or the Share dialog (view). */}
					{/* Start from an AI-generated draft — opens the AI Dashboard Builder modal. */}
					{aiEnabled() && (
						<button
							onClick={() => setShowAiModal(true)}
							title="Generate a dashboard from a description with AI"
							className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 font-medium text-indigo-600 text-xs transition-colors hover:bg-indigo-50"
						>
							<Sparkles className="h-3.5 w-3.5" /> AI Builder
						</button>
					)}
					{/* Reuse this query as another chart — hidden when param sheet is active */}
					{!activeSheet?.isParamSheet &&
						(() => {
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
											canDup &&
											setSheetMenuOpen((v) => !v)
										}
										disabled={!canDup}
										title={
											canDup
												? "Reuse this query to build another visualization"
												: "Write a query first"
										}
										className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
									>
										<CopyPlus className="h-3.5 w-3.5" />{" "}
										Reuse Query
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
					{/* Build / Layout mode toggle — hidden when param sheet is active */}
					{!activeSheet?.isParamSheet && (
						<div className="inline-flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5">
							<button
								onClick={() => {
									if (layoutSelectedVizId) {
										setSelectedVizId(layoutSelectedVizId);
										setLayoutSelectedVizId(null);
									}
									setEditorTab("visualize");
								}}
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
					)}
					{/* Run All Queries — hidden when param sheet is active */}
					{!activeSheet?.isParamSheet && (
						<button
							onClick={() => void handleRunAll()}
							disabled={runningAll}
							title="Run all saved queries to populate the Layout preview"
							className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-2.5 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{runningAll ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
									Running…
								</>
							) : (
								<>
									<RefreshCw className="h-3.5 w-3.5" /> Run
									All
								</>
							)}
						</button>
					)}
					<div className="mx-1 h-5 w-px bg-stone-200" />
					<Link
						to={isEditing ? `/dashboard/${id}` : "/dashboards"}
						className={buttonClasses("secondary", "sm")}
					>
						Cancel
					</Link>
					<button
						onClick={onSaveClick}
						disabled={saving}
						className={`${buttonClasses("primary", "sm")} disabled:cursor-not-allowed disabled:opacity-60`}
					>
						{saving ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Save className="h-3.5 w-3.5" />
						)}
						{saving
							? isEditing
								? "Saving…"
								: "Publishing…"
							: isEditing
								? "Save"
								: "Save & publish"}
					</button>
				</div>

				{/* ── Body ── */}
				<div className="flex min-h-0 flex-1 flex-col bg-white">
					{/* Two-panel body — Visualize tab */}
					{editorTab === "visualize" &&
						(activeSheet?.isParamSheet ? (
							<div className="min-h-0 flex-1 overflow-hidden">
								<ParamSheetEditor
									paramGroups={paramGroups}
									queries={queries}
									config={activeSheet.paramSheetConfig ?? {}}
									onConfigChange={(patch) =>
										setSheets((prev) =>
											prev.map((s) =>
												s.isParamSheet
													? {
															...s,
															paramSheetConfig: {
																...s.paramSheetConfig,
																...patch,
															},
														}
													: s,
											),
										)
									}
									onUpdateQuery={updateQuery}
									previewValues={paramPreviewValues}
									onPreviewValueChange={(name, val) =>
										setParamPreviewValues((prev) => ({
											...prev,
											[name]: val,
										}))
									}
								/>
							</div>
						) : (
							<div className="flex min-h-0 flex-1 flex-col">
								{/* Visualization strip — horizontal tabs */}
								<div className="flex h-10 flex-shrink-0 items-stretch gap-1 overflow-x-auto border-stone-200 border-b bg-stone-50/60 px-2">
									{visualizations.map((viz) => {
										const VizIcon =
											VIZ_TYPE_META[viz.visualizationType]
												?.icon ?? BarChart2;
										const active = selectedVizId === viz.id;
										const inL = layout.some(
											(l) => l.vizId === viz.id,
										);
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
												className={`group my-1.5 inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs transition-colors ${
													active
														? "border border-stone-200 bg-white font-semibold text-indigo-700 shadow-soft"
														: "text-stone-500 hover:bg-white/70 hover:text-stone-700"
												}`}
											>
												<VizIcon
													className={`h-3.5 w-3.5 flex-shrink-0 ${active ? "text-indigo-500" : "text-stone-400"}`}
												/>
												{editingVizId === viz.id ? (
													<input
														ref={(el) =>
															el?.focus()
														}
														value={viz.title}
														onChange={(e) =>
															updateVisualization(
																viz.id,
																{
																	title: e
																		.target
																		.value,
																},
															)
														}
														onClick={(e) =>
															e.stopPropagation()
														}
														onBlur={() =>
															setEditingVizId(
																null,
															)
														}
														onKeyDown={(e) => {
															if (
																e.key ===
																	"Enter" ||
																e.key ===
																	"Escape"
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
														{viz.title ||
															"Untitled"}
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
															removeVisualization(
																viz.id,
															);
														}}
														className="-mr-1 flex-shrink-0 rounded p-0.5 text-stone-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
														title="Remove"
													>
														<X className="h-3 w-3" />
													</button>
												)}
											</div>
										);
									})}
									<button
										onClick={addVisualization}
										className="my-1.5 inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-stone-300 border-dashed px-2.5 font-medium text-stone-500 text-xs transition-colors hover:border-indigo-300 hover:bg-white/70 hover:text-indigo-600"
									>
										<Plus className="h-3.5 w-3.5" /> Add
									</button>
								</div>

								{/* VizEditor — full width */}
								<div className="min-h-0 min-w-0 flex-1">
									{(() => {
										const viz = visualizations.find(
											(v) => v.id === selectedVizId,
										);
										if (!viz)
											return (
												<div className="flex h-full items-center justify-center text-sm text-stone-400">
													Select a visualization to
													edit
												</div>
											);
										const qKey = viz.queryId ?? viz.id;
										// Usage counts across all sheets, so the picker can warn when a
										// query feeds multiple charts (edits apply to all of them).
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
												key={viz.id}
												viz={viz}
												queries={queries}
												queryUsage={queryUsage}
												hasParamSheet={hasParamSheet}
												databases={databases}
												testResult={testResults[qKey]}
												testLoading={
													testLoading[qKey] ?? false
												}
												inLayout={layout.some(
													(l) => l.vizId === viz.id,
												)}
												onUpdate={(updates) =>
													updateVisualization(
														viz.id,
														updates,
													)
												}
												onUpdateQuery={updateQuery}
												onCreateQuery={createQuery}
												onDeleteQuery={deleteQuery}
												onSelectQuery={(qid) =>
													updateVisualization(
														viz.id,
														{ queryId: qid },
													)
												}
												onAddToLayout={() =>
													addVizToLayout(viz.id)
												}
												onTestQuery={() =>
													void testQuery(viz.id)
												}
												customColorPalettes={
													customColorPalettes
												}
												onCustomColorPalettesChange={
													setCustomColorPalettes
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
															v.id !== viz.id,
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
									})()}
								</div>
							</div>
						))}

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
										ref={layoutTabRef}
										key={activeSheetId}
										model={getFlexModel(activeSheet)}
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
												raw?.data?.headers ??
												raw?.headers ??
												[];
											const values: any[][] =
												raw?.data?.values ??
												raw?.values ??
												[];
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
											const vizId = cfg?.vizId ?? "";
											const isLayoutSelected =
												layoutSelectedVizId === vizId;
											return (
												<div
													className={`relative h-full${isLayoutSelected ? "ring-2 ring-indigo-500 ring-inset" : ""}`}
													onClick={() =>
														setLayoutSelectedVizId(
															(prev) =>
																prev === vizId
																	? null
																	: vizId,
														)
													}
												>
													{preloadedData ? (
														<DashboardVisualization
															visualization={viz}
															preloadedData={
																preloadedData
															}
															fillContainer
															onFilterDefaultValuesChange={(
																vizId,
																values,
															) => {
																const v =
																	visualizations.find(
																		(x) =>
																			x.id ===
																			vizId,
																	);
																if (!v) return;
																updateVisualization(
																	vizId,
																	{
																		config: {
																			...v.config,
																			filterDefaultValues:
																				values,
																		},
																	},
																);
															}}
															onFilterFloatRulesChange={(
																vizId,
																rules,
															) => {
																const v =
																	visualizations.find(
																		(x) =>
																			x.id ===
																			vizId,
																	);
																if (!v) return;
																updateVisualization(
																	vizId,
																	{
																		config: {
																			...v.config,
																			filterFloatRules:
																				rules,
																		},
																	},
																);
															}}
															onStackbarStylingChange={(
																updates,
															) => {
																updateVisualization(
																	viz.id,
																	{
																		config: {
																			...viz.config,
																			styling:
																				{
																					...(viz
																						.config
																						?.styling ??
																						{}),
																					stackbar:
																						{
																							...(viz
																								.config
																								?.styling
																								?.stackbar ??
																								{}),
																							...updates,
																						},
																				},
																		},
																	},
																);
															}}
															onAreaStylingChange={(
																updates,
															) => {
																updateVisualization(
																	viz.id,
																	{
																		config: {
																			...viz.config,
																			styling:
																				{
																					...(viz
																						.config
																						?.styling ??
																						{}),
																					area: {
																						...(viz
																							.config
																							?.styling
																							?.area ??
																							{}),
																						...updates,
																					},
																				},
																		},
																	},
																);
															}}
															onLineStylingChange={(
																updates,
															) => {
																updateVisualization(
																	viz.id,
																	{
																		config: {
																			...viz.config,
																			styling:
																				{
																					...(viz
																						.config
																						?.styling ??
																						{}),
																					line: {
																						...(viz
																							.config
																							?.styling
																							?.line ??
																							{}),
																						...updates,
																					},
																				},
																		},
																	},
																);
															}}
															onMultilineStylingChange={(
																updates,
															) => {
																const v =
																	visualizations.find(
																		(x) =>
																			x.id ===
																			viz.id,
																	);
																if (!v) return;
																updateVisualization(
																	viz.id,
																	{
																		config: {
																			...v.config,
																			styling:
																				{
																					...(v
																						.config
																						?.styling ??
																						{}),
																					multiline:
																						{
																							...(v
																								.config
																								?.styling
																								?.multiline ??
																								{}),
																							...updates,
																						},
																				},
																		},
																	},
																);
															}}
															onComboStylingChange={(
																updates,
															) => {
																updateVisualization(
																	viz.id,
																	{
																		config: {
																			...viz.config,
																			styling:
																				{
																					...(viz
																						.config
																						?.styling ??
																						{}),
																					combo: {
																						...(viz
																							.config
																							?.styling
																							?.combo ??
																							{}),
																						...updates,
																					},
																				},
																		},
																	},
																);
															}}
														/>
													) : (
														<div className="flex h-full flex-col items-center justify-center gap-1.5 bg-stone-50/80 text-stone-400">
															<p className="max-w-[80%] truncate px-2 text-center font-semibold text-stone-600 text-xs">
																{viz.title ||
																	"Untitled"}
															</p>
															<p className="text-[10px]">
																Run query to
																preview
															</p>
														</div>
													)}
												</div>
											);
										}}
										onModelChange={(
											model: Model,
											action?: { type?: string },
										) => {
											// Tab selection / active-tabset / maximize are view-only — don't
											// mark the editor dirty or bake them into the saved layout.
											if (isViewOnlyLayoutAction(action))
												return;
											const flexLayout =
												model.toJson() as unknown as Record<
													string,
													unknown
												>;
											setSheets((prev) =>
												prev.map((s) =>
													s.id === activeSheetId
														? { ...s, flexLayout }
														: s,
												),
											);
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

											const inner =
												editingVizId === vizId ? (
													<input
														ref={(el) =>
															el?.focus()
														}
														data-viz-rename="true"
														value={viz?.title ?? ""}
														onChange={(e) =>
															updateVisualization(
																vizId,
																{
																	title: e
																		.target
																		.value,
																},
															)
														}
														onPointerDown={(e) =>
															e.stopPropagation()
														}
														onClick={(e) =>
															e.stopPropagation()
														}
														onKeyDown={(e) => {
															if (
																e.key ===
																	"Enter" ||
																e.key ===
																	"Escape"
															) {
																e.preventDefault();
																setEditingVizId(
																	null,
																);
															}
														}}
														placeholder="Untitled"
														className="w-24 border-indigo-400 border-b bg-transparent px-1 py-0 text-stone-800 text-xs outline-none"
													/>
												) : (
													<span className="group/tabrename flex items-center gap-1">
														<span className="max-w-[110px] truncate">
															{viz?.title ||
																"Untitled"}
														</span>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																setEditingVizId(
																	vizId,
																);
															}}
															title="Rename"
															className="rounded p-0.5 text-stone-400 opacity-0 transition-opacity hover:text-indigo-600 group-hover/tabrename:opacity-100"
														>
															<Pencil className="h-3 w-3" />
														</button>
													</span>
												);

											if (viz?.phi) {
												rv.content = (
													<span
														data-pii="true"
														style={{
															display: "contents",
														}}
													>
														{inner}
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
														{inner}
													</span>
												);
											} else {
												rv.content = inner;
											}
										}}
									/>
								)}
							</div>
							{/* Footer: pinned to bottom — hint only; Save lives in the page header */}
							<div className="absolute right-0 bottom-0 left-0 flex h-[52px] items-center gap-2 border-stone-200 border-t bg-white px-5 shadow-[0_-2px_6px_rgba(0,0,0,0.04)]">
								<p className="text-stone-400 text-xs">
									Drag panels to resize &amp; rearrange ·
									changes save when you click{" "}
									{isEditing
										? "“Save Changes”"
										: "“Create Dashboard”"}{" "}
									above
								</p>
							</div>
						</div>
					)}
				</div>
				{/* /editor body */}

				{/* Sheet tab bar */}
				<SheetTabs
					sheets={sheets}
					activeId={activeSheetId}
					onSelect={switchSheet}
					onRename={(id, name) =>
						setSheets((prev) =>
							prev.map((s) => (s.id === id ? { ...s, name } : s)),
						)
					}
					onColorChange={changeSheetColor}
					onAdd={addSheet}
					onDelete={deleteSheet}
				/>

				{/* Publish dialog — assign folders (tags) before going live */}
				{showPublishDialog && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
						onClick={() => !saving && setShowPublishDialog(false)}
					>
						<div
							className="relative w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-soft-lg"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => setShowPublishDialog(false)}
								disabled={saving}
								title="Close"
								className="absolute top-3 right-3 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
							>
								<X className="h-4 w-4" />
							</button>

							<h2 className="pr-8 font-bold text-lg text-stone-900">
								Publish dashboard
							</h2>
							<p className="mt-0.5 text-[13px] text-stone-500">
								“{name.trim() || "Untitled dashboard"}”
							</p>

							<div className="mt-4">
								<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
									Folders (tags)
								</label>
								<TagInput
									value={tags}
									onChange={applyTags}
									suggestions={effectiveTagSuggestions}
									placeholder="Type a folder name and press Enter…"
									max={1}
								/>
								<p className="mt-1.5 text-[11px] text-stone-400">
									{tags.length >= 1
										? "Remove the current tag to assign a different folder."
										: "You can add one folder; Type a name and press Enter."}
								</p>
							</div>

							{/* Visibility */}
							<div className="mt-4">
								<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
									Who can access
								</label>
								<div
									className={`grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}
								>
									<button
										type="button"
										onClick={() =>
											setPublishVisibility("public")
										}
										className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${publishVisibility === "public" ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-500/20" : "border-stone-200 hover:border-stone-300"}`}
									>
										<Globe
											className={`mt-0.5 h-4 w-4 ${publishVisibility === "public" ? "text-indigo-600" : "text-stone-400"}`}
										/>
										<span>
											<span
												className={`block font-semibold text-[13px] ${publishVisibility === "public" ? "text-indigo-900" : "text-stone-800"}`}
											>
												Public
											</span>
											<span className="block text-[11px] text-stone-500">
												Everyone who uses this app
											</span>
										</span>
									</button>
									<button
										type="button"
										onClick={() =>
											setPublishVisibility("private")
										}
										className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${publishVisibility === "private" ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-500/20" : "border-stone-200 hover:border-stone-300"}`}
									>
										<Lock
											className={`mt-0.5 h-4 w-4 ${publishVisibility === "private" ? "text-indigo-600" : "text-stone-400"}`}
										/>
										<span>
											<span
												className={`block font-semibold text-[13px] ${publishVisibility === "private" ? "text-indigo-900" : "text-stone-800"}`}
											>
												Private
											</span>
											<span className="block text-[11px] text-stone-500">
												Only you — share with people
												after
											</span>
										</span>
									</button>
									{isAdmin && (
										<button
											type="button"
											onClick={() =>
												setPublishVisibility("landing")
											}
											className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-colors ${publishVisibility === "landing" ? "border-violet-400 bg-violet-50/60 ring-1 ring-violet-500/20" : "border-stone-200 hover:border-stone-300"}`}
										>
											<BookOpen
												className={`mt-0.5 h-4 w-4 ${publishVisibility === "landing" ? "text-violet-600" : "text-stone-400"}`}
											/>
											<span>
												<span
													className={`block font-semibold text-[13px] ${publishVisibility === "landing" ? "text-violet-900" : "text-stone-800"}`}
												>
													Landing Page
												</span>
												<span className="block text-[11px] text-stone-500">
													Pinned to the Insights
													Portal
												</span>
											</span>
										</button>
									)}
								</div>
								{publishVisibility === "landing" && (
									<p className="mt-2 text-[11px] text-violet-600">
										A folder tag is required — it determines
										which category this insight appears
										under in the Insights Portal.
									</p>
								)}
								{publishVisibility === "private" && (
									<div className="mt-3 space-y-2.5 rounded-lg border border-stone-200 bg-stone-50/60 p-3">
										<p className="text-[12px] text-stone-500">
											Pick who can access it. Only these
											people (and you) will see the
											dashboard and its folder.
										</p>
										<div className="flex flex-wrap items-end gap-2">
											<div className="min-w-[200px] flex-1">
												<UserSearchSelect
													isAdmin={isAdmin}
													excludeIds={
														new Set(
															grants.map(
																(g) => g.id,
															),
														)
													}
													selected={pendingUser}
													onChange={setPendingUser}
												/>
											</div>
											<div className="w-28">
												<Select
													value={addRole}
													onChange={(e) =>
														setAddRole(
															e.target
																.value as Role,
														)
													}
													className="py-1.5"
													aria-label="Role"
												>
													{ACCESS_ROLES.map((r) => (
														<option
															key={r}
															value={r}
														>
															{roleLabel(r)}
														</option>
													))}
												</Select>
											</div>
											<Button
												size="sm"
												disabled={
													!pendingUser ||
													grants.some(
														(g) =>
															g.id ===
															pendingUser?.id,
													)
												}
												onClick={() => {
													if (!pendingUser) return;
													setGrants((prev) => [
														...prev,
														{
															id: pendingUser.id,
															role: addRole,
															name: pendingUser.name,
														},
													]);
													setPendingUser(null);
												}}
											>
												<Plus className="h-3.5 w-3.5" />{" "}
												Add
											</Button>
										</div>
										{grants.length > 0 && (
											<ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
												{grants.map((g) => (
													<li
														key={g.id}
														className="flex items-center gap-2 px-3 py-1.5"
													>
														<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
															{g.name || g.id}
														</span>
														<span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold text-[10px] text-stone-500">
															{roleLabel(g.role)}
														</span>
														<button
															onClick={() =>
																setGrants(
																	(prev) =>
																		prev.filter(
																			(
																				x,
																			) =>
																				x.id !==
																				g.id,
																		),
																)
															}
															title="Remove"
															className="rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
														>
															<X className="h-3.5 w-3.5" />
														</button>
													</li>
												))}
											</ul>
										)}

										{/* Teams — granted View only */}
										<div className="mt-3 border-stone-200 border-t pt-3">
											<p className="mb-1.5 font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
												Teams (view only)
											</p>
											<div className="flex items-end gap-2">
												<div className="min-w-[150px] flex-1">
													{allGroups.length > 0 ? (
														<Select
															value={addTeam}
															onChange={(e) =>
																setAddTeam(
																	e.target
																		.value,
																)
															}
															className="py-1.5"
															aria-label="Select team"
														>
															<option value="">
																Select a team…
															</option>
															{allGroups
																.filter(
																	(g) =>
																		!teamGrants.includes(
																			g.id,
																		),
																)
																.map((g) => (
																	<option
																		key={
																			g.id
																		}
																		value={
																			g.id
																		}
																	>
																		{g.name}
																	</option>
																))}
														</Select>
													) : (
														<Input
															value={addTeam}
															onChange={(e) =>
																setAddTeam(
																	e.target
																		.value,
																)
															}
															placeholder="Enter a team id"
															className="py-1.5"
														/>
													)}
												</div>
												<Button
													size="sm"
													disabled={
														!addTeam.trim() ||
														teamGrants.includes(
															addTeam.trim(),
														)
													}
													onClick={() => {
														setTeamGrants(
															(prev) => [
																...prev,
																addTeam.trim(),
															],
														);
														setAddTeam("");
													}}
												>
													<Plus className="h-3.5 w-3.5" />{" "}
													Add team
												</Button>
											</div>
											{teamGrants.length > 0 && (
												<ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
													{teamGrants.map((gid) => (
														<li
															key={gid}
															className="flex items-center gap-2 px-3 py-1.5"
														>
															<span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
																{allGroups.find(
																	(g) =>
																		g.id ===
																		gid,
																)?.name ?? gid}
															</span>
															<span className="rounded bg-stone-100 px-1.5 py-0.5 font-semibold text-[10px] text-stone-500">
																Viewer
															</span>
															<button
																onClick={() =>
																	setTeamGrants(
																		(
																			prev,
																		) =>
																			prev.filter(
																				(
																					x,
																				) =>
																					x !==
																					gid,
																			),
																	)
																}
																title="Remove"
																className="rounded-md p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
															>
																<X className="h-3.5 w-3.5" />
															</button>
														</li>
													))}
												</ul>
											)}
										</div>
									</div>
								)}
							</div>

							<div className="mt-5 flex justify-end gap-2 border-stone-100 border-t pt-4">
								<button
									onClick={() => setShowPublishDialog(false)}
									disabled={saving}
									className={`${buttonClasses("secondary", "sm")} disabled:opacity-50`}
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									disabled={
										saving ||
										(publishVisibility === "landing" &&
											tags.length === 0)
									}
									className={`${buttonClasses("primary", "sm")} disabled:cursor-not-allowed disabled:opacity-60`}
								>
									{saving ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Save className="h-3.5 w-3.5" />
									)}
									{saving
										? "Saving…"
										: publishVisibility === "landing"
											? "Save & publish"
											: publishVisibility === "public"
												? "Save & publish"
												: "Save (private)"}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* AI Dashboard Builder — generates a draft that replaces the editor content. */}
				<AiBuilderModal
					open={showAiModal}
					onClose={() => setShowAiModal(false)}
					onGenerated={applyGeneratedDashboard}
				/>
			</div>
		</DashboardFilterProvider>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// VizCard sub-component
// ─────────────────────────────────────────────────────────────────────────────
interface VizCardProps {
	viz: Visualization;
	/** Shared query registry + how many charts use each (for the picker). */
	queries: DashboardQuery[];
	queryUsage: Record<string, number>;
	/** When true, a Parameters sheet centralises param inputs — Crown and gear overlay suppressed. */
	hasParamSheet?: boolean;
	databases: IDatabase[];
	testResult: any;
	testLoading: boolean;
	inLayout: boolean;
	/** Patch viz-only fields (config, title, type, phi…). Query fields are split out below. */
	onUpdate: (updates: Partial<Visualization>) => void;
	/** Patch the bound shared query (database / sql / parameters). */
	onUpdateQuery: (queryId: string, patch: Partial<DashboardQuery>) => void;
	/** Create a fresh shared query (used when the viz isn't bound yet, or "New query"). */
	onCreateQuery: (init?: Partial<DashboardQuery>) => DashboardQuery;
	/** Delete an unused shared query. */
	onDeleteQuery: (queryId: string) => void;
	/** Bind this viz to an existing shared query. */
	onSelectQuery: (queryId: string) => void;
	onAddToLayout: () => void;
	onTestQuery: () => void;
	customColorPalettes: ColorPaletteType[];
	onCustomColorPalettesChange: (palettes: ColorPaletteType[]) => void;
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
	hasParamSheet = false,
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
	customColorPalettes,
	onCustomColorPalettesChange,
	siblings,
}: VizCardProps) {
	const { actions } = useInsight();

	// Normalised runPixel for HtmlBlockEditor / VizEditor — returns output directly
	const runPixel = React.useCallback(
		(pixel: string) =>
			actions.run(pixel).then((r: any) => r.pixelReturn[0].output),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const [metaTypes, setMetaTypes] = React.useState<Record<string, string>>(
		{},
	);

	// The viz's effective data source: the bound shared query, else its embedded fields.
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

	// Authoritative column types come from the database METAMODEL (the schema), not
	// a raw SQL query's headerInfo (which many engines report as all-STRING). Keyed
	// off the EFFECTIVE database (bound query's db, or the viz's own).
	const metaDbId = vizForEditor.databaseId;
	React.useEffect(() => {
		if (!metaDbId) return;
		let cancelled = false;
		runPixel(
			`GetDatabaseMetamodel(database=["${metaDbId}"], options=["dataTypes","logicalNames"]);`,
		)
			.then((out: any) => {
				const dt = out?.dataTypes ?? out?.data?.dataTypes ?? {};
				const logical =
					out?.logicalNames ?? out?.data?.logicalNames ?? {};
				// Build a CASE-INSENSITIVE map keyed by every name a query column might use:
				// full "CONCEPT__PROP", bare "PROP", and the logical aliases (e.g. "number").
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
	}, [metaDbId, runPixel]);

	// Split editor patches: query fields update the shared query (affecting every
	// chart bound to it); everything else stays on the viz. If the viz isn't bound
	// yet, the first query-field edit lazily creates + binds a query.
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

	return (() => {
		const liveHeaders: string[] =
			testResult?.data?.headers ?? testResult?.headers ?? [];
		const rawValues: any[][] =
			testResult?.data?.values ?? testResult?.values ?? [];
		const previewData = rawValues.map((row) => {
			const obj: any = {};
			liveHeaders.forEach((h, i) => {
				obj[h] = row[i];
			});
			return obj;
		});
		const headerInfo: Array<{ header: string; type: string }> =
			testResult?.headerInfo ?? [];
		const headerInfoTypes: Record<string, string> = {};
		headerInfo.forEach((info) => {
			headerInfoTypes[info.header] = info.type;
		});
		const savedTypes = viz.config?.columnTypes ?? {};

		// Columns ALWAYS come from the query result (or the saved columns when
		// there's no live result) — never from the metamodel, which lists EVERY
		// column in the whole database. metaTypes is only a type lookup below.
		let headers = liveHeaders;
		if (!headers.length) {
			headers = [
				...new Set([
					...(viz.config?.tableColumns ?? []),
					...Object.keys(savedTypes),
				]),
			];
		}

		// Resolve each column's type from the most reliable source first:
		//   metamodel (schema) → live headerInfo → saved → infer from sampled data.
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

		// Convert current config to drop zone format
		const getDropZoneData = (): DropZoneDataWithTable => {
			const data: DropZoneDataWithTable = {};
			const vizType = viz.visualizationType;

			if (vizType === "kpi") {
				// KPI: yKeys → metrics
				if (viz.config?.yKeys?.length) {
					data.metrics = viz.config.yKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							viz.config?.columnAggregations?.[name] ||
							viz.config?.kpiAggregation ||
							"sum",
					}));
				}
			} else if (vizType === "pie") {
				// Pie: xKey → name, yKeys[0] → value, heatKey → heat
				if (viz.config?.xKey) {
					data.name = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.value = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								(typeMap[colName] === "NUMBER"
									? "sum"
									: "count"),
						},
					];
				}
				if (viz.config?.heatKey) {
					const hk = viz.config.heatKey;
					data.heat = [
						{
							name: hk,
							dataType: typeMap[hk] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[hk] || "avg",
						},
					];
				}
			} else if (vizType === "treemap") {
				if (viz.config?.seriesKey)
					data.series = [
						{
							name: viz.config.seriesKey,
							dataType: typeMap[viz.config.seriesKey] || "STRING",
						},
					];
				if (viz.config?.xKey)
					data.label = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.size = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								(typeMap[colName] === "NUMBER"
									? "sum"
									: "count"),
						},
					];
				}
			} else if (vizType === "pivot") {
				// Pivot: pivotRows → rows, pivotColumns → columns, pivotValues → values
				const rowCols = viz.config?.pivotRows ?? [];
				if (rowCols.length) {
					data.rows = rowCols.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
					}));
				}
				const colCols = viz.config?.pivotColumns ?? [];
				if (colCols.length) {
					data.columns = colCols.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
					}));
				}
				const valCols =
					viz.config?.pivotValues ?? viz.config?.yKeys ?? [];
				if (valCols.length) {
					data.values = valCols.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							viz.config?.columnAggregations?.[name] ||
							(typeMap[name] === "NUMBER" ? "sum" : "count"),
					}));
				}
			} else if (vizType === "table") {
				// Table: tableColumns (ordered list of visible columns) + per-column
				// aggregations. Empty by default — the user assigns columns manually.
				data.tableColumns = viz.config?.tableColumns ?? [];
				data.columnAggregations = viz.config?.columnAggregations;
			} else if (vizType === "scatter") {
				// Scatter: label, xAxis, yAxis, size, color
				// Label (category)
				if (viz.config?.label) {
					data.label = [
						{
							name: viz.config.label,
							dataType: typeMap[viz.config.label] || "STRING",
						},
					];
				}
				// X-Axis (numeric with aggregation)
				if (viz.config?.xKey) {
					const colName = viz.config.xKey;
					data.xAxis = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								(typeMap[colName] === "NUMBER"
									? "avg"
									: "count"),
						},
					];
				}
				// Y-Axis (numeric with aggregation)
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.yAxis = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								(typeMap[colName] === "NUMBER"
									? "avg"
									: "count"),
						},
					];
				}
				// Size (numeric with aggregation)
				if (viz.config?.size) {
					const colName = viz.config.size;
					data.size = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[colName] ||
								(typeMap[colName] === "NUMBER"
									? "avg"
									: "count"),
						},
					];
				}
				// Color (category)
				if (viz.config?.color) {
					data.color = [
						{
							name: viz.config.color,
							dataType: typeMap[viz.config.color] || "STRING",
						},
					];
				}
			} else if (vizType === "heatmap") {
				// Heatmap: xAxis → xKey, yAxis → heatmapYKey, heat → heatKey (required value column)
				if (viz.config?.xKey) {
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
				if (viz.config?.heatmapYKey) {
					data.yAxis = [
						{
							name: viz.config.heatmapYKey,
							dataType:
								typeMap[viz.config.heatmapYKey] || "STRING",
						},
					];
				}
				// heat zone: prefer heatKey, fall back to yKeys[0] for legacy configs
				const heatCol = viz.config?.heatKey || viz.config?.yKeys?.[0];
				if (heatCol) {
					data.heat = [
						{
							name: heatCol,
							dataType: typeMap[heatCol] || "NUMBER",
							aggregation:
								viz.config?.columnAggregations?.[heatCol] ||
								"avg",
						},
					];
				}
			} else if (vizType === "worldmap") {
				// World Map: label, latitude, longitude (required) + size/color/tooltip (optional)
				if (viz.config?.label) {
					data.label = [
						{
							name: viz.config.label,
							dataType: typeMap[viz.config.label] || "STRING",
						},
					];
				}
				if (viz.config?.latitudeKey) {
					data.latitude = [
						{
							name: viz.config.latitudeKey,
							dataType:
								typeMap[viz.config.latitudeKey] || "NUMBER",
						},
					];
				}
				if (viz.config?.longitudeKey) {
					data.longitude = [
						{
							name: viz.config.longitudeKey,
							dataType:
								typeMap[viz.config.longitudeKey] || "NUMBER",
						},
					];
				}
				if (viz.config?.size) {
					const colName = viz.config.size;
					data.size = [
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
				if (viz.config?.color) {
					data.color = [
						{
							name: viz.config.color,
							dataType: typeMap[viz.config.color] || "STRING",
						},
					];
				}
			} else if (vizType === "multiline") {
				// Multi-Line: xAxis → xKey, yAxis → yKeys[0], category → categoryKey
				if (viz.config?.xKey) {
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
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
				if (viz.config?.categoryKey) {
					data.category = [
						{
							name: viz.config.categoryKey,
							dataType:
								typeMap[viz.config.categoryKey] || "STRING",
						},
					];
				}
				if (viz.config?.tooltips?.length) {
					data.tooltip = viz.config.tooltips.map(
						({ column, aggregation }) => ({
							name: column,
							dataType: typeMap[column] || "STRING",
							aggregation,
						}),
					);
				} else if (viz.config?.tooltip) {
					const colName = viz.config.tooltip;
					data.tooltip = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config.tooltipAggregation ||
								(typeMap[colName] === "NUMBER"
									? "avg"
									: "count"),
						},
					];
				}
			} else if (vizType === "wordcloud") {
				// Word Cloud: words (xKey), size (yKeys[0])
				if (viz.config?.xKey) {
					data.words = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.size = [
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
			} else if (vizType === "bubble") {
				// Bubble: bubbles (xKey), size (yKeys[0]), tooltip (optional)
				if (viz.config?.xKey) {
					data.bubbles = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
				if (viz.config?.yKeys?.[0]) {
					const colName = viz.config.yKeys[0];
					data.size = [
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
				if (viz.config?.tooltips?.length) {
					data.tooltip = viz.config.tooltips.map(
						({ column, aggregation }) => ({
							name: column,
							dataType: typeMap[column] || "STRING",
							aggregation,
						}),
					);
				} else if (viz.config?.tooltip) {
					const colName = viz.config.tooltip;
					data.tooltip = [
						{
							name: colName,
							dataType: typeMap[colName] || "STRING",
							aggregation:
								viz.config.tooltipAggregation ||
								viz.config.columnAggregations?.[colName] ||
								"count",
						},
					];
				}
			} else if (vizType === "sunburst") {
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
			} else if (vizType === "puck") {
				// Puck: group columns + value (size)
				data.puckGroups = (viz.config?.puckGroups ?? []).map(
					(name) => ({
						name,
						dataType: typeMap[name] || "STRING",
					}),
				);
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
				if (viz.config?.tooltips?.length) {
					data.tooltip = viz.config.tooltips.map(
						({ column, aggregation }) => ({
							name: column,
							dataType: typeMap[column] || "STRING",
							aggregation,
						}),
					);
				}
			} else if (vizType === "combo") {
				// Combo: xAxis + barSeries zone + lineSeries zone
				if (viz.config?.xKey) {
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
				const comboStyling = viz.config?.styling?.combo ?? {};
				const barKeys = comboStyling.barKeys ?? [];
				const lineKeys = comboStyling.lineKeys ?? [];
				const barAggregations = comboStyling.barAggregations ?? {};
				const lineAggregations = comboStyling.lineAggregations ?? {};
				if (barKeys.length) {
					data.barSeries = barKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						// Each zone stores its own aggregation independently
						aggregation:
							barAggregations[name] ||
							(typeMap[name] === "NUMBER" ? "avg" : "count"),
					}));
				}
				if (lineKeys.length) {
					data.lineSeries = lineKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							lineAggregations[name] ||
							(typeMap[name] === "NUMBER" ? "avg" : "count"),
					}));
				}
			} else if (viz.visualizationType === "halfdonut") {
				if (viz.config?.xKey)
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				if (viz.config?.yKeys?.[0]) {
					const c = viz.config.yKeys[0];
					data.yAxis = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[c] || "sum",
						},
					];
				}
				if (viz.config?.targetKey) {
					const c = viz.config.targetKey;
					data.target = [
						{
							name: c,
							dataType: typeMap[c] || "STRING",
							aggregation:
								viz.config?.columnAggregations?.[c] || "sum",
						},
					];
				}
				if (viz.config?.tooltips?.length) {
					data.tooltip = viz.config.tooltips.map(
						({ column, aggregation }) => ({
							name: column,
							dataType: typeMap[column] || "STRING",
							aggregation,
						}),
					);
				}
			} else {
				// Bar, Line, Area, Radar: standard xAxis/yAxis
				if (viz.config?.xKey) {
					data.xAxis = [
						{
							name: viz.config.xKey,
							dataType: typeMap[viz.config.xKey] || "STRING",
						},
					];
				}
				if (viz.config?.yKeys?.length) {
					data.yAxis = viz.config.yKeys.map((name) => ({
						name,
						dataType: typeMap[name] || "STRING",
						aggregation:
							viz.config?.columnAggregations?.[name] ||
							(typeMap[name] === "NUMBER" ? "avg" : "count"),
					}));
				}
			}

			// Stacked bar: category (stack-by) column → distinct values become stacks.
			if (viz.visualizationType === "stackbar" && viz.config?.facetKey) {
				data.category = [
					{
						name: viz.config.facetKey,
						dataType: typeMap[viz.config.facetKey] || "STRING",
					},
				];
			}

			// Facet navigation column
			if (viz.config?.facetColumn) {
				data.facet = [
					{
						name: viz.config.facetColumn,
						dataType: typeMap[viz.config.facetColumn] || "STRING",
					},
				];
			}

			// Populate tooltip drop zone for all viz types
			if (viz.config?.tooltips?.length) {
				data.tooltip = viz.config.tooltips.map(
					({ column, aggregation }) => ({
						name: column,
						dataType: typeMap[column] || "STRING",
						aggregation,
					}),
				);
			} else if (viz.config?.tooltip) {
				const colName = viz.config.tooltip;
				data.tooltip = [
					{
						name: colName,
						dataType: typeMap[colName] || "STRING",
						aggregation:
							viz.config.tooltipAggregation ||
							(typeMap[colName] === "NUMBER" ? "avg" : "count"),
					},
				];
			}

			// Include styling configuration
			data.styling = viz.config?.styling;

			return data;
		};

		// Convert drop zone data back to config
		const handleDropZoneChange = (data: DropZoneDataWithTable) => {
			const vizType = viz.visualizationType;
			const newConfig: Partial<typeof viz.config> = { ...viz.config };

			if (vizType === "kpi") {
				// KPI: metrics → yKeys
				newConfig.yKeys = data.metrics?.map((c: any) => c.name) || [];
				// Store per-column aggregations
				newConfig.columnAggregations = {};
				data.metrics?.forEach((c: any) => {
					if (c.aggregation && newConfig.columnAggregations) {
						newConfig.columnAggregations[c.name] = c.aggregation;
					}
				});
				// Keep legacy kpiAggregation for backward compat
				if (data.metrics?.[0]?.aggregation) {
					newConfig.kpiAggregation = data.metrics[0]
						.aggregation as any;
				}
			} else if (vizType === "pie") {
				// Pie: name → xKey, value → yKeys[0], heat → heatKey
				newConfig.xKey = data.name?.[0]?.name || "";
				newConfig.yKeys = data.value?.[0] ? [data.value[0].name] : [];
				newConfig.columnAggregations =
					newConfig.columnAggregations || {};
				if (data.value?.[0]?.aggregation) {
					newConfig.columnAggregations[data.value[0].name] =
						data.value[0].aggregation;
				}
				newConfig.heatKey = data.heat?.[0]?.name || undefined;
				if (data.heat?.[0]?.aggregation) {
					newConfig.columnAggregations[data.heat[0].name] =
						data.heat[0].aggregation;
				}
			} else if (vizType === "treemap") {
				newConfig.seriesKey = data.series?.[0]?.name || "";
				newConfig.xKey = data.label?.[0]?.name || "";
				newConfig.yKeys = data.size?.[0] ? [data.size[0].name] : [];
				newConfig.columnAggregations = {};
				if (data.size?.[0]?.aggregation)
					newConfig.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
			} else if (vizType === "pivot") {
				// Pivot: rows → pivotRows, columns → pivotColumns, values → pivotValues
				newConfig.pivotRows = data.rows?.map((c: any) => c.name) || [];
				newConfig.pivotColumns =
					data.columns?.map((c: any) => c.name) || [];
				newConfig.pivotValues =
					data.values?.map((c: any) => c.name) || [];
				// Store per-column aggregations for value columns
				newConfig.columnAggregations = {};
				data.values?.forEach((c: any) => {
					if (c.aggregation && newConfig.columnAggregations) {
						newConfig.columnAggregations[c.name] = c.aggregation;
					}
				});
				// Mirror to legacy yKeys for any code still reading it
				newConfig.yKeys = newConfig.pivotValues;
			} else if (vizType === "table") {
				// Table: tableColumns (ordered list of visible columns) + per-column aggregations
				newConfig.tableColumns = data.tableColumns;
				newConfig.columnAggregations = data.columnAggregations ?? {};
			} else if (vizType === "scatter") {
				// Scatter: label, xAxis, yAxis, size, color
				newConfig.label = data.label?.[0]?.name || "";
				newConfig.xKey = data.xAxis?.[0]?.name || "";
				newConfig.yKeys = data.yAxis?.[0] ? [data.yAxis[0].name] : [];
				newConfig.size = data.size?.[0]?.name || "";
				newConfig.color = data.color?.[0]?.name || "";
				// Store per-column aggregations
				newConfig.columnAggregations = {};
				[data.xAxis?.[0], data.yAxis?.[0], data.size?.[0]].forEach(
					(col: any) => {
						if (col?.aggregation && newConfig.columnAggregations) {
							newConfig.columnAggregations[col.name] =
								col.aggregation;
						}
					},
				);
			} else if (vizType === "heatmap") {
				newConfig.xKey = data.xAxis?.[0]?.name || "";
				newConfig.heatmapYKey = data.yAxis?.[0]?.name || "";
				newConfig.heatKey = data.heat?.[0]?.name || undefined;
				// mirror into yKeys for backward compat with any code still reading it
				newConfig.yKeys = data.heat?.[0] ? [data.heat[0].name] : [];
				newConfig.columnAggregations = {};
				if (
					data.heat?.[0]?.aggregation &&
					newConfig.columnAggregations
				) {
					newConfig.columnAggregations[data.heat[0].name] =
						data.heat[0].aggregation;
				}
			} else if (vizType === "worldmap") {
				// World Map: label, latitudeKey, longitudeKey (required) + size/color (optional)
				newConfig.label = data.label?.[0]?.name || "";
				newConfig.latitudeKey = data.latitude?.[0]?.name || "";
				newConfig.longitudeKey = data.longitude?.[0]?.name || "";
				newConfig.size = data.size?.[0]?.name || "";
				newConfig.color = data.color?.[0]?.name || "";
				// Store size aggregation
				newConfig.columnAggregations = {};
				if (
					data.size?.[0]?.aggregation &&
					newConfig.columnAggregations
				) {
					newConfig.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				}
				// Clear unused linear-chart fields so the saved config stays clean
				newConfig.xKey = "";
				newConfig.yKeys = [];
			} else if (vizType === "multiline") {
				// Multi-Line: xAxis → xKey, yAxis → yKeys[0], category → categoryKey
				newConfig.xKey = data.xAxis?.[0]?.name || "";
				newConfig.yKeys = data.yAxis?.[0] ? [data.yAxis[0].name] : [];
				newConfig.categoryKey = data.category?.[0]?.name || "";
				newConfig.columnAggregations = {};
				if (
					data.yAxis?.[0]?.aggregation &&
					newConfig.columnAggregations
				) {
					newConfig.columnAggregations[data.yAxis[0].name] =
						data.yAxis[0].aggregation;
				}
				if (data.tooltip?.length && newConfig.columnAggregations) {
					for (const col of data.tooltip) {
						newConfig.columnAggregations[col.name] =
							col.aggregation || "count";
					}
				}
			} else if (vizType === "wordcloud") {
				// Word Cloud: words → xKey, size → yKeys[0]
				newConfig.xKey = data.words?.[0]?.name || "";
				newConfig.yKeys = data.size?.[0] ? [data.size[0].name] : [];
				newConfig.columnAggregations = {};
				if (
					data.size?.[0]?.aggregation &&
					newConfig.columnAggregations
				) {
					newConfig.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				}
				// Clear fields only used by other chart types
				newConfig.label = "";
				newConfig.size = "";
				newConfig.color = "";
				newConfig.latitudeKey = "";
				newConfig.longitudeKey = "";
			} else if (vizType === "bubble") {
				// Bubble: bubbles → xKey, size → yKeys[0], optional tooltip
				newConfig.xKey = data.bubbles?.[0]?.name || "";
				newConfig.yKeys = data.size?.[0] ? [data.size[0].name] : [];
				newConfig.columnAggregations = {};
				if (
					data.size?.[0]?.aggregation &&
					newConfig.columnAggregations
				) {
					newConfig.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				}
				if (data.tooltip?.length && newConfig.columnAggregations) {
					for (const col of data.tooltip) {
						newConfig.columnAggregations[col.name] =
							col.aggregation || "count";
					}
				}
				// Clear fields only used by other chart types
				newConfig.label = "";
				newConfig.size = "";
				newConfig.color = "";
				newConfig.latitudeKey = "";
				newConfig.longitudeKey = "";
			} else if (vizType === "sunburst") {
				// Sunburst: hierarchy levels + value column
				newConfig.sunburstLevels =
					data.levels?.map((c: any) => c.name) || [];
				newConfig.yKeys = data.value?.[0] ? [data.value[0].name] : [];
				newConfig.columnAggregations = {};
				if (data.value?.[0]?.aggregation)
					newConfig.columnAggregations[data.value[0].name] =
						data.value[0].aggregation;
				newConfig.xKey = "";
			} else if (vizType === "puck") {
				// Puck: group columns (nesting depth) + value column
				newConfig.puckGroups =
					data.puckGroups?.map((c: any) => c.name) || [];
				newConfig.yKeys = data.size?.[0] ? [data.size[0].name] : [];
				newConfig.columnAggregations = {};
				if (data.size?.[0]?.aggregation)
					newConfig.columnAggregations[data.size[0].name] =
						data.size[0].aggregation;
				newConfig.xKey = "";
			} else if (vizType === "combo") {
				const barCols = (data.barSeries as any[]) ?? [];
				const lineCols = (data.lineSeries as any[]) ?? [];
				const barKeys = barCols.map((c: any) => c.name as string);
				const lineKeys = lineCols.map((c: any) => c.name as string);
				// Columns in both zones get aliased keys so each zone can have its own aggregation
				const sharedCols = new Set(
					barKeys.filter((k) => lineKeys.includes(k)),
				);
				const resolvedBarKeys = barKeys.map((k) =>
					sharedCols.has(k) ? `${k}__combo_bar` : k,
				);
				const resolvedLineKeys = lineKeys.map((k) =>
					sharedCols.has(k) ? `${k}__combo_line` : k,
				);
				newConfig.xKey = data.xAxis?.[0]?.name || "";
				newConfig.yKeys = [...resolvedBarKeys, ...resolvedLineKeys];
				newConfig.columnAggregations = {};
				barCols.forEach((c: any, i: number) => {
					if (c.aggregation && newConfig.columnAggregations) {
						newConfig.columnAggregations[resolvedBarKeys[i]] =
							c.aggregation;
					}
				});
				lineCols.forEach((c: any, i: number) => {
					if (c.aggregation && newConfig.columnAggregations) {
						newConfig.columnAggregations[resolvedLineKeys[i]] =
							c.aggregation;
					}
				});
			} else if (vizType === "halfdonut") {
				newConfig.xKey = data.xAxis?.[0]?.name || "";
				newConfig.yKeys = data.yAxis?.[0] ? [data.yAxis[0].name] : [];
				newConfig.targetKey = data.target?.[0]?.name || undefined;
				newConfig.columnAggregations = {};
				[...(data.yAxis ?? []), ...(data.target ?? [])].forEach(
					(c: any) => {
						if (c.aggregation && newConfig.columnAggregations) {
							newConfig.columnAggregations[c.name] =
								c.aggregation;
						}
					},
				);
			} else {
				// Standard: xAxis → xKey, yAxis → yKeys
				newConfig.xKey = data.xAxis?.[0]?.name || "";
				newConfig.yKeys = data.yAxis?.map((c: any) => c.name) || [];
				// Store per-column aggregations
				newConfig.columnAggregations = {};
				data.yAxis?.forEach((c: any) => {
					if (c.aggregation && newConfig.columnAggregations) {
						newConfig.columnAggregations[c.name] = c.aggregation;
					}
				});
			}

			// Stacked bar: category zone → stacking column (facetKey).
			if (vizType === "stackbar") {
				newConfig.facetKey = data.category?.[0]?.name || undefined;
			}
			// Facet navigation column — all chart types including stackbar
			newConfig.facetColumn = data.facet?.[0]?.name || undefined;

			// Tooltip: Handle for all viz types except table and pivot
			if (vizType !== "table" && vizType !== "pivot") {
				if (data.tooltip?.length) {
					newConfig.tooltips = data.tooltip.map((col) => ({
						column: col.name,
						aggregation: col.aggregation || "count",
					}));
					if (!newConfig.columnAggregations)
						newConfig.columnAggregations = {};
					for (const col of data.tooltip) {
						newConfig.columnAggregations[col.name] =
							col.aggregation || "count";
					}
				} else {
					newConfig.tooltips = undefined;
				}
				newConfig.tooltip = undefined;
				newConfig.tooltipAggregation = undefined;
			}

			// Preserve styling configuration
			newConfig.styling = data.styling;

			// Patch combo: save explicit barKeys/lineKeys, per-zone aggregations, and seriesTypes
			if (vizType === "combo") {
				const barCols = (data.barSeries as any[]) ?? [];
				const lineCols = (data.lineSeries as any[]) ?? [];
				const barKeys = barCols.map((c: any) => c.name as string);
				const lineKeys = lineCols.map((c: any) => c.name as string);
				const barAggregations: Record<string, string> = {};
				barCols.forEach((c: any) => {
					if (c.aggregation) barAggregations[c.name] = c.aggregation;
				});
				const lineAggregations: Record<string, string> = {};
				lineCols.forEach((c: any) => {
					if (c.aggregation) lineAggregations[c.name] = c.aggregation;
				});
				const existing = (newConfig.styling?.combo?.seriesTypes ??
					{}) as Record<string, "line" | "area">;
				const newSeriesTypes: Record<string, "line" | "area"> = {};
				for (const k of lineKeys) {
					newSeriesTypes[k] = existing[k] ?? "line";
				}
				newConfig.styling = {
					...newConfig.styling,
					combo: {
						...(newConfig.styling?.combo ?? {}),
						barKeys,
						lineKeys,
						barAggregations,
						lineAggregations,
						seriesTypes: newSeriesTypes,
					},
				};
			}

			onUpdate({ config: newConfig });
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
				hasParamSheet={hasParamSheet}
				loadAfterParams={boundQuery?.loadAfterParams ?? false}
				onToggleLoadAfterParams={
					viz.queryId
						? () =>
								onUpdateQuery(viz.queryId!, {
									loadAfterParams: !(
										boundQuery?.loadAfterParams ?? false
									),
								})
						: undefined
				}
				typeOptions={VIZ_TYPES.map((t) => ({
					value: t,
					label: VIZ_TYPE_META[t].label,
				}))}
				databases={databases.map((d) => ({
					id: d.app_id,
					label: d.engine_name ?? d.app_name ?? d.app_id,
				}))}
				columns={columns}
				dropZoneData={getDropZoneData()}
				onDropZoneChange={handleDropZoneChange}
				onRunQuery={onTestQuery}
				running={testLoading}
				rowCount={testResult ? rawValues.length : null}
				hasData={previewData.length > 0}
				renderPreview={() => (
					<DashboardVisualization
						visualization={vizForEditor}
						preloadedData={previewData}
						fillContainer
						onFilterDefaultValuesChange={(_vizId, values) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									filterDefaultValues: values,
								},
							})
						}
						onFilterFloatRulesChange={(_vizId, rules) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									filterFloatRules: rules,
								},
							})
						}
						onStackbarStylingChange={(updates) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									styling: {
										...(vizForEditor.config?.styling ?? {}),
										stackbar: {
											...(vizForEditor.config?.styling
												?.stackbar ?? {}),
											...updates,
										},
									},
								},
							})
						}
						onAreaStylingChange={(updates) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									styling: {
										...(vizForEditor.config?.styling ?? {}),
										area: {
											...(vizForEditor.config?.styling
												?.area ?? {}),
											...updates,
										},
									},
								},
							})
						}
						onLineStylingChange={(updates) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									styling: {
										...(vizForEditor.config?.styling ?? {}),
										line: {
											...(vizForEditor.config?.styling
												?.line ?? {}),
											...updates,
										},
									},
								},
							})
						}
						onMultilineStylingChange={(updates) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									styling: {
										...(vizForEditor.config?.styling ?? {}),
										multiline: {
											...(vizForEditor.config?.styling
												?.multiline ?? {}),
											...updates,
										},
									},
								},
							})
						}
						onComboStylingChange={(updates) =>
							onUpdate({
								config: {
									...(vizForEditor.config ?? {}),
									styling: {
										...(vizForEditor.config?.styling ?? {}),
										combo: {
											...(vizForEditor.config?.styling
												?.combo ?? {}),
											...updates,
										},
									},
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
				customColorPalettes={customColorPalettes}
				onCustomColorPalettesChange={onCustomColorPalettesChange}
			/>
		);
	})();
}
