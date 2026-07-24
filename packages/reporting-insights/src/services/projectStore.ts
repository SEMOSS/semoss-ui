/**
 * projectStore — the app's persistence layer, backed entirely by SEMOSS PROJECTS
 * (no dedicated H2 database, no DDL, no tables).
 *
 * The model:
 *   • Every dashboard IS a SEMOSS project. Its definition lives in the project's
 *     `dashboard.json` asset (under assets/portals/).
 *   • A private project (global=false) is a personal draft → "My Dashboards".
 *   • A global project (global=true, released) is published → "Published".
 *   • Tags (project metadata) are the ONLY folder system. A folder is simply the
 *     set of dashboards that share a tag; folders are derived client-side.
 *   • Every dashboard we own carries the marker tag APP_TAG so MyProjects can pick
 *     ours out of the full SEMOSS project catalog.
 *
 * Verified SEMOSS reactors / endpoints used here:
 *   MyProjects(metaKeys=["tag","description"], ...)          — list + metadata
 *   GetAppAssets(filePath=[...], project=[...])              — read a private asset (raw text)
 *   UploadProjectApp(filePath=[...], global=[bool])          — create project from a zip
 *   POST /api/uploadFile/projectAssetsUpload                  — write dashboard.json
 *   DeleteAsset(filePath=[...], space=[...])                  — remove old dashboard.json
 *   SetProjectMetadata(project=[...], meta=[{tag,description}]) — write tags/description
 *   POST /api/auth/project/setProjectGlobal                   — toggle public/private
 *   PublishProject(project=[...], release=[true])             — release a published version
 *   DeleteProject(project=[...])                              — delete entirely
 */

import { upload } from "@semoss/sdk";
import { inferSqlParameters } from "@/lib/paramInference";
import { publishedPortalUrl } from "@/lib/portalUrl";
import type { Dashboard } from "@/types/dashboard";
import {
	buildDashboardMcp,
	buildHostMcp,
	PY_DRIVER_FILE,
	PY_DRIVER_PATH,
	PY_MANIFEST_FILE,
	PY_MANIFEST_PATH,
} from "./mcpManifest";
import {
	buildMcpHostZip,
	buildPortalZip,
	escapeForPixel,
	mcpHostRedirectHtml,
	PORTAL_INDEX_HTML,
	sanitizeProjectName,
} from "./portalGenerator";

const MODULE = "/Monolith";

/**
 * Marker tag stamped on every dashboard this app creates, so we can reliably
 * filter OUR projects out of the full SEMOSS catalog. Namespaced to avoid
 * colliding with other apps' tags.
 */
export const APP_TAG = "reporting-insights--app";

/** Older marker(s) still recognised so previously-published apps keep appearing. */
const LEGACY_APP_TAGS = ["data--insight"];

/**
 * SEMOSS discovers MCP applications by this tag (the playground's MCP selector
 * filters projects on `tag = MCP`). Every dashboard we deploy carries it so it's
 * callable as an MCP tool. Treated as a marker (never shown as a user folder).
 */
export const MCP_TAG = "MCP";

/**
 * Marks the single "host" project that registers the reporting-insights APP itself
 * as an MCP (exposing create/list/update dashboard tools). It is NOT a dashboard,
 * so it's excluded from the dashboard listing.
 */
export const MCP_HOST_TAG = "reporting-insights--mcp-host";

/**
 * Prefix for the idempotency signature tag written by the MCP create flow. It is
 * SAVED on the project (so a reload can find an already-built dashboard instead of
 * deploying a duplicate) but must never surface as a user-facing folder.
 */
export const SIG_TAG_PREFIX = "ri-sig-";

/** All tags that mean "this is one of our apps" — never shown as folders. */
const MARKER_TAGS = new Set<string>([
	APP_TAG,
	MCP_TAG,
	MCP_HOST_TAG,
	...LEGACY_APP_TAGS,
]);

/** A tag that should never appear as a folder chip (markers + internal signature tags). */
const isMarkerTag = (t: string): boolean =>
	MARKER_TAGS.has(t) || t.startsWith(SIG_TAG_PREFIX);

/** Tags that identify a project as one of our DASHBOARDS (not the MCP host). */
const DASHBOARD_MARKERS = new Set<string>([APP_TAG, ...LEGACY_APP_TAGS]);
const isOurDashboard = (tags: string[]): boolean =>
	tags.some((t) => DASHBOARD_MARKERS.has(t)) && !tags.includes(MCP_HOST_TAG);

