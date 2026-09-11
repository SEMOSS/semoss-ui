/**
 * WorkspaceProvider — the app's single source of truth for dashboards + folders,
 * backed entirely by SEMOSS PROJECTS (no H2 database, no tables).
 *
 *   • Each dashboard is a SEMOSS project (see services/projectStore.ts).
 *   • Private project (global=false) = personal draft → "My Dashboards".
 *   • Global project (global=true)   = published → "Published".
 *   • Folders are TAGS: a WorkspaceFolder.id IS a tag string. A dashboard appears
 *     in every folder whose tag it carries.
 *
 * Listing is fast (metadata only): the listing NEVER fetches project assets. Full
 * sheet definitions are loaded lazily via loadDashboard() (GetAppAssets) ONLY when a
 * dashboard is opened to view or edit it, then cached for instant re-opens.
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useInsight } from "@semoss/sdk-react";
import { useToast } from "@/components/ui/Toast";
import {
	buildCanonicalFolderNames,
	canonicalizeFolderTags,
	isManagedSystemTag,
	isOwnershipMarkerTag,
	isParamAppTag,
	PARAM_APP_TAG,
	syncParamAppTag,
	tagKey,
	userFolderTags,
} from "@/lib/dashboardTags";
import {
	getProjects,
	isAdminUser,
	normalizeProjectPermission,
} from "@/services/permissionsApi";
import { type DashboardMeta, ProjectStore } from "@/services/projectStore";
import type { FolderKind, WorkspaceFolder } from "@/services/workspaceStore";
import type { Dashboard } from "@/types/dashboard";

/** Owned = I'm the project OWNER, or (permission unknown) it's my private draft. */
export function isOwnedDashboard(d: Dashboard): boolean {
	const permission = normalizeProjectPermission(d.permission);
	return permission ? permission === "OWNER" : !d.published;
}

export interface DashboardSaveResult {
	released: boolean;
	metadataSynced: boolean;
}

interface WorkspaceContextValue {
	/** Every dashboard I can access (mine + public + shared-with-me). */
	dashboards: Dashboard[];
	/** Only dashboards I own. */
	ownedDashboards: Dashboard[];
	/** Folders = the distinct tags across every dashboard I can see. */
	folders: WorkspaceFolder[];
	loading: boolean;
	error: string | null;
	reload: () => Promise<void>;

	currentUserId: string;
	isAdmin: boolean;

	/** Meta lookup (sheets may be empty until loadDashboard resolves). */
	getDashboard: (id: string) => Dashboard | undefined;
	/** Fetch + cache the full definition (sheets) for a dashboard. */
	loadDashboard: (id: string) => Promise<Dashboard>;

	/** Create a new dashboard as a SEMOSS project. Returns the new project id. */
	createDashboard: (
		dashboard: Dashboard,
		opts: { published: boolean; tags: string[] },
	) => Promise<string>;
	/** Merge updates into an existing dashboard and persist (definition + metadata). */
	updateDashboard: (
		id: string,
		updates: Partial<Dashboard>,
	) => Promise<DashboardSaveResult>;
	/** Re-push the current portal bundle + definition to an existing project (owner-only release). */
	redeployDashboard: (
		id: string,
		dashboard?: Dashboard,
	) => Promise<{ released: boolean }>;
	deleteDashboard: (id: string) => void;
	restoreDashboard: (dashboard: Dashboard) => void;
	duplicateDashboard: (id: string) => Promise<string | undefined>;

	/** Publish (global) or unpublish (private) a dashboard. */
	publishDashboard: (id: string, published: boolean) => Promise<void>;

