# Reporting Insights — Analytics & Dashboard Platform

A React application for building, deploying, and sharing data dashboards on top of
**SEMOSS**. Users compose SQL-backed visualizations, publish each dashboard as its own
SEMOSS project, and — new — drive the whole flow from the **SEMOSS Playground** because
the app registers itself and every dashboard it deploys as **MCP tools**.

There are two build outputs from one codebase:

- **The app** (`src/`) — the full authoring UI (create, edit, manage, deploy dashboards).
- **The portal** (`portal/`) — a slim read-only renderer that ships *inside* every
  deployed dashboard project and renders that dashboard from its `dashboard.json`.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Application structure](#application-structure)
- [Routes](#routes)
- [Data model & persistence (projects + tags)](#data-model--persistence-projects--tags)
- [`dashboard.json` schema](#dashboardjson-schema)
- [Publishing a dashboard as a SEMOSS app](#publishing-a-dashboard-as-a-semoss-app)
- [How dashboards render](#how-dashboards-render)
- [Parameters (filters)](#parameters-filters)
- [Data products (cross-source joins)](#data-products-cross-source-joins)
- [AI dashboard builder](#ai-dashboard-builder)
- [**MCP integration (SEMOSS Playground)**](#mcp-integration-semoss-playground)
  - [1. The app registers itself as an MCP host project](#1-the-app-registers-itself-as-an-mcp-host-project)
  - [2. `create_dashboard` — build + deploy from the playground](#2-create_dashboard--build--deploy-from-the-playground)
  - [3. Every deployed dashboard is its own MCP subapp](#3-every-deployed-dashboard-is-its-own-mcp-subapp)
  - [Artifact shapes](#artifact-shapes)
  - [Requirements, gotchas & how the pieces avoid re-running](#requirements-gotchas--how-the-pieces-avoid-re-running)
- [Key files](#key-files)
- [Troubleshooting](#troubleshooting)

---

## Features

- 📊 **20+ visualization types** — bar, line, area, scatter, pie, treemap, heatmap,
  worldmap, KPI, table, pivot, sunburst, radar, boxplot, bubble, and more.
- 🧩 **Multi-sheet dashboards** with a resizable grid layout.
- 🔎 **Interactive filters / parameters** — `{{placeholder}}` tokens in SQL become
  filter controls; multi-select, dropdown (typeahead), date, and text inputs.
- 🗄️ **Live SQL** against any SEMOSS database engine, with a metamodel-driven
  table/column browser.
- 🤖 **AI builder** — describe a dashboard in natural language; a chosen model engine
  generates schema-grounded SQL + charts.
- 🚀 **One-click deploy** — each dashboard becomes its own published SEMOSS project
  served at `/public_home/<id>/portals/`.
- 🔒 **PHI/PII gating** on CSV export.
- 🔌 **MCP integration** — the app *and* every deployed dashboard are callable as tools
  from the SEMOSS Playground (see [MCP integration](#mcp-integration-semoss-playground)).

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React 18.3 + TypeScript |
| Build | Vite (two configs: app + portal) |
| Routing | `react-router-dom` **HashRouter** (path-independent — works under any SEMOSS sub-path) |
| UI kit | `@semoss/ui` + Tailwind CSS v4 |
| Platform SDK | `@semoss/sdk`, `@semoss/sdk-react` |
| Charts | ECharts + custom React viz components |
| Editors | Monaco (SQL), drag-and-drop layout via `@hello-pangea/dnd` |
| Zip generation | JSZip (builds the deployable project zip in the browser) |

---

## Getting started

### Prerequisites

- Node 18+ and `pnpm` (this package lives in the SemossWeb pnpm workspace).
- A running SEMOSS backend (Monolith) reachable at the `ENDPOINT` origin.

### Install & run (dev)

```bash
# from the SemossWeb workspace root
pnpm install
pnpm --filter @semoss/reporting-insights dev      # Vite dev server (default port 5176)
```

### Build

```bash
# builds BOTH the portal bundle and the app (portal must build first — it is inlined
# into the app so buildPortalZip can embed it in each deployed dashboard)
pnpm exec turbo run build --filter=@semoss/reporting-insights
# → packages/reporting-insights/dist/            (the app)
# → packages/reporting-insights/portal/dist/     (the inlined portal renderer)
```

`build` runs `build:portal` (Vite portal config + `portal/inline-build.mjs`, which
inlines JS/CSS into a single self-contained `portal/dist/index.html`) then `tsc -b` and
the app `vite build`.

When deployed under Tomcat, the app is served as a static bundle at
`<origin>/SemossWeb/packages/reporting-insights/dist/`.

---

## Environment variables

Set in `.env.local` (dev) or baked at build time. All are exposed to the bundle via
`vite.config.ts`'s `define` (they are **not** `VITE_`-prefixed except `VITE_*`).

| Var | Purpose |
| --- | --- |
| `VITE_PORT` | Dev server port (5176 by convention). |
| `ENDPOINT` | SEMOSS backend origin (e.g. `http://localhost:9090`). Empty ⇒ the app uses its own origin. Used for the dev proxy **and** to build absolute published-portal links. |
| `MODULE` | SEMOSS module path (default `/Monolith`). |
| `VITE_APP_URL` | **This app's deployed URL**, baked into the MCP host's tool `resourceURI`s + redirect so the playground can open the app. See [MCP requirements](#requirements-gotchas--how-the-pieces-avoid-re-running). |

**Deployment-correct URLs matter for MCP.** If you register/deploy from the Vite dev
server (`:5176`), set `ENDPOINT` and `VITE_APP_URL` so the baked URLs point at the
Tomcat origin, not the dev port — e.g.:

```
ENDPOINT=http://localhost:9090
VITE_APP_URL=http://localhost:9090/SemossWeb/packages/reporting-insights/dist/
```

When you register from the built app served under Tomcat, both can be blank
(`window.location` is already correct).

> **Cache note:** the app `index.html` ships `Cache-Control: no-store` so the shell can
> never pin a stale JS bundle (hashed assets stay cacheable). This prevents the classic
> "my fix didn't take effect" problem — especially inside the playground's tool iframe.

---

## Application structure

```
reporting-insights/
├─ src/                         # the authoring app
│  ├─ App.tsx                   # HashRouter + routes; initializes SEMOSS Env
│  ├─ pages/
│  │  ├─ NewDashboardPage.tsx   # create / edit a dashboard
│  │  ├─ DashboardPage.tsx      # native (in-app) dashboard view
│  │  ├─ PublishedPage.tsx      # gallery of deployed dashboards
│  │  ├─ McpCreatePage.tsx      # #/mcp/create — headless auto-build target for the MCP create tool
│  │  └─ AuthenticatedLayout.tsx
│  ├─ services/
│  │  ├─ projectStore.ts        # ALL SEMOSS project CRUD (create/deploy/tag/publish) + MCP host
│  │  ├─ portalGenerator.ts     # builds the deployable project zip + MCP host redirect portal
│  │  ├─ mcpManifest.ts         # generates the Python MCP tools (manifest + driver)
│  │  ├─ aiBuilder.ts           # NL → dashboard generation + SQL validate/repair
│  │  └─ permissionsApi.ts
│  ├─ lib/
│  │  ├─ portalUrl.ts           # publishedPortalUrl() + appPublicBaseUrl()
│  │  └─ paramInference.ts      # infer Parameters from {{placeholders}} in SQL
│  └─ workspace/WorkspaceProvider.tsx  # single source of truth; registers the MCP host
├─ portal/                      # the read-only renderer shipped inside each dashboard
│  ├─ main.tsx                  # early SMSS_INIT_TOOL capture (before React mounts)
│  ├─ components/ViewMode.tsx   # renders dashboard.json; ingests tool/URL params
│  └─ inline-build.mjs          # inlines portal build into one index.html
├─ vite.config.ts               # app build + dev proxy
└─ vite.config.portal.ts        # portal build
```

---

## Routes

`HashRouter` (the app is served from an arbitrary SEMOSS sub-path, so hash routing keeps
navigation + refresh working).

| Path | Page |
| --- | --- |
| `#/login` | Login (full-screen). |
| `#/published` | Deployed dashboards gallery (landing page). |
| `#/dashboards/new` | Create a dashboard. |
| `#/dashboard/:id` | View a dashboard natively in the app. |
| `#/dashboard/:id/edit` | Edit an existing dashboard. |
| `#/mcp/create` | **MCP auto-build target** — reads `?description=…&database=…`, builds + deploys, then navigates to the new dashboard. |

---

## Data model & persistence (projects + tags)

There is **no separate database and no tables** — a dashboard *is* a SEMOSS **project**.
State is derived from project metadata:

- Every dashboard project carries the marker tag **`reporting-insights--app`** (so
  `MyProjects` can find "our" dashboards) plus the **`MCP`** discovery tag.
- **Folders are tags.** Any non-marker tag a dashboard carries becomes a folder chip.
- **Private** project (`global=false`) = personal draft → *My Dashboards*.
  **Global** project (`global=true`) = *Published*.
- Marker/internal tags are hidden from the folder UI. Internal tags include the MCP
  markers and the MCP **signature tag** (`ri-sig-…`, see [dedupe](#requirements-gotchas--how-the-pieces-avoid-re-running)).

Listing is metadata-only and fast; full sheet definitions are loaded lazily
(`GetAppAssets`) when a dashboard is opened, then cached.

---

## `dashboard.json` schema

A dashboard is a **pure declaration** — sheets, chart configs, and SQL **queries**;
never data, never markup. The portal renders it at view time.

```jsonc
{
  "id": "<project id>",
  "name": "Sales Overview",
  "description": "…",
  "tags": ["Finance"],
  "published": true,
  "queries": [
    {
      "id": "<uuid>",
      "name": "Sales by region",
      "databaseId": "<engine id>",
      "databaseName": "alphabet2",
      "query": "SELECT \"Region\", SUM(\"Sales\") AS \"total\" FROM \"SHEET1\" GROUP BY \"Region\"",
      "parameters": [
        { "id": "<uuid>", "name": "region", "label": "Region",
          "defaultValue": "East", "inputType": "dropdown", "required": false,
          "options": ["East", "West"] }
      ]
    }
  ],
  "sheets": [
    {
      "id": "<uuid>", "name": "Sheet 1",
      "visualizations": [
        { "id": "<uuid>", "title": "Sales by region", "queryId": "<query uuid>",
          "visualizationType": "bar",
          "config": { "xKey": "Region", "yKeys": ["total"] } }
      ],
      "layout": [ { "vizId": "<uuid>", "colSpan": 6, "order": 0 } ]
    }
  ]
}
```

Visualizations bind to a shared `queryId` (so charts on the same query fetch once and
share one parameter form). A `viz.config` may reference **only** the columns its query's
SELECT returns (aggregates by their alias).

---

## Publishing a dashboard as a SEMOSS app

`projectStore.create()` (and `saveDefinition()` / `redeploy()`) do the full deploy:

1. **Normalize** — `inferSqlParameters()` registers a `Parameter` for any
   `{{placeholder}}` in the SQL that wasn't declared.
2. **Build the portal zip** (`buildPortalZip`) — a project zip containing the `.smss`,
   `assets/portals/index.html` (the inlined portal renderer), and `dashboard.json`.
3. **Upload** the zip (`upload()` from `@semoss/sdk`).
4. **Create the project** — `UploadProjectApp(filePath=[...], global=[published])`.
5. **Write `dashboard.json`** into the project's assets.
6. **Write the MCP tool** (`writeMcpManifest` → `mcp/py_mcp.json` + `py/mcp_driver.py`).
7. **Tag** — `SetProjectMetadata(tag=[reporting-insights--app, MCP, …folderTags])`.
8. **Publish** — `PublishProject(release=[true])` so `/public_home/<id>/portals/` serves it.

The published portal is reachable at
`${ENDPOINT || origin}${MODULE}/public_home/<id>/portals/`.

---

## How dashboards render

Dashboards are rendered **natively** two ways from the same `dashboard.json`:

- **In-app** (`#/dashboard/:id`) via `DashboardPage`.
- **Standalone portal** (`/public_home/<id>/portals/`) via the `portal/` bundle
  (`ViewMode`), which the app iframes nowhere — the portal is the deployed dashboard
  itself. This portal bundle is what the MCP tool renders inline in the playground.

The portal fetches its config with `fetch('./dashboard.json')` — relative to its own
path — so each deployed copy renders its own dashboard.

---

## Parameters (filters)

- A `{{name}}` token in a query's SQL becomes a `Parameter`. `inferSqlParameters()`
  guarantees every placeholder is registered even if authored by hand or by the AI.
- Author placeholders as **quoted string literals** — `WHERE "Letter" = '{{letter}}'` —
  so the SQL stays valid before a value is chosen.
- At view time the portal **substitutes** values and **auto-runs** the query as soon as
  every required parameter has a value (from its default **or** an external value).
- **External values** arrive two ways and override defaults:
  1. `SMSS_INIT_TOOL` postMessage (when the playground renders the dashboard as a tool),
  2. URL query params (`…/portals/?letter=A`).

  These are captured **before React mounts** (`portal/main.tsx` buffers the message into
  `window.__SMSS_TOOL_PARAMS__`) so a value posted on the iframe `load` event can't be
  missed by a late-registering React listener.

---

## Data products (cross-source joins)

A visualization's query can be a **data product**: two or more SQL queries — each
against its **own database** — joined into a single dataset. Author it with the **Join
sources** button in the VizEditor query toolbar (`DataProductModal`). A `DashboardQuery`
then carries `sources` (the legs) and `joins` instead of a single `query`.

### How SEMOSS joins across databases (and how legacy does it)

SEMOSS **cannot** run a SQL `JOIN` across two different database engines — the engine
throws _"Joining tables across databases is not possible, please consider converting to a
materialized frame"_ (`MergeReactor.java`). The canonical approach — the same one the
legacy SemossWeb pipeline uses — is to **materialize each query into an in-memory GRID
frame, then `Merge` the frames**:

```text
Database(database=["dbA"]) | Query("<encode>SELECT …</encode>") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["S1"])]);   -- base
Database(database=["dbB"]) | Query("<encode>SELECT …</encode>") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["S2"])]);   -- incoming
Frame(frame=[S2]) | QueryAll() | Merge(joins=[(baseCol, inner.join, incomingCol)], frame=[S1]);   -- pipe incoming, arg = base
Frame(frame=[S1]) | QueryAll() | Collect(N);                                                        -- collect the base
```

- Each additional leg is merged as its **own statement** with an explicit `| QueryAll()`; then
  the base frame is `Collect`ed. (Chaining `Merge(...) | Collect(...)` without `QueryAll()` fails.)
- Two `MergeReactor` rules the builder encodes: **(a)** `getFrame()` returns the `frame=[…]`
  argument and the result is stored under it — so you **pipe the incoming leg and pass the base
  as `frame=[…]`** so the base accumulates the merge and is what you Collect (piping the base
  instead silently leaves `Collect(base)` un-merged). **(b)** the generated SQL is
  `FROM <base> A <type> JOIN <incoming> B ON (A.<t0> = B.<t2>)`, so the tuple is
  **`(baseColumn, joinType, incomingColumn)`**. Bare column names; join types `inner.join`,
  `left.outer.join`, `right.outer.join`. `buildQueryPixel` derives the orientation from the
  sources so it works whichever way the user assigns left/right.
- Same-named columns across legs are auto-deduped by the engine (`letter` → `letter_1`).

### How **we** build it

All pixel construction — editor preview, app viewer, portal, and the MCP `query_dashboard`
tool — goes through **one** builder, [`src/lib/queryPixel.ts`](src/lib/queryPixel.ts)
`buildQueryPixel()`, so the syntax lives in a single place. A single-source query still
produces the exact `Database | Query | Collect` pixel as before (zero change). Multi-source
runs the frame-merge pipeline above. Callers read the **last** `pixelReturn` entry
(`lastPixelOutput`) since a data product is multi-statement.

### Type & identifier rules (identical to legacy — it's engine-level)

The join SQL is generated by the **SEMOSS engine** (`AnsiSqlQueryUtil.createNewTableFromJoiningTables()`),
so these rules apply to every client, legacy included:

- **Reserved-word / non-identifier columns** (e.g. a column literally named `Group`) are
  emitted **unquoted** in the engine's `CREATE TABLE … AS SELECT`, so H2 throws
  `expected "identifier"`. We defend against this: `aliasReservedColumns()` wraps each leg
  (`SELECT "Group" AS "Group_c", … FROM (<sql>) __ri_sub`) and remaps the join columns —
  baked into the **saved** leg SQL so app/portal/MCP all stay merge-safe. (Legacy avoided
  this by aliasing columns via `Select(...).as([...])` at import time; the raw engine does
  not.)
- **Type-mismatched join keys** are coerced by the engine, not by us: joining a numeric
  column to a text column emits `… = CAST(<text> AS DOUBLE)`, which throws
  `Data conversion error` on non-numeric text (e.g. `"cat"`). This is inherent SEMOSS
  behavior — **legacy fails the same way, and the legacy client did not pre-validate join
  types either.** Join columns of the **same type** (`letter`↔`letter`, `number`↔`number`).
- **Cross-DB joins require materialized GRID frames first** (we always `Import` before
  `Merge`); a raw cross-engine SQL `JOIN` is rejected by the engine.

See [`GOTCHAS.md`](GOTCHAS.md) §10 for the full list of merge pitfalls.

---

## AI dashboard builder

`aiBuilder.generateDashboard()` turns a natural-language request + the database's real
metamodel into a `dashboard.json`:

- Emits **standard ANSI SQL** with strict rules (quote identifiers with exact case,
  single-quote string values, GROUP-BY completeness, no trailing commas, alias
  aggregates, `LIMIT n`), grounded only in the provided schema.
- **Honors the user literally** — if you supply explicit SQL it is used verbatim; if you
  specify a parameter default it is set exactly.
- **Validates + repairs** — each query runs against the DB (placeholders swapped for a
  probe value so parameterized SQL validates); failures are repaired by the model up to
  twice, preserving `{{placeholders}}`.
- Sanitizes each viz `config` against the query's real output columns.

---

## MCP integration (SEMOSS Playground)

This is how the app plugs into the playground as tools. The playground discovers MCP
apps by listing **projects tagged `MCP`** (`MyProjects(metaFilters=[{"tag":["MCP"]}])`),
lists a project's tools via `GetMCPTools`, executes a tool via `RunMCPTool`
(→ `MCPUtility.runPythonTool`), and renders a tool's UI by iframing
`${MODULE}/public_home/<projectId>/portals` **+** the tool's `resourceURI`.

**Two things are registered as MCP:**

1. the **app itself**, as a small "host" project offering create/list/update tools, and
2. **every deployed dashboard**, as its own `show_<name>` tool.

MCP tools must be backed by **executable code shipped in the project** (a manifest alone
yields "cannot find reactor"). We ship **Python**:

- `py/mcp_driver.py` — functions whose names equal the tool names,
- `mcp/py_mcp.json` — the manifest (`"_type": "python"`) `GetMCPTools` reads.

> **`resourceURI` is portal-relative, not absolute.** Because the playground concatenates
> `…/public_home/<id>/portals` **+** `resourceURI`, it must start with `/`
> (`"/"`, `"/#/mcp/create"`) — an absolute `http(s)://` URL becomes `…/portalshttp://…`
> and 404s.

### 1. The app registers itself as an MCP host project

On load, `WorkspaceProvider` calls `store.ensureMcpHost(appBaseUrl)`. It finds-or-creates
one small SEMOSS project tagged **`MCP`** + **`reporting-insights--mcp-host`**, carrying
`py/mcp_driver.py` + `mcp/py_mcp.json` (`buildHostMcp`) with three tools:

| Tool (python fn) | Inputs | `resourceURI` | Opens the app at |
| --- | --- | --- | --- |
| `create_dashboard` | `description` (required), `database` | `/#/mcp/create` | `#/mcp/create?description=…&database=…` |
| `list_dashboards` | — | `/#/published` | `#/published` |
| `update_dashboard` | `dashboard_id` | `/#/published` | `#/dashboard/<id>/edit` |

The host is tagged host-only (not the `reporting-insights--app` dashboard marker), so it
is **excluded from the dashboard listing**.

**The host portal is a smart forwarder** (`mcpHostRedirectHtml`), not the app itself. The
playground iframes it at `…/portals/#/<route>` and posts the tool's parameters via
`SMSS_INIT_TOOL`. The forwarder:

- registers its message listener at parse time (before the `load` event),
- forwards to `VITE_APP_URL` + the route, appending the tool params to the hash
  (`#/mcp/create?description=…`), routing `update_dashboard`'s `dashboard_id` to
  `#/dashboard/<id>/edit`,
- **cache-busts** the app document URL (`?_ts=<now>`) so the iframe always loads the
  current app bundle,
- falls back to a plain redirect if no message arrives.

### 2. `create_dashboard` — build + deploy from the playground

`create_dashboard` **actually creates and deploys** a dashboard (it is not just a link):

1. Playground executes the tool → forwarder opens the app at
   `#/mcp/create?description=…&database=…`.
2. **`McpCreatePage`** (`src/pages/McpCreatePage.tsx`) runs the same pipeline as the AI
   builder: resolve the database (match by id/name) + a model engine →
   `generateDashboard(...)` → `createDashboard(..., { published })`.
3. It navigates to `#/dashboard/<newId>`, which renders the finished dashboard **inline
   in the tool panel**.

A **real, published SEMOSS project** results and appears in your SEMOSS apps.

**Idempotency (no duplicates on reload).** The tool's `resourceURI` is an action URL, so
the playground re-mounts `McpCreatePage` on every chat reload. Before building, the page
computes a **signature** (`database|description|visibility`) and checks the server
(`MyProjects` for a project tagged `ProjectStore.sigTag(signature)` → `ri-sig-<hash>`):

- **match found** → it reopens that dashboard and returns *before* any build (no
  `DeleteAsset`/upload/publish),
- **no match** → it builds once and tags the new project with the signature.

This is a **server-side** check on purpose — client storage is blocked/partitioned inside
a cross-origin tool iframe. The `ri-sig-` tag is persisted but hidden from the folder UI.

Because the create flow renders the app cross-origin, it must be able to authenticate:
open the playground and the app on the **same origin** (both under Tomcat `:9090`), or
the tool iframe can't establish a session and will spin.

### 3. Every deployed dashboard is its own MCP subapp

On **create / save / redeploy**, `projectStore.writeMcpManifest` writes the dashboard's
own MCP tool (`buildDashboardMcp`): one **`show_<name>`** tool whose `inputSchema`
properties are the dashboard's **query parameters**.

- `resourceURI` is **`"/"`** → the playground renders this project's own portal
  (`…/public_home/<id>/portals/`), which *is* the deployed dashboard.
- Filter parameters are **all marked `required`** in the tool schema, so the model
  reliably passes values (an optional filter is routinely skipped, leaving the dashboard
  unfiltered). Dropdown parameters expose their options as an `enum`.
- Calling `show_sales_overview({ region: "West" })` renders the dashboard, and the
  portal auto-runs the SQL filtered to `region='West'` — the value arrives via
  `SMSS_INIT_TOOL` and is applied by `ViewMode` (see [Parameters](#parameters-filters)).

### Artifact shapes

```jsonc
// mcp/py_mcp.json (a per-dashboard show tool) — SEMOSS may regenerate this from the .py
{
  "_meta": { "last_modified_date": "2026-07-14" },
  "tools": [{
    "name": "show_sales_overview",
    "title": "Sales Overview",
    "description": "Show the \"Sales Overview\" dashboard. Filtered by: region. You MUST provide a value…",
    "inputSchema": {
      "type": "object", "title": "Sales Overview Arguments",
      "properties": { "region": { "type": "string", "title": "Region", "enum": ["East","West"], "default": "East" } },
      "required": ["region"]
    },
    "_meta": {
      "generated_on": "2026-07-14",
      "SMSS_MCP_EXECUTION": "auto",
      "SMSS_MCP_UI": { "resourceURI": "/", "displayLocation": "inline", "autoOpen": true, "loadingMessage": "Sales Overview…" }
    },
    "_type": "python"
  }]
}
```

```python
# py/mcp_driver.py  (function name == tool name; args == inputSchema properties)
import urllib.parse
PORTAL_URL = "<origin>/Monolith/public_home/<id>/portals/"

def show_sales_overview(**kwargs):
    """Show the "Sales Overview" dashboard, filtered to the given parameters."""
    params = {k: str(v) for k, v in kwargs.items() if v is not None and str(v) != ""}
    url = PORTAL_URL + (("?" + urllib.parse.urlencode(params)) if params else "")
    return {"message": "Reporting Insights dashboard", "url": url, "parameters": params}
```

### Requirements, gotchas & how the pieces avoid re-running

- **SEMOSS Python runtime** must be available for the project — `RunMCPTool` executes
  `py/mcp_driver.py` via `runPythonTool`. The driver functions are thin and dependency-free.
- **Deployment-correct URLs** — set `VITE_APP_URL` (this app's deployed URL) and
  `ENDPOINT` (SEMOSS origin) if registering from the dev server; otherwise the dev port
  gets baked into the host redirect. See [Environment variables](#environment-variables).
- **`SMSS_MCP_EXECUTION: "auto"`** so the agent can call the tool. (`"disabled"` makes a
  tool undiscoverable; a bare manifest with no backing function fails with "cannot find
  reactor" — both were dead ends before going Python-backed.)
- **Host self-heal runs once per version, not per load.** `ensureMcpHost(refresh=true)`
  re-uploads the host driver/manifest/redirect and republishes — expensive. It is gated
  by `HOST_ARTIFACT_VERSION` + the app URL, remembered in `localStorage`
  (`ri-mcp-host-sync`). A normal reload skips it; **bump `HOST_ARTIFACT_VERSION`**
  (in `mcpManifest.ts`) whenever `buildHostMcp` or `mcpHostRedirectHtml` change so
  clients re-sync exactly once.
- **Each deployed dashboard freezes its own copy of the portal bundle** (inlined at
  deploy time). A change to the `portal/` renderer only reaches existing dashboards after
  they are re-saved/redeployed.
- **Playground tool cache** — after changing a manifest, refresh/re-add the MCP app in
  the playground so it re-fetches `GetMCPTools`.

**Quick check after deploying:** load the app once (host syncs), then run
`MyProjects(metaFilters=[{"tag":["MCP"]}])` — the **Reporting Insights** host and your
dashboards should list; `GetMCPTools(project=["<id>"])` should return the tools; calling
one should render the app/dashboard rather than erroring.

---

## Key files

| File | Role |
| --- | --- |
| `src/services/projectStore.ts` | All project CRUD + deploy (`create`/`saveDefinition`/`redeploy`), `ensureMcpHost`, `writeMcpManifest`, `findBySignature`, `sigTag`, tag constants |
| `src/services/portalGenerator.ts` | `buildPortalZip` (dashboard project zip), `buildMcpHostZip`, `mcpHostRedirectHtml` (cache-busting forwarder) |
| `src/services/mcpManifest.ts` | `buildDashboardMcp`, `buildHostMcp`, `dashboardParameters`, `HOST_ARTIFACT_VERSION`, `SIG_TAG_PREFIX` |
| `src/services/aiBuilder.ts` | `generateDashboard`, SQL validate/repair, prompt |
| `src/lib/paramInference.ts` | `inferSqlParameters` (placeholders → Parameters) |
| `src/lib/portalUrl.ts` | `publishedPortalUrl`, `appPublicBaseUrl` |
| `src/pages/McpCreatePage.tsx` | `#/mcp/create` auto-build + dedupe target |
| `src/workspace/WorkspaceProvider.tsx` | app state; version-guarded MCP host registration |
| `portal/main.tsx` | early `SMSS_INIT_TOOL` capture before React mounts |
| `portal/components/ViewMode.tsx` | renders `dashboard.json`; applies tool/URL params; auto-runs |

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Tool preview spins forever | The app couldn't load/authenticate in the iframe. Use the **same-origin** playground (`:9090`), and ensure `Env.MODULE` is set (the deployed shell now initializes it unconditionally). |
| A 404 with `…/portalshttp://…` | An **absolute** `resourceURI` was baked. It must be portal-relative (`/`, `/#/…`). |
| Reload rebuilds the dashboard (DeleteAsset/upload) | You're on a **stale cached bundle** (no dedupe). Hard-reload; the `no-store` shell + signature dedupe prevent it once fresh code runs. |
| Host `DeleteAsset`/upload/publish on every load | Old behavior. Now gated by `HOST_ARTIFACT_VERSION` (`localStorage`); runs once per version. |
| `create_dashboard` returns text but no app appears | Playground tool cache and/or stale bundle — refresh the MCP app in the playground and hard-reload. |
| Parameter value from the tool isn't applied | The dashboard has an **old frozen portal bundle** — recreate/redeploy it. |
| Generated SQL fails | The model didn't follow schema (case, quoting). Re-run; the validate/repair pass fixes most cases. Report the error and refine the prompt. |

---

*Built on the SEMOSS platform. One codebase, two outputs (app + portal); one deploy per
dashboard; every dashboard callable from the SEMOSS Playground as an MCP tool.*