/** Public portal origin (set ENDPOINT in .env for dev; empty when deployed). */
const MODULE_PATH = (
	String(import.meta.env.MODULE || "") || "/Monolith"
).replace(/\/+$/, "");

/** A pixel runner that returns the first pixel output, already unwrapped. */
export type PixelRunner = (pixel: string) => Promise<unknown>;

/** Lightweight listing row — the full sheets are loaded lazily via loadDefinition. */
export interface DashboardMeta {
	id: string;
	name: string;
	description: string;
	tags: string[];
	published: boolean;
	permission?: string;
	updatedAt?: string;
}

// ── helpers ─────────────────────────────────────────────────────────────────
function asTags(raw: unknown): string[] {
	if (Array.isArray(raw))
		return raw.map((t) => String(t).trim()).filter(Boolean);
	if (typeof raw === "string")
		return raw
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
	return [];
}

const str = (v: unknown): string => (v == null ? "" : String(v));

/**
 * Candidate asset paths for dashboard.json. GetAppAssets resolves relative to the
 * project's app_root, so the canonical location (where uploadApp writes) is
 * version/assets/portals/. Older apps stored it at app_root/portals/. We try the
 * canonical path first.
 */
const ASSET_PATH_CANDIDATES = [
	"version/assets/portals/dashboard.json",
	"portals/dashboard.json",
	"assets/portals/dashboard.json",
];

export class ProjectStore {
	private csrfToken: string | null = null;
	/** Insight id captured from raw runPixel responses — the ACTIVE session, used
	 *  for uploads. (useInsight().insightId can be stale mid-flow.) */
	private capturedInsightId: string | null = null;
	private readonly run: PixelRunner;
	private readonly getInsightId: () => string | null;

	constructor(run: PixelRunner, getInsightId: () => string | null) {
		this.run = run;
		this.getInsightId = getInsightId;
	}

	/**
	 * Run a pixel via the raw endpoint and capture the session insightID from the
	 * response — the same approach as the proven portal save flow. Subsequent calls
	 * (and the asset upload) reuse this exact insight, avoiding the stale-id 400/500.
	 */
	private async runPixelRaw(expression: string): Promise<unknown> {
		const csrf = await this.csrf();
		// Match the SEMOSS SDK transport: x-www-form-urlencoded with the WHOLE
		// pixel percent-encoded, so the servlet's URL-decode reconstructs the exact
		// pixel (handles `%`, `+`, etc. in any embedded SQL).
		const headers: Record<string, string> = {
			"Content-Type": "application/x-www-form-urlencoded",
		};
		if (csrf) headers["X-CSRF-Token"] = csrf;
		let body = `expression=${encodeURIComponent(expression)}`;
		if (this.capturedInsightId)
			body += `&insightId=${encodeURIComponent(this.capturedInsightId)}`;
		const r = await fetch(`${MODULE}/api/engine/runPixel`, {
			method: "POST",
			headers,
			credentials: "include",
			body,
		});
		if (!r.ok) throw new Error(`HTTP ${r.status}`);
		const json: any = await r.json();
		if (json?.insightID) this.capturedInsightId = json.insightID;
		const pr = json?.pixelReturn?.[0];
		if (
			Array.isArray(pr?.operationType) &&
			pr.operationType.includes("ERROR")
		) {
			throw new Error(String(pr.output ?? "Pixel error"));
		}
		return pr?.output;
	}

	/** Ensure we hold an active insight id (creates one via a cheap pixel if needed). */
	private async ensureInsightId(): Promise<string> {
		if (!this.capturedInsightId) {
			try {
				await this.runPixelRaw("true;");
			} catch {
				/* ignore */
			}
		}
		return this.capturedInsightId ?? this.getInsightId() ?? "";
	}

	// ── CSRF (cached) ─────────────────────────────────────────────────────────
	private async csrf(): Promise<string | null> {
		if (this.csrfToken) return this.csrfToken;
		try {
			const r = await fetch(`${MODULE}/api/config/fetchCsrf`, {
				credentials: "include",
				headers: { "X-CSRF-Token": "fetch" },
			});
			if (r.ok)
				this.csrfToken =
					r.headers.get("X-CSRF-Token") ||
					r.headers.get("x-csrf-token");
		} catch {
			/* non-fatal */
		}
		return this.csrfToken;
	}

