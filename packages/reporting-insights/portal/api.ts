import { buildQueryPixel, lastPixelOutput } from "@/lib/queryPixel";
import type {
	DashboardConfig,
	Database,
	JoinSpec,
	QueryResult,
	QuerySourceLeg,
} from "./types";

const MODULE = "/Monolith";

// Captured from pixel responses (json.insightID). Reused for file uploads.
let INSIGHT_ID: string | null = null;
let csrfToken: string | null = null;

async function getCsrf(): Promise<string | null> {
	if (csrfToken) return csrfToken;
	try {
		const r = await fetch(`${MODULE}/api/config/fetchCsrf`, {
			credentials: "include",
			headers: { "X-CSRF-Token": "fetch" },
		});
		if (r.ok)
			csrfToken =
				r.headers.get("X-CSRF-Token") ||
				r.headers.get("x-csrf-token") ||
				null;
	} catch {
		/* non-fatal */
	}
	return csrfToken;
}

/**
 * Run a pixel. Captures the session insightID from the response (json.insightID)
 * so subsequent file uploads can be associated with a valid insight.
 */
type PixelReturnEntry = { operationType?: string[]; output?: unknown };

/**
 * POST a pixel and return the FULL pixelReturn array (one entry per `;` statement).
 * Captures the session insight id. Does not throw on ERROR — callers decide.
 */
async function postPixel(expression: string): Promise<PixelReturnEntry[]> {
	const csrf = await getCsrf();
	// Match the SEMOSS SDK transport: x-www-form-urlencoded with the WHOLE pixel
	// percent-encoded. The servlet URL-decodes the `expression` value, so encoding
	// it here means the backend reconstructs the exact pixel — including any `%`,
	// `+`, etc. in the SQL. (Sending raw JSON makes the backend's decode choke on a
	// literal `%`: "URLDecoder: Illegal hex characters".)
	const headers: Record<string, string> = {
		"Content-Type": "application/x-www-form-urlencoded",
	};
	if (csrf) headers["X-CSRF-Token"] = csrf;

	let body = `expression=${encodeURIComponent(expression)}`;
	if (INSIGHT_ID) body += `&insightId=${encodeURIComponent(INSIGHT_ID)}`;

	const r = await fetch(`${MODULE}/api/engine/runPixel`, {
		method: "POST",
		headers,
		credentials: "include",
		body,
	});
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	const json = await r.json();

	// SEMOSS returns the session insight ID at the top level — capture it
	if ((json as any)?.insightID) INSIGHT_ID = (json as any).insightID;

	return (json as { pixelReturn?: PixelReturnEntry[] })?.pixelReturn ?? [];
}

/**
 * Run a pixel. Returns the FIRST statement's output (throws on ERROR). Used for the
 * many single-statement pixels (metadata, save flow, etc.).
 */
export async function runPixel(expression: string): Promise<unknown> {
	const prs = await postPixel(expression);
	const pr = prs[0];
	if (
		Array.isArray(pr?.operationType) &&
		pr.operationType.includes("ERROR")
	) {
		throw new Error(String(pr.output ?? "Pixel error"));
	}
	return pr?.output;
}

/** Optional cross-source legs (already param-interpolated) for a data-product query. */
export interface QueryRunSource {
	sources?: QuerySourceLeg[];
	joins?: JoinSpec[];
}

/**
 * Run a SQL query (or a data-product frame merge) against the database(s).
 * @param collect rows to fetch — a finite page size for table pagination, or -1
 *   (ALL rows) for other viz types.
 * @param source when present with ≥2 legs, executes a cross-source frame merge.
 */
export async function runDatabaseQuery(
	databaseId: string,
	query: string,
	collect = -1,
	source?: QueryRunSource,
): Promise<QueryResult> {
	const pixel = buildQueryPixel(
		{ databaseId, query, sources: source?.sources, joins: source?.joins },
		{ collect },
	);
	const prs = await postPixel(pixel);
	const { output: out, error } = lastPixelOutput(prs);
	if (error) throw new Error(error);
	const o = out as Record<string, unknown> | null;
	const headers =
		(o?.data as { headers?: string[] })?.headers ??
		(o?.headers as string[]) ??
		[];
	const values =
		(o?.data as { values?: unknown[][] })?.values ??
		(o?.values as unknown[][]) ??
		(o?.data as unknown[][]) ??
		[];
	if (!Array.isArray(values))
		throw new Error("Unexpected query result format");
	return { headers: headers as string[], values: values as unknown[][] };
}

