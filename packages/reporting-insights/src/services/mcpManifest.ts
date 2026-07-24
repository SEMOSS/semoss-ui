/**
 * MCP tool generation for reporting-insights.
 *
 * SEMOSS MCP tools must be backed by executable code in the project — either Java
 * reactors or **Python functions**. We ship Python: each project carries
 *   • `py/mcp_driver.py`  — the tool functions (name == tool name), and
 *   • `mcp/py_mcp.json`   — the manifest (`"_type": "python"`) GetMCPTools reads.
 *
 * The functions are intentionally thin: they return a link to the Reporting
 * Insights app/portal (and `_meta.SMSS_MCP_UI.resourceURI` opens it inline where
 * supported), so a tool call always produces a usable result and never errors —
 * even on a minimal Python runtime. Richer server-side behaviour can be added to
 * `mcp_driver.py` later without changing the manifest contract.
 *
 * Manifest shape follows SEMOSS's generated py_mcp.json (see vba-futures apps):
 * top-level `_meta.last_modified_date`; each tool has name/title/description/
 * inputSchema and `_meta` { generated_on, SMSS_MCP_EXECUTION, SMSS_MCP_UI? } + `_type`.
 */
import type { Dashboard, Parameter } from "@/types/dashboard";

/**
 * Version of the MCP HOST artifacts (host tool manifest + driver + redirect portal).
 * `WorkspaceProvider` re-syncs the host on load only when this (or the app URL) changes,
 * so a normal reload doesn't re-upload+republish the host every time. BUMP this whenever
 * `buildHostMcp` or `mcpHostRedirectHtml` change so clients pick up the new host once.
 */
export const HOST_ARTIFACT_VERSION =
	"2026-07-22.data-products-merge-base-accumulate";

export const PY_DRIVER_PATH = "py/"; // → version/assets/py/mcp_driver.py
export const PY_DRIVER_FILE = "mcp_driver.py";
export const PY_MANIFEST_PATH = "mcp/"; // → version/assets/mcp/py_mcp.json
export const PY_MANIFEST_FILE = "py_mcp.json";

export interface McpArtifacts {
	manifest: string; // py_mcp.json contents
	driver: string; // mcp_driver.py contents
}

interface PyTool {
	name: string;
	title: string;
	description: string;
	inputSchema: {
		type: "object";
		title: string;
		properties: Record<string, PyField>;
		required: string[];
	};
	_meta: {
		generated_on: string;
		SMSS_MCP_EXECUTION: "auto" | "ask" | "disabled";
		SMSS_MCP_UI?: {
			resourceURI: string;
			loadingMessage: string;
			displayLocation: "inline" | "sidebar" | "hidden";
			autoOpen: boolean;
		};
	};
	_type: "python";
}
interface PyField {
	type: string;
	title: string;
	description?: string;
	default?: string;
	enum?: string[];
}

const day = (iso: string) => iso.slice(0, 10);
const pyStr = (s: string) => JSON.stringify(String(s ?? "")); // safe python string literal (JSON == valid py)

/** slug → valid python identifier fragment. */
function slug(name: string): string {
	return (
		(name || "dashboard")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "")
			.slice(0, 40) || "dashboard"
	);
}

/** Every unique query parameter across the dashboard, deduped by name. */
export function dashboardParameters(dashboard: Dashboard): Parameter[] {
	const seen = new Set<string>();
	const out: Parameter[] = [];
	const collect = (params?: Parameter[]) => {
		for (const p of params ?? []) {
			if (!p?.name || seen.has(p.name)) continue;
			seen.add(p.name);
			out.push(p);
		}
	};
	for (const q of dashboard.queries ?? []) collect(q.parameters);
	for (const s of dashboard.sheets ?? [])
		for (const v of s.visualizations ?? []) collect(v.parameters);
	return out;
}