	// ── List ──────────────────────────────────────────────────────────────────
	/** All dashboards we own/can see (private drafts + published), newest-ish first. */
	async list(): Promise<DashboardMeta[]> {
		const pixel =
			'MyProjects(metaKeys=["tag","description"], metaFilters=[{}], ' +
			'sort=[{"DATELASTEDITED":"DESC"}], userT=[true], limit=[500], offset=[0]);';
		const out = await this.run(pixel);
		const rows: any[] = Array.isArray(out)
			? out
			: Array.isArray((out as any)?.data)
				? (out as any).data
				: [];
		return rows
			.map((r) => {
				const id = str(
					r.project_id ??
						r.app_id ??
						r.id ??
						r.PROJECT_ID ??
						r.project_global_id,
				);
				// Prefer the editable DISPLAY name (set via SetProjectDisplayName / rename);
				// fall back to the internal project name set at creation.
				const name = str(
					r.project_display_name ??
						r.project_name ??
						r.app_name ??
						r.low_project_name ??
						id,
				);
				const description = str(
					r.project_description ?? r.description ?? "",
				);
				const allTags = asTags(r.tag ?? r.tags);
				const published =
					r.project_global === true ||
					r.global === true ||
					str(r.project_global) === "true";
				const updatedAt = str(
					r.project_date_updated ??
						r.last_modified_on ??
						r.DATELASTEDITED ??
						"",
				);
				// project_permission may come back as an array (["OWNER"]) or a string.
				const permRaw = r.project_permission ?? r.permission;
				const permission = Array.isArray(permRaw)
					? permRaw[0] != null
						? String(permRaw[0])
						: undefined
					: permRaw != null
						? String(permRaw)
						: undefined;
				return {
					id,
					name,
					description,
					// Hide ALL marker + internal signature tags from the folder list.
					tags: allTags.filter((t) => !isMarkerTag(t)),
					published,
					permission,
					updatedAt: updatedAt || undefined,
					_isOurs: !!id && isOurDashboard(allTags),
				};
			})
			.filter((m) => m._isOurs)
			.map(({ _isOurs, ...m }) => m);
	}

	// ── Read definition ─────────────────────────────────────────────────────────
	/**
	 * Load the full Dashboard definition (sheets, etc.) from the project's
	 * dashboard.json. Works for private drafts via GetAppAssets; falls back to the
	 * public portal asset for published projects.
	 */
	async loadDefinition(id: string, published: boolean): Promise<Dashboard> {
		// 1. GetAppAssets — works for private AND published (reads the working copy).
		for (const path of ASSET_PATH_CANDIDATES) {
			try {
				const raw = await this.run(
					`GetAppAssets(filePath=["${escapeForPixel(path)}"], project=["${escapeForPixel(id)}"]);`,
				);
				const parsed = this.parseDefinition(raw, id);
				if (parsed) return parsed;
			} catch {
				/* try next candidate */
			}
		}
		// 2. Published fallback — fetch the served portal asset. Use a RELATIVE URL so
		//    it goes through the dev proxy (an absolute backend origin would be a
		//    cross-origin request and get blocked by CORS).
		if (published) {
			try {
				const r = await fetch(
					`${MODULE_PATH}/public_home/${encodeURIComponent(id)}/portals/dashboard.json`,
					{ credentials: "include" },
				);
				if (r.ok) {
					const parsed = this.parseDefinition(await r.text(), id);
					if (parsed) return parsed;
				}
			} catch {
				/* fall through */
			}
		}
		throw new Error("Could not load this dashboard’s definition.");
	}

	private parseDefinition(raw: unknown, id: string): Dashboard | null {
		let text: string;
		if (typeof raw === "string") text = raw;
		else if (raw && typeof raw === "object") text = JSON.stringify(raw);
		else return null;
		try {
			const obj = JSON.parse(text) as Partial<Dashboard>;
			if (!obj || typeof obj !== "object") return null;
			// Always trust the project id as the dashboard id so edits target the right project.
			return { ...(obj as Dashboard), id };
		} catch {
			return null;
		}
	}

