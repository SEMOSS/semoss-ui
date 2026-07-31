"""Reporting Insights — MCP tools (static driver).

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

# APP_URL is resolved at runtime — no env var required.
# Resolution order:
#   1. REPORTING_INSIGHTS_URL env var (explicit override)
#   2. Auto-detect from __file__ path + SEMOSS server config
#   3. Empty string (data tools still work; UI links are relative)
def _detect_app_url():
    """Auto-detect the app URL from the project directory structure and server config."""
    # 1. Explicit env var wins
    explicit = os.environ.get("REPORTING_INSIGHTS_URL") or os.environ.get("SEMOSS_APP_URL")
    if explicit:
        return explicit.rstrip("/") + "/"

    # 2. Extract project ID from __file__
    #    Path: <base>/project/<Name>__<id>/app_root/version/assets/py/mcp_driver.py
    project_id = ""
    try:
        parts = os.path.abspath(__file__).split(os.sep)
        for i, p in enumerate(parts):
            if p == "app_root" and i > 0:
                proj_dir = parts[i - 1]
                project_id = proj_dir.rsplit("__", 1)[1] if "__" in proj_dir else proj_dir
                break
    except Exception:
        pass

    if not project_id:
        return ""

    # 3. Detect server origin from SEMOSS config / social.properties
    origin = ""
    try:
        base = None
        for k in ("SEMOSS_HOME", "BaseFolder", "BASE_FOLDER"):
            v = os.environ.get(k)
            if v and os.path.isdir(v):
                base = v
                break
        if not base:
            # Walk up from __file__ looking for social.properties
            d = os.path.dirname(os.path.abspath(__file__))
            for _ in range(12):
                if os.path.isfile(os.path.join(d, "social.properties")):
                    base = d
                    break
                nd = os.path.dirname(d)
                if nd == d:
                    break
                d = nd

        if base:
            # Read social.properties for the server URL
            sp_path = os.path.join(base, "social.properties")
            if os.path.isfile(sp_path):
                with open(sp_path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("SEMOSS_BASE_URL"):
                            origin = line.split("=", 1)[1].strip().rstrip("/")
                            break
                        if line.startswith("BASE_URL"):
                            origin = line.split("=", 1)[1].strip().rstrip("/")
                            break

            # Also check RDF_Map.prop
            if not origin:
                rdf_path = os.path.join(base, "RDF_Map.prop")
                if os.path.isfile(rdf_path):
                    with open(rdf_path, "r") as f:
                        for line in f:
                            line = line.strip()
                            if "BASE_URL" in line and "=" in line:
                                origin = line.split("=", 1)[1].strip().rstrip("/")
                                break
    except Exception:
        pass

    # 4. Construct the portal URL
    module = os.environ.get("SEMOSS_MODULE", "/Monolith")
    if origin:
        return origin + module + "/public_home/" + project_id + "/portals/"
    else:
        # Relative URL — works when rendered in the same-origin playground iframe
        return module + "/public_home/" + project_id + "/portals/"


APP_URL = _detect_app_url()


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