/**
 * `resourceURI` is the tool's custom-UI path. The playground renders it as
 *   `${MODULE}/public_home/<projectId>/portals${resourceURI}`
 * (string concatenation — see playground tools-view.tsx), so it MUST be a path
 * relative to the project's own portal that starts with `/` — NEVER an absolute
 * `http(s)://` URL (that produces `…/portalshttp://…` and 404s).
 */
function uiMeta(
	resourceURI: string,
	title: string,
): PyTool["_meta"]["SMSS_MCP_UI"] {
	return {
		resourceURI,
		loadingMessage: `${title}…`,
		displayLocation: "inline",
		autoOpen: true,
	};
}

// ── Per-dashboard: a "show the dashboard" tool ────────────────────────────────
export function buildDashboardMcp(
	dashboard: Dashboard,
	portalUrl: string,
	nowIso: string = new Date().toISOString(),
): McpArtifacts {
	const params = dashboardParameters(dashboard);
	const fn = `show_${slug(dashboard.name)}`;
	const properties: Record<string, PyField> = {};
	const required: string[] = [];
	for (const p of params) {
		const hint = p.options?.length
			? `${p.label || p.name} (one of: ${p.options.join(", ")})`
			: p.label || p.name;
		properties[p.name] = {
			type: "string",
			title: p.label || p.name,
			description: `Filter value for "${p.name}". ${hint}`,
		};
		if (p.defaultValue) properties[p.name].default = p.defaultValue;
		if (p.options?.length) properties[p.name].enum = p.options;
		// Mark EVERY filter required so the model reliably passes a value — an optional
		// filter is routinely skipped by the LLM, which leaves the dashboard unfiltered.
		required.push(p.name);
	}
	const desc =
		`Show the "${dashboard.name}" dashboard` +
		(dashboard.description ? ` — ${dashboard.description}` : "") +
		(params.length
			? `. This dashboard is filtered by: ${params.map((p) => p.name).join(", ")}. You MUST provide a value` +
				` for each of these arguments — they are applied to the dashboard's SQL and the filtered result is rendered.`
			: ".");

	const tool: PyTool = {
		name: fn,
		title: dashboard.name || "Dashboard",
		description: desc,
		inputSchema: {
			type: "object",
			title: `${dashboard.name || "Dashboard"} Arguments`,
			properties,
			required,
		},
		// resourceURI "/" → the playground renders THIS project's own portal
		// (`…/public_home/<id>/portals/`), which IS the deployed dashboard. Filter
		// parameters arrive via the SMSS_INIT_TOOL postMessage (handled in ViewMode),
		// so they need not be in the URL.
		_meta: {
			generated_on: day(nowIso),
			SMSS_MCP_EXECUTION: "auto",
			SMSS_MCP_UI: uiMeta("/", dashboard.name || "Dashboard"),
		},
		_type: "python",
	};
	const manifest = JSON.stringify(
		{ _meta: { last_modified_date: day(nowIso) }, tools: [tool] },
		null,
		2,
	);

	const driver = [
		`"""Reporting Insights dashboard — MCP tool (auto-generated)."""`,
		`import urllib.parse`,
		``,
		`PORTAL_URL = ${pyStr(portalUrl)}`,
		``,
		``,
		`def ${fn}(**kwargs):`,
		`    """${desc.replace(/"/g, "'")}`,
		``,
		`    Returns a link that renders the dashboard filtered to the given parameters.`,
		`    """`,
		`    params = {k: str(v) for k, v in kwargs.items() if v is not None and str(v) != ""}`,
		`    url = PORTAL_URL`,
		`    if params:`,
		`        url = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params)`,
		`    return {"message": "Reporting Insights dashboard", "url": url, "parameters": params}`,
		``,
	].join("\n");

	return { manifest, driver };
}