	// ── Create (new project from a portal zip) ───────────────────────────────────
	/**
	 * Create a brand-new SEMOSS project for this dashboard.
	 * Returns the real project id assigned by SEMOSS.
	 */
	async create(
		dashboard: Dashboard,
		opts: { published: boolean; tags: string[] },
	): Promise<string> {
		// Register a Parameter for any {{placeholder}} in the SQL so the deployed
		// dashboard's portal can substitute values AND its MCP tool exposes those inputs.
		dashboard = inferSqlParameters(dashboard);
		const insightId = this.getInsightId();
		if (!insightId)
			throw new Error(
				"No active insight session. Please refresh and try again.",
			);

		const projectName = sanitizeProjectName(dashboard.name);
		const tempId = crypto.randomUUID();

		// 1. Build + upload the portal zip.
		const zipBlob = await buildPortalZip(
			{ ...dashboard, id: tempId },
			projectName,
			tempId,
		);
		const zipFile = new File([zipBlob], `${projectName}.zip`, {
			type: "application/zip",
		});
		const uploaded = await upload(zipFile, insightId, null, "");
		const fileLocation = uploaded[0]?.fileLocation ?? uploaded[0]?.fileName;
		if (!fileLocation)
			throw new Error("Upload failed: no fileLocation returned.");

		// 2. Create the project.
		let projectId = tempId;
		const output: any = await this.run(
			`UploadProjectApp(filePath=["${escapeForPixel(fileLocation)}"], global=[${opts.published}]);`,
		);
		if (typeof output === "string" && /^error/i.test(output))
			throw new Error(output);
		projectId =
			output?.project_id ?? output?.id ?? output?.app_id ?? tempId;
		// (No temp-zip cleanup: this instance has no DeleteInsightFile reactor and the
		// temp upload is discarded with the insight session anyway.)

		// 3. Re-write dashboard.json with the real id so future saves target it.
		const finalDashboard = {
			...dashboard,
			id: projectId,
			tags: opts.tags,
			published: opts.published,
		};
		// The definition MUST land in the project's assets — surface failures rather
		// than producing a project that opens to "Dashboard unavailable".
		await this.writeJson(projectId, finalDashboard);

		// 3b. Register the dashboard as an MCP tool (manifest asset).
		await this.writeMcpManifest(projectId, finalDashboard);

		// 4. Tags + description (always include the marker + MCP tags).
		await this.setMetadata(
			projectId,
			opts.tags,
			dashboard.description ?? "",
		);

		// 5. Release a published version so public_home serves it.
		if (opts.published) {
			try {
				await this.run(
					`PublishProject(project=["${escapeForPixel(projectId)}"], release=[true]);`,
				);
			} catch {
				/* non-fatal — project still created */
			}
		}
		return projectId;
	}

	// ── MCP host (register the app itself as an MCP) ──────────────────────────────
	/** Find one of our projects carrying a specific tag (or null). */
	private async findProjectIdByTag(tag: string): Promise<string | null> {
		try {
			const out = await this.run(
				'MyProjects(metaKeys=["tag"], metaFilters=[{}], userT=[true], limit=[500], offset=[0]);',
			);
			const rows: any[] = Array.isArray(out)
				? out
				: Array.isArray((out as any)?.data)
					? (out as any).data
					: [];
			for (const r of rows) {
				const id = str(
					r.project_id ?? r.app_id ?? r.id ?? r.PROJECT_ID,
				);
				if (id && asTags(r.tag ?? r.tags).includes(tag)) return id;
			}
		} catch {
			/* treat as not-found */
		}
		return null;
	}

	/** Deterministic idempotency tag for an MCP-created dashboard request signature. */
	static sigTag(signature: string): string {
		let h = 5381;
		for (let i = 0; i < signature.length; i++)
			h = ((h << 5) + h + signature.charCodeAt(i)) >>> 0;
		return `${SIG_TAG_PREFIX}${h.toString(36)}`;
	}

	/**
	 * Find a dashboard already deployed for this request signature, if any. Used by the
	 * MCP create flow so reloading the tool reopens the existing dashboard instead of
	 * deploying a duplicate — a server-side check that works even where client storage
	 * is blocked (cross-origin tool iframe).
	 */
	async findBySignature(signature: string): Promise<string | null> {
		return this.findProjectIdByTag(ProjectStore.sigTag(signature));
	}

