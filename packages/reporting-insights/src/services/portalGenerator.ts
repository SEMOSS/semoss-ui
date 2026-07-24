import JSZip from "jszip";
import type { Dashboard } from "@/types/dashboard";
// Pre-built React portal app (portal/dist/index.html inlined by inline-build.mjs)
import portalAppHtml from "../../portal/dist/index.html?raw";

/**
 * The current portal app bundle (the built `portal/dist/index.html`, baked in at
 * app-build time). Exposed so `projectStore.redeploy` can push the *latest* bundle
 * onto an existing project — refreshing a previously-deployed dashboard's portal
 * code without recreating the project.
 */
export const PORTAL_INDEX_HTML: string = portalAppHtml;

/**
 * Generates a self-contained vanilla JS portal page for a published dashboard.
 *
 * Save flow: build zip (portals/dashboard.json) → projectAssetsUpload to
 * version/assets/ → UnzipFile → ReloadInsightClasses(release=true)
 * → setProjectPortal → PublishProject → reload. Mirrors editApp in app-settings.tsx.
 * All users see the change on their next load. */
export function generatePortalHtml(): string {
	/* eslint-disable no-useless-escape */
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
/* ── Reset & base ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f1f5f9;color:#1e293b;height:100vh;overflow:hidden;-webkit-font-smoothing:antialiased;font-size:14px;line-height:1.5}

/* ── App shell ── */
#app-view{display:flex;flex-direction:column;height:100vh}
.view-content{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
#app-edit{overflow:auto;height:100vh}

/* ── Toolbar ── */
.toolbar{display:flex;justify-content:space-between;align-items:center;padding:0 28px;height:60px;gap:16px;flex-wrap:wrap;border-bottom:1px solid #e2e8f0;background:#fff;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.04)}
h1{font-size:1.0625rem;font-weight:700;color:#0f172a;letter-spacing:-.015em}
.desc{color:#94a3b8;font-size:.8125rem;margin-top:1px}
.btn-edit{background:#fff;border:1px solid #e2e8f0;color:#475569;padding:7px 16px;border-radius:8px;font-size:.8125rem;font-weight:500;cursor:pointer;transition:all .12s;display:inline-flex;align-items:center;gap:7px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.btn-edit:hover{background:#f8fafc;border-color:#cbd5e1;color:#1e293b}

/* ── Viz grid ── */
/* Grid fills the view; rows fill the grid proportionally (flex weights = rowHeightPct) */
.viz-grid{display:flex;flex-direction:column;padding:8px 10px;flex:1;min-height:0;overflow:hidden}
.viz-row{display:flex;flex-direction:row;min-height:0;align-items:stretch}
.viz-section{display:flex;flex-direction:column;min-width:0;position:relative;min-height:0}

/* ── Viz card ── */
.viz-card{background:#fff;border-radius:14px;border:1px solid #e8edf3;box-shadow:0 2px 8px rgba(15,23,42,.07),0 0 1px rgba(15,23,42,.08);display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;transition:box-shadow .15s}
/* Ensure the param-waiting form fills the card and footer is never clipped */
.param-waiting{height:100%;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.viz-card:hover{box-shadow:0 4px 16px rgba(15,23,42,.1),0 0 1px rgba(15,23,42,.08)}
.viz-card-hdr{display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-bottom:1px solid #f1f5f9;flex-shrink:0;gap:10px}
.viz-title{font-size:.875rem;font-weight:600;color:#0f172a;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1;letter-spacing:-.01em}

/* ── Status (row count) ── */
.status{font-size:.75rem;color:#94a3b8;padding:8px 22px 0;flex-shrink:0;letter-spacing:-.01em}
.status.error{color:#ef4444}
.rc-container{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column}

/* ── Table ── */
.scroll{overflow-x:auto;overflow-y:auto;flex:1;min-height:0}
table{width:100%;border-collapse:collapse}
thead tr{border-bottom:1px solid #e8edf3;background:#f8fafc;position:sticky;top:0;z-index:1}
thead th{padding:11px 18px;text-align:left;font-size:.6875rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}
tbody td{padding:11px 18px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:.8125rem;white-space:nowrap}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#f8fbff}

/* ── Pagination ── */
.table-pagination{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-top:1px solid #f1f5f9;background:#fafcff;flex-shrink:0;gap:10px;flex-wrap:wrap}
.page-btn{background:#fff;border:1px solid #e2e8f0;border-radius:7px;width:28px;height:28px;cursor:pointer;color:#64748b;font-size:.75rem;display:inline-flex;align-items:center;justify-content:center;transition:all .12s;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.page-btn:hover:not(:disabled){background:#f1f5f9;border-color:#cbd5e1;color:#374151}
.page-btn:disabled{opacity:.3;cursor:not-allowed;box-shadow:none}
.page-size-input{width:50px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:7px;font-size:.8125rem;text-align:center;color:#374151;background:#fff;outline:none}
.page-size-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}

/* ── Chart ── */
.chart-wrapper{position:relative;flex:1;min-height:0}

/* ── CSV export ── */
.csv-btn{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:7px;padding:4px 12px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .12s;white-space:nowrap;letter-spacing:-.01em}
.csv-btn:hover{background:#dcfce7;border-color:#86efac}

/* ── Param waiting form ── */
.param-waiting{height:100%;display:flex;flex-direction:column;overflow:hidden}
.param-waiting-hdr{flex-shrink:0;padding:28px 24px 18px;border-bottom:1px solid #f1f5f9}
.param-waiting-hdr h4{font-size:.9375rem;font-weight:600;color:#0f172a;margin:0 0 4px;letter-spacing:-.01em}
.param-waiting-hdr p{font-size:.8125rem;color:#94a3b8;margin:0;line-height:1.5}
.param-waiting-body{flex:1;overflow-y:auto;padding:20px 24px}
.param-waiting-grid{display:grid;gap:18px}
.param-waiting-grid.cols-2{grid-template-columns:1fr 1fr}
.param-waiting-footer{flex-shrink:0;padding:16px 24px 24px;border-top:1px solid #f1f5f9;background:#fff}
.param-waiting-run{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:#2563eb;color:#fff;border:none;padding:11px 20px;border-radius:10px;font-size:.9375rem;font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:-.01em;box-shadow:0 2px 6px rgba(37,99,235,.3)}
.param-waiting-run:hover{background:#1d4ed8;box-shadow:0 4px 12px rgba(37,99,235,.35);transform:translateY(-1px)}
.param-waiting-run:active{transform:translateY(0)}
.param-waiting-inp{width:100%;padding:10px 14px;border:1.5px solid #cbd5e1;border-radius:9px;font-size:.875rem;outline:none;background:#fff;color:#1e293b;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;line-height:1.5}
.param-waiting-inp:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.param-waiting-inp::placeholder{color:#94a3b8}

/* ── Adjust-params strip (post-run) ── */
.adjust-params-strip{flex-shrink:0;background:#f8fafc;border-bottom:1px solid #e8edf3;padding:18px 22px;display:none}
.adjust-params-strip.open{display:block}
.adjust-params-grid{display:grid;gap:14px;margin-bottom:14px}
.adjust-params-grid.cols-2{grid-template-columns:1fr 1fr}
.adjust-params-grid.cols-3{grid-template-columns:1fr 1fr 1fr}
.adjust-params-grid input{width:100%;padding:8px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.875rem;outline:none;background:#fff;color:#1e293b;transition:border-color .12s}
.adjust-params-grid input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.adjust-params-grid label{display:block;font-size:.6875rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.adjust-params-run{background:#2563eb;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:.875rem;font-weight:600;cursor:pointer;transition:background .12s;display:inline-flex;align-items:center;gap:6px}
.adjust-params-run:hover{background:#1d4ed8}

/* ── Header action icons ── */
.params-toggle-btn{background:none;border:1.5px solid transparent;border-radius:8px;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:.9rem;color:#94a3b8;transition:all .12s;flex-shrink:0}
.params-toggle-btn:hover{background:#eff6ff;color:#2563eb;border-color:#bfdbfe}
.params-toggle-btn.active{background:#eff6ff;color:#2563eb;border-color:#bfdbfe}

/* ── Sheet tabs ── */
.sheet-tab-bar{display:flex;align-items:stretch;overflow-x:auto;background:#fff;border-top:1px solid #e2e8f0;box-shadow:0 -1px 0 #e2e8f0;flex-shrink:0}
.sheet-tab{display:flex;align-items:center;gap:7px;padding:11px 22px;border-right:1px solid #f1f5f9;cursor:pointer;font-size:.8125rem;color:#64748b;border-top:2px solid transparent;margin-top:-1px;white-space:nowrap;transition:all .12s;background:transparent;user-select:none;font-weight:500}
.sheet-tab:hover{background:#f8fafc;color:#374151}
.sheet-tab.active{background:#fff;color:#0f172a;font-weight:600;border-top-color:#3b82f6}
.tab-badge{font-size:.6875rem;padding:2px 7px;border-radius:999px;background:#f1f5f9;color:#64748b;font-weight:600}
.sheet-tab.active .tab-badge{background:#dbeafe;color:#1d4ed8}

/* ── Panel resize handles (match main app PanelResizeHandle) ── */
.panel-sep-v{flex-shrink:0;height:8px;cursor:ns-resize;border-radius:4px;background:#e2e8f0;transition:background .15s;margin:2px 0}
.panel-sep-v:hover,.panel-sep-v.active{background:#60a5fa}
.panel-sep-h{flex-shrink:0;width:8px;cursor:ew-resize;border-radius:4px;background:#e2e8f0;transition:background .15s;align-self:stretch;margin:0 2px}
.panel-sep-h:hover,.panel-sep-h.active{background:#60a5fa}

/* ── Hide view-chrome with no main-app equivalent ── */
.viz-controls-bar,.viz-drag-handle{display:none!important}
.vcp-type-btn,.vcp-select,.vcp-row,.viz-controls-panel{display:none!important}

/* ── KPI tiles ── */
.kpi-grid{display:flex;flex-wrap:wrap;gap:16px;padding:20px;height:100%;box-sizing:border-box;align-content:flex-start}
.kpi-tile{background:#fff;border-radius:12px;border:1px solid #e8edf3;padding:22px 24px;flex:1;min-width:160px;display:flex;flex-direction:column;gap:6px;border-top:3px solid;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.kpi-label{font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8}
.kpi-value{font-size:2.25rem;font-weight:800;color:#0f172a;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.kpi-meta{font-size:.8125rem;color:#94a3b8}
.kpi-trend-up{color:#16a34a;font-weight:600;display:flex;align-items:center;gap:4px}
.kpi-trend-dn{color:#dc2626;font-weight:600;display:flex;align-items:center;gap:4px}

/* ── Edit mode (preserved, no changes) ── */
.edit-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;gap:12px;flex-wrap:wrap}
.edit-hdr h2{font-size:1.4rem;font-weight:700;color:#0f172a}
.edit-acts{display:flex;gap:8px}
.section-card{background:#fff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.05);margin-bottom:16px}
.section-hdr{padding:14px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
.section-hdr h3{font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
.section-body{padding:20px}
.fld{margin-bottom:16px}
.fld label{display:block;font-size:.875rem;font-weight:600;color:#374151;margin-bottom:6px}
.fld input,.fld select,.fld textarea{padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:.875rem;transition:border-color .15s,box-shadow .15s}
.fld input:focus,.fld select:focus,.fld textarea:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.viz-type-grp{display:flex;gap:6px;flex-wrap:wrap}
.viz-btn{padding:8px 14px;border-radius:8px;border:2px solid #e2e8f0;background:#fff;font-size:.8rem;font-weight:600;text-transform:capitalize;cursor:pointer;transition:all .15s;color:#475569}
.viz-btn:hover{border-color:#cbd5e1}
.viz-btn.active{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}
.params-hint code{background:#f1f5f9;padding:2px 5px;border-radius:4px;color:#2563eb;font-family:ui-monospace,monospace;font-size:.8rem}
.param-row{display:grid;grid-template-columns:1fr 1fr 1fr auto auto;gap:8px;align-items:start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;margin-bottom:6px}
.btn-trash{background:none;border:none;cursor:pointer;padding:6px;border-radius:4px;color:#cbd5e1;transition:all .15s;font-size:.9rem;line-height:1}
.btn-trash:hover{color:#ef4444;background:#fef2f2}
.add-btn{display:inline-flex;align-items:center;gap:4px;background:none;border:none;color:#2563eb;font-size:.8rem;font-weight:600;cursor:pointer;padding:0}
.add-btn:hover{text-decoration:underline}
.test-btn{background:#166534;color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer;transition:background .15s}
.test-btn:hover{background:#15803d}
.test-btn:disabled{background:#94a3b8;cursor:not-allowed}
.test-out{background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;padding:10px;margin-top:10px;display:none;max-height:180px;overflow:auto;font-size:.8rem}
.layout-row{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;margin-bottom:6px}
.layout-row-title{flex:1;font-size:.875rem;font-weight:500;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.span-btn{padding:4px 8px;border:1px solid #cbd5e1;background:#fff;border-radius:4px;font-size:.75rem;cursor:pointer;color:#475569;transition:all .15s}
.span-btn.active{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:600}
.move-btn{background:none;border:1px solid #e2e8f0;border-radius:4px;width:26px;height:26px;cursor:pointer;color:#64748b;font-size:.875rem;transition:all .15s}
.move-btn:hover{background:#f1f5f9}
.move-btn:disabled{opacity:.3;cursor:not-allowed}
.layout-preview{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:10px}
.preview-item{background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:6px;text-align:center}
.preview-item p{font-size:.7rem;font-weight:600;color:#1d4ed8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preview-item small{font-size:.65rem;color:#3b82f6}
.viz-selector-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.save-status{margin-top:12px;font-size:.85rem;min-height:1.2em}
.save-status.error{color:#dc2626}
.save-status.ok{color:#16a34a}
.btn-primary{background:#2563eb;color:#fff;border:none;padding:9px 22px;border-radius:8px;font-weight:600;font-size:.875rem;cursor:pointer;transition:background .15s}
.btn-primary:hover{background:#1d4ed8}
.btn-primary:disabled{background:#94a3b8;cursor:not-allowed}
.btn-secondary{background:#fff;color:#374151;border:1px solid #cbd5e1;padding:8px 20px;border-radius:8px;font-weight:600;font-size:.875rem;cursor:pointer;transition:background .15s}
.btn-secondary:hover{background:#f1f5f9}
label{display:block;font-size:.75rem;font-weight:600;color:#475569;margin-bottom:3px}
input,select,textarea{width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:.875rem;outline:none;background:#fff;color:#1e293b}
input:focus,select:focus,textarea:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.2)}
.mono{font-family:ui-monospace,monospace;font-size:.82rem;resize:vertical}
.run-btn{background:#2563eb;color:#fff;border:none;padding:7px 16px;border-radius:7px;font-weight:600;font-size:.8125rem;cursor:pointer;transition:background .12s;white-space:nowrap}
.run-btn:hover{background:#1d4ed8}
.run-btn:disabled{background:#94a3b8;cursor:not-allowed}
.run-btn-inline{background:#2563eb;color:#fff;border:none;padding:5px 12px;border-radius:6px;font-weight:600;font-size:.75rem;cursor:pointer;transition:background .12s}
.run-btn-inline:hover{background:#1d4ed8}
.scroll{overflow-x:auto}
.in-layout-badge{display:inline-flex;align-items:center;gap:4px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:.75rem;font-weight:600;padding:3px 10px;border-radius:6px}
.add-to-layout-btn{background:#16a34a;color:#fff;border:none;padding:4px 12px;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;transition:background .15s}
.add-to-layout-btn:hover{background:#15803d}
.del-viz-btn{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:5px 10px;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;transition:background .15s}
.del-viz-btn:hover{background:#fca5a5}
.layout-row.dragging{opacity:.4}
.layout-row.drag-over{background:#eff6ff!important;border-color:#3b82f6!important}
.edit-sheet-tab{display:flex;align-items:center;padding:8px 16px;border-right:1px solid #e2e8f0;cursor:pointer;font-size:.8rem;color:#64748b;border-top:2px solid transparent;background:#f8fafc;white-space:nowrap;transition:all .15s;user-select:none}
.edit-sheet-tab:hover{background:#fff;color:#374151}
.edit-sheet-tab.active{background:#fff;color:#0f172a;font-weight:600;border-top-color:#3b82f6}
.grip{cursor:grab;color:#94a3b8;font-size:1.1rem;flex-shrink:0;margin-right:2px}
.csv-btn{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:7px;padding:4px 12px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .12s;white-space:nowrap}
.csv-btn:hover{background:#dcfce7;border-color:#86efac}
.filters-btn{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:5px;border:1px solid transparent;background:none;color:#64748b;font-size:.75rem;font-weight:500;cursor:pointer;transition:all .15s}
.filters-btn:hover,.filters-btn.active{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.params-panel-compact{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;margin-bottom:6px}
.params-panel-compact .ppc-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.params-panel-compact .ppc-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1e40af}
.params-panel-compact .params-grid{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
.params-panel-compact .run-btn{margin:0;padding:5px 14px;font-size:.75rem}
#app-edit{overflow:auto;height:100vh}
</style>
</head>
<body>

<!-- ── View mode ─────────────────────────────────────────────────────── -->
<div id="app-view">
  <div class="view-content">
    <div class="toolbar" style="padding:16px 20px 0">
      <div>
        <h1 id="title">Loading&#8230;</h1>
        <p class="desc" id="desc"></p>
      </div>
      <button class="btn-edit" onclick="enterEdit()">&#9998; Edit Dashboard</button>
    </div>
    <div id="viz-grid" class="viz-grid"></div>
  </div>
  <div class="sheet-tab-bar" id="sheet-tabs-view" style="display:none"></div>
</div>

<!-- ── Edit mode ──────────────────────────────────────────────────────── -->
<div id="app-edit" style="display:none">
  <div style="max-width:960px;margin:0 auto;padding:24px">
  <div class="edit-hdr">
    <h2>Edit Dashboard</h2>
    <div class="edit-acts">
      <button class="btn-secondary" onclick="cancelEdit()">Cancel</button>
      <button class="btn-primary" id="save-btn" onclick="saveEdit()">Save &amp; Publish</button>
    </div>
  </div>

  <!-- Sheet selector (hidden when only 1 sheet) -->
  <div class="section-card" id="edit-sheet-card" style="display:none">
    <div class="section-hdr"><h3>Sheet</h3></div>
    <div style="display:flex;overflow-x:auto" id="edit-sheet-tabs"></div>
  </div>

  <!-- Dashboard meta -->
  <div class="section-card">
    <div class="section-hdr"><h3>Dashboard Info</h3></div>
    <div class="section-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="fld"><label>Name</label><input type="text" id="edit-name"/></div>
        <div class="fld"><label>Description</label><input type="text" id="edit-desc" placeholder="Optional"/></div>
      </div>
    </div>
  </div>

  <!-- Visualization editor -->
  <div class="section-card">
    <div class="section-hdr">
      <h3>Visualization</h3>
      <div class="viz-selector-row">
        <select id="edit-viz-select" style="width:180px" onchange="switchViz()"></select>
        <button onclick="addVisualization()" class="btn-primary" style="padding:5px 12px;font-size:.8rem">+ New</button>
        <button onclick="deleteVisualization()" class="del-viz-btn" id="del-viz-btn">Delete</button>
      </div>
    </div>
    <div class="section-body" id="viz-edit-body">
      <div id="layout-status-row" style="margin-bottom:12px"></div>
      <div class="fld"><label>Title</label><input type="text" id="edit-viz-title"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="fld"><label>Database</label><select id="edit-db"><option value="">Loading&#8230;</option></select></div>
        <div class="fld">
          <label>Chart Type</label>
          <div class="viz-type-grp">
            <button class="viz-btn" data-viz="bar" onclick="selectViz('bar')">Bar</button>
            <button class="viz-btn" data-viz="line" onclick="selectViz('line')">Line</button>
            <button class="viz-btn" data-viz="pie" onclick="selectViz('pie')">Pie</button>
            <button class="viz-btn" data-viz="area" onclick="selectViz('area')">Area</button>
            <button class="viz-btn" data-viz="table" onclick="selectViz('table')">Table</button>
          </div>
        </div>
      </div>
      <div class="fld">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <label style="margin:0">Query</label>
          <button class="test-btn" id="test-btn" onclick="testEditQuery()">&#9654; Test</button>
        </div>
        <textarea id="edit-query" rows="5" class="mono" placeholder="SELECT col1, col2 FROM table WHERE str_col = '{{param}}' LIMIT 100"></textarea>
        <div id="test-out" class="test-out"></div>
      </div>
      <!-- Parameters -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <label style="margin:0">Parameters
            <span style="font-size:.75rem;color:#64748b;font-weight:400;margin-left:4px">— use <code class="params-hint">{{name}}</code> in query; for strings: <code class="params-hint">'{{name}}'</code></span>
          </label>
          <button class="add-btn" onclick="addParam()">+ Add Parameter</button>
        </div>
        <div id="edit-params-list"></div>
      </div>
    </div>
  </div>

  <!-- Layout -->
  <div class="section-card">
    <div class="section-hdr"><h3>Layout</h3></div>
    <div class="section-body">
      <p style="font-size:.8rem;color:#64748b;margin-bottom:12px">Drag rows to reorder. Set the width for each visualization. Use &#x22EE;&#x22EE; grip to drag.</p>
      <div id="layout-items"></div>
      <p style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:14px 0 6px">Preview</p>
      <div class="layout-preview" id="layout-preview"></div>
    </div>
  </div>

  <div class="save-status" id="save-status"></div>
  <div style="display:flex;gap:8px;margin-top:4px">
    <button class="btn-primary" id="save-btn2" onclick="saveEdit()">Save &amp; Publish</button>
    <button class="btn-secondary" onclick="cancelEdit()">Cancel</button>
  </div>
  </div><!-- /inner padding wrapper -->
</div>

<script>
var CONFIG = null;
var INSIGHT_ID = null;
var csrfToken = null;
var chartInstances = {};
var vizParamValues = {};
var activeSheetIdx = 0;
var vizWidths = {};
var vizRawData = {}; // vizId → { headers, values, headerInfo }
var vizHasRun = {};  // vizId → bool — tracks whether the viz has been run at least once
// COL_SPAN_STEPS_V / COL_SPAN_LABELS_V removed — widths are now continuous percentages
var editVizType = 'table';
var editVizId = null;
var editDraftSheets = [];
var editActiveSheetIdx = 0;
var editDraftVizs = [];
var editDraftLayout = [];

// ── CSRF ──────────────────────────────────────────────────────────────────────
async function getCsrf() {
  if (csrfToken) return csrfToken;
  try {
    var r = await fetch('/Monolith/api/config/fetchCsrf', { credentials: 'include', headers: { 'X-CSRF-Token': 'fetch' } });
    if (r.ok) csrfToken = r.headers.get('X-CSRF-Token') || r.headers.get('x-csrf-token') || null;
  } catch (e) {}
  return csrfToken;
}

// ── Pixel runner ──────────────────────────────────────────────────────────────
async function runPixel(expression) {
  var csrf = await getCsrf();
  var hdrs = { 'Content-Type': 'application/json' };
  if (csrf) hdrs['X-CSRF-Token'] = csrf;
  var body = { expression: expression };
  if (INSIGHT_ID) body.insightId = INSIGHT_ID;
  var r = await fetch('/Monolith/api/engine/runPixel', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  var json = await r.json();
  if (json.insightID) INSIGHT_ID = json.insightID;
  var pr = json && json.pixelReturn && json.pixelReturn[0];
  if (pr && Array.isArray(pr.operationType) && pr.operationType.indexOf('ERROR') > -1) throw new Error(String(pr.output || 'Pixel error'));
  return pr && pr.output;
}

function escPixel(s) {
  return String(s).replace(/\\\\/g,'\\\\\\\\').replace(/"/g,'\\\\"').replace(/\\n/g,'\\\\n').replace(/\\t/g,'\\\\t').replace(/\\r/g,'');
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Migrate any legacy format → sheets-based config ──────────────────────────
function migrateConfig(c) {
  // Already has sheets array — use as-is
  if (c.sheets && Array.isArray(c.sheets) && c.sheets.length) return c;
  // Has top-level visualizations (old multi-viz format)
  if (c.visualizations && Array.isArray(c.visualizations)) {
    return Object.assign({}, c, {
      sheets: [{ id: 'sheet-1', name: 'Sheet 1', visualizations: c.visualizations, layout: c.layout || [] }]
    });
  }
  // Very old single-viz format
  var viz = {
    id: 'viz-legacy', title: c.name || 'Visualization',
    databaseId: c.databaseId || '', databaseName: c.databaseName || '',
    query: c.query || '', parameters: c.parameters || [],
    visualizationType: c.visualizationType || 'table'
  };
  return Object.assign({}, c, {
    sheets: [{ id: 'sheet-1', name: 'Sheet 1', visualizations: [viz], layout: [{ vizId: 'viz-legacy', colSpan: 12, order: 0 }] }]
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    var r = await fetch('./dashboard.json?_=' + Date.now(), { credentials: 'include' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    CONFIG = migrateConfig(await r.json());
  } catch (e) {
    document.getElementById('title').textContent = 'Error loading dashboard';
    return;
  }
  document.title = CONFIG.name || 'Dashboard';
  document.getElementById('title').textContent = CONFIG.name || '';
  document.getElementById('desc').textContent = CONFIG.description || '';
  renderViewGrid();
}

// ── View mode ─────────────────────────────────────────────────────────────────
function renderSheetTabs() {
  var bar = document.getElementById('sheet-tabs-view');
  if (!bar) return;
  if (CONFIG.sheets.length <= 1) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = '';
  CONFIG.sheets.forEach(function(sheet, idx) {
    var isActive = idx === activeSheetIdx;
    var tabColor = sheet.color || '#3b82f6';
    var tab = document.createElement('div');
    tab.className = 'sheet-tab' + (isActive ? ' active' : '');
    tab.style.borderTopColor = isActive ? tabColor : 'transparent';
    tab.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:'+esc(tabColor)+';display:inline-block;flex-shrink:0;margin-right:4px"></span>'
      + esc(sheet.name) + '<span class="tab-badge">' + sheet.visualizations.length + '</span>';
    tab.onclick = (function(i){ return function(){ switchSheet(i); }; })(idx);
    bar.appendChild(tab);
  });
}

function switchSheet(idx) {
  if (idx === activeSheetIdx) return;
  Object.keys(chartInstances).forEach(function(id){ if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];} });
  activeSheetIdx = idx;
  vizWidths = {}; vizRawData = {}; tablePages = {}; vizHasRun = {};
  renderViewGrid();
}

function renderViewGrid() {
  var sheet = CONFIG.sheets[activeSheetIdx] || CONFIG.sheets[0];
  var sorted = (sheet ? sheet.layout : []).slice().sort(function(a,b){ return a.order-b.order; });
  var grid = document.getElementById('viz-grid');
  grid.innerHTML = '';

  // Group items into rows using cumulative widthPct (flex-wrap logic)
  var rows = [];
  var curRow = []; var wAcc = 0;
  sorted.forEach(function(item) {
    var viz = sheet.visualizations.find(function(v){ return v.id === item.vizId; });
    if (!viz) return;
    var iw = item.widthPct != null ? item.widthPct : Math.round((item.colSpan||12)/12*100);
    if (wAcc > 0 && wAcc + iw > 100) { rows.push(curRow); curRow = [{item:item,viz:viz,w:iw}]; wAcc = iw; }
    else { curRow.push({item:item,viz:viz,w:iw}); wAcc += iw; }
  });
  if (curRow.length) rows.push(curRow);

  // Proportional row heights
  var totalH = rows.reduce(function(s,r){ return s+(r[0].item.rowHeightPct||(100/rows.length)); }, 0);

  var numRows = rows.length;
  rows.forEach(function(row, rowIdx) {
    var rowH = row[0].item.rowHeightPct || (100/numRows);
    var rowDiv = document.createElement('div');
    rowDiv.className = 'viz-row';
    rowDiv.id = 'vr-'+rowIdx;
    rowDiv.style.flex = String(rowH);

    row.forEach(function(entry, itemIdx) {
      var item=entry.item; var viz=entry.viz; var iw=entry.w;
      vizParamValues[viz.id] = {};
      var effectivePct = vizWidths[viz.id] !== undefined ? vizWidths[viz.id] : iw;

      // ── Horizontal (column) separator between items ──
      if (itemIdx > 0) {
        var colSep = document.createElement('div');
        colSep.className = 'panel-sep-h';
        var vizIdLeft = row[itemIdx-1].viz.id;
        var vizIdRight = viz.id;
        colSep.onmousedown = (function(vl,vr){ return function(e){ startColResize(e,vl,vr); }; })(vizIdLeft, vizIdRight);
        rowDiv.appendChild(colSep);
      }

      var section = document.createElement('div');
      section.className = 'viz-section';
      section.id = 'vs-'+viz.id;
      section.style.cssText = 'flex:'+effectivePct+';min-width:0;min-height:0;display:flex;flex-direction:column;position:relative';

      // Width badge
      var cbar = document.createElement('div'); cbar.className = 'viz-controls-bar';
      var wlbl = document.createElement('span'); wlbl.id = 'wlabel-'+viz.id;
      wlbl.style.cssText = 'font-size:.7rem;color:#94a3b8;user-select:none';
      wlbl.textContent = Math.round(effectivePct)+'%';
      cbar.appendChild(wlbl);
      section.appendChild(cbar);

      // Viz card
      var vc = document.createElement('div'); vc.className = 'viz-card'; vc.id = 'vc-'+viz.id;

      // Card header
      var vh = document.createElement('div'); vh.className = 'viz-card-hdr';
      var vt = document.createElement('h2'); vt.className = 'viz-title'; vt.textContent = viz.title;
      vh.appendChild(vt);
      // Card header right-side buttons — matches main app DashboardVisualization header
      var hbtns = document.createElement('div'); hbtns.style.cssText = 'display:flex;align-items:center;gap:4px;flex-shrink:0';
      // Parameters toggle (hidden until first run, matches main app's SlidersHorizontal icon)
      if (viz.parameters && viz.parameters.length) {
        var ptbtn = document.createElement('button'); ptbtn.className = 'params-toggle-btn'; ptbtn.id = 'ptbtn-'+viz.id;
        ptbtn.innerHTML = '&#9776;'; ptbtn.title = 'Adjust parameters'; ptbtn.style.display = 'none';
        ptbtn.style.cssText += 'width:28px;height:28px;display:none;align-items:center;justify-content:center;border-radius:6px;border:none;background:none;cursor:pointer;color:#94a3b8;font-size:.9rem;transition:all .15s';
        ptbtn.onmouseover = function(){ ptbtn.style.background='#eff6ff'; ptbtn.style.color='#1d4ed8'; };
        ptbtn.onmouseout  = function(){ if(!ptbtn.classList.contains('active')){ ptbtn.style.background=''; ptbtn.style.color='#94a3b8'; }};
        ptbtn.onclick = (function(vId){ return function(){ toggleAdjustParams(vId); }; })(viz.id);
        hbtns.appendChild(ptbtn);
      }
      // Refresh button — always shown (matches main app's RefreshCw icon)
      var refreshBtn = document.createElement('button');
      refreshBtn.title = 'Refresh';
      refreshBtn.style.cssText = 'width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;border:none;background:none;cursor:pointer;color:#94a3b8;font-size:.85rem;transition:color .15s';
      refreshBtn.innerHTML = '&#8635;';
      refreshBtn.onmouseover = function(){ refreshBtn.style.color='#475569'; };
      refreshBtn.onmouseout  = function(){ refreshBtn.style.color='#94a3b8'; };
      refreshBtn.onclick = (function(id){ return function(){ runVizFromCard(id); }; })(viz.id);
      hbtns.appendChild(refreshBtn);
      vh.appendChild(hbtns);
      vc.appendChild(vh);

      // Adjust-params strip (post-run, toggled)
      if (viz.parameters && viz.parameters.length) {
        viz.parameters.forEach(function(p){ vizParamValues[viz.id][p.name] = p.defaultValue||''; });
        var cols = viz.parameters.length>=3 ? 'cols-3' : viz.parameters.length===2 ? 'cols-2' : '';
        var strip = document.createElement('div'); strip.className = 'adjust-params-strip'; strip.id = 'apstrip-'+viz.id;
        var sg = document.createElement('div'); sg.className = 'adjust-params-grid '+cols;
        viz.parameters.forEach(function(p) {
          var d = document.createElement('div');
          var lbl = document.createElement('label'); lbl.style.cssText = 'font-size:.7rem;font-weight:600;color:#475569;margin-bottom:3px;display:block'; lbl.textContent = p.label||p.name;
          var inp = document.createElement('input'); inp.type='text'; inp.value=p.defaultValue||''; inp.placeholder=p.defaultValue||p.name; inp.style.cssText='padding:6px 10px;font-size:.8rem';
          inp.dataset.viz=viz.id; inp.dataset.name=p.name;
          inp.addEventListener('input', function(e){ vizParamValues[e.target.dataset.viz][e.target.dataset.name]=e.target.value; });
          inp.addEventListener('keydown', function(e){ if(e.key==='Enter') runVizFromCard(viz.id); });
          d.appendChild(lbl); d.appendChild(inp); sg.appendChild(d);
        });
        var sr = document.createElement('button'); sr.className='adjust-params-run'; sr.textContent='▶ Run Query';
        sr.onclick=(function(vId){ return function(){ runVizFromCard(vId); }; })(viz.id);
        strip.appendChild(sg); strip.appendChild(sr);
        vc.appendChild(strip);
      }

      var st = document.createElement('div'); st.className='status'; st.id='st-'+viz.id;
      var rc = document.createElement('div'); rc.id='rc-'+viz.id; rc.className='rc-container'; rc.style.display='none';
      vc.appendChild(st); vc.appendChild(rc);
      section.appendChild(vc);

      rowDiv.appendChild(section);
    });
    grid.appendChild(rowDiv);

    // ── Vertical (row) separator between rows ──
    if (rowIdx < numRows - 1) {
      var rowSep = document.createElement('div');
      rowSep.className = 'panel-sep-v';
      rowSep.id = 'rs-'+rowIdx;
      rowSep.onmousedown = (function(ri){ return function(e){ startRowResize(e, ri); }; })(rowIdx);
      grid.appendChild(rowSep);
    }
  });

  // ── Resize logic: columns ──────────────────────────────────────────────────
  function startColResize(e, vizIdLeft, vizIdRight) {
    e.preventDefault();
    var secL = document.getElementById('vs-'+vizIdLeft);
    var secR = document.getElementById('vs-'+vizIdRight);
    if (!secL || !secR) return;
    var sep = e.target; sep.classList.add('active');
    var startX = e.clientX;
    var flexL = parseFloat(secL.style.flex) || 50;
    var flexR = parseFloat(secR.style.flex) || 50;
    var totalW = secL.offsetWidth + secR.offsetWidth;
    var totalFlex = flexL + flexR;
    function onMove(ev) {
      var dx = ev.clientX - startX;
      var newFlexL = Math.max(5, flexL + (dx / totalW) * totalFlex);
      var newFlexR = Math.max(5, (totalFlex - newFlexL));
      secL.style.flex = String(newFlexL);
      secR.style.flex = String(newFlexR);
      vizWidths[vizIdLeft]  = newFlexL;
      vizWidths[vizIdRight] = newFlexR;
      var lbl = document.getElementById('wlabel-'+vizIdLeft); if(lbl) lbl.textContent = Math.round(newFlexL)+'%';
      requestAnimationFrame(function(){
        if(chartInstances[vizIdLeft])  chartInstances[vizIdLeft].resize();
        if(chartInstances[vizIdRight]) chartInstances[vizIdRight].resize();
      });
    }
    function onUp() { sep.classList.remove('active'); document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Resize logic: rows ────────────────────────────────────────────────────
  function startRowResize(e, rowIdx) {
    e.preventDefault();
    // Grid children alternate: row0, sep0, row1, sep1, row2...
    var rowAbove = document.getElementById('vr-'+rowIdx);
    var rowBelow = document.getElementById('vr-'+(rowIdx+1));
    if (!rowAbove || !rowBelow) return;
    var sep2 = e.target; sep2.classList.add('active');
    var startY = e.clientY;
    var flexA = parseFloat(rowAbove.style.flex) || 50;
    var flexB = parseFloat(rowBelow.style.flex) || 50;
    var totalH = rowAbove.offsetHeight + rowBelow.offsetHeight;
    var totalFlex = flexA + flexB;
    var sheetLayout = CONFIG.sheets[activeSheetIdx] && CONFIG.sheets[activeSheetIdx].layout;
    // Collect vizIds in each row for chart resize + config save
    var vizIdsAbove = Array.from(rowAbove.querySelectorAll('.viz-section')).map(function(s){ return s.id.replace('vs-',''); });
    var vizIdsBelow = Array.from(rowBelow.querySelectorAll('.viz-section')).map(function(s){ return s.id.replace('vs-',''); });
    function onMove(ev) {
      var dy = ev.clientY - startY;
      var newFlexA = Math.max(5, flexA + (dy / totalH) * totalFlex);
      var newFlexB = Math.max(5, totalFlex - newFlexA);
      rowAbove.style.flex = String(newFlexA);
      rowBelow.style.flex = String(newFlexB);
      // Save to config
      if (sheetLayout) {
        vizIdsAbove.forEach(function(id){ var li=sheetLayout.find(function(l){ return l.vizId===id; }); if(li) li.rowHeightPct=newFlexA; });
        vizIdsBelow.forEach(function(id){ var li=sheetLayout.find(function(l){ return l.vizId===id; }); if(li) li.rowHeightPct=newFlexB; });
      }
      requestAnimationFrame(function(){
        vizIdsAbove.concat(vizIdsBelow).forEach(function(id){ if(chartInstances[id]) chartInstances[id].resize(); });
      });
    }
    function onUp() { sep2.classList.remove('active'); document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // Auto-run no-param vizs; show inline param form for others
  sheet.visualizations.forEach(function(v){
    if (!v.parameters || !v.parameters.length) { runViz(v.id); }
    else { renderParamWaiting(v.id, v); }
  });
  renderSheetTabs();
}

// Inline param form — matches main app waiting state
function renderParamWaiting(vizId, viz) {
  var rc = document.getElementById('rc-'+vizId);
  var st = document.getElementById('st-'+vizId);
  if (st) { st.textContent=''; st.style.display='none'; }
  if (!rc) return;
  rc.style.display='block'; rc.innerHTML='';
  var cols = viz.parameters.length>=3 ? 'cols-2' : '';
  var form = document.createElement('div'); form.className='param-waiting';
  form.innerHTML = '<div class="param-waiting-hdr"><h4>Query Parameters</h4><p>Set values below, then run to load data</p></div>'
    +'<div class="param-waiting-body"><div class="param-waiting-grid '+cols+'">'
    +viz.parameters.map(function(p){
      return '<div><label style="display:block;font-size:.75rem;font-weight:600;color:#475569;margin-bottom:4px">'+esc(p.label||p.name)+'</label>'
        +'<input class="param-waiting-inp" type="text" data-viz="'+esc(vizId)+'" data-name="'+esc(p.name)+'" value="'+esc(p.defaultValue||'')+'" placeholder="'+esc(p.defaultValue||p.name)+'"/></div>';
    }).join('')
    +'</div></div>'
    +'<div class="param-waiting-footer"><button class="param-waiting-run">&#9654; Run Query</button></div>';
  rc.appendChild(form);
  // Wire Run button via addEventListener — avoids inline onclick quote-escaping issues
  var runBtn = form.querySelector('.param-waiting-run');
  if (runBtn) runBtn.addEventListener('click', (function(id){ return function(){ runVizFromCard(id); }; })(vizId));
  form.querySelectorAll('.param-waiting-inp').forEach(function(inp){
    vizParamValues[vizId]=vizParamValues[vizId]||{};
    vizParamValues[vizId][inp.dataset.name]=inp.value;
    inp.addEventListener('input', function(e){ vizParamValues[vizId][e.target.dataset.name]=e.target.value; });
    inp.addEventListener('keydown', (function(id){ return function(e){ if(e.key==='Enter') runVizFromCard(id); }; })(vizId));
  });
}

// Run from card: clear waiting form, show chart
function runVizFromCard(vizId) {
  var rc = document.getElementById('rc-'+vizId); if(rc){ rc.innerHTML=''; rc.style.display='none'; }
  vizHasRun[vizId]=true;
  // Show the params-toggle button in header now
  var ptbtn = document.getElementById('ptbtn-'+vizId); if(ptbtn) ptbtn.style.display='';
  // Hide the Run Query button from header (params toggle replaces it)
  var vc = document.getElementById('vc-'+vizId);
  if(vc){ var rb=vc.querySelector('.run-btn-inline'); if(rb) rb.style.display='none'; }
  runViz(vizId);
}

// Toggle adjust-params strip
function toggleAdjustParams(vizId) {
  var strip=document.getElementById('apstrip-'+vizId); var btn=document.getElementById('ptbtn-'+vizId);
  if(!strip) return;
  var open=strip.classList.toggle('open');
  if(btn){ btn.innerHTML=open?'&#9776; Parameters &#9650;':'&#9776; Parameters &#9660;'; btn.classList.toggle('active',open); }
}

// Continuous width drag

async function runViz(vizId) {
  var viz = null;
  for (var _si = 0; _si < CONFIG.sheets.length; _si++) {
    viz = CONFIG.sheets[_si].visualizations.find(function(v){ return v.id === vizId; });
    if (viz) break;
  }
  if (!viz) return;
  var st = document.getElementById('st-' + vizId);
  var rc = document.getElementById('rc-' + vizId);
  if (st) { st.textContent = 'Fetching data\u2026'; st.className = 'status'; }
  try {
    var pv = vizParamValues[vizId] || {};
    var q = viz.query.replace(/{{(w+)}}/g, function(_, n){ return pv[n] !== undefined ? pv[n] : ''; });
    var safeQ = q.replace(/\\\\/g,'\\\\\\\\').replace(/"/g,'\\\\"');
    var pixel = 'Database(database=["' + viz.databaseId + '"]) | Query("' + safeQ + '") | Collect(500);';
    var out = await runPixel(pixel);
    var headers = (out && out.data && out.data.headers) || (out && out.headers) || [];
    var values  = (out && out.data && out.data.values)  || (out && out.values)  || (out && out.data) || [];
    if (!Array.isArray(values) || !values.length) {
      if (st) st.textContent = 'No data returned.';
      if (rc) rc.style.display = 'none';
      return;
    }
    if (st) { st.textContent = values.length.toLocaleString() + ' row' + (values.length === 1 ? '' : 's') + ' returned.'; st.style.cssText='font-size:.75rem;color:#94a3b8;padding:6px 20px 2px;flex-shrink:0'; }
    vizRawData[vizId] = { headers: headers, values: values, headerInfo: (out && out.headerInfo) || [] };
    renderVizResult(vizId, viz.visualizationType, headers, values, viz.config);
    if (rc) rc.style.display = 'block';
  } catch (err) {
    if (st) { st.textContent = 'Error: ' + err.message; st.className = 'status error'; }
  }
}

// Determine x/y columns from config or auto-detect via headerInfo
function resolveAxes(headers, headerInfo, config) {
  var numericSet = {};
  if (headerInfo && headerInfo.length) {
    headerInfo.forEach(function(info){ if (info.type === 'NUMBER') numericSet[info.header] = true; });
  } else {
    // simple heuristic: nothing; rely on config
  }
  var configuredX = config && config.xKey && headers.indexOf(config.xKey) > -1 ? config.xKey : null;
  var configuredY = config && config.yKeys && config.yKeys.length ? config.yKeys.filter(function(k){ return headers.indexOf(k) > -1; }) : null;
  var xKey = configuredX || headers.find(function(h){ return !numericSet[h]; }) || headers[0] || '';
  var yKeys = configuredY || headers.filter(function(h){ return h !== xKey && numericSet[h]; });
  if (!yKeys.length) yKeys = headers.filter(function(h){ return h !== xKey; });
  return { xKey: xKey, yKeys: yKeys.slice(0, 8) };
}

function contentSizeTarget(container, config) {
  // Author-defined Size & Position: box the rendered content inside the panel and
  // align it. Returns the element the renderer should draw into (the container
  // itself when no size is set). The flexlayout panel/card is untouched.
  var size = config && config.styling && config.styling.size;
  if (!size || (!size.width && !size.height)) return container;
  var flex = { start: 'flex-start', center: 'center', end: 'flex-end' };
  container.style.cssText += ';display:flex;overflow:auto;justify-content:' + (flex[size.align] || 'flex-start') + ';align-items:' + (flex[size.valign] || 'flex-start');
  var box = document.createElement('div');
  box.style.cssText = 'width:' + (size.width || '100%') + ';height:' + (size.height || '100%') + ';flex:0 0 auto;min-width:0;min-height:0;display:flex;flex-direction:column;position:relative';
  container.appendChild(box);
  return box;
}

function renderVizResult(vizId, vizType, headers, values, config) {
  var container = document.getElementById('rc-' + vizId);
  container.innerHTML = '';
  container.style.cssText = '';
  var target = contentSizeTarget(container, config);
  if (vizType === 'kpi') {
    renderKpi(target, headers, values, config);
    renderVizControls(vizId, headers, values, config, vizType);
    return;
  }
  if (vizType === 'table') {
    renderTable(target, headers, values, vizId, false);
    renderVizControls(vizId, headers, values, config, vizType);
    return;
  }
  if (vizType === 'pivot') {
    renderPivot(target, headers, values, vizId, config);
    renderVizControls(vizId, headers, values, config, vizType);
    return;
  }
  var wrap = document.createElement('div'); wrap.className = 'chart-wrapper';
  var canvas = document.createElement('canvas'); wrap.appendChild(canvas); target.appendChild(wrap);
  if (chartInstances[vizId]) { chartInstances[vizId].destroy(); }
  var raw = vizRawData[vizId] || {};
  var axes = resolveAxes(headers, raw.headerInfo, config);
  var xIdx = headers.indexOf(axes.xKey);
  var colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316'];
  var labels = values.map(function(r){ return String(r[xIdx] != null ? r[xIdx] : ''); });
  var typeMap = { bar:'bar', line:'line', area:'line', pie:'pie', scatter:'scatter', radar:'radar' };
  var ct = typeMap[vizType] || 'bar';
  var datasets;
  if (ct === 'scatter') {
    var yIdx = headers.indexOf(axes.yKeys[0]);
    datasets = [{ label: axes.yKeys[0]||'', data: values.map(function(r){ return { x: parseFloat(r[xIdx])||0, y: parseFloat(r[yIdx])||0 }; }), backgroundColor: colors[0]+'bb', borderColor: colors[0], borderWidth: 1, pointRadius: 4 }];
  } else {
    datasets = axes.yKeys.map(function(h, i){
      var hi = headers.indexOf(h);
      var c = colors[i % colors.length];
      var d = values.map(function(r){ return parseFloat(r[hi]) || 0; });
      if (ct === 'pie') return { data: d, backgroundColor: values.map(function(_,j){ return colors[j%colors.length]; }) };
      if (ct === 'radar') return { label: h, data: d, backgroundColor: c+'40', borderColor: c, borderWidth: 2, fill: true };
      return { label: h, data: d, backgroundColor: ct==='area'?c+'25':c+'cc', borderColor: c, borderWidth: ct==='bar'?0:2, fill: ct==='area', tension: .4, pointRadius: ct==='line'?3:0, borderRadius: ct==='bar'?3:0 };
    });
  }
  var chartData = (ct==='pie')
    ? { labels: labels, datasets: [datasets[0]] }
    : ct==='scatter' ? { datasets: datasets }
    : ct==='radar' ? { labels: labels, datasets: datasets }
    : { labels: labels, datasets: datasets };
  chartInstances[vizId] = new Chart(canvas, {
    type: ct,
    data: chartData,
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length>1||ct==='pie'||ct==='radar', labels: { font: { size: 11 } } } },
      scales: (ct==='pie'||ct==='radar') ? {} : {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' }, border: { display: false } },
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' }, border: { display: false } }
      }
    }
  });
  watchCardResize(vizId);
  renderVizControls(vizId, headers, values, config, vizType);
}

// On-the-fly controls (chart type + axis selectors)
function renderVizControls(vizId, headers, values, config, currentType) {
  var panelId = 'vcp-'+vizId;
  var existing = document.getElementById(panelId);
  if (existing) existing.remove();
  var raw = vizRawData[vizId] || {};
  var axes = resolveAxes(headers, raw.headerInfo, config);
  var section = document.getElementById('vs-'+vizId);
  if (!section) return;
  var panel = document.createElement('div');
  panel.id = panelId; panel.className = 'viz-controls-panel active';
  // Type buttons
  var typeRow = document.createElement('div'); typeRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px';
  var types = ['kpi','bar','line','area','scatter','pie','radar','treemap','pivot','table'];
  types.forEach(function(t){
    var btn = document.createElement('button'); btn.className = 'vcp-type-btn'+(t===currentType?' active':'');
    btn.textContent = t;
    btn.onclick = (function(type){ return function(){ reRenderAs(vizId, type); }; })(t);
    typeRow.appendChild(btn);
  });
  panel.appendChild(typeRow);
  // Axis selectors (not for pie, table, pivot)
  if (['bar','line','area','scatter','radar'].indexOf(currentType) > -1) {
    var axRow = document.createElement('div'); axRow.className = 'vcp-row';
    // X
    var xWrap = document.createElement('div');
    var xLbl = document.createElement('label'); xLbl.style.cssText = 'display:block;font-size:.7rem;font-weight:600;color:#64748b;margin-bottom:3px'; xLbl.textContent = 'X Axis';
    var xSel = document.createElement('select'); xSel.className = 'vcp-select';
    headers.forEach(function(h){ var o=document.createElement('option'); o.value=h; o.textContent=h; if(h===axes.xKey)o.selected=true; xSel.appendChild(o); });
    xSel.onchange = function(){ reRenderAs(vizId, currentType, xSel.value, getCheckedY(vizId)); };
    xWrap.appendChild(xLbl); xWrap.appendChild(xSel); axRow.appendChild(xWrap);
    // Y (checkboxes)
    var yWrap = document.createElement('div');
    var yLbl = document.createElement('label'); yLbl.style.cssText = 'display:block;font-size:.7rem;font-weight:600;color:#64748b;margin-bottom:3px'; yLbl.textContent = 'Y Axis';
    var yCont = document.createElement('div'); yCont.id = 'ycheck-'+vizId; yCont.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
    headers.filter(function(h){return h!==axes.xKey;}).forEach(function(h){
      var lbl=document.createElement('label'); lbl.style.cssText='display:flex;align-items:center;gap:3px;font-size:.72rem;cursor:pointer';
      var cb=document.createElement('input'); cb.type='checkbox'; cb.value=h; cb.checked=axes.yKeys.indexOf(h)>-1;
      cb.onchange=function(){ reRenderAs(vizId, currentType, xSel.value, getCheckedY(vizId)); };
      lbl.appendChild(cb); lbl.appendChild(document.createTextNode(h)); yCont.appendChild(lbl);
    });
    yWrap.appendChild(yLbl); yWrap.appendChild(yCont); axRow.appendChild(yWrap);
    panel.appendChild(axRow);
  }
  section.appendChild(panel);
}

function getCheckedY(vizId) {
  var cont = document.getElementById('ycheck-'+vizId);
  if (!cont) return [];
  var cbs = cont.querySelectorAll('input[type=checkbox]:checked');
  return Array.prototype.map.call(cbs, function(cb){ return cb.value; });
}

function reRenderAs(vizId, newType, xKey, yKeys) {
  var raw = vizRawData[vizId];
  if (!raw) return;
  // Find and update viz config in memory
  var viz = null;
  for (var si=0; si<CONFIG.sheets.length; si++) {
    viz = CONFIG.sheets[si].visualizations.find(function(v){ return v.id===vizId; });
    if (viz) break;
  }
  if (!viz) return;
  if (!viz.config) viz.config = {};
  if (xKey) viz.config.xKey = xKey;
  if (yKeys && yKeys.length) viz.config.yKeys = yKeys;
  viz.visualizationType = newType;
  var rc = document.getElementById('rc-'+vizId);
  if (rc) rc.style.display = 'none';
  renderVizResult(vizId, newType, raw.headers, raw.values, viz.config);
  var rc2 = document.getElementById('rc-'+vizId);
  if (rc2) rc2.style.display = 'block';
}

// ── KPI tiles ────────────────────────────────────────────────────────────────
function renderKpi(container, headers, values, config) {
  config = config || {};
  var agg     = config.kpiAggregation || 'sum';
  var fmt     = config.kpiFormat      || 'auto';
  var pre     = config.kpiPrefix      || '';
  var suf     = config.kpiSuffix      || '';
  var yKeys   = (config.yKeys && config.yKeys.length) ? config.yKeys : headers.slice(1);
  var colors  = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316'];

  function aggregate(col) {
    var idx = headers.indexOf(col);
    if (idx < 0) return 0;
    var vals = values.map(function(r){ return parseFloat(r[idx]); }).filter(function(v){ return !isNaN(v); });
    if (!vals.length) return 0;
    switch(agg) {
      case 'avg':   return vals.reduce(function(a,b){return a+b;},0)/vals.length;
      case 'count': return vals.length;
      case 'max':   return Math.max.apply(null,vals);
      case 'min':   return Math.min.apply(null,vals);
      case 'last':  return vals[vals.length-1];
      default:      return vals.reduce(function(a,b){return a+b;},0);
    }
  }

  var decimals   = config.kpiDecimals;                                    // number | 'auto' | undefined
  var notation   = config.kpiNotation || 'standard';
  var thouSep    = config.kpiThousandsSep === 'none' ? '' : (config.kpiThousandsSep || ',');
  var decSep     = config.kpiDecimalSep || '.';
  function roundTo(n, p){ var f = Math.pow(10, p); return Math.round((n + Number.EPSILON) * f) / f; }
  function group(intPart){ return thouSep ? intPart.replace(/B(?=(d{3})+(?!d))/g, thouSep) : intPart; }
  function fmtStandard(v){
    var neg = v < 0, s;
    if (decimals === undefined || decimals === 'auto') s = String(roundTo(Math.abs(v), 2));
    else s = Math.abs(v).toFixed(Math.max(0, Math.min(6, decimals)));
    var parts = s.split('.'), body = parts[1] ? group(parts[0]) + decSep + parts[1] : group(parts[0]);
    return (neg ? '-' : '') + body;
  }
  function fmtCompact(v){
    var abs = Math.abs(v), div = 1, unit = '';
    if      (abs >= 1e12) { div = 1e12; unit = 'T'; }
    else if (abs >= 1e9)  { div = 1e9;  unit = 'B'; }
    else if (abs >= 1e6)  { div = 1e6;  unit = 'M'; }
    else if (abs >= 1e3)  { div = 1e3;  unit = 'K'; }
    var places = (decimals === undefined || decimals === 'auto') ? 1 : Math.max(0, Math.min(6, decimals));
    var s = (v / div).toFixed(places);
    if (decimals === undefined || decimals === 'auto') s = s.replace(/.0+$/,'').replace(/(.d*?)0+$/,'$1');
    return s.replace('.', decSep) + unit;
  }
  function formatNum(n) {
    if (!isFinite(n)) n = 0;
    var body = (notation === 'compact') ? fmtCompact(n) : fmtStandard(n);
    return pre + (fmt === 'currency' ? '$' : '') + body + (fmt === 'percent' ? '%' : '') + suf;
  }

  function getTrend(col) {
    if (values.length < 2) return null;
    var idx = headers.indexOf(col);
    var curr = parseFloat(values[values.length-1][idx]) || 0;
    var prev = parseFloat(values[values.length-2][idx]) || 0;
    if (prev === 0) return null;
    var pct = ((curr - prev) / Math.abs(prev)) * 100;
    return { pct: pct, up: pct >= 0 };
  }

  var kpiLayout = (config.styling && config.styling.kpi && config.styling.kpi.layout) || 'horizontal';
  var wrap = document.createElement('div');
  if (kpiLayout === 'grid') {
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;padding:12px;align-content:start;height:100%;overflow:auto;box-sizing:border-box';
  } else if (kpiLayout === 'vertical') {
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:12px;height:100%;overflow:auto;box-sizing:border-box';
  } else {
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;padding:12px;align-items:flex-start;align-content:flex-start;height:100%;overflow:auto;box-sizing:border-box';
  }

  yKeys.forEach(function(col, i) {
    var value = aggregate(col);
    var trend = getTrend(col);
    var color = colors[i % colors.length];
    var card = document.createElement('div');
    var cardFlex = (kpiLayout === 'horizontal') ? 'flex:1;min-width:160px;' : 'width:100%;min-width:0;';
    card.style.cssText = 'background:#fff;border-radius:16px;border:1px solid #e2e8f0;border-top:3px solid '+color+';padding:20px 24px;'+cardFlex+'box-shadow:0 1px 3px rgba(0,0,0,.05);box-sizing:border-box';
    var lbl = document.createElement('p');
    lbl.style.cssText = 'font-size:.65rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    lbl.textContent = col;
    var val = document.createElement('p');
    val.style.cssText = 'font-size:2rem;font-weight:800;color:#0f172a;line-height:1;margin-bottom:8px;font-variant-numeric:tabular-nums';
    val.textContent = formatNum(value);
    card.appendChild(lbl);
    card.appendChild(val);
    if (trend) {
      var tr = document.createElement('div');
      tr.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:.8rem;font-weight:600;color:'+(trend.up?'#059669':'#dc2626');
      tr.innerHTML = (trend.up?'↑':'↓')+' '+Math.abs(trend.pct).toFixed(1)+'% <span style="color:#94a3b8;font-weight:400;font-size:.72rem;margin-left:2px">vs previous</span>';
      card.appendChild(tr);
    } else {
      var meta = document.createElement('p');
      meta.style.cssText = 'font-size:.7rem;color:#94a3b8';
      meta.textContent = values.length.toLocaleString()+' rows · '+agg;
      card.appendChild(meta);
    }
    wrap.appendChild(card);
  });
  container.appendChild(wrap);
}

// ── Pivot table (multi-dimensional crosstab) ─────────────────────────────────
function renderPivot(container, headers, values, vizId, config) {
  container.innerHTML = '';
  config = config || {};
  var rowFields = (config.pivotRows || []).filter(function(f){ return headers.indexOf(f) > -1; });
  var colFields = (config.pivotColumns || []).filter(function(f){ return headers.indexOf(f) > -1; });
  var valFields = ((config.pivotValues && config.pivotValues.length ? config.pivotValues : (config.yKeys||[])) || []).filter(function(f){ return headers.indexOf(f) > -1; });
  var aggregations = config.columnAggregations || {};
  var totals = (config.styling && config.styling.pivot && config.styling.pivot.showTotals) || {};
  var showAll = !!totals.all;
  var showRowTotals = showAll || !!totals.rows;
  var showColumnTotals = showAll || !!totals.columns;
  var showSubtotals = !!totals.subtotals;
  var fitWidth = !(config.styling && config.styling.table && config.styling.table.fitContainerWidth === false);

  function emptyMsg(msg, sub) {
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#94a3b8;text-align:center;padding:24px';
    var p = document.createElement('p'); p.style.cssText = 'font-size:.875rem;font-weight:500'; p.textContent = msg;
    var p2 = document.createElement('p'); p2.style.cssText = 'font-size:.75rem;margin-top:4px'; p2.textContent = sub;
    div.appendChild(p); div.appendChild(p2); container.appendChild(div);
  }
  if (!rowFields.length && !colFields.length) { emptyMsg('No pivot configured', 'Drag columns to Rows or Columns'); return; }
  if (!valFields.length) { emptyMsg('No values configured', 'Drag a measure to Values'); return; }
  if (!values.length) { emptyMsg('No data', ''); return; }

  var SEP = '\u0001';
  function key(arr) { return arr.join(SEP); }
  function fmtH(v) { return (v == null || v === '') ? '(blank)' : String(v); }
  function aggregate(vals, type) {
    if (!vals.length) return null;
    if (type === 'count') return vals.length;
    if (type === 'countUnique') { var s = {}; vals.forEach(function(v){ s[v]=1; }); return Object.keys(s).length; }
    var nums = vals.map(function(v){ return Number(v); }).filter(function(v){ return !isNaN(v); });
    if (!nums.length) return null;
    if (type === 'avg') return nums.reduce(function(a,b){return a+b;},0) / nums.length;
    if (type === 'min') return Math.min.apply(null, nums);
    if (type === 'max') return Math.max.apply(null, nums);
    if (type === 'median') { var s = nums.slice().sort(function(a,b){return a-b;}); var m = Math.floor(s.length/2); return s.length%2===0 ? (s[m-1]+s[m])/2 : s[m]; }
    return nums.reduce(function(a,b){return a+b;},0); // sum/default
  }
  function formatNum(v) {
    if (v == null) return '—';
    if (!isFinite(v)) return String(v);
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function aggForVal(vf) {
    if (aggregations[vf]) return aggregations[vf];
    var hi = headers.indexOf(vf);
    return (hi > -1 && values[0] && typeof values[0][hi] === 'number') ? 'sum' : 'sum';
  }

  // Pre-compute column indices
  var rowIdx = rowFields.map(function(f){ return headers.indexOf(f); });
  var colIdx = colFields.map(function(f){ return headers.indexOf(f); });
  var valIdx = valFields.map(function(f){ return headers.indexOf(f); });

  // Discover unique column-dim combinations
  var colCombos = []; // {key, labels}
  var seenCols = {};
  if (colIdx.length) {
    values.forEach(function(row){
      var labels = colIdx.map(function(i){ return fmtH(row[i]); });
      var k = key(labels);
      if (!seenCols[k]) { seenCols[k] = 1; colCombos.push({ key: k, labels: labels }); }
    });
    colCombos.sort(function(a,b){ return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
  } else {
    colCombos.push({ key: '', labels: [] });
  }

  // Build column definitions
  var columns = []; // {key, columnHeaders, valueField, aggregation}
  colCombos.forEach(function(combo){
    valFields.forEach(function(vf){
      columns.push({
        key: combo.key ? combo.key + SEP + vf : vf,
        columnHeaders: combo.labels,
        valueField: vf,
        aggregation: aggForVal(vf),
      });
    });
  });

  // Bucket: rowKey → colKey → valueField → raw values[]
  var buckets = {};
  var rowOrder = [];
  var rowLabelsByKey = {};
  values.forEach(function(row){
    var rl = rowIdx.map(function(i){ return fmtH(row[i]); });
    var rk = key(rl);
    if (!buckets[rk]) { buckets[rk] = {}; rowOrder.push(rk); rowLabelsByKey[rk] = rl; }
    var cl = colIdx.map(function(i){ return fmtH(row[i]); });
    var ck = key(cl);
    if (!buckets[rk][ck]) buckets[rk][ck] = {};
    valFields.forEach(function(vf, vi){
      if (!buckets[rk][ck][vf]) buckets[rk][ck][vf] = [];
      buckets[rk][ck][vf].push(row[valIdx[vi]]);
    });
  });
  // Sort rows lexically by labels
  rowOrder.sort(function(a,b){
    var la = rowLabelsByKey[a]; var lb = rowLabelsByKey[b];
    for (var i=0; i<la.length; i++) { if (la[i] !== lb[i]) return la[i] < lb[i] ? -1 : 1; }
    return 0;
  });

  function buildLeafRow(rk) {
    var bm = buckets[rk] || {};
    var cells = {};
    var rowTotalRaw = {}; valFields.forEach(function(vf){ rowTotalRaw[vf] = []; });
    columns.forEach(function(col){
      var ck = col.columnHeaders.length ? key(col.columnHeaders) : '';
      var raw = (bm[ck] && bm[ck][col.valueField]) || [];
      cells[col.key] = aggregate(raw, col.aggregation);
      rowTotalRaw[col.valueField] = rowTotalRaw[col.valueField].concat(raw);
    });
    var rowTotals = {}; valFields.forEach(function(vf){ rowTotals[vf] = aggregate(rowTotalRaw[vf], aggForVal(vf)); });
    return { rowKey: rk, rowHeaders: rowLabelsByKey[rk], cells: cells, rowTotals: rowTotals, level: 0 };
  }
  var leafRows = rowOrder.map(buildLeafRow);

  function aggregateGroup(prefix, groupRows) {
    var cells = {}; var rowTotals = {};
    columns.forEach(function(col){
      var ck = col.columnHeaders.length ? key(col.columnHeaders) : '';
      var allRaw = [];
      groupRows.forEach(function(leaf){
        var bm = buckets[leaf.rowKey];
        var raw = (bm && bm[ck] && bm[ck][col.valueField]) || [];
        allRaw = allRaw.concat(raw);
      });
      cells[col.key] = aggregate(allRaw, col.aggregation);
    });
    valFields.forEach(function(vf){
      var allRaw = [];
      groupRows.forEach(function(leaf){
        var bm = buckets[leaf.rowKey] || {};
        Object.keys(bm).forEach(function(ck){ allRaw = allRaw.concat(bm[ck][vf] || []); });
      });
      rowTotals[vf] = aggregate(allRaw, aggForVal(vf));
    });
    var headers2 = prefix.slice();
    while (headers2.length < rowFields.length) headers2.push('');
    return { rowKey: '__group__'+key(prefix), rowHeaders: headers2, cells: cells, rowTotals: rowTotals, level: 0 };
  }

  // Insert subtotal rows
  var rendered = leafRows.slice();
  if (showSubtotals && rowFields.length >= 2) {
    rendered = [];
    for (var i=0; i<leafRows.length; i++) {
      rendered.push(leafRows[i]);
      for (var lvl = rowFields.length - 1; lvl >= 1; lvl--) {
        var isLast = (i === leafRows.length - 1) || (function(){
          var pa = leafRows[i].rowHeaders.slice(0, lvl);
          var pb = leafRows[i+1].rowHeaders.slice(0, lvl);
          for (var k=0; k<lvl; k++) if (pa[k] !== pb[k]) return true;
          return false;
        })();
        if (!isLast) continue;
        var prefix = leafRows[i].rowHeaders.slice(0, lvl);
        var grp = [];
        for (var j=i; j>=0; j--) {
          var match = true;
          for (var k=0; k<lvl; k++) if (prefix[k] !== leafRows[j].rowHeaders[k]) { match = false; break; }
          if (!match) break;
          grp.unshift(leafRows[j]);
        }
        var sub = aggregateGroup(prefix, grp);
        sub.level = rowFields.length - lvl;
        sub.isSubtotal = true;
        rendered.push(sub);
      }
    }
  }

  // Grand total row
  var grandTotalRow = null;
  if (showRowTotals) {
    grandTotalRow = aggregateGroup([], leafRows);
    grandTotalRow.isGrandTotal = true;
    grandTotalRow.rowHeaders = ['Grand Total'];
    while (grandTotalRow.rowHeaders.length < rowFields.length) grandTotalRow.rowHeaders.push('');
  }

  // Group columns into column-dimension combinations for pagination
  var combos = []; var comboMap = {};
  columns.forEach(function(c){
    var ck = c.columnHeaders.join(SEP);
    if (!comboMap[ck]) { comboMap[ck] = { headers: c.columnHeaders, cols: [] }; combos.push(comboMap[ck]); }
    comboMap[ck].cols.push(c);
  });
  var paginationEnabled = colFields.length > 0 && combos.length > 0;
  pivotPages[vizId] = pivotPages[vizId] || { page: 0, pageSize: 10 };
  var pState = pivotPages[vizId];
  var totalPages = paginationEnabled ? Math.max(1, Math.ceil(combos.length / pState.pageSize)) : 1;
  if (pState.page >= totalPages) pState.page = 0;
  var visibleColumns = paginationEnabled
    ? combos.slice(pState.page * pState.pageSize, (pState.page + 1) * pState.pageSize).reduce(function(acc, c){ return acc.concat(c.cols); }, [])
    : columns;

  // Build header rows from visible columns
  var headerRows = [];
  if (colFields.length) {
    for (var lvl = 0; lvl < colFields.length; lvl++) {
      var rowH = []; var i = 0;
      while (i < visibleColumns.length) {
        var label = visibleColumns[i].columnHeaders[lvl] || '';
        var span = 1;
        while (i + span < visibleColumns.length && visibleColumns[i+span].columnHeaders[lvl] === label) {
          var sharedPrefix = true;
          for (var p = 0; p < lvl; p++) {
            if (visibleColumns[i+span].columnHeaders[p] !== visibleColumns[i].columnHeaders[p]) { sharedPrefix = false; break; }
          }
          if (!sharedPrefix) break;
          span++;
        }
        rowH.push({ label: label, colSpan: span });
        i += span;
      }
      headerRows.push(rowH);
    }
  }
  // Value-name row
  headerRows.push(visibleColumns.map(function(c){ return { label: c.valueField, colSpan: 1 }; }));

  // Render
  var wrap = document.createElement('div'); wrap.className = 'scroll';
  var table = document.createElement('table');
  table.style.width = fitWidth ? '100%' : 'auto';
  var thead = document.createElement('thead');
  headerRows.forEach(function(cells, ri){
    var tr = document.createElement('tr');
    if (ri === 0 && rowFields.length) {
      var th = document.createElement('th');
      th.colSpan = Math.max(1, rowFields.length);
      th.rowSpan = headerRows.length;
      th.textContent = rowFields.join(' / ');
      tr.appendChild(th);
    }
    cells.forEach(function(c){ var th = document.createElement('th'); th.colSpan = c.colSpan; th.textContent = c.label; tr.appendChild(th); });
    if (showColumnTotals && ri === 0) {
      var tt = document.createElement('th');
      tt.colSpan = valFields.length;
      tt.rowSpan = Math.max(1, headerRows.length - 1);
      tt.textContent = 'Total';
      tt.style.cssText = 'background:#f1f5f9;border-left:2px solid #cbd5e1';
      tr.appendChild(tt);
    }
    if (showColumnTotals && ri === headerRows.length - 1) {
      valFields.forEach(function(vf){ var th = document.createElement('th'); th.textContent = vf; th.style.cssText = 'background:#f1f5f9'; tr.appendChild(th); });
    }
    thead.appendChild(tr);
  });
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  function renderDataRow(row, isGT) {
    var tr = document.createElement('tr');
    if (isGT) tr.style.cssText = 'background:#f1f5f9;border-top:2px solid #cbd5e1;font-weight:700';
    else if (row.isSubtotal) tr.style.cssText = 'background:#f8fafc;font-weight:600';
    if (rowFields.length) {
      row.rowHeaders.forEach(function(label){ var td = document.createElement('td'); td.textContent = label; tr.appendChild(td); });
    }
    visibleColumns.forEach(function(col){
      var td = document.createElement('td');
      td.style.textAlign = 'right';
      var v = row.cells[col.key];
      td.textContent = (v == null) ? '—' : formatNum(v);
      tr.appendChild(td);
    });
    if (showColumnTotals) {
      valFields.forEach(function(vf){
        var td = document.createElement('td');
        td.style.cssText = 'text-align:right;background:#f1f5f9;border-left:2px solid #cbd5e1;font-weight:600';
        var v = row.rowTotals[vf];
        td.textContent = (v == null) ? '—' : formatNum(v);
        tr.appendChild(td);
      });
    }
    return tr;
  }
  rendered.forEach(function(row){ tbody.appendChild(renderDataRow(row, false)); });
  if (grandTotalRow) tbody.appendChild(renderDataRow(grandTotalRow, true));
  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);

  // Pagination footer (only when paginating column groups)
  if (paginationEnabled) {
    var bar = document.createElement('div'); bar.className = 'table-pagination';
    var info = document.createElement('span');
    info.style.cssText = 'font-size:.75rem;color:#94a3b8';
    var startN = pState.page * pState.pageSize + 1;
    var endN = Math.min((pState.page + 1) * pState.pageSize, combos.length);
    info.textContent = startN + '–' + endN + ' of ' + combos.length + ' column groups';
    var prev = document.createElement('button');
    prev.className = 'page-btn'; prev.textContent = '‹';
    prev.disabled = pState.page === 0;
    prev.onclick = function(){ pState.page--; renderPivot(container, headers, values, vizId, config); };
    var pageLabel = document.createElement('span');
    pageLabel.style.cssText = 'font-size:.75rem;color:#475569;padding:0 6px';
    pageLabel.textContent = (pState.page + 1) + ' / ' + totalPages;
    var next = document.createElement('button');
    next.className = 'page-btn'; next.textContent = '›';
    next.disabled = pState.page >= totalPages - 1;
    next.onclick = function(){ pState.page++; renderPivot(container, headers, values, vizId, config); };
    var right = document.createElement('div');
    right.style.cssText = 'display:flex;align-items:center;gap:6px';
    right.appendChild(info); right.appendChild(prev); right.appendChild(pageLabel); right.appendChild(next);
    bar.appendChild(document.createElement('div'));
    bar.appendChild(right);
    container.appendChild(bar);
  }
}

// ── Table with pagination + CSV export ────────────────────────────────────────
var tablePages = {}; // vizId → { page, pageSize }
var pivotPages = {}; // vizId → { page, pageSize } — for pivot column-group pagination

function renderTable(container, headers, values, vizId, isPivot) {
  var state = tablePages[vizId] = tablePages[vizId] || { page: 0, pageSize: 50 };
  container.innerHTML = '';
  var data = values;
  if (isPivot) {
    // Group by first col, sum numeric cols
    var xCol = 0;
    var grouped = {};
    var order = [];
    values.forEach(function(row){
      var key = String(row[xCol]);
      if (!grouped[key]) { grouped[key] = {}; grouped[key][headers[0]] = key; order.push(key); headers.slice(1).forEach(function(_,i){ grouped[key][headers[i+1]] = 0; }); }
      headers.slice(1).forEach(function(_,i){ grouped[key][headers[i+1]] += parseFloat(row[i+1]) || 0; });
    });
    data = order.map(function(k){ return headers.map(function(h){ return grouped[k][h]; }); });
  }
  var totalRows = data.length;
  var ps = state.pageSize;
  var start = state.page * ps;
  var pageData = data.slice(start, start + ps);
  var totalPages = Math.max(1, Math.ceil(totalRows / ps));
  if (state.page >= totalPages) { state.page = totalPages - 1; start = state.page * ps; pageData = data.slice(start, start+ps); }
  // Table
  var wrap = document.createElement('div'); wrap.className = 'scroll';
  var table = document.createElement('table');
  var thead = document.createElement('thead'); var hr = document.createElement('tr');
  headers.forEach(function(h,i){ var th = document.createElement('th'); th.textContent = isPivot && i>0 ? h+' (Σ)' : h; hr.appendChild(th); });
  thead.appendChild(hr); table.appendChild(thead);
  var tbody = document.createElement('tbody');
  pageData.forEach(function(row){
    var tr = document.createElement('tr');
    row.forEach(function(cell){ var td = document.createElement('td'); td.textContent = cell != null ? (typeof cell==='number'?cell.toLocaleString():String(cell)) : ''; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); wrap.appendChild(table); container.appendChild(wrap);
  // Pagination bar
  var bar = document.createElement('div'); bar.className = 'table-pagination';
  // Left: rows per page + count
  var left = document.createElement('div'); left.style.cssText = 'display:flex;align-items:center;gap:8px';
  var psLbl = document.createElement('span'); psLbl.style.cssText = 'font-size:.75rem;color:#64748b'; psLbl.textContent = 'Rows:';
  var psInp = document.createElement('input'); psInp.type='text'; psInp.inputMode='numeric'; psInp.className='page-size-input';
  psInp.value = String(ps);
  psInp.oninput = function(){
    var raw = psInp.value.replace(/[^0-9]/g,'');
    psInp.value = raw; // strip non-digits live
    var n = parseInt(raw);
    if (n > 0) { state.pageSize = n; state.page = 0; renderTable(container, headers, values, vizId, isPivot); }
  };
  psInp.onblur = function(){
    if (!psInp.value || parseInt(psInp.value) <= 0) { psInp.value = '50'; state.pageSize = 50; state.page = 0; renderTable(container, headers, values, vizId, isPivot); }
  };
  var countLbl = document.createElement('span'); countLbl.style.cssText = 'font-size:.75rem;color:#94a3b8';
  countLbl.textContent = (start+1)+'–'+Math.min(start+ps,totalRows)+' of '+totalRows;
  left.appendChild(psLbl); left.appendChild(psInp); left.appendChild(countLbl);
  // Right: nav + CSV
  var right = document.createElement('div'); right.style.cssText = 'display:flex;align-items:center;gap:6px';
  var prevBtn = document.createElement('button'); prevBtn.className='page-btn'; prevBtn.innerHTML='&#8592;'; prevBtn.disabled=state.page===0;
  prevBtn.onclick=function(){ state.page--; renderTable(container,headers,values,vizId,isPivot); };
  var pageSpan = document.createElement('span'); pageSpan.style.cssText='font-size:.75rem;color:#64748b;tabular-nums';
  pageSpan.textContent = (state.page+1)+' / '+totalPages;
  var nextBtn = document.createElement('button'); nextBtn.className='page-btn'; nextBtn.innerHTML='&#8594;'; nextBtn.disabled=state.page>=totalPages-1;
  nextBtn.onclick=function(){ state.page++; renderTable(container,headers,values,vizId,isPivot); };
  var csvBtn = document.createElement('button'); csvBtn.className='csv-btn'; csvBtn.textContent='↓ CSV';
  csvBtn.title='Download as CSV'; csvBtn.onclick=function(){ exportTableCsv(headers, data, vizId); };
  right.appendChild(prevBtn); right.appendChild(pageSpan); right.appendChild(nextBtn); right.appendChild(csvBtn);
  bar.appendChild(left); bar.appendChild(right);
  container.appendChild(bar);
}

function exportTableCsv(headers, rows, vizId) {
  var esc = function(v){ var s=v!=null?String(v):''; return (s.indexOf(',')>-1||s.indexOf('"')>-1||s.indexOf('\\n')>-1)?'"'+s.replace(/"/g,'\\"')+'"':s; };
  var csv = [headers.map(esc).join(',')].concat(rows.map(function(r){ return r.map(esc).join(','); })).join('\\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = (vizId||'export')+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Edit mode ─────────────────────────────────────────────────────────────────
function enterEdit() {
  editDraftSheets = JSON.parse(JSON.stringify(CONFIG.sheets));
  editActiveSheetIdx = 0;
  document.getElementById('edit-name').value = CONFIG.name || '';
  document.getElementById('edit-desc').value = CONFIG.description || '';
  populateEditSheet(0);
  renderEditSheetTabs();
  loadDatabasesForEdit();
  document.getElementById('app-view').style.display = 'none';
  document.getElementById('app-edit').style.display = 'block';
  document.getElementById('save-status').textContent = '';
  document.getElementById('save-status').className = 'save-status';
  document.getElementById('test-out').style.display = 'none';
}

function populateEditSheet(idx) {
  editActiveSheetIdx = idx;
  var sheet = editDraftSheets[idx];
  editDraftVizs = sheet.visualizations;
  editDraftLayout = sheet.layout;
  var sel = document.getElementById('edit-viz-select');
  sel.innerHTML = '';
  editDraftVizs.forEach(function(v, i){
    var opt = document.createElement('option'); opt.value = v.id; opt.textContent = v.title || ('Viz '+(i+1)); sel.appendChild(opt);
  });
  editVizId = editDraftVizs[0] ? editDraftVizs[0].id : null;
  if (editVizId) populateVizEdit(editVizId);
  renderLayoutEditor();
  document.getElementById('test-out').style.display = 'none';
}

function renderEditSheetTabs() {
  var card = document.getElementById('edit-sheet-card');
  var container = document.getElementById('edit-sheet-tabs');
  if (!card || !container) return;
  card.style.display = 'block';
  container.innerHTML = '';
  editDraftSheets.forEach(function(sheet, idx) {
    var isActive = idx === editActiveSheetIdx;
    var tabColor = sheet.color || '#3b82f6';
    var tab = document.createElement('div');
    tab.className = 'edit-sheet-tab' + (isActive ? ' active' : '');
    tab.style.cssText = 'display:flex;align-items:center;gap:6px';
    tab.style.borderTopColor = isActive ? tabColor : 'transparent';

    // Color picker swatch
    var colorInput = document.createElement('input');
    colorInput.type = 'color'; colorInput.value = tabColor;
    colorInput.style.cssText = 'width:14px;height:14px;padding:0;border:none;border-radius:50%;cursor:pointer;flex-shrink:0;background:none;outline:none';
    colorInput.title = 'Tab color';
    colorInput.onclick = function(e){ e.stopPropagation(); };
    colorInput.onchange = (function(i){ return function(e){ e.stopPropagation(); editDraftSheets[i].color = e.target.value; renderEditSheetTabs(); }; })(idx);
    tab.appendChild(colorInput);

    var nameSpan = document.createElement('span'); nameSpan.textContent = sheet.name;
    tab.appendChild(nameSpan);
    if (editDraftSheets.length > 1) {
      var delBtn = document.createElement('button');
      delBtn.style.cssText = 'background:none;border:none;cursor:pointer;color:#94a3b8;padding:0 2px;font-size:.9rem;line-height:1';
      delBtn.title = 'Delete sheet'; delBtn.textContent = '×';
      delBtn.onclick = (function(i){ return function(e){ e.stopPropagation(); deleteSheet(i); }; })(idx);
      tab.appendChild(delBtn);
    }
    tab.onclick = (function(i){ return function(){ switchEditSheet(i); }; })(idx);
    container.appendChild(tab);
  });
  // "+" button to add a new sheet
  var addTab = document.createElement('div');
  addTab.style.cssText = 'display:flex;align-items:center;padding:8px 14px;cursor:pointer;color:#64748b;font-size:1rem;border-right:1px solid #e2e8f0;transition:background .15s';
  addTab.title = 'Add new sheet'; addTab.textContent = '+';
  addTab.onmouseenter = function(){ addTab.style.background='#f1f5f9'; };
  addTab.onmouseleave = function(){ addTab.style.background=''; };
  addTab.onclick = function(){ addSheet(); };
  container.appendChild(addTab);
}

function switchEditSheet(idx) {
  if (idx === editActiveSheetIdx) return;
  saveCurrentVizToDraft();
  // Flush layout ref back to sheet before switching
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  populateEditSheet(idx);
  renderEditSheetTabs();
}

function cancelEdit() {
  document.getElementById('app-edit').style.display = 'none';
  document.getElementById('app-view').style.display = 'flex';
}

function selectViz(v) {
  editVizType = v;
  document.querySelectorAll('.viz-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.viz === v); });
}

function populateVizEdit(vizId) {
  var viz = editDraftVizs.find(function(v){ return v.id === vizId; });
  if (!viz) return;
  editVizId = vizId;
  document.getElementById('edit-viz-title').value = viz.title || '';
  document.getElementById('edit-query').value = viz.query || '';
  selectViz(viz.visualizationType || 'table');
  renderEditParams(viz.parameters || []);
  document.getElementById('test-out').style.display = 'none';
  // Set database selector
  var dbSel = document.getElementById('edit-db');
  for (var i = 0; i < dbSel.options.length; i++) {
    if (dbSel.options[i].value === viz.databaseId) { dbSel.selectedIndex = i; break; }
  }
  updateLayoutStatusUI();
  // Show/hide delete button (can't delete last viz)
  var delBtn = document.getElementById('del-viz-btn');
  if (delBtn) delBtn.style.display = editDraftVizs.length > 1 ? '' : 'none';
}

function switchViz() {
  saveCurrentVizToDraft();
  var sel = document.getElementById('edit-viz-select');
  editVizId = sel.value;
  populateVizEdit(editVizId);
}

function saveCurrentVizToDraft() {
  if (!editVizId) return;
  var idx = editDraftVizs.findIndex(function(v){ return v.id === editVizId; });
  if (idx < 0) return;
  var dbSel = document.getElementById('edit-db');
  var selOpt = dbSel.options[dbSel.selectedIndex];
  editDraftVizs[idx] = Object.assign({}, editDraftVizs[idx], {
    title: document.getElementById('edit-viz-title').value.trim(),
    databaseId: dbSel.value || editDraftVizs[idx].databaseId,
    databaseName: (selOpt && selOpt.textContent) || editDraftVizs[idx].databaseName,
    query: document.getElementById('edit-query').value,
    visualizationType: editVizType,
    parameters: collectParams()
  });
  // Update selector label
  var optEl = document.getElementById('edit-viz-select').querySelector('option[value="' + editVizId + '"]');
  if (optEl && editDraftVizs[idx].title) optEl.textContent = editDraftVizs[idx].title;
  // Sync back to sheet (editDraftVizs is a reference but element replacement needs explicit sync)
  editDraftSheets[editActiveSheetIdx].visualizations = editDraftVizs;
}

// ── Visualization CRUD ────────────────────────────────────────────────────────
function addVisualization() {
  saveCurrentVizToDraft();
  var newViz = { id: 'viz-'+Date.now(), title: 'New Visualization', databaseId: '', databaseName: '', query: '', parameters: [], visualizationType: 'table' };
  editDraftVizs.push(newViz);
  editDraftSheets[editActiveSheetIdx].visualizations = editDraftVizs;
  var sel = document.getElementById('edit-viz-select');
  var opt = document.createElement('option'); opt.value = newViz.id; opt.textContent = newViz.title; sel.appendChild(opt);
  sel.value = newViz.id;
  editVizId = newViz.id;
  populateVizEdit(newViz.id);
}

function deleteVisualization() {
  if (editDraftVizs.length <= 1) { alert('Cannot delete the last visualization.'); return; }
  if (!confirm('Delete this visualization?')) return;
  var deletedId = editVizId;
  var idx = editDraftVizs.findIndex(function(v){ return v.id === deletedId; });
  if (idx < 0) return;
  editDraftVizs.splice(idx, 1);
  editDraftLayout = editDraftLayout.filter(function(l){ return l.vizId !== deletedId; }).map(function(l,i){ return Object.assign({},l,{order:i}); });
  editDraftSheets[editActiveSheetIdx].visualizations = editDraftVizs;
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  var sel = document.getElementById('edit-viz-select');
  sel.innerHTML = '';
  editDraftVizs.forEach(function(v,i){ var opt=document.createElement('option'); opt.value=v.id; opt.textContent=v.title||('Viz '+(i+1)); sel.appendChild(opt); });
  editVizId = editDraftVizs[0] ? editDraftVizs[0].id : null;
  if (editVizId) { sel.value = editVizId; populateVizEdit(editVizId); }
  renderLayoutEditor();
}

// ── Layout membership ─────────────────────────────────────────────────────────
function updateLayoutStatusUI() {
  var row = document.getElementById('layout-status-row');
  if (!row || !editVizId) return;
  var inLayout = editDraftLayout.some(function(l){ return l.vizId === editVizId; });
  row.innerHTML = inLayout
    ? '<span class="in-layout-badge">✓ In Layout</span>'
    : '<button class="add-to-layout-btn" onclick="addVizToLayoutById(editVizId)">+ Add to Layout</button>';
}

function addVizToLayoutById(vizId) {
  if (editDraftLayout.some(function(l){ return l.vizId === vizId; })) return;
  editDraftLayout.push({ vizId: vizId, colSpan: 12, order: editDraftLayout.length });
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  if (vizId === editVizId) updateLayoutStatusUI();
  renderLayoutEditor();
}

function removeVizFromLayoutById(vizId) {
  editDraftLayout = editDraftLayout.filter(function(l){ return l.vizId !== vizId; }).map(function(l,i){ return Object.assign({},l,{order:i}); });
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  if (vizId === editVizId) updateLayoutStatusUI();
  renderLayoutEditor();
}

// ── Sheet CRUD (edit mode) ────────────────────────────────────────────────────
function addSheet() {
  saveCurrentVizToDraft();
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  var newViz = { id: 'viz-'+Date.now(), title: 'New Visualization', databaseId: '', databaseName: '', query: '', parameters: [], visualizationType: 'table' };
  var newSheet = { id: 'sheet-'+Date.now(), name: 'Sheet '+(editDraftSheets.length+1), visualizations: [newViz], layout: [] };
  editDraftSheets.push(newSheet);
  populateEditSheet(editDraftSheets.length - 1);
  renderEditSheetTabs();
}

function deleteSheet(idx) {
  if (editDraftSheets.length <= 1) { alert('Cannot delete the last sheet.'); return; }
  if (!confirm('Delete sheet "'+editDraftSheets[idx].name+'"?')) return;
  editDraftSheets.splice(idx, 1);
  var newIdx = idx === editActiveSheetIdx
    ? Math.min(idx, editDraftSheets.length - 1)
    : idx < editActiveSheetIdx ? editActiveSheetIdx - 1 : editActiveSheetIdx;
  populateEditSheet(newIdx);
  renderEditSheetTabs();
}

// ── Parameters ────────────────────────────────────────────────────────────────
function collectParams() {
  var rows = document.querySelectorAll('#edit-params-list .param-row-item');
  var result = [];
  rows.forEach(function(row){
    var name = row.querySelector('.inp-name').value.trim().replace(/\\s+/g,'_');
    result.push({ id: row.dataset.paramId || ('p'+Date.now()), name: name, label: row.querySelector('.inp-label').value.trim(), defaultValue: row.querySelector('.inp-default').value });
  });
  return result;
}

function renderEditParams(source) {
  var list = document.getElementById('edit-params-list');
  list.innerHTML = '';
  source.forEach(function(p){
    var row = document.createElement('div'); row.className = 'param-row param-row-item'; row.dataset.paramId = p.id;
    row.style.gridTemplateColumns = '1fr 1fr 1fr auto auto';
    row.innerHTML = '<input class="inp-name mono" placeholder="var_name" value="' + esc(p.name||'') + '" style="width:100%"/>'
      + '<input class="inp-label" placeholder="Label" value="' + esc(p.label||'') + '" style="width:100%"/>'
      + '<input class="inp-default" placeholder="Default value" value="' + esc(p.defaultValue||'') + '" style="width:100%"/>'
      + '<button title="Insert {{name}} at cursor in query" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:4px;cursor:pointer;padding:4px 7px;font-size:.75rem;font-family:ui-monospace,monospace;white-space:nowrap" onclick="insertParamFromRow(this)">{{}}</button>'
      + '<button class="btn-trash" onclick="removeParam(this)">\u2715</button>';
    list.appendChild(row);
  });
}

function addParam() {
  var ps = collectParams(); ps.push({ id: 'p'+Date.now(), name:'', label:'', defaultValue:'' }); renderEditParams(ps);
  var rows = document.querySelectorAll('#edit-params-list .param-row-item'); if(rows.length) rows[rows.length-1].querySelector('.inp-name').focus();
}

function removeParam(btn) {
  btn.closest('.param-row-item').remove();
}

function insertParamToQuery(name) {
  var ta = document.getElementById('edit-query');
  if (!ta || !name) return;
  var snippet = '{{' + name + '}}';
  var start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
  var end   = ta.selectionEnd   != null ? ta.selectionEnd   : ta.value.length;
  ta.value = ta.value.slice(0, start) + snippet + ta.value.slice(end);
  ta.focus();
  ta.setSelectionRange(start + snippet.length, start + snippet.length);
}

function insertParamFromRow(btn) {
  var row = btn.closest('.param-row-item');
  var name = row ? row.querySelector('.inp-name').value.trim() : '';
  if (name) insertParamToQuery(name);
}

// ── Load databases ────────────────────────────────────────────────────────────
async function loadDatabasesForEdit() {
  var sel = document.getElementById('edit-db');
  sel.innerHTML = '<option value="">Loading\u2026</option>';
  try {
    var dbs = await runPixel('MyEngines(engineTypes=[\\'DATABASE\\'], sort=[{"ENGINENAME":"ASC"}], limit=[1000], offset=[0]);');
    sel.innerHTML = '';
    if (!Array.isArray(dbs) || !dbs.length) { sel.innerHTML = '<option value="">No databases available</option>'; return; }
    dbs.forEach(function(db){
      var id = db.app_id || db.engine_id;
      var name = db.engine_display_name || db.engine_name || db.app_name || id;
      var opt = document.createElement('option'); opt.value = id; opt.textContent = name; sel.appendChild(opt);
    });
    // Re-select current viz's db
    if (editVizId) {
      var viz = editDraftVizs.find(function(v){ return v.id === editVizId; });
      if (viz && viz.databaseId) { for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===viz.databaseId){sel.selectedIndex=i;break;} } }
    }
  } catch (e) { sel.innerHTML = '<option value="">Error loading databases</option>'; }
}

// ── Test query ────────────────────────────────────────────────────────────────
async function testEditQuery() {
  var btn = document.getElementById('test-btn');
  var outDiv = document.getElementById('test-out');
  var dbId = document.getElementById('edit-db').value;
  var q = document.getElementById('edit-query').value.trim();
  if (!dbId || !q) { outDiv.style.display = 'block'; outDiv.textContent = 'Select a database and enter a query.'; return; }
  btn.disabled = true; btn.textContent = 'Running\u2026'; outDiv.style.display = 'none';
  try {
    var ps = collectParams();
    ps.forEach(function(p){ if(p.name) q = q.split('{{'+p.name+'}}').join(p.defaultValue||''); });
    var safeQ = q.replace(/\\\\/g,'\\\\\\\\').replace(/"/g,'\\\\"');
    var out = await runPixel('Database(database=["'+dbId+'"]) | Query("'+safeQ+'") | Collect(10);');
    var headers = (out&&out.data&&out.data.headers)||(out&&out.headers)||[];
    var values  = (out&&out.data&&out.data.values) ||(out&&out.values) ||(out&&out.data)||[];
    outDiv.innerHTML = ''; outDiv.style.display = 'block';
    if (!Array.isArray(values)||!values.length) { outDiv.textContent = 'No results.'; return; }
    var table = document.createElement('table');
    var tr = document.createElement('tr'); headers.forEach(function(h){ var th=document.createElement('th'); th.textContent=h; tr.appendChild(th); });
    table.appendChild(tr);
    values.slice(0,8).forEach(function(row){ var tr2=document.createElement('tr'); row.forEach(function(c){ var td=document.createElement('td'); td.textContent=String(c??''); tr2.appendChild(td); }); table.appendChild(tr2); });
    outDiv.appendChild(table);
  } catch(e) { outDiv.style.display='block'; outDiv.textContent='Error: '+e.message; }
  finally { btn.disabled=false; btn.textContent='\u25b6 Test'; }
}

// ── Layout editor ─────────────────────────────────────────────────────────────
function renderLayoutEditor() {
  var sorted = editDraftLayout.slice().sort(function(a,b){ return a.order-b.order; });
  var container = document.getElementById('layout-items');
  container.innerHTML = '';

  // ── In-layout rows (draggable) ──
  sorted.forEach(function(item, idx){
    var viz = editDraftVizs.find(function(v){ return v.id === item.vizId; });
    if (!viz) return;
    var row = document.createElement('div');
    row.className = 'layout-row';
    row.setAttribute('draggable', 'true');
    row.dataset.vizId = item.vizId;

    // Grip handle
    var grip = document.createElement('span');
    grip.className = 'grip'; grip.textContent = '⋮⋮';
    row.appendChild(grip);

    // Title
    var titleSpan = document.createElement('span');
    titleSpan.className = 'layout-row-title'; titleSpan.textContent = viz.title || 'Untitled';
    row.appendChild(titleSpan);

    // Type badge
    var badge = document.createElement('span');
    badge.style.cssText = 'font-size:.75rem;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;flex-shrink:0';
    badge.textContent = viz.visualizationType;
    row.appendChild(badge);

    // Width buttons
    var wg = document.createElement('div'); wg.style.cssText = 'display:flex;gap:4px';
    [[3,'25%'],[4,'33%'],[6,'50%'],[12,'100%']].forEach(function(o){
      var btn = document.createElement('button');
      btn.className = 'span-btn'+(item.colSpan===o[0]?' active':'');
      btn.style.cssText = 'padding:3px 7px;font-size:.7rem';
      btn.textContent = o[1];
      btn.onclick = (function(vId,cs){ return function(e){ e.stopPropagation(); setColSpan(vId,cs); }; })(item.vizId, o[0]);
      wg.appendChild(btn);
    });
    row.appendChild(wg);

    // Height input
    var hg = document.createElement('div'); hg.style.cssText = 'display:flex;align-items:center;gap:3px;flex-shrink:0';
    var hLbl = document.createElement('span'); hLbl.style.cssText = 'font-size:.7rem;color:#64748b'; hLbl.textContent = 'H:';
    var hInp = document.createElement('input');
    hInp.type = 'text'; hInp.inputMode = 'numeric';
    hInp.value = String(item.heightPx || 420);
    hInp.style.cssText = 'width:58px;padding:2px 5px;font-size:.75rem;border:1px solid #cbd5e1;border-radius:4px';
    hInp.title = 'Card height in pixels';
    hInp.onclick = function(e){ e.stopPropagation(); };
    hInp.onchange = (function(vId){ return function(e){ e.stopPropagation(); setLayoutItemHeight(vId, parseInt(e.target.value)||420); }; })(item.vizId);
    var hUnt = document.createElement('span'); hUnt.style.cssText = 'font-size:.7rem;color:#64748b'; hUnt.textContent = 'px';
    hg.appendChild(hLbl); hg.appendChild(hInp); hg.appendChild(hUnt);
    row.appendChild(hg);

    // Up / Down
    var upBtn = document.createElement('button'); upBtn.className = 'move-btn'; upBtn.innerHTML = '&#8593;'; upBtn.disabled = idx===0;
    upBtn.onclick = (function(vId){ return function(e){ e.stopPropagation(); moveLayout(vId,'up'); }; })(item.vizId);
    var downBtn = document.createElement('button'); downBtn.className = 'move-btn'; downBtn.innerHTML = '&#8595;'; downBtn.disabled = idx===sorted.length-1;
    downBtn.onclick = (function(vId){ return function(e){ e.stopPropagation(); moveLayout(vId,'down'); }; })(item.vizId);
    row.appendChild(upBtn); row.appendChild(downBtn);

    // Remove from layout
    var remBtn = document.createElement('button'); remBtn.className = 'btn-trash'; remBtn.title = 'Remove from layout'; remBtn.textContent = '✕';
    remBtn.onclick = (function(vId){ return function(e){ e.stopPropagation(); removeVizFromLayoutById(vId); }; })(item.vizId);
    row.appendChild(remBtn);

    // ── Drag events ──
    row.addEventListener('dragstart', function(e){
      e.dataTransfer.setData('text/plain', item.vizId);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function(){ row.classList.add('dragging'); }, 0);
    });
    row.addEventListener('dragend', function(){
      row.classList.remove('dragging');
      document.querySelectorAll('#layout-items .layout-row').forEach(function(r){ r.classList.remove('drag-over'); });
    });
    row.addEventListener('dragover', function(e){
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('#layout-items .layout-row').forEach(function(r){ r.classList.remove('drag-over'); });
      row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', function(){ row.classList.remove('drag-over'); });
    row.addEventListener('drop', function(e){
      e.preventDefault(); row.classList.remove('drag-over');
      var fromId = e.dataTransfer.getData('text/plain');
      var toId = item.vizId;
      if (fromId === toId) return;
      var s2 = editDraftLayout.slice().sort(function(a,b){ return a.order-b.order; });
      var ai = s2.findIndex(function(l){ return l.vizId===fromId; });
      var bi = s2.findIndex(function(l){ return l.vizId===toId; });
      if (ai<0||bi<0) return;
      var moved = s2.splice(ai,1)[0]; s2.splice(bi,0,moved);
      editDraftLayout = s2.map(function(l,i){ return Object.assign({},l,{order:i}); });
      editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
      renderLayoutEditor();
    });

    container.appendChild(row);
  });

  // ── Not-in-layout vizs ──
  var notInLayout = editDraftVizs.filter(function(v){ return !editDraftLayout.some(function(l){ return l.vizId===v.id; }); });
  if (notInLayout.length) {
    var hdr = document.createElement('p');
    hdr.style.cssText = 'font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin:14px 0 6px';
    hdr.textContent = 'Not in Layout';
    container.appendChild(hdr);
    notInLayout.forEach(function(viz){
      var row2 = document.createElement('div'); row2.className = 'layout-row'; row2.style.background = '#fafafa';
      var t2 = document.createElement('span'); t2.className = 'layout-row-title'; t2.style.color = '#94a3b8'; t2.textContent = viz.title||'Untitled';
      var addBtn = document.createElement('button');
      addBtn.style.cssText = 'background:#16a34a;color:#fff;border:none;padding:4px 12px;border-radius:6px;font-size:.75rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0';
      addBtn.textContent = '+ Add to Layout';
      addBtn.onclick = (function(vId){ return function(){ addVizToLayoutById(vId); }; })(viz.id);
      row2.appendChild(t2); row2.appendChild(addBtn);
      container.appendChild(row2);
    });
  }

  // ── Grid preview ──
  var prev = document.getElementById('layout-preview');
  prev.innerHTML = '';
  sorted.forEach(function(item2){
    var viz2 = editDraftVizs.find(function(v){ return v.id===item2.vizId; });
    if (!viz2) return;
    var colLabel = item2.colSpan===3?'25%':item2.colSpan===4?'33%':item2.colSpan===6?'50%':'100%';
    var heightLabel = (item2.heightPx||420)+'px';
    var d = document.createElement('div'); d.className = 'preview-item'; d.style.gridColumn = 'span '+item2.colSpan;
    if (item2.heightPx) d.style.minHeight = Math.min(item2.heightPx, 80)+'px';
    d.innerHTML = '<p>'+esc(viz2.title||'Untitled')+'</p><small>'+colLabel+' × '+heightLabel+'</small>';
    prev.appendChild(d);
  });
}

function setColSpan(vizId, colSpan) {
  var item = editDraftLayout.find(function(l){ return l.vizId===vizId; });
  if (item) item.colSpan = colSpan;
  renderLayoutEditor();
}

function setLayoutItemHeight(vizId, h) {
  var item = editDraftLayout.find(function(l){ return l.vizId===vizId; });
  if (item) item.heightPx = h;
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
}

function moveLayout(vizId, direction) {
  var sorted = editDraftLayout.slice().sort(function(a,b){ return a.order-b.order; });
  var idx = sorted.findIndex(function(l){ return l.vizId===vizId; });
  var swapIdx = direction==='up' ? idx-1 : idx+1;
  if (swapIdx<0||swapIdx>=sorted.length) return;
  var tmp=sorted[idx]; sorted[idx]=sorted[swapIdx]; sorted[swapIdx]=tmp;
  editDraftLayout = sorted.map(function(l,i){ return Object.assign({},l,{order:i}); });
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  renderLayoutEditor();
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function saveEdit() {
  saveCurrentVizToDraft();
  // Flush current sheet's layout back (in case moveLayout reassigned the array)
  editDraftSheets[editActiveSheetIdx].layout = editDraftLayout;
  editDraftSheets[editActiveSheetIdx].visualizations = editDraftVizs;
  var btns = [document.getElementById('save-btn'), document.getElementById('save-btn2')];
  var status = document.getElementById('save-status');
  btns.forEach(function(b){ if(b){b.disabled=true;b.textContent='Saving\u2026';} });
  status.textContent = ''; status.className = 'save-status';
  try {
    var newConfig = Object.assign({}, CONFIG, {
      name: document.getElementById('edit-name').value.trim() || CONFIG.name,
      description: document.getElementById('edit-desc').value.trim(),
      sheets: editDraftSheets,
      updatedAt: new Date().toISOString()
    });
    var projectId = CONFIG.projectId;
    status.textContent = 'Preparing\u2026';
    try { await runPixel('DeleteAsset(filePath=["version/assets/portals/dashboard.json"], space=["'+escPixel(projectId)+'"]);'); } catch(e) {}
    var csrf = await getCsrf();
    var dashFile = new File([JSON.stringify(newConfig, null, 2)], 'dashboard.json', { type: 'application/json' });
    var fd = new FormData(); fd.append('file', dashFile);
    var uploadHdrs = {}; if (csrf) uploadHdrs['X-CSRF-Token'] = csrf;
    var uploadUrl = '/Monolith/api/uploadFile/projectAssetsUpload'
      + '?insightId=' + encodeURIComponent(INSIGHT_ID||'')
      + '&projectId=' + encodeURIComponent(projectId)
      + '&path=' + encodeURIComponent('portals/');
    var uploadResp = await fetch(uploadUrl, { method:'POST', headers:uploadHdrs, credentials:'include', body:fd });
    if (!uploadResp.ok) throw new Error('Upload failed: HTTP '+uploadResp.status);
    status.textContent = 'Configuring portal\u2026';
    var portalHdrs = { 'Content-Type':'application/x-www-form-urlencoded' };
    if (csrf) portalHdrs['X-CSRF-Token'] = csrf;
    var portalResp = await fetch('/Monolith/api/auth/project/setProjectPortal', { method:'POST', headers:portalHdrs, credentials:'include', body:'projectId='+encodeURIComponent(projectId)+'&hasPortal=true' });
    if (!portalResp.ok) throw new Error('setProjectPortal failed: HTTP '+portalResp.status);
    status.textContent = 'Publishing\u2026';
    await runPixel('PublishProject(project=["'+escPixel(projectId)+'"], release=[true]);');
    status.textContent = 'Published \u2014 reloading\u2026'; status.className = 'save-status ok';
    setTimeout(function(){ location.reload(); }, 1000);
  } catch(e) {
    status.textContent = 'Error: '+e.message; status.className = 'save-status error';
    btns.forEach(function(b){ if(b){b.disabled=false;b.textContent='Save & Publish';} });
  }
}

init();
</script>
</body>
</html>`;
	/* eslint-enable no-useless-escape */
}

/**
 * Escapes a string for safe inclusion as a value inside a Semoss pixel string literal.
 * e.g.  SaveAsset(content=["<escaped here>"])
 */
export function escapeForPixel(str: string): string {
	return str
		.replace(/\\/g, "\\\\") // backslash first
		.replace(/"/g, '\\"') // double quotes
		.replace(/\n/g, "\\n") // newlines
		.replace(/\r/g, "") // carriage returns
		.replace(/\t/g, "\\t"); // tabs
}

/**
 * Sanitizes a dashboard name into a valid Semoss project name.
 * Must start with a letter, contain only letters/numbers/spaces.
 */
export function sanitizeProjectName(name: string): string {
	const clean = name
		.replace(/[^a-zA-Z0-9 ]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	// Ensure it starts with a letter
	const startsWithLetter = /^[a-zA-Z]/.test(clean);
	return startsWithLetter ? clean : "Dashboard " + clean;
}

/**
 * Generates a Semoss .smss properties file for a portal project.
 * Must include RDBMS_INSIGHTS so SmssUtilities.getInsightsRdbmsFile() returns
 * a non-null File (otherwise addProject throws a NullPointerException wrapped
 * as "Error occurred trying to synchronize the metadata and insights...").
 *
 * RDBMS_INSIGHTS uses the @PROJECT@ placeholder which Semoss resolves to
 * "ProjectAlias__projectId" at runtime.
 */
export function generateSmssContent(
	projectName: string,
	projectId: string,
): string {
	const lines = [
		`PROJECT=${projectId}`,
		`PROJECT_ALIAS=${projectName}`,
		`PROJECT_DISPLAY_NAME=${projectName}`,
		`PROJECT_TYPE=prerna.project.impl.Project`,
		`PROJECT_ENUM_TYPE=CODE`,
		`PUBLIC_HOME_ENABLE=true`,
		`PORTAL_NAME=portals`,
		`RDBMS_INSIGHTS=project/@PROJECT@/insights_database`,
		`RDBMS_INSIGHTS_TYPE=H2_DB`,
	];
	return lines.join("\n") + "\n";
}

/**
 * Builds the zip blob expected by UploadProjectApp.
 *
 * UploadProjectApp zip root logic:
 *   - directory named "assets" → copied to app_root/version/assets/
 *   - any other directory       → copied to app_root/version/  (wrong for portals)
 *   - files                     → copied to project root folder
 *
 * So portals must live inside an "assets" directory:
 *
 * Structure:
 *   ProjectName__projectId.smss      ← file at root → goes to project root
 *   assets/
 *     portals/
 *       index.html                   → app_root/version/assets/portals/index.html
 *       dashboard.json               → app_root/version/assets/portals/dashboard.json
 */
export async function buildPortalZip(
	dashboard: Dashboard,
	projectName: string,
	projectId: string,
): Promise<Blob> {
	const folderName = `${projectName}__${projectId}`;
	const zip = new JSZip();

	zip.file(`${folderName}.smss`, generateSmssContent(projectName, projectId));

	const portalsFolder = zip.folder("assets")!.folder("portals")!;
	portalsFolder.file("index.html", portalAppHtml);

	// Build a portal-compatible config that always has flat visualizations + layout
	// (portal reads these at top level) plus the full sheets array (for multi-sheet support).
	const allVizs = dashboard.visualizations?.length
		? dashboard.visualizations
		: (dashboard.sheets ?? []).flatMap((s) => s.visualizations);
	const allLayout = dashboard.layout?.length
		? dashboard.layout
		: (dashboard.sheets?.[0]?.layout ?? []);

	// Use the first sheet's flexLayout as the top-level flexLayout for the portal
	const flexLayout = dashboard.sheets?.[0]?.flexLayout;

	portalsFolder.file(
		"dashboard.json",
		JSON.stringify(
			{
				...dashboard,
				projectId,
				visualizations: allVizs,
				layout: allLayout,
				flexLayout,
			},
			null,
			2,
		),
	);

	return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/**
 * The host project's portal `index.html` — a smart forwarder to the live
 * reporting-insights app. `appUrl` must be a deployment-correct absolute URL
 * (see lib/portalUrl.appPublicBaseUrl), NOT the dev server.
 *
 * The playground renders a tool's UI by iframing this portal at `…/portals/#/<route>`
 * (its MCP tools set a portal-relative `resourceURI` of `/#/<route>`) and, on load,
 * posts an `SMSS_INIT_TOOL` message carrying the tool's parameter values. This page:
 *   1. registers a message listener BEFORE the parent posts,
 *   2. on `SMSS_INIT_TOOL`, forwards to `appUrl` + the portal's own hash route, with
 *      the tool parameters appended as a query string on the hash — so
 *      `create_dashboard` lands on `#/mcp/create?description=…&database=…` (which
 *      auto-builds + deploys), `update_dashboard` on `#/dashboard/<id>/edit`, etc.
 *   3. falls back to a plain redirect (route only) if no message arrives shortly.
 * Everything is same-origin (Tomcat), so the postMessage is delivered and the
 * subsequent navigation keeps the user's session.
 */
export function mcpHostRedirectHtml(appUrl: string): string {
	const base = appUrl.replace(/#.*$/, "");
	const script = `(function(){
  var BASE=${JSON.stringify(base)};
  // Cache-buster on the app document URL so the tool iframe ALWAYS loads the current
  // app bundle (Tomcat serves index.html cacheably; a unique query bypasses that).
  var BUST=(BASE.indexOf("?")>=0?"&":"?")+"_ts="+Date.now();
  var done=false;
  function go(route,params){
    if(done)return; done=true;
    var r=route||location.hash||"";
    var id=params&&(params.dashboard_id||params.dashboardId);
    if(id){ location.replace(BASE+BUST+"#/dashboard/"+encodeURIComponent(id)+"/edit"); return; }
    var qs=[];
    if(params){for(var k in params){var v=params[k];if(v==null||v==="")continue;qs.push(encodeURIComponent(k)+"="+encodeURIComponent(String(v)));}}
    var sep=r.indexOf("?")>=0?"&":"?";
    location.replace(BASE+BUST+r+(qs.length?sep+qs.join("&"):""));
  }
  window.addEventListener("message",function(e){
    var d=e&&e.data;
    if(!d||d.type!=="SMSS_INIT_TOOL")return;
    var t=d.tool||d.payload||d;
    go(location.hash, (t&&t.parameters)||{});
  });
  setTimeout(function(){ go(location.hash,null); },2500);
})();`;
	return (
		`<!doctype html><meta charset="utf-8"><title>Reporting Insights</title>` +
		`<script>${script}</script>` +
		`<noscript><meta http-equiv="refresh" content="0; url=${base}"></noscript>` +
		`<p>Opening <a href="${base}">Reporting Insights</a>…</p>`
	);
}

/**
 * Build a minimal SEMOSS project zip for the reporting-insights MCP "host" — the
 * app registered as its own MCP so the playground can create/list/update
 * dashboards. It carries the Python MCP tools (`assets/py/mcp_driver.py` +
 * `assets/mcp/py_mcp.json`) and a tiny portal that redirects to the live app.
 */
export async function buildMcpHostZip(
	projectName: string,
	projectId: string,
	appUrl: string,
	manifestJson: string,
	driverPy: string,
): Promise<Blob> {
	const folderName = `${projectName}__${projectId}`;
	const zip = new JSZip();
	zip.file(`${folderName}.smss`, generateSmssContent(projectName, projectId));
	const assets = zip.folder("assets")!;
	// Portal: opening the host project just forwards to the reporting-insights app.
	assets.folder("portals")!.file("index.html", mcpHostRedirectHtml(appUrl));
	// MCP tools: Python driver (functions) + manifest GetMCPTools reads.
	assets.folder("mcp")!.file("py_mcp.json", manifestJson);
	assets.folder("py")!.file("mcp_driver.py", driverPy);
	return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