// ── App host: create / list / update dashboard tools ──────────────────────────
export function buildHostMcp(
	appBaseUrl: string,
	nowIso: string = new Date().toISOString(),
): McpArtifacts {
	const base = appBaseUrl.replace(/#.*$/, "").replace(/\/+$/, "") + "/";
	const mk = (
		name: string,
		title: string,
		description: string,
		route: string,
		properties: Record<string, PyField>,
		required: string[],
	): PyTool => ({
		name,
		title,
		description,
		inputSchema: {
			type: "object",
			title: `${title} Arguments`,
			properties,
			required,
		},
		// resourceURI is portal-relative ("/#/route"). The host project's portal is a
		// hash-aware redirect (see mcpHostRedirectHtml) that forwards to the deployed
		// app at APP_URL + that hash — so each tool opens the right app page.
		_meta: {
			generated_on: day(nowIso),
			SMSS_MCP_EXECUTION: "auto",
			SMSS_MCP_UI: uiMeta(`/#/${route}`, title),
		},
		_type: "python",
	});

	// Data tool: returns dashboard data/insights straight to the assistant (no iframe UI).
	const mkData = (
		name: string,
		title: string,
		description: string,
		properties: Record<string, PyField>,
		required: string[],
	): PyTool => ({
		name,
		title,
		description,
		inputSchema: {
			type: "object",
			title: `${title} Arguments`,
			properties,
			required,
		},
		_meta: { generated_on: day(nowIso), SMSS_MCP_EXECUTION: "auto" },
		_type: "python",
	});

	const tools: PyTool[] = [
		mkData(
			"search_dashboards",
			"Search dashboards",
			'Find Reporting Insights dashboards whose content matches a query. Searches names, descriptions, tags, chart titles, database + column names, SQL text, and parameters. Returns ranked matches (id, name, description, databases, sheet/chart summary) — use this to answer "which dashboard shows X?".',
			{
				query: {
					type: "string",
					title: "Search query",
					description:
						'What to look for (e.g. "color distribution", a table/column name, a topic)',
				},
				limit: {
					type: "string",
					title: "Max results",
					description: "Maximum dashboards to return (default 10)",
					default: "10",
				},
			},
			["query"],
		),
		mkData(
			"describe_dashboard",
			"Describe a dashboard",
			"Return the full structure of one dashboard: its sheets, every visualization (title, chart type, database) and the underlying SQL queries + parameters. Use after search_dashboards to understand how a dashboard is built and what data it uses. Accepts a dashboard id OR a name.",
			{
				dashboard_id: {
					type: "string",
					title: "Dashboard id",
					description:
						"The dashboard (project) id — or pass `name` instead",
				},
				name: {
					type: "string",
					title: "Dashboard name",
					description:
						"Dashboard name (or part of it) if you do not have the id",
				},
			},
			[],
		),
		mkData(
			"query_dashboard",
			"Query a dashboard for insights",
			"Run a dashboard's queries against its live database and return sample rows + row counts, so you can answer questions about the actual data. Optionally target one chart by title. Falls back to returning the SQL if live execution is unavailable.",
			{
				dashboard_id: {
					type: "string",
					title: "Dashboard id",
					description: "The dashboard (project) id to query",
				},
				visualization: {
					type: "string",
					title: "Visualization",
					description:
						"Optional — only run the query for the chart whose title contains this text",
				},
				limit: {
					type: "string",
					title: "Row limit",
					description: "Max rows per query (default 20)",
					default: "20",
				},
			},
			["dashboard_id"],
		),
		mkData(
			"list_dashboards",
			"List dashboards",
			"List all Reporting Insights dashboards with a short summary of each (id, name, description, databases, charts).",
			{},
			[],
		),
		// These open the app UI — create/edit are inherently interactive.
		mk(
			"create_dashboard",
			"Create a dashboard",
			"Create AND deploy a new Reporting Insights dashboard from a natural-language description, grounded in a database. Opens the auto-build page which generates + deploys the dashboard.",
			"mcp/create",
			{
				description: {
					type: "string",
					title: "Description",
					description:
						'What the dashboard should show (e.g. "sales by region as a pie chart")',
				},
				database: {
					type: "string",
					title: "Database",
					description:
						'Database name or engine id to build from (e.g. "alphabet2")',
				},
			},
			["description"],
		),
		mk(
			"update_dashboard",
			"Edit a dashboard",
			"Open an existing Reporting Insights dashboard for editing / redeploying.",
			"published",
			{
				dashboard_id: {
					type: "string",
					title: "Dashboard id",
					description: "The dashboard (project) id to edit",
				},
			},
			[],
		),
	];
	const manifest = JSON.stringify(
		{ _meta: { last_modified_date: day(nowIso) }, tools },
		null,
		2,
	);

	// The driver reads each dashboard's definition (dashboard.json) from disk and can
	// run its SQL via the SEMOSS pixel bridge — so search/describe/query return real
	// data to the assistant. String.raw keeps Python escapes (\s, \\, \") intact.
	const driver = String.raw`"""Reporting Insights — MCP tools (auto-generated).

Search, describe, and query your Reporting Insights dashboards from the SEMOSS
playground. search_dashboards / describe_dashboard / list_dashboards / query_dashboard
return DATA (not just a link) so an assistant can find the right dashboard and answer
questions about it. create_dashboard / update_dashboard open the app UI.
"""
import os
import re
import sys
import glob
import json
import urllib.parse

APP_URL = ${pyStr(base)}


# ── locating dashboard definitions on disk ────────────────────────────────────
# Each dashboard is a SEMOSS project with its definition at
#   <projectsBase>/<Name>__<id>/app_root/version/assets/portals/dashboard.json
# This driver lives under the same <projectsBase>. We discover the base from several
# anchors (this file, SEMOSS base-folder env vars, argv, cwd) and walk up until a
# directory directly contains those dashboard.json files.
def _has_dashboards(d):
    try:
        return bool(glob.glob(os.path.join(d, "*", "app_root", "version", "assets", "portals", "dashboard.json")))
    except Exception:
        return False


def _projects_base():
    cands = []
    try:
        cands.append(os.path.dirname(os.path.abspath(__file__)))
    except Exception:
        pass
    for k in ("SEMOSS_HOME", "BaseFolder", "BASE_FOLDER", "SEMOSS_BASE", "MOUNT", "INSIGHT_CACHE_DIR"):
        v = os.environ.get(k)
        if v:
            cands.append(os.path.join(v, "project"))
            cands.append(v)
    try:
        cands.append(os.path.dirname(os.path.abspath(sys.argv[0])))
    except Exception:
        pass
    cands.append(os.getcwd())
    for start in cands:
        if not start:
            continue
        d = start
        for _ in range(16):
            if _has_dashboards(d):
                return d
            nd = os.path.dirname(d)
            if nd == d:
                break
            d = nd
    return None


def _iter_dashboards():
    base = _projects_base()
    if not base:
        return
    pattern = os.path.join(base, "*", "app_root", "version", "assets", "portals", "dashboard.json")
    for path in glob.glob(pattern):
        try:
            proj_dir = path.split(os.sep + "app_root" + os.sep)[0]
            proj_name = os.path.basename(proj_dir)
            pid = proj_name.rsplit("__", 1)[1] if "__" in proj_name else proj_name
            with open(path, "r") as f:
                data = json.load(f)
            if not data.get("id"):
                data["id"] = pid
            if not data.get("name"):
                data["name"] = proj_name.rsplit("__", 1)[0]
            yield data
        except Exception:
            continue


def _queries_of(d):
    """All queries across a dashboard (shared queries + embedded per-viz queries)."""
    out = []
    for q in d.get("queries") or []:
        out.append(q)
    for s in d.get("sheets") or []:
        for v in s.get("visualizations") or []:
            if v.get("query"):
                out.append({
                    "name": v.get("title"),
                    "databaseId": v.get("databaseId"),
                    "databaseName": v.get("databaseName"),
                    "query": v.get("query"),
                    "parameters": v.get("parameters") or [],
                })
    return out


def _corpus(d):
    parts = [d.get("name", ""), d.get("description", "")]
    parts += [t for t in (d.get("tags") or []) if isinstance(t, str)]
    for s in d.get("sheets") or []:
        parts.append(s.get("name", ""))
        for v in s.get("visualizations") or []:
            parts.append(v.get("title", ""))
            parts.append(v.get("visualizationType", ""))
            parts.append(v.get("databaseName", ""))
            parts.append(v.get("query", ""))
            for p in v.get("parameters") or []:
                parts.append(p.get("name", ""))
                parts.append(p.get("label", ""))
    for q in d.get("queries") or []:
        parts.append(q.get("name", ""))
        parts.append(q.get("query", ""))
        parts.append(q.get("databaseName", ""))
    return "\n".join([str(p) for p in parts if p])


def _summary(d):
    sheets = []
    for s in d.get("sheets") or []:
        if s.get("isParamSheet"):
            continue
        vizzes = [{
            "title": v.get("title"),
            "type": v.get("visualizationType"),
            "database": v.get("databaseName"),
        } for v in (s.get("visualizations") or [])]
        sheets.append({"sheet": s.get("name"), "visualizations": vizzes})
    dbs = sorted({q.get("databaseName") for q in _queries_of(d) if q.get("databaseName")})
    return {
        "id": d.get("id"),
        "name": d.get("name"),
        "description": d.get("description", ""),
        "tags": [t for t in (d.get("tags") or []) if isinstance(t, str)],
        "databases": list(dbs),
        "sheets": sheets,
    }


def _match(d, key):
    key = (key or "").strip().lower()
    if not key:
        return False
    did = str(d.get("id", "")).lower()
    dname = str(d.get("name", "")).lower()
    return key == did or key in did or key in dname


# ── data tools ────────────────────────────────────────────────────────────────
def search_dashboards(query="", limit="10"):
    """Search dashboards by name, description, tags, chart titles, columns, SQL, etc."""
    try:
        lim = max(1, int(limit))
    except Exception:
        lim = 10
    terms = [t for t in re.split(r"\s+", (query or "").lower().strip()) if t]
    results = []
    for d in _iter_dashboards():
        text = _corpus(d).lower()
        score = 0
        matched = []
        for t in terms:
            c = text.count(t)
            if c:
                score += c
                matched.append(t)
        if terms and score <= 0:
            continue
        item = _summary(d)
        item["score"] = score
        item["matched_terms"] = matched
        results.append(item)
    results.sort(key=lambda r: r.get("score", 0), reverse=True)
    results = results[:lim]
    return {"query": query, "count": len(results), "results": results, "open_url": APP_URL + "#/published"}


def describe_dashboard(dashboard_id="", name=""):
    """Full structure of one dashboard: sheets, visualizations, queries (SQL), parameters."""
    for d in _iter_dashboards():
        if _match(d, dashboard_id) or _match(d, name):
            s = _summary(d)
            s["queries"] = [{
                "name": q.get("name"),
                "database": q.get("databaseName"),
                "sql": q.get("query"),
                "parameters": [{
                    "name": p.get("name"),
                    "label": p.get("label"),
                    "default": p.get("defaultValue"),
                    "type": p.get("inputType", "text"),
                } for p in (q.get("parameters") or [])],
                # Cross-source data product legs + joins, when this query is one.
                "data_product": (len(q.get("sources") or []) >= 2) or None,
                "sources": [{
                    "alias": s2.get("alias"),
                    "database": s2.get("databaseName"),
                    "sql": s2.get("query"),
                } for s2 in (q.get("sources") or [])] or None,
                "joins": q.get("joins") or None,
            } for q in _queries_of(d)]
            s["open_url"] = APP_URL + "#/dashboard/" + str(d.get("id", ""))
            return s
    return {"error": "No dashboard matched '" + (dashboard_id or name) + "'. Use search_dashboards or list_dashboards to find it."}


def list_dashboards():
    """List all Reporting Insights dashboards with a short summary each."""
    items = [_summary(d) for d in _iter_dashboards()]
    items.sort(key=lambda r: (r.get("name") or "").lower())
    return {"count": len(items), "dashboards": items, "open_url": APP_URL + "#/published"}


def _sub(sql, gparams):
    """Substitute {{token}} with dashboard defaults, then strip any leftovers."""
    for nm, dv in gparams.items():
        sql = sql.replace("{{" + nm + "}}", dv)
    return re.sub(r"\{\{[^}]+\}\}", "", sql or "")


def _dp_pixel(sources, joins, gparams, limit):
    """Frame-merge pixel for a data-product query (mirror of src/lib/queryPixel.ts)."""
    jt = {"inner": "inner.join", "left": "left.outer.join", "right": "right.outer.join"}

    def fid(alias, i):
        a = re.sub(r"[^A-Za-z0-9]+", "_", (alias or ("leg" + str(i)))).strip("_").upper() or ("LEG" + str(i))
        return "RI_MCP_" + a

    stmts = []
    frames = {}
    for i, leg in enumerate(sources):
        fn = fid(leg.get("alias", ""), i)
        frames[leg.get("alias")] = fn
        sql = _sub(leg.get("query", ""), gparams).replace("\\", "\\\\").replace('"', '\\"')
        stmts.append(
            'Database(database=["' + (leg.get("databaseId") or "") + '"]) | Query("' + sql + '") | '
            + 'Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["' + fn + '"])]);'
        )
    base_alias = sources[0].get("alias")
    base = frames.get(base_alias, "")
    merged = set([base_alias])
    for j in (joins or []):
        left_in = j.get("leftAlias") in merged
        right_in = j.get("rightAlias") in merged
        if right_in and not left_in:
            incoming_alias = j.get("leftAlias")
            incoming_col = j.get("leftColumn") or ""
            base_col = j.get("rightColumn") or ""
        else:
            incoming_alias = j.get("rightAlias")
            incoming_col = j.get("rightColumn") or ""
            base_col = j.get("leftColumn") or ""
        rf = frames.get(incoming_alias)
        if not rf:
            continue
        # Pipe the INCOMING leg, pass the BASE as frame=[…] (MergeReactor.getFrame() returns
        # the frame= arg and stores the result under it), so the base accumulates the merge.
        #   Frame(<incoming>) | QueryAll() | Merge(joins=[(baseCol, type, incomingCol)], frame=[<base>])
        keep = j.get("leftAlias") if j.get("type") == "left" else (j.get("rightAlias") if j.get("type") == "right" else "")
        t = "inner" if j.get("type") == "inner" else ("right" if keep == incoming_alias else "left")
        stmts.append(
            "Frame(frame=[" + rf + "]) | QueryAll() | Merge(joins=[("
            + base_col + ", " + jt.get(t, "inner.join") + ", " + incoming_col + ")], frame=[" + base + "]);"
        )
        merged.add(incoming_alias)
    stmts.append("Frame(frame=[" + base + "]) | QueryAll() | Collect(" + str(limit) + ");")
    return "\n".join(stmts)


def _run_pixel(pixel):
    """Execute a (possibly multi-statement) pixel; return (headers, values) of the last Collect, or None."""
    try:
        from gaas_server_proxy import ServerProxy
    except Exception:
        return None
    try:
        sp = ServerProxy()
        epoc = sp.get_next_epoc() if hasattr(sp, "get_next_epoc") else "0"
        resp = sp.callReactor(epoc=epoc, pixel=pixel)
        prs = resp.get("pixelReturn") if isinstance(resp, dict) else None
        if prs:
            out = prs[-1].get("output")
        elif isinstance(resp, dict):
            out = resp.get("output", resp)
        else:
            out = resp
        data = out.get("data", out) if isinstance(out, dict) else out
        if isinstance(data, dict) and data.get("headers") is not None and data.get("values") is not None:
            return data.get("headers"), data.get("values")
    except Exception:
        return None
    return None


def _run_sql(database_id, sql, limit):
    """Best-effort: run one SQL query through the SEMOSS pixel bridge."""
    safe = (sql or "").replace("\\", "\\\\").replace('"', '\\"')
    return _run_pixel('Database(database=["' + database_id + '"]) | Query("' + safe + '") | Collect(' + str(limit) + ');')


def query_dashboard(dashboard_id="", visualization="", limit="20"):
    """Run a dashboard's queries and return sample rows so you can answer questions about its data."""
    try:
        lim = max(1, min(500, int(limit)))
    except Exception:
        lim = 20
    target = None
    for d in _iter_dashboards():
        if _match(d, dashboard_id):
            target = d
            break
    if target is None:
        return {"error": "No dashboard matched '" + dashboard_id + "'. Use search_dashboards first."}
    # Dashboard-wide default values so any {{token}} resolves even when a viz's own
    # parameter list is empty.
    gparams = {}
    for q in _queries_of(target):
        for p in q.get("parameters") or []:
            if p.get("name") and p.get("name") not in gparams:
                gparams[p.get("name")] = str(p.get("defaultValue", ""))
    vfilter = (visualization or "").strip().lower()
    out = []
    seen = set()
    for q in _queries_of(target):
        title = q.get("name") or ""
        if vfilter and vfilter not in title.lower():
            continue
        srcs = q.get("sources") or []
        if len(srcs) >= 2:
            # Cross-source data product → frame-merge pixel.
            k = "dp::" + "|".join([(s.get("databaseId") or "") + ":" + (s.get("query") or "") for s in srcs])
            if k in seen:
                continue
            seen.add(k)
            entry = {
                "visualization": title,
                "data_product": True,
                "sources": [{"alias": s.get("alias"), "database": s.get("databaseName")} for s in srcs],
                "joins": q.get("joins") or [],
            }
            res = _run_pixel(_dp_pixel(srcs, q.get("joins"), gparams, lim))
        else:
            sql = _sub(q.get("query") or "", gparams)
            dbid = q.get("databaseId") or ""
            if not sql or not dbid:
                continue
            k = dbid + "::" + sql
            if k in seen:
                continue
            seen.add(k)
            entry = {"visualization": title, "database": q.get("databaseName"), "sql": sql}
            res = _run_sql(dbid, sql, lim)
        if res is not None:
            headers, values = res
            entry["headers"] = headers
            entry["rows"] = values[:lim]
            entry["row_count"] = len(values)
        else:
            entry["note"] = "Live data unavailable in this runtime."
        out.append(entry)
        if len(out) >= 12:
            break
    return {"id": target.get("id"), "name": target.get("name"), "results": out, "open_url": APP_URL + "#/dashboard/" + str(target.get("id", ""))}


# ── UI tools (open the app) ───────────────────────────────────────────────────
def create_dashboard(description="", database=""):
    """Create and deploy a new Reporting Insights dashboard from a description."""
    q = {k: v for k, v in {"description": description, "database": database}.items() if v}
    url = APP_URL + "#/mcp/create" + (("?" + urllib.parse.urlencode(q)) if q else "")
    return {"message": "Building and deploying your dashboard…", "url": url, "description": description, "database": database}


def update_dashboard(dashboard_id=""):
    """Open an existing Reporting Insights dashboard for editing."""
    dest = APP_URL + ("#/dashboard/" + dashboard_id + "/edit" if dashboard_id else "#/published")
    return {"message": "Open the dashboard for editing.", "url": dest}
`;

	return { manifest, driver };
}