	/**
	 * Register the reporting-insights APP itself as an MCP project the playground can
	 * use (create/list/update dashboards). Idempotent: reuses the existing host if one
	 * is found, refreshing its tool manifest; otherwise creates a small MCP-tagged
	 * project whose tools open the live app. Returns the host project id.
	 * @param appBaseUrl absolute URL the app is served from (its own location).
	 */
	async ensureMcpHost(appBaseUrl: string, refresh = false): Promise<string> {
		const { manifest, driver } = buildHostMcp(appBaseUrl);

		const existing = await this.findProjectIdByTag(MCP_HOST_TAG);
		if (existing) {
			// Cheap path: already registered. Only re-write the tools when asked.
			if (!refresh) return existing;
			await this.ensureInsightId();
			await this.uploadPortalAsset(
				existing,
				PY_DRIVER_FILE,
				driver,
				"text/x-python",
				PY_DRIVER_PATH,
			);
			await this.uploadPortalAsset(
				existing,
				PY_MANIFEST_FILE,
				manifest,
				"application/json",
				PY_MANIFEST_PATH,
			);
			// Re-write the portal redirect so it points at the (possibly corrected) app
			// URL — otherwise a host created from the dev server keeps redirecting to it.
			await this.uploadPortalAsset(
				existing,
				"index.html",
				mcpHostRedirectHtml(appBaseUrl),
				"text/html",
				"portals/",
			);
			try {
				await this.runPixelRaw(
					`DeleteAsset(filePath=["version/assets/mcp/pixel_mcp.json"], space=["${escapeForPixel(existing)}"]);`,
				);
			} catch {
				/* not present */
			}
			try {
				await this.runPixelRaw(
					`PublishProject(project=["${escapeForPixel(existing)}"], release=[true]);`,
				);
			} catch {
				/* non-fatal */
			}
			return existing;
		}

		const insightId = this.getInsightId();
		if (!insightId) throw new Error("No active insight session.");
		const projectName = sanitizeProjectName("Reporting Insights");
		const tempId = crypto.randomUUID();
		const zipBlob = await buildMcpHostZip(
			projectName,
			tempId,
			appBaseUrl,
			manifest,
			driver,
		);
		const zipFile = new File([zipBlob], `${projectName}.zip`, {
			type: "application/zip",
		});
		const uploaded = await upload(zipFile, insightId, null, "");
		const fileLocation = uploaded[0]?.fileLocation ?? uploaded[0]?.fileName;
		if (!fileLocation)
			throw new Error("Upload failed: no fileLocation returned.");
		const output: any = await this.run(
			`UploadProjectApp(filePath=["${escapeForPixel(fileLocation)}"], global=[true]);`,
		);
		if (typeof output === "string" && /^error/i.test(output))
			throw new Error(output);
		const projectId =
			output?.project_id ?? output?.id ?? output?.app_id ?? tempId;
		// Tag as MCP + host (NOT the dashboard marker, so it never shows in the list).
		const meta = JSON.stringify({
			tag: [MCP_TAG, MCP_HOST_TAG],
			description:
				"Reporting Insights — create, view, and manage dashboards.",
		});
		await this.run(
			`SetProjectMetadata(project=["${escapeForPixel(projectId)}"], meta=[${meta}]);`,
		);
		try {
			await this.runPixelRaw(
				`PublishProject(project=["${escapeForPixel(projectId)}"], release=[true]);`,
			);
		} catch {
			/* non-fatal */
		}
		return projectId;
	}

	// ── Save definition (existing project) ───────────────────────────────────────
	/**
	 * Overwrite an existing project's dashboard.json AND release the project so the
	 * deployed/uploaded app reflects the change (the published copy that public_home
	 * serves is otherwise left at the previous release). Runs under the same captured
	 * insight session as the write.
	 */
	async saveDefinition(
		id: string,
		dashboard: Dashboard,
	): Promise<{ released: boolean }> {
		dashboard = inferSqlParameters(dashboard);
		await this.writeJson(id, dashboard);
		// Keep the MCP tool manifest in sync with the latest parameters/name.
		await this.writeMcpManifest(id, dashboard);
		// Push the working copy to the published version so the deployed app updates.
		// PublishProject requires OWNER permission — editors can save the working copy
		// but can't release. Treat a release failure as NON-FATAL so an editor's save
		// still succeeds (the working copy is updated; an owner republishes the live
		// portal). Returns whether the release actually happened so callers can inform.
		try {
			await this.runPixelRaw(
				`PublishProject(project=["${escapeForPixel(id)}"], release=[true]);`,
			);
			return { released: true };
		} catch {
			return { released: false };
		}
	}