export async function loadDatabases(): Promise<Database[]> {
	const pixel = `MyEngines(engineTypes=['DATABASE'], sort=[{"ENGINENAME":"ASC"}], limit=[1000], offset=[0]);`;
	return ((await runPixel(pixel)) as Database[]) ?? [];
}

function resolveProjectId(fallback: string): string {
	try {
		const match = window.location.pathname.match(
			/\/project\/([^/]+)\/portals/,
		);
		if (match?.[1]) return match[1];
	} catch {
		/* ignore */
	}
	return fallback;
}

/** Escape a value for a Semoss pixel string literal. */
function escPixel(s: string): string {
	return String(s)
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t")
		.replace(/\r/g, "");
}

/**
 * Ensure we have a session insight ID. The portal runs pixels on mount
 * (loadDatabases), which populates INSIGHT_ID — but if save is the first
 * action, run a cheap pixel to obtain one.
 */
async function ensureInsightId(): Promise<void> {
	if (INSIGHT_ID) return;
	try {
		await runPixel(`true;`);
	} catch {
		/* ignore — upload will use '' */
	}
}

/**
 * Save dashboard.json using the proven portal save flow:
 *   1. DeleteAsset (remove existing dashboard.json)
 *   2. projectAssetsUpload (insightId + projectId + path=portals/)
 *   3. setProjectPortal (hasPortal=true)
 *   4. PublishProject (release=true)
 */
export async function saveDashboard(
	projectId: string,
	config: DashboardConfig,
): Promise<void> {
	const resolvedId = resolveProjectId(projectId);
	const newConfig = {
		...config,
		projectId: resolvedId,
		updatedAt: new Date().toISOString(),
	};

	await ensureInsightId();

	// 1. Delete the existing dashboard.json (best-effort)
	try {
		await runPixel(
			`DeleteAsset(filePath=["version/assets/portals/dashboard.json"], space=["${escPixel(resolvedId)}"]);`,
		);
	} catch {
		/* non-fatal — may not exist */
	}

	// 2. Upload the new dashboard.json via projectAssetsUpload
	const csrf = await getCsrf();
	const dashFile = new File(
		[JSON.stringify(newConfig, null, 2)],
		"dashboard.json",
		{ type: "application/json" },
	);
	const fd = new FormData();
	fd.append("file", dashFile);
	const uploadHdrs: Record<string, string> = {};
	if (csrf) uploadHdrs["X-CSRF-Token"] = csrf;

	const uploadUrl =
		`${MODULE}/api/uploadFile/projectAssetsUpload` +
		`?insightId=${encodeURIComponent(INSIGHT_ID || "")}` +
		`&projectId=${encodeURIComponent(resolvedId)}` +
		`&path=${encodeURIComponent("portals/")}`;

	const uploadResp = await fetch(uploadUrl, {
		method: "POST",
		headers: uploadHdrs,
		credentials: "include",
		body: fd,
	});
	if (!uploadResp.ok) {
		const errBody = await uploadResp.text().catch(() => "");
		throw new Error(
			`Upload failed: HTTP ${uploadResp.status} ${errBody.slice(0, 160)}`,
		);
	}

	// 3. Mark the project as having a portal
	const portalHdrs: Record<string, string> = {
		"Content-Type": "application/x-www-form-urlencoded",
	};
	if (csrf) portalHdrs["X-CSRF-Token"] = csrf;
	const portalResp = await fetch(
		`${MODULE}/api/auth/project/setProjectPortal`,
		{
			method: "POST",
			headers: portalHdrs,
			credentials: "include",
			body: `projectId=${encodeURIComponent(resolvedId)}&hasPortal=true`,
		},
	);
	if (!portalResp.ok)
		throw new Error(`setProjectPortal failed: HTTP ${portalResp.status}`);

	// 4. Publish so all users see the change on next load
	await runPixel(
		`PublishProject(project=["${escPixel(resolvedId)}"], release=[true]);`,
	);
}
