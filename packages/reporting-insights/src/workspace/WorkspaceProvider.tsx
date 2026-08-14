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
import { appPublicBaseUrl } from "@/lib/portalUrl";
import { HOST_ARTIFACT_VERSION } from "@/services/mcpManifest";
import { isAdminUser } from "@/services/permissionsApi";
import { type DashboardMeta, ProjectStore } from "@/services/projectStore";
import type { FolderKind, WorkspaceFolder } from "@/services/workspaceStore";
import type { Dashboard } from "@/types/dashboard";

/** Owned = I'm the project OWNER, or (permission unknown) it's my private draft. */
export function isOwnedDashboard(d: Dashboard): boolean {
	return d.permission ? d.permission === "OWNER" : !d.published;
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
	/** Find a dashboard already deployed for a request signature (MCP create idempotency). */
	findDashboardBySignature: (signature: string) => Promise<string | null>;
	/** Merge updates into an existing dashboard and persist (definition + metadata). */
	updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
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
		folderId: m.tags[0], // compat: "primary" folder = first tag
		sheets,
		createdAt: m.updatedAt ?? now(),
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
					const res: any = await actionsRef.current.run(pixel);
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

	// ── Load identity (once) ─────────────────────────────────────────────────
	const ensureViewer = useCallback(async () => {
		if (viewerRef.current) return viewerRef.current;
		let userId = "";
		try {
			const out: any = await actionsRef.current
				.run("GetUserInfo();")
				.then((r: any) => r?.pixelReturn?.[0]?.output);
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
			const metas = await store.list();
			// Merge any cached full definitions so we don't lose sheets already loaded
			// (e.g. after opening a dashboard, then navigating back to the listing).
			setDashboards(
				metas.map((m) =>
					metaToDashboard(
						m,
						defsCache.current.get(m.id)?.sheets ?? [],
					),
				),
			);
		} catch (e: any) {
			setError(e?.message ?? "Failed to load workspace.");
		} finally {
			setLoading(false);
		}
	}, [store, ensureViewer]);

	useEffect(() => {
		void reload();
	}, [reload]);

	// Register the reporting-insights app itself as an MCP host project so the playground
	// can discover it and call its create/list/update dashboard tools.
	// The self-heal (re-upload driver + manifest + redirect, then republish) is EXPENSIVE,
	// so only run it when the host artifacts (HOST_ARTIFACT_VERSION) or the app URL have
	// changed since this browser last synced — otherwise a plain reload would re-upload +
	// republish the host on every load (the DeleteAsset/upload/PublishProject noise).
	const mcpRegisteredRef = useRef(false);
	useEffect(() => {
		if (mcpRegisteredRef.current) return;
		mcpRegisteredRef.current = true;
		// Deployment-correct app URL (VITE_APP_URL, else window.location). Baked into
		// the host's tool resourceURIs + redirect so the playground can open the app.
		const appBaseUrl = appPublicBaseUrl();
		const syncKey = `${HOST_ARTIFACT_VERSION}|${appBaseUrl}`;
		let alreadySynced = false;
		try {
			alreadySynced =
				localStorage.getItem("ri-mcp-host-sync") === syncKey;
		} catch {
			/* storage unavailable — fall through and sync (once per mount) */
		}
		if (alreadySynced) return; // host already up to date for this version + URL
		void store
			.ensureMcpHost(appBaseUrl, true)
			.then(() => {
				try {
					localStorage.setItem("ri-mcp-host-sync", syncKey);
				} catch {
					/* ignore */
				}
			})
			.catch(() => {
				/* non-fatal: playground registration is best-effort */
			});
	}, [store]);

	const writeThrough = useCallback((p: Promise<unknown>) => {
		p.catch((e: any) => setError(e?.message ?? "Failed to save change."));
	}, []);

	// ── Definitions ─────────────────────────────────────────────────────────────
	const loadDashboard = useCallback(
		async (id: string): Promise<Dashboard> => {
			const cached = defsCache.current.get(id);
			if (cached && cached.sheets?.length) return cached;
			const meta = dashboards.find((d) => d.id === id);
			const def = await store.loadDefinition(
				id,
				meta?.published ?? false,
			);
			const full: Dashboard = {
				...def,
				id,
				tags: meta?.tags ?? def.tags ?? [],
				published: meta?.published ?? def.published ?? false,
				permission: meta?.permission ?? def.permission,
				folderId: (meta?.tags ?? def.tags ?? [])[0],
			};
			defsCache.current.set(id, full);
			setDashboards((prev) =>
				prev.map((d) =>
					d.id === id ? { ...d, sheets: full.sheets } : d,
				),
			);
			return full;
		},
		[store, dashboards],
	);

	const getDashboard = useCallback(
		(id: string) =>
			defsCache.current.get(id) ?? dashboards.find((d) => d.id === id),
		[dashboards],
	);

	// ── Create / update / delete ────────────────────────────────────────────────
	const createDashboard = useCallback(
		async (
			dashboard: Dashboard,
			opts: { published: boolean; tags: string[] },
		): Promise<string> => {
			const id = await store.create(dashboard, opts);
			const created: Dashboard = {
				...dashboard,
				id,
				tags: opts.tags,
				published: opts.published,
				folderId: opts.tags[0],
			};
			defsCache.current.set(id, created);
			setDashboards((prev) => [
				metaToDashboard(
					{
						id,
						name: created.name,
						description: created.description ?? "",
						tags: opts.tags,
						published: opts.published,
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
		(id: string, updates: Partial<Dashboard>) => {
			let merged: Dashboard | undefined;
			setDashboards((prev) =>
				prev.map((d) => {
					if (d.id !== id) return d;
					merged = { ...d, ...updates, updatedAt: now() };
					return merged;
				}),
			);
			if (!merged) return;
			defsCache.current.set(id, merged);
			// Persist the definition. Tags are NEVER written from an edit — they're
			// only set when sharing/publishing (setDashboardTags). A description change
			// updates metadata but preserves the existing tags.
			writeThrough(
				(async () => {
					const { released } = await store.saveDefinition(
						id,
						merged!,
					);
					if (updates.name != null && merged!.name?.trim()) {
						// Rename the SEMOSS project's display name to match the title.
						// Owner-only (SetProjectDisplayName) — non-fatal for editors.
						try {
							await store.renameProject(id, merged!.name);
						} catch {
							/* editor can't rename the project */
						}
					}
					if (updates.description != null) {
						// Metadata writes are owner-gated too — non-fatal for editors.
						try {
							await store.setMetadata(
								id,
								merged!.tags ?? [],
								merged!.description ?? "",
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
				})(),
			);
		},
		[store, writeThrough, toast],
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
			const clean = Array.from(
				new Set(tags.map((t) => t.trim()).filter(Boolean)),
			);
			let desc = "";
			setDashboards((prev) =>
				prev.map((d) => {
					if (d.id !== id) return d;
					desc = d.description ?? "";
					return { ...d, tags: clean, folderId: clean[0] };
				}),
			);
			const cached = defsCache.current.get(id);
			if (cached)
				defsCache.current.set(id, {
					...cached,
					tags: clean,
					folderId: clean[0],
				});
			writeThrough(store.setMetadata(id, clean, desc));
		},
		[store, writeThrough],
	);

	const toggleDashboardTag = useCallback(
		(id: string, tag: string, on: boolean) => {
			const d = dashboards.find((x) => x.id === id);
			const current = d?.tags ?? [];
			const next = on
				? Array.from(new Set([...current, tag]))
				: current.filter((t) => t !== tag);
			setDashboardTags(id, next);
		},
		[dashboards, setDashboardTags],
	);

	// ── Derived folders (the distinct tags across everything I can see) ─────────
	const folders = useMemo<WorkspaceFolder[]>(() => {
		const names = new Set<string>();
		for (const d of dashboards) for (const t of d.tags ?? []) names.add(t);
		return [...names]
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
	}, [dashboards]);

	const renameFolder = useCallback(
		(id: string, name: string) => {
			const next = name.trim();
			if (!next || next === id) return;
			// Rename the tag across every dashboard that has it.
			for (const d of dashboards) {
				if (!(d.tags ?? []).includes(id)) continue;
				setDashboardTags(
					d.id,
					(d.tags ?? []).map((t) => (t === id ? next : t)),
				);
			}
		},
		[dashboards, setDashboardTags],
	);

	const deleteFolder = useCallback(
		(id: string) => {
			for (const d of dashboards) {
				if (!(d.tags ?? []).includes(id)) continue;
				setDashboardTags(
					d.id,
					(d.tags ?? []).filter((t) => t !== id),
				);
			}
		},
		[dashboards, setDashboardTags],
	);

	const ownedDashboards = useMemo(
		() => dashboards.filter(isOwnedDashboard),
		[dashboards],
	);

	const findDashboardBySignature = useCallback(
		(signature: string) => store.findBySignature(signature),
		[store],
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
			findDashboardBySignature,
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
			findDashboardBySignature,
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