	/**
	 * Delete the old dashboard.json then upload the new one — mirrors the proven
	 * portal save flow: everything runs under ONE captured insight session so the
	 * upload's insightId matches the active server-side insight.
	 */
	private async writeJson(id: string, dashboard: Dashboard): Promise<void> {
		await this.ensureInsightId();
		const payload = {
			...dashboard,
			id,
			projectId: id,
			updatedAt: new Date().toISOString(),
		};
		await this.uploadPortalAsset(
			id,
			"dashboard.json",
			JSON.stringify(payload, null, 2),
			"application/json",
		);
	}

	/**
	 * Replace a single file under the project's `version/assets/portals/` folder:
	 * delete the old copy (best-effort) then upload the new one via the same
	 * projectAssetsUpload endpoint the save flow uses. Requires the caller to have
	 * already captured the insight session (see {@link ensureInsightId}).
	 */
	private async uploadPortalAsset(
		id: string,
		filename: string,
		content: BlobPart,
		contentType: string,
		pathFolder: string = "portals/",
	): Promise<void> {
		try {
			await this.runPixelRaw(
				`DeleteAsset(filePath=["version/assets/${pathFolder}${filename}"], space=["${escapeForPixel(id)}"]);`,
			);
		} catch {
			/* non-fatal — file may not exist yet */
		}
		const file = new File([content], filename, { type: contentType });
		const fd = new FormData();
		fd.append("file", file);
		const csrf = await this.csrf();
		const headers: Record<string, string> = {};
		if (csrf) headers["X-CSRF-Token"] = csrf;
		const params = [
			`projectId=${encodeURIComponent(id)}`,
			`path=${encodeURIComponent(pathFolder)}`,
		];
		if (this.capturedInsightId)
			params.push(
				`insightId=${encodeURIComponent(this.capturedInsightId)}`,
			);
		const url = `${MODULE}/api/uploadFile/projectAssetsUpload?${params.join("&")}`;
		const r = await fetch(url, {
			method: "POST",
			headers,
			credentials: "include",
			body: fd,
		});
		if (!r.ok) {
			const body = await r.text().catch(() => "");
			throw new Error(
				`${filename} upload failed: HTTP ${r.status} ${body.slice(0, 160)}`,
			);
		}
	}

	/**
	 * Write the MCP tool manifest (`assets/mcp/pixel_mcp.json`) for a deployed
	 * dashboard so SEMOSS's GetMCPTools exposes it as a callable tool — a
	 * "show the dashboard" tool whose inputs are the dashboard's query parameters
	 * and whose UI is the live portal. Best-effort: never block a save/deploy.
	 */
	private async writeMcpManifest(
		id: string,
		dashboard: Dashboard,
	): Promise<void> {
		try {
			const { manifest, driver } = buildDashboardMcp(
				{ ...dashboard, id },
				publishedPortalUrl(id),
			);
			// Python-backed tool: driver functions + the manifest GetMCPTools reads.
			await this.uploadPortalAsset(
				id,
				PY_DRIVER_FILE,
				driver,
				"text/x-python",
				PY_DRIVER_PATH,
			);
			await this.uploadPortalAsset(
				id,
				PY_MANIFEST_FILE,
				manifest,
				"application/json",
				PY_MANIFEST_PATH,
			);
			// Remove any stale pixel manifest (earlier approach) that would 404 the reactor.
			try {
				await this.runPixelRaw(
					`DeleteAsset(filePath=["version/assets/mcp/pixel_mcp.json"], space=["${escapeForPixel(id)}"]);`,
				);
			} catch {
				/* not present */
			}
		} catch {
			/* non-fatal — the dashboard still deploys; it just won't be MCP-callable */
		}
	}