	// Folders == tags
	/** Rename a folder = rename that tag across every dashboard that carries it. */
	renameFolder: (id: string, name: string) => void;
	/** Delete a folder = remove that tag from every dashboard that carries it. */
	deleteFolder: (id: string) => void;
	/** Set the full tag set for a dashboard. */
	setDashboardTags: (id: string, tags: string[]) => void;
	/** Add/remove a single folder tag on a dashboard (multi-membership). */
	toggleDashboardTag: (id: string, tag: string, on: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const now = () => new Date().toISOString();

/** Build a Dashboard "meta" object (empty sheets until loaded). */
function metaToDashboard(
	m: DashboardMeta,
	sheets: Dashboard["sheets"] = [],
): Dashboard {
	return {
		id: m.id,
		name: m.name,
		description: m.description,
		tags: m.tags,
		published: m.published,
		permission: m.permission,
		folderId: userFolderTags(m.tags)[0], // compat: "primary" folder = first user folder tag
		sheets,
		createdAt: m.createdAt ?? m.updatedAt ?? now(),
		updatedAt: m.updatedAt ?? now(),
	};
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const { actions, insightId } = useInsight();

	const actionsRef = useRef(actions);
	actionsRef.current = actions;
	const insightIdRef = useRef<string | null>(insightId ?? null);
	insightIdRef.current = insightId ?? null;

	const store = useMemo(
		() =>
			new ProjectStore(
				async (pixel: string) => {
					const res: { pixelReturn?: Array<{ output?: unknown }> } =
						await actionsRef.current.run(pixel);
					return res?.pixelReturn?.[0]?.output;
				},
				() => insightIdRef.current,
			),
		[],
	);

	const toast = useToast();
	const [dashboards, setDashboards] = useState<Dashboard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState("");
	const [isAdmin, setIsAdmin] = useState(false);

	const viewerRef = useRef<{ userId: string; isAdmin: boolean } | null>(null);
	const defsCache = useRef<Map<string, Dashboard>>(new Map());
	// Mirror of dashboards state in a ref so loadDashboard can read the latest
	// metadata without capturing dashboards in its dep array (which would recreate
	// loadDashboard on every definition load and cause cascading re-fetches).
	const dashboardsRef = useRef<Dashboard[]>([]);

	// ── Load identity (once) ─────────────────────────────────────────────────
	const ensureViewer = useCallback(async () => {
		if (viewerRef.current) return viewerRef.current;
		let userId = "";
		try {
			const out: Record<string, unknown> | undefined =
				await actionsRef.current
					.run("GetUserInfo();")
					.then(
						(r: { pixelReturn?: Array<{ output?: unknown }> }) =>
							r?.pixelReturn?.[0]?.output as
								| Record<string, unknown>
								| undefined,
					);
			userId = String(
				out?.id ?? out?.ID ?? out?.user_id ?? out?.name ?? "",
			);
		} catch {
			/* best-effort */
		}
		const admin = await isAdminUser();
		viewerRef.current = { userId, isAdmin: admin };
		setCurrentUserId(userId);
		setIsAdmin(admin);
		return viewerRef.current;
	}, []);

	// ── Reload listing ────────────────────────────────────────────────────────
	// Metadata only — fast. We deliberately do NOT fetch each project's full
	// definition here: GetAppAssets is called lazily by loadDashboard() only when a
	// dashboard is actually opened (to render or edit it), not once per card. The
	// listing cards don't need sheet/chart contents.
	const reload = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			await ensureViewer();
			const [metas, permissionProjects] = await Promise.all([
				store.list(),
				getProjects(false).catch(() => []),
			]);
			const permissionsById = new Map(
				permissionProjects.map((project) => [
					project.id,
					project.permission,
				]),
			);
			const resolvedMetas = metas.map((meta) => ({
				...meta,
				permission: permissionsById.get(meta.id) ?? meta.permission,
			}));
			// Merge any cached full definitions so we don't lose sheets already loaded
			// (e.g. after opening a dashboard, then navigating back to the listing).
			const listedDashboards = resolvedMetas.map((m) =>
				metaToDashboard(m, defsCache.current.get(m.id)?.sheets ?? []),
			);
			const canonicalFolderNames =
				buildCanonicalFolderNames(listedDashboards);
			const nextDashboards = listedDashboards.map((dashboard) => {
				const tags = canonicalizeFolderTags(
					dashboard.tags ?? [],
					canonicalFolderNames,
				);
				return {
					...dashboard,
					tags,
					folderId: userFolderTags(tags)[0],
				};
			});
			for (const meta of resolvedMetas) {
				const cached = defsCache.current.get(meta.id);
				if (cached)
					defsCache.current.set(meta.id, {
						...cached,
						permission: meta.permission,
					});
			}
			dashboardsRef.current = nextDashboards;
			setDashboards(nextDashboards);
		} catch (e: unknown) {
			setError(
				e instanceof Error ? e.message : "Failed to load workspace.",
			);
		} finally {
			setLoading(false);
		}
	}, [store, ensureViewer]);

	useEffect(() => {
		void reload();
	}, [reload]);

	// Keep dashboardsRef in sync so loadDashboard can read the latest metadata
	// without capturing dashboards in its dep array.
	useEffect(() => {
		dashboardsRef.current = dashboards;
	}, [dashboards]);

	const writeThrough = useCallback((p: Promise<unknown>) => {
		p.catch((e: unknown) =>
			setError(e instanceof Error ? e.message : "Failed to save change."),
		);
	}, []);

	// ── Definitions ─────────────────────────────────────────────────────────────
	const loadDashboard = useCallback(
		async (id: string): Promise<Dashboard> => {
			const cached = defsCache.current.get(id);
			if (cached?.sheets?.length) return cached;
			// Read metadata from the ref (not the dashboards state) so this callback
			// stays stable across renders and doesn't retrigger effects that depend on it.
			const meta = dashboardsRef.current.find((d) => d.id === id);
			const def = await store.loadDefinition(
				id,
				meta?.published ?? false,
			);
			const full: Dashboard = {
				...def,
				id,
				tags: meta?.tags ?? def.tags ?? [],
				published: meta?.published ?? def.published ?? false,
				permission: meta?.permission,
				folderId: userFolderTags(meta?.tags ?? def.tags)[0],
			};
			defsCache.current.set(id, full);
			setDashboards((prev) =>
				prev.map((d) =>
					d.id === id ? { ...d, sheets: full.sheets } : d,
				),
			);
			return full;
		},
		[store],
	);

	const getDashboard = useCallback(
		(id: string) => {
			const meta = dashboards.find((dashboard) => dashboard.id === id);
			const cached = defsCache.current.get(id);
			if (!cached) return meta;
			return meta ? { ...cached, permission: meta.permission } : cached;
		},
		[dashboards],
	);

	// ── Create / update / delete ────────────────────────────────────────────────
	const createDashboard = useCallback(
		async (
			dashboard: Dashboard,
			opts: { published: boolean; tags: string[] },
		): Promise<string> => {
			const canonicalFolderNames = buildCanonicalFolderNames(
				dashboardsRef.current,
			);
			const effectiveTags = syncParamAppTag(
				canonicalizeFolderTags(opts.tags, canonicalFolderNames),
				dashboard,
			);
			const dashboardWithTags = { ...dashboard, tags: effectiveTags };
			const id = await store.create(dashboardWithTags, {
				...opts,
				tags: effectiveTags,
			});
			const created: Dashboard = {
				...dashboardWithTags,
				id,
				published: opts.published,
				permission: "OWNER",
				folderId: userFolderTags(effectiveTags)[0],
			};
			defsCache.current.set(id, created);
			setDashboards((prev) => [
				metaToDashboard(
					{
						id,
						name: created.name,
						description: created.description ?? "",
						tags: effectiveTags,
						published: opts.published,
						permission: "OWNER",
						updatedAt: now(),
					},
					created.sheets,
				),
				...prev.filter((d) => d.id !== id),
			]);
			return id;
		},
		[store],
	);

	const updateDashboard = useCallback(
		async (
			id: string,
			updates: Partial<Dashboard>,
		): Promise<DashboardSaveResult> => {
			const current =
				defsCache.current.get(id) ??
				dashboardsRef.current.find((dashboard) => dashboard.id === id);
			if (!current) throw new Error("Dashboard not found.");

			// Tags are NEVER written from an edit — they're only set when
			// sharing/publishing (setDashboardTags). Retain any ownership markers
			// (the param-app classification is re-derived below) so an edit save
			// can never clobber them.
			const retainedManagedTags = (current.tags ?? []).filter(
				isOwnershipMarkerTag,
			);
			const canonicalFolderNames = buildCanonicalFolderNames(
				dashboardsRef.current,
			);
			const requestedTags = canonicalizeFolderTags(
				updates.tags === undefined
					? (current.tags ?? [])
					: [...updates.tags, ...retainedManagedTags],
				canonicalFolderNames,
			);
			const next = {
				...current,
				...updates,
				tags: requestedTags,
				updatedAt: now(),
			};
			const effectiveTags = syncParamAppTag(next.tags, next);
			const merged: Dashboard = {
				...next,
				tags: effectiveTags,
				folderId: userFolderTags(effectiveTags)[0],
			};
			const hadParamTag = (current.tags ?? []).some(isParamAppTag);
			const hasParamTag = effectiveTags.some(isParamAppTag);
			const classificationChanged = hadParamTag !== hasParamTag;

			defsCache.current.set(id, merged);
			setDashboards((prev) =>
				prev.map((dashboard) =>
					dashboard.id === id ? merged : dashboard,
				),
			);

			try {
				const { released } = await store.saveDefinition(id, merged);
				if (updates.name != null && merged.name?.trim()) {
					// Rename the SEMOSS project's display name to match the title.
					// Owner-only (SetProjectDisplayName) — non-fatal for editors.
					try {
						await store.renameProject(id, merged.name);
					} catch {
						/* editor can't rename the project */
					}
				}

				let metadataSynced = true;
				if (classificationChanged) {
					try {
						await store.setMetadata(
							id,
							effectiveTags,
							merged.description ?? "",
						);
					} catch {
						// Owner-only write failed (e.g. editor permissions) — keep the
						// locally-visible tags consistent with what the server still has.
						metadataSynced = false;
						const serverTags = effectiveTags.filter(
							(tag) => !isParamAppTag(tag),
						);
						if (hadParamTag) serverTags.push(PARAM_APP_TAG);
						const locallyAccurate = {
							...merged,
							tags: serverTags,
							folderId: userFolderTags(serverTags)[0],
						};
						defsCache.current.set(id, locallyAccurate);
						setDashboards((prev) =>
							prev.map((dashboard) =>
								dashboard.id === id
									? locallyAccurate
									: dashboard,
							),
						);
					}
				} else if (updates.description != null) {
					// Metadata writes are owner-gated too — non-fatal for editors.
					try {
						await store.setMetadata(
							id,
							effectiveTags,
							merged.description ?? "",
						);
					} catch {
						/* editor can't update project metadata */
					}
				}
				if (!released) {
					// Editor saved the working copy but can't release a new version.
					toast.info(
						"Your changes are saved. The live portal updates when an owner republishes.",
						"Saved",
					);
				}
				return { released, metadataSynced };
			} catch (error: unknown) {
				setError(
					error instanceof Error
						? error.message
						: "Failed to save change.",
				);
				throw error;
			}
		},
		[store, toast],
	);

	// Redeploy: push the CURRENT portal bundle + definition onto the existing
	// project (owner-only release). Use after the portal code changes so a
	// previously-deployed dashboard picks up the new build without recreating it.
	const redeployDashboard = useCallback(
		async (
			id: string,
			dashboard?: Dashboard,
		): Promise<{ released: boolean }> => {
			const def =
				dashboard ??
				defsCache.current.get(id) ??
				(await loadDashboard(id));
			if (!def) throw new Error("Dashboard not found.");
			defsCache.current.set(id, def);
			const res = await store.redeploy(id, def);
			if (res.released) {
				toast.success(
					"Portal redeployed — the live app now serves the latest build.",
					"Redeployed",
				);
			} else {
				toast.info(
					"Portal bundle updated. It goes live when an owner republishes.",
					"Redeployed",
				);
			}
			return res;
		},
		[store, loadDashboard, toast],
	);

	const deleteDashboard = useCallback(
		(id: string) => {
			setDashboards((prev) => prev.filter((d) => d.id !== id));
			defsCache.current.delete(id);
			writeThrough(store.remove(id));
		},
		[store, writeThrough],
	);

	const restoreDashboard = useCallback(
		(dashboard: Dashboard) => {
			// Re-create as a fresh project (a new id is assigned).
			writeThrough(
				createDashboard(dashboard, {
					published: dashboard.published ?? false,
					tags: dashboard.tags ?? [],
				}),
			);
		},
		[createDashboard, writeThrough],
	);

	const duplicateDashboard = useCallback(
		async (id: string): Promise<string | undefined> => {
			const src =
				(await loadDashboard(id).catch(() => undefined)) ??
				getDashboard(id);
			if (!src) return undefined;
			const copy: Dashboard = {
				...structuredClone(src),
				id: "pending",
				name: `${src.name} (copy)`,
			};
			return createDashboard(copy, {
				published: false,
				tags: src.tags ?? [],
			});
		},
		[loadDashboard, getDashboard, createDashboard],
	);

	const publishDashboard = useCallback(
		async (id: string, published: boolean) => {
			setDashboards((prev) =>
				prev.map((d) => (d.id === id ? { ...d, published } : d)),
			);
			const cached = defsCache.current.get(id);
			if (cached) defsCache.current.set(id, { ...cached, published });
			await store.setPublished(id, published);
		},
		[store],
	);

	// ── Tags (folders) ──────────────────────────────────────────────────────────
	const setDashboardTags = useCallback(
		(id: string, tags: string[]) => {
			const current = dashboardsRef.current.find(
				(dashboard) => dashboard.id === id,
			);
			const canonicalFolderNames = buildCanonicalFolderNames(
				dashboardsRef.current,
			);
			const editableTags = canonicalizeFolderTags(
				tags,
				canonicalFolderNames,
			).filter((tag) => !isManagedSystemTag(tag));
			const clean = current?.tags?.some(isParamAppTag)
				? [...editableTags, PARAM_APP_TAG]
				: editableTags;
			let desc = "";
			setDashboards((prev) =>
				prev.map((d) => {
					if (d.id !== id) return d;
					desc = d.description ?? "";
					return {
						...d,
						tags: clean,
						folderId: userFolderTags(clean)[0],
					};
				}),
			);
			const cached = defsCache.current.get(id);
			if (cached)
				defsCache.current.set(id, {
					...cached,
					tags: clean,
					folderId: userFolderTags(clean)[0],
				});
			writeThrough(store.setMetadata(id, clean, desc));
		},
		[store, writeThrough],
	);

	const toggleDashboardTag = useCallback(
		(id: string, tag: string, on: boolean) => {
			if (isManagedSystemTag(tag)) return;
			const d = dashboards.find((x) => x.id === id);
			const current = d?.tags ?? [];
			const key = tagKey(tag);
			const next = on
				? [...current, tag]
				: current.filter((t) => tagKey(t) !== key);
			setDashboardTags(id, next);
		},
		[dashboards, setDashboardTags],
	);

	// ── Derived folders (the distinct tags across everything I can see) ─────────
	const folders = useMemo<WorkspaceFolder[]>(() => {
		const names = buildCanonicalFolderNames(dashboards);
		const ordinaryFolders: WorkspaceFolder[] = [...names.values()]
			.sort((a, b) => a.localeCompare(b))
			.map((name, i) => ({
				id: name,
				name,
				kind: "published" as FolderKind,
				visibility: "public",
				sortOrder: i,
				createdAt: now(),
				updatedAt: now(),
			}));
		if (!dashboards.some((d) => (d.tags ?? []).some(isParamAppTag)))
			return ordinaryFolders;
		return [
			{
				id: PARAM_APP_TAG,
				name: "Parameterized Apps",
				kind: "published" as FolderKind,
				visibility: "public",
				sortOrder: -1,
				createdAt: now(),
				updatedAt: now(),
				locked: true,
			},
			...ordinaryFolders,
		];
	}, [dashboards]);

	const renameFolder = useCallback(
		(id: string, name: string) => {
			if (isManagedSystemTag(id) || isManagedSystemTag(name)) return;
			const next = name.trim();
			const idKey = tagKey(id);
			if (!next || next === id) return;
			// Rename the tag across every dashboard that has it.
			for (const d of dashboards) {
				if (!(d.tags ?? []).some((t) => tagKey(t) === idKey)) continue;
				setDashboardTags(
					d.id,
					(d.tags ?? []).map((t) => (tagKey(t) === idKey ? next : t)),
				);
			}
		},
		[dashboards, setDashboardTags],
	);

	const deleteFolder = useCallback(
		(id: string) => {
			if (isManagedSystemTag(id)) return;
			const idKey = tagKey(id);
			for (const d of dashboards) {
				if (!(d.tags ?? []).some((t) => tagKey(t) === idKey)) continue;
				setDashboardTags(
					d.id,
					(d.tags ?? []).filter((t) => tagKey(t) !== idKey),
				);
			}
		},
		[dashboards, setDashboardTags],
	);

	const ownedDashboards = useMemo(
		() => dashboards.filter(isOwnedDashboard),
		[dashboards],
	);

	const value = useMemo<WorkspaceContextValue>(
		() => ({
			dashboards,
			ownedDashboards,
			folders,
			loading,
			error,
			reload,
			currentUserId,
			isAdmin,
			getDashboard,
			loadDashboard,
			createDashboard,
			updateDashboard,
			redeployDashboard,
			deleteDashboard,
			restoreDashboard,
			duplicateDashboard,
			publishDashboard,
			renameFolder,
			deleteFolder,
			setDashboardTags,
			toggleDashboardTag,
		}),
		[
			dashboards,
			ownedDashboards,
			folders,
			loading,
			error,
			reload,
			currentUserId,
			isAdmin,
			getDashboard,
			loadDashboard,
			createDashboard,
			updateDashboard,
			redeployDashboard,
			deleteDashboard,
			restoreDashboard,
			duplicateDashboard,
			publishDashboard,
			renameFolder,
			deleteFolder,
			setDashboardTags,
			toggleDashboardTag,
		],
	);

	return (
		<WorkspaceContext.Provider value={value}>
			{children}
		</WorkspaceContext.Provider>
	);
}

export function useWorkspace(): WorkspaceContextValue {
	const ctx = useContext(WorkspaceContext);
	if (!ctx)
		throw new Error("useWorkspace must be used within a WorkspaceProvider");
	return ctx;
}