	// ── Redeploy (refresh an existing project's portal bundle) ───────────────────
	/**
	 * Re-push the CURRENT portal app bundle (the built index.html baked into this
	 * app) plus the latest dashboard.json onto an existing project — without
	 * recreating it, so the project id, URL, tags and permissions are all preserved.
	 *
	 * Use this after the portal code changes: a plain Save only rewrites
	 * dashboard.json, leaving each project on its original (now-stale) index.html.
	 * Redeploy replaces index.html too, then releases.
	 *
	 * Owner-gated at the release step (PublishProject needs OWNER). A release failure
	 * is non-fatal — the working copy is refreshed and an owner can release later —
	 * and is reported back via `released`.
	 */
	async redeploy(
		id: string,
		dashboard: Dashboard,
	): Promise<{ released: boolean }> {
		dashboard = inferSqlParameters(dashboard);
		await this.ensureInsightId();
		// 1. Replace the portal app bundle with the freshly-built one.
		await this.uploadPortalAsset(
			id,
			"index.html",
			PORTAL_INDEX_HTML,
			"text/html",
		);
		// 2. Refresh the dashboard definition alongside it.
		await this.writeJson(id, dashboard);
		// 2b. Refresh the MCP tool manifest so the tool reflects the latest dashboard.
		await this.writeMcpManifest(id, dashboard);
		// 3. Make sure the project is still flagged as having a portal.
		try {
			const csrf = await this.csrf();
			const headers: Record<string, string> = {
				"Content-Type": "application/x-www-form-urlencoded",
			};
			if (csrf) headers["X-CSRF-Token"] = csrf;
			await fetch(`${MODULE}/api/auth/project/setProjectPortal`, {
				method: "POST",
				headers,
				credentials: "include",
				body: `projectId=${encodeURIComponent(id)}&hasPortal=true`,
			});
		} catch {
			/* non-fatal */
		}
		// 4. Release so the deployed/public copy serves the new bundle.
		try {
			await this.runPixelRaw(
				`PublishProject(project=["${escapeForPixel(id)}"], release=[true]);`,
			);
			return { released: true };
		} catch {
			return { released: false };
		}
	}

	// ── Metadata (tags + description) ────────────────────────────────────────────
	/** Write the project's tags (marker tag always included) and description. */
	async setMetadata(
		id: string,
		tags: string[],
		description: string,
	): Promise<void> {
		// Always include our marker + the MCP discovery tag; never let a marker tag be
		// used as a folder. The MCP tag makes the deployed dashboard show up in the
		// playground's MCP selector so it can be called as a tool.
		const folderTags = tags
			.map((t) => t.trim())
			.filter((t) => t && !MARKER_TAGS.has(t));
		const unique = Array.from(new Set([APP_TAG, MCP_TAG, ...folderTags]));
		// SEMOSS accepts the meta object inlined as raw JSON (proven by the existing
		// publish flow). JSON.stringify already escapes inner quotes/newlines, which
		// is exactly what the pixel parser needs for the embedded JSON value.
		const meta = JSON.stringify({
			tag: unique,
			description: description ?? "",
		});
		await this.run(
			`SetProjectMetadata(project=["${escapeForPixel(id)}"], meta=[${meta}]);`,
		);
	}

	// ── Rename (display name) ────────────────────────────────────────────────────
	/**
	 * Rename the SEMOSS project's DISPLAY name (what the catalog + our listing show).
	 * Uses SetProjectDisplayName, which updates the security DB (PROJECTDISPLAYNAME),
	 * the .smss, and pushes to cloud. OWNER-only — throws otherwise. The project id is
	 * unchanged, so links keep working.
	 */
	async renameProject(id: string, name: string): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed) throw new Error("Name cannot be blank.");
		await this.run(
			`SetProjectDisplayName(project=["${escapeForPixel(id)}"], name=["${escapeForPixel(trimmed)}"]);`,
		);
	}

	// ── Visibility toggle (public / private) ─────────────────────────────────────
	/** Make the project discoverable by everyone (public) or owner+grantees (private).
	 *  Does NOT re-release — visibility only. */
	async setPublished(id: string, published: boolean): Promise<void> {
		const csrf = await this.csrf();
		const headers: Record<string, string> = {
			"Content-Type": "application/x-www-form-urlencoded",
		};
		if (csrf) headers["X-CSRF-Token"] = csrf;
		const r = await fetch(`${MODULE}/api/auth/project/setProjectGlobal`, {
			method: "POST",
			headers,
			credentials: "include",
			body: `projectId=${encodeURIComponent(id)}&public=${published ? "true" : "false"}`,
		});
		if (!r.ok) throw new Error(`setProjectGlobal failed: HTTP ${r.status}`);
	}

	// ── Delete ───────────────────────────────────────────────────────────────────
	async remove(id: string): Promise<void> {
		const output: any = await this.run(
			`DeleteProject(project=["${escapeForPixel(id)}"]);`,
		);
		if (typeof output === "string" && /^error/i.test(output))
			throw new Error(output);
	}
}
