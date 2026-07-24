/**
 * aiBuilder — the AI Dashboard Builder's model plumbing.
 *
 * Reuses the same SEMOSS `LLM(engine=[...], command=[...], context=[...])` pixel the
 * HTML-block generator uses, but the model engine id comes from the environment
 * (`LLM_MODEL_ID`, exposed via vite `define`) rather than a per-viz picker.
 *
 * The generation pipeline is deliberately grounded: we feed the LLM the real
 * database metamodel (tables/columns/types) and constrain it to emit a Dashboard
 * JSON matching our schema, which the editor then renders/validates like any other
 * dashboard. SQL execution + repair is a planned follow-up (see generateDashboard).
 */

import { inferSqlParameters } from "@/lib/paramInference";
import type {
	ColSpan,
	Dashboard,
	DashboardQuery,
	LayoutItem,
	Parameter,
	Sheet,
	Visualization,
	VisualizationType,
} from "@/types/dashboard";

export type RunPixel = (pixel: string) => Promise<any>;

/** A SEMOSS model engine the user can pick for the AI Builder. */
export interface ModelEngine {
	id: string;
	name: string;
}

/** List the model engines the current user can access (for the model picker). */
export async function fetchModels(runPixel: RunPixel): Promise<ModelEngine[]> {
	const out = await runPixel(`MyEngines(engineTypes=['MODEL']);`);
	return (Array.isArray(out) ? out : [])
		.map((m: any) => ({
			id: m.app_id ?? m.database_id ?? m.engine_id,
			name: m.engine_name ?? m.app_name ?? m.app_id,
		}))
		.filter((m: ModelEngine) => m.id);
}

export interface TableMeta {
	table: string;
	columns: { column: string; type: string }[];
}

/** Escape a string for inclusion inside a SEMOSS pixel string literal. */
function escPixel(s: string): string {
	return s
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "")
		.replace(/\t/g, "\\t");
}

/** Every renderable data-visualization type the builder may emit. Excludes the
 *  non-data widgets (htmlblock, csvexport, filter) which need bespoke config. */
const ALLOWED_TYPES: VisualizationType[] = [
	"bar",
	"stackbar",
	"line",
	"area",
	"multiline",
	"pie",
	"halfdonut",
	"treemap",
	"sunburst",
	"wordcloud",
	"radar",
	"polarbar",
	"scatter",
	"bubble",
	"boxplot",
	"cluster",
	"heatmap",
	"worldmap",
	"kpi",
	"table",
	"pivot",
	// Utility widgets:
	"csvexport",
	"filter",
];

/** Fetch the curated metamodel (tables → columns → types) for grounding. */
export async function fetchMetamodel(
	runPixel: RunPixel,
	dbId: string,
): Promise<TableMeta[]> {
	const out = await runPixel(
		`GetDatabaseMetamodel(database=["${escPixel(dbId)}"], options=["physicalTypes","dataTypes"]);`,
	);
	const nodes: any[] = Array.isArray(out?.nodes) ? out.nodes : [];
	const physTypes: Record<string, string> = out?.physicalTypes ?? {};
	const dataTypes: Record<string, string> = out?.dataTypes ?? {};
	const colName = (p: string) =>
		p.includes("__") ? p.split("__").slice(1).join("__") : p;
	return nodes
		.map((n) => ({
			table: String(n?.conceptualName ?? ""),
			columns: (Array.isArray(n?.propSet) ? n.propSet : [])
				.map((p: string) => ({
					column: colName(String(p)),
					type: String(physTypes[p] ?? dataTypes[p] ?? ""),
				}))
				.filter((c: { column: string }) => c.column),
		}))
		.filter((t) => t.table);
}

/** Validates a single SQL statement against the DB and returns its output columns. */
export type RunSql = (
	databaseId: string,
	sql: string,
) => Promise<{ ok: boolean; error?: string; headers?: string[] }>;

/** Strip code fences / prose and a trailing semicolon from a model SQL response. */
function cleanSql(text: string): string {
	let s = String(text ?? "")
		.trim()
		.replace(/^```(?:sql)?\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();
	// Keep from the first SELECT if the model added a preface.
	const m = /select\b/i.exec(s);
	if (m && m.index > 0) s = s.slice(m.index);
	return s.replace(/;\s*$/, "").trim();
}

/** True only for a single read-only SELECT (no DDL/DML/multiple statements). */
function isSelectOnly(sql: string): boolean {
	const s = sql.trim();
	if (!/^select\b/i.test(s)) return false;
	if (/;/.test(s.replace(/;\s*$/, ""))) return false; // no embedded statements
	return !/\b(insert|update|delete|drop|alter|create|truncate|merge|grant|revoke)\b/i.test(
		s,
	);
}

const REPAIR_CONTEXT = [
	"You fix a single SQL SELECT statement that failed to run. Emit standard ANSI SQL.",
	"Return ONLY the corrected statement — no markdown, no code fences, no explanation.",
	"Do NOT put quotes around table or column names — reference them bare, using the EXACT case",
	"from the schema (e.g. SELECT Color, Region FROM SHEET1). Use single quotes only for string VALUES.",
	"No trailing commas.",
	"If the SELECT list mixes an aggregate with plain columns, every plain column must be in GROUP BY.",
	"Do not reference SELECT aliases in WHERE/GROUP BY. Keep it a single read-only SELECT.",
	"Only use tables/columns present in the schema.",
	"PRESERVE any {{placeholder}} tokens EXACTLY as-is (keep them inside their single quotes); they are",
	"parameter markers — never remove, rename, or unquote them.",
].join("\n");

/** Replace {{placeholder}} tokens with a sample literal so SQL can be validated before
 *  a real value is supplied. Placeholders are authored inside single quotes, so this
 *  yields a valid string literal (e.g. WHERE "Letter" = 'x'). The stored SQL keeps the
 *  original {{placeholder}}. */
function probeSql(sql: string): string {
	return sql.replace(/\{\{\s*\w+\s*\}\}/g, "x");
}

/** Call the chosen model engine and return its text response. */
export async function askLlm(
	runPixel: RunPixel,
	modelId: string,
	command: string,
	context: string,
): Promise<string> {
	if (!modelId) throw new Error("Select a model to use.");
	const pixel = `LLM(engine=["${escPixel(modelId)}"], command=["${escPixel(command)}"], context=["${escPixel(context)}"]);`;
	const out = await runPixel(pixel);
	const text =
		typeof out === "string" ? out : (out?.response ?? out?.output ?? "");
	return String(text ?? "");
}

/** Pull the first JSON object out of a model response (tolerates code fences/prose). */
function extractJson(text: string): any {
	let t = text
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/i, "");
	const start = t.indexOf("{");
	const end = t.lastIndexOf("}");
	if (start >= 0 && end > start) t = t.slice(start, end + 1);
	return JSON.parse(t);
}

/** The compact shape we ask the model to return. */
interface AiSpecParam {
	name: string; // matches a {{name}} token in the SQL
	default?: string; // value pre-filled at view time
	label?: string;
	options?: string[]; // makes it a dropdown
}
interface AiSpecQuery {
	id: string;
	name?: string;
	sql: string;
	parameters?: AiSpecParam[];
}
interface AiSpecViz {
	id: string;
	title: string;
	type: string;
	queryId?: string; // omitted for filter widgets
	config?: Record<string, any>;
	width?: number; // 3 | 4 | 6 | 12 (grid columns)
}
interface AiSpec {
	name?: string;
	description?: string;
	queries: AiSpecQuery[];
	visualizations: AiSpecViz[];
}

const SYSTEM_CONTEXT = [
	"You are a data-visualization expert that designs analytics dashboards.",
	"You are given a natural-language request and the real database schema (tables, columns, types).",
	"Return ONLY minified JSON (no markdown, no code fences, no prose) with this shape:",
	'{"name":string,"description":string,',
	'"queries":[{"id":string,"name":string,"sql":string,"parameters":[{"name":string,"default":string,"label":string,"options":string[]}]}],',
	'"visualizations":[{"id":string,"title":string,"type":string,"queryId":string(omit for filter),"width":number,"config":object}]}',
	"",
	"Honoring the user request LITERALLY (CRITICAL):",
	"- If the user provides an explicit SQL statement, use it EXACTLY as written — do NOT rewrite,",
	"  rename, re-quote, reorder, or reformat it. Put it verbatim in queries[].sql. Only change it if",
	"  it genuinely fails to run.",
	'- If the user specifies a default value for a parameter/filter, set that parameter\'s "default" to',
	"  EXACTLY that value.",
	"",
	"SQL rules (CRITICAL — malformed SQL breaks the whole dashboard). Emit standard ANSI SQL:",
	"- Only use tables and columns that appear in the provided schema. Never invent names.",
	"- Do NOT put quotes around table or column names — reference them BARE, using the EXACT case",
	"  from the schema, e.g. SELECT Color, Number, Size FROM SHEET1. Never wrap identifiers in double",
	"  quotes or backticks.",
	"- Use single quotes ONLY for string/text VALUES (e.g. 'Active'), never for identifiers.",
	"- Each sql MUST be a single read-only SELECT (no INSERT/UPDATE/DELETE/DROP/DDL/semicolons).",
	"- No trailing comma in the SELECT list; put a comma between every pair of selected items and none",
	"  before FROM.",
	"- GROUP BY completeness: if the SELECT list mixes an aggregate (COUNT/SUM/AVG/MIN/MAX) with a plain",
	"  column, EVERY plain column in the SELECT list MUST also appear in GROUP BY. Do not GROUP BY an",
	"  aggregate.",
	"- ALWAYS alias aggregates with a bare (unquoted) name, e.g. COUNT(*) AS count, SUM(Sales) AS total.",
	"- Do NOT reference a SELECT alias in WHERE or GROUP BY (repeat the full expression there); aliases",
	"  may be used in ORDER BY only.",
	"- To cap rows, end with LIMIT n (e.g. LIMIT 100). Prefer aggregation (GROUP BY) over returning raw rows.",
	"- Use only standard functions (COUNT, SUM, AVG, MIN, MAX, ROUND, and standard JOIN ... ON ...);",
	"  avoid vendor-specific syntax.",
	"- Prefer aggregated queries (GROUP BY) for charts so they render cleanly; select only the",
	"  columns the chart needs.",
	"",
	"Parameters / interactive filters (use ONLY when the request asks to filter by a value the user picks):",
	"- Create a parameter by writing a placeholder token {{name}} directly in the SQL as a single-quoted",
	"  string literal in the WHERE clause, e.g. SELECT * FROM SHEET1 WHERE Letter = '{{letter}}'.",
	"  (Identifiers stay bare; only the placeholder VALUE is quoted.)",
	"- Use a short lowercase name for the token; keep it INSIDE single quotes so the SQL stays valid even",
	"  before a value is chosen. Never leave a placeholder unquoted (e.g. never = {{age}}).",
	'- ALSO declare each {{name}} in that query\'s "parameters" array with its "name", a "default" value',
	'  (use the exact default the user requested, else a reasonable one from the data), an optional "label",',
	'  and optional "options" (a fixed choice list → renders a dropdown). The "name" MUST match the token.',
	"- The app turns each declared parameter into an interactive filter control AND an MCP tool input.",
	"- Only add placeholders the user genuinely wants to filter by; otherwise write plain literal filters",
	"  or no WHERE clause.",
	"",
	"Config ↔ query columns (CRITICAL):",
	"- A visualization.config may ONLY reference columns that ITS query returns — i.e. the SELECT",
	"  list, using the ALIAS for aggregates. NEVER reference a table column you did not select.",
	"- Example: for query SELECT Group, COUNT(*) AS count FROM SHEET1 GROUP BY Group,",
	'  a bar chart MUST use config {"xKey":"Group","yKeys":["count"]} — nothing else.',
	"- The set of usable column names for a viz is exactly the SELECT output of its query.",
	"",
	"Layout:",
	"- width is the grid span out of 12: use 3, 4, 6, or 12. Put KPIs at width 3 and charts at 6 or 12.",
	"- Create as MANY visualizations as the request genuinely warrants — do NOT cap the count.",
	"- Every visualization.queryId must match one queries[].id (queries may be shared across viz).",
	"",
	"type is one of: " +
		ALLOWED_TYPES.join(", ") +
		". Pick the BEST type for each question.",
	"config maps query columns to the chart. Use these keys per type:",
	'- bar, line, area, scatter, cluster: {"xKey":"<category>","yKeys":["<numeric>", ...],"columnAggregations":{"<col>":"sum|avg|count|min|max"}}',
	'- stackbar: same as bar plus {"facetKey":"<column whose values become the stacked series>"}',
	'- multiline: {"xKey":"<x>","yKeys":["<numeric>"],"categoryKey":"<column that splits into lines>"}',
	'- pie, halfdonut, treemap, wordcloud: {"xKey":"<label/category>","yKeys":["<numeric value>"]}',
	'- radar, polarbar: {"xKey":"<category>","yKeys":["<numeric>", ...]}',
	'- boxplot: {"xKey":"<group>","yKeys":["<numeric>"]}',
	'- bubble: {"label":"<label col>","yKeys":["<size numeric>"],"xKey":"<optional numeric>"}',
	'- sunburst: {"sunburstLevels":["<outer>","<inner>", ...]}',
	'- heatmap: {"xKey":"<x category>","heatmapYKey":"<y category>","yKeys":["<numeric value>"]}',
	'- worldmap: {"latitudeKey":"<lat>","longitudeKey":"<lng>","size":"<optional numeric>","label":"<optional>"}',
	'- kpi: {"yKeys":["<numeric>", ...],"kpiAggregation":"sum|avg|count|min|max"}',
	'- table: {"tableColumns":["<col>", ...]}',
	'- pivot: {"pivotRows":["<row dim>"],"pivotColumns":["<col dim>"],"pivotValues":["<numeric>"]}',
	"",
	"Utility widgets (add only when the request asks for interactivity or downloads):",
	"- csvexport: a button that downloads a query's rows as CSV. Give it a queryId (a SELECT) and",
	'  config {"csvExportLabel":"Export …"}.',
	"- filter: an interactive control that filters OTHER visualizations. OMIT its queryId entirely.",
	'  config {"filterColumn":"<a column that appears in the targeted visualizations\' output>",',
	'  "filterTargets":["<id of a visualization this filter should control>", ...]}. Reference the',
	"  ids you assigned to the other visualizations in this same response.",
].join("\n");

/** Render the metamodel compactly for the prompt. */
function metamodelToText(meta: TableMeta[]): string {
	return meta
		.map(
			(t) =>
				`TABLE ${t.table}(${t.columns.map((c) => `${c.column}:${c.type || "?"}`).join(", ")})`,
		)
		.join("\n");
}

const nowIso = () => new Date().toISOString();

// Config keys that hold a single column name, and those that hold arrays of them.
const SINGLE_COL_KEYS = [
	"xKey",
	"heatmapYKey",
	"latitudeKey",
	"longitudeKey",
	"label",
	"color",
	"categoryKey",
	"facetKey",
];
const ARRAY_COL_KEYS = [
	"yKeys",
	"tableColumns",
	"sunburstLevels",
	"pivotRows",
	"pivotColumns",
	"pivotValues",
];

/**
 * Drop any config column reference that isn't in the query's actual output columns
 * (the root cause of "a table column appears on the x-axis"), then fill sensible
 * defaults from the real headers so the chart still renders. When headers are
 * unknown (query didn't validate) the config is returned unchanged.
 */
function sanitizeConfig(
	type: VisualizationType,
	config: Record<string, any>,
	headers: string[] | undefined,
): Record<string, any> {
	if (!headers?.length) return config;
	const valid = new Set(headers);
	const out: Record<string, any> = { ...config };

	for (const k of SINGLE_COL_KEYS)
		if (out[k] && !valid.has(out[k])) delete out[k];
	// `size` is a column for bubble/worldmap but a number elsewhere — only treat as a column here.
	if (out.size && typeof out.size === "string" && !valid.has(out.size))
		delete out.size;
	for (const k of ARRAY_COL_KEYS) {
		if (Array.isArray(out[k])) {
			out[k] = out[k].filter(
				(c: unknown) => typeof c === "string" && valid.has(c),
			);
			if (!out[k].length) delete out[k];
		}
	}
	if (out.columnAggregations && typeof out.columnAggregations === "object") {
		out.columnAggregations = Object.fromEntries(
			Object.entries(out.columnAggregations).filter(([c]) =>
				valid.has(c),
			),
		);
	}

	// Fill sensible defaults from the real output columns.
	const [first, ...rest] = headers;
	if (type === "table") {
		if (!out.tableColumns?.length) out.tableColumns = headers;
	} else if (type === "kpi") {
		if (!out.yKeys?.length) out.yKeys = rest.length ? rest : [first];
	} else if (
		[
			"bar",
			"stackbar",
			"line",
			"area",
			"multiline",
			"pie",
			"halfdonut",
			"treemap",
			"wordcloud",
			"radar",
			"polarbar",
			"scatter",
			"boxplot",
			"cluster",
		].includes(type)
	) {
		if (!out.xKey) out.xKey = first;
		if (!out.yKeys?.length)
			out.yKeys = (rest.length ? rest : [first]).filter(
				(c) => c !== out.xKey,
			);
		if (!out.yKeys.length) out.yKeys = [first];
	}
	return out;
}

function toColSpan(width: number | undefined): ColSpan {
	const w = Number(width) || 6;
	if (w <= 3) return 3;
	if (w <= 4) return 4;
	if (w <= 6) return 6;
	return 12;
}

/**
 * Normalize the model's spec into a real Dashboard: fresh ids, shared queries wired
 * to the chosen database, one sheet, and a sequential grid layout. Invalid vizzes
 * (bad type or missing query) are dropped.
 */
function specToDashboard(
	spec: AiSpec,
	dbId: string,
	dbName: string,
	headersBySpecQueryId: Record<string, string[]> = {},
): Dashboard {
	// Remap the model's query ids → fresh uuids so nothing collides with real data.
	const queryIdMap = new Map<string, string>();
	const queries: DashboardQuery[] = (spec.queries ?? [])
		.filter((q) => q?.id && q?.sql)
		.map((q) => {
			const id = crypto.randomUUID();
			queryIdMap.set(q.id, id);
			// Carry the model's declared parameters (with the user's requested defaults
			// and any option lists). inferSqlParameters (applied at return) backfills a
			// param for any {{placeholder}} the model forgot to declare.
			const parameters: Parameter[] = (q.parameters ?? [])
				.filter((p) => p?.name)
				.map((p) => ({
					id: crypto.randomUUID(),
					name: p.name,
					label: p.label?.trim() || p.name,
					defaultValue: p.default != null ? String(p.default) : "",
					inputType: p.options?.length
						? ("dropdown" as const)
						: ("text" as const),
					required: false,
					...(p.options?.length ? { options: p.options } : {}),
				}));
			return {
				id,
				name: q.name?.trim() || "Query",
				databaseId: dbId,
				databaseName: dbName,
				query: String(q.sql).trim(),
				parameters,
			};
		});

	// Pass 1: assign fresh viz ids up front so a filter's `filterTargets` (which
	// reference other viz ids) can be remapped in pass 2.
	const vizIdMap = new Map<string, string>();
	(spec.visualizations ?? []).forEach((v) => {
		if (v?.id) vizIdMap.set(v.id, crypto.randomUUID());
	});

	const visualizations: Visualization[] = [];
	const layout: LayoutItem[] = [];
	(spec.visualizations ?? []).forEach((v, i) => {
		const type = String(v?.type) as VisualizationType;
		if (!ALLOWED_TYPES.includes(type)) return;
		const vizId = vizIdMap.get(v?.id) ?? crypto.randomUUID();
		const pushLayout = () => {
			const colSpan = toColSpan(v.width);
			layout.push({
				vizId,
				colSpan,
				order: i,
				widthPct: (colSpan / 12) * 100,
			});
		};

		// Filter widget: no query of its own; wire its targets to the new viz ids.
		if (type === "filter") {
			const rawTargets = Array.isArray(v.config?.filterTargets)
				? v.config!.filterTargets
				: [];
			const filterTargets = rawTargets
				.map((t: string) => vizIdMap.get(t))
				.filter((x: string | undefined): x is string => !!x);
			visualizations.push({
				id: vizId,
				title: v.title?.trim() || "Filter",
				databaseId: "",
				databaseName: "",
				query: "",
				parameters: [],
				visualizationType: "filter",
				config: {
					filterColumn: v.config?.filterColumn,
					filterTargets,
				} as Visualization["config"],
			});
			pushLayout();
			return;
		}

		// Everything else needs a backing query.
		const mappedQueryId = queryIdMap.get(v?.queryId ?? "");
		if (!mappedQueryId) return;
		const boundQuery = queries.find((q) => q.id === mappedQueryId)!;
		const headers = v.queryId ? headersBySpecQueryId[v.queryId] : undefined;
		const config = sanitizeConfig(
			type,
			(v.config ?? {}) as Record<string, any>,
			headers,
		);
		visualizations.push({
			id: vizId,
			title: v.title?.trim() || "Visualization",
			queryId: mappedQueryId,
			databaseId: dbId,
			databaseName: dbName,
			query: boundQuery.query,
			parameters: [],
			visualizationType: type,
			config: config as Visualization["config"],
		});
		pushLayout();
	});

	const sheet: Sheet = {
		id: crypto.randomUUID(),
		name: "Sheet 1",
		visualizations,
		layout,
	};
	// Register a Parameter for any {{placeholder}} the model wrote into the SQL, so the
	// dashboard gets an interactive filter AND exposes those params as MCP tool inputs.
	return inferSqlParameters({
		id: "",
		name: spec.name?.trim() || "AI Dashboard",
		description: spec.description?.trim() || "",
		tags: [],
		queries,
		sheets: [sheet],
		createdAt: nowIso(),
		updatedAt: nowIso(),
	});
}

export interface GenerateArgs {
	runPixel: RunPixel;
	/** Model engine id the user selected (from fetchModels). */
	modelId: string;
	description: string;
	databaseId: string;
	databaseName: string;
	/** Optional pre-fetched metamodel; fetched if omitted. */
	metamodel?: TableMeta[];
	/** Optional SQL validator — when provided, each query is executed and repaired on error. */
	runSql?: RunSql;
	/** Progress callback for UI status text. */
	onProgress?: (msg: string) => void;
}

/**
 * Execute each generated query; on failure, ask the model to repair the SQL (given
 * the error + schema) up to `maxAttempts` times. Mutates `queries[].sql` in place.
 * Best-effort: a query that never validates is left as-is (the editor still shows it
 * so the user can fix it manually).
 */
async function validateAndRepairSql(
	runPixel: RunPixel,
	modelId: string,
	runSql: RunSql,
	databaseId: string,
	queries: AiSpecQuery[],
	schemaText: string,
	onProgress?: (msg: string) => void,
	maxAttempts = 2,
): Promise<Record<string, string[]>> {
	const headersByQueryId: Record<string, string[]> = {};
	for (let i = 0; i < queries.length; i++) {
		const q = queries[i];
		let sql = cleanSql(q.sql);
		for (let attempt = 0; attempt <= maxAttempts; attempt++) {
			if (!isSelectOnly(sql)) {
				// Refuse non-SELECT outright; try one repair, else keep for manual fixing.
				sql =
					attempt < maxAttempts
						? cleanSql(
								await askLlm(
									runPixel,
									modelId,
									`Rewrite as a single read-only SELECT.\nSchema:\n${schemaText}\nStatement:\n${sql}`,
									REPAIR_CONTEXT,
								),
							)
						: sql;
				continue;
			}
			// Validate the PROBE form (placeholders → sample literal) so parameterized
			// queries can be checked before a real value exists; keep placeholders in `sql`.
			const res = await runSql(databaseId, probeSql(sql));
			if (res.ok) {
				if (res.headers?.length) headersByQueryId[q.id] = res.headers;
				break;
			}
			if (attempt === maxAttempts) break; // give up; keep last attempt for manual fixing
			onProgress?.(`Fixing query ${i + 1}…`);
			const fix = await askLlm(
				runPixel,
				modelId,
				`This SQL failed with error:\n${res.error ?? "unknown error"}\n\nSchema:\n${schemaText}\n\nSQL:\n${sql}`,
				REPAIR_CONTEXT,
			);
			sql = cleanSql(fix);
		}
		q.sql = sql;
	}
	return headersByQueryId;
}

/**
 * Generate a draft Dashboard from a natural-language description, grounded in the
 * chosen database's schema. Returns an un-persisted Dashboard (id: '') for the user
 * to review in the editor before saving/publishing.
 */
export async function generateDashboard(
	args: GenerateArgs,
): Promise<Dashboard> {
	const {
		runPixel,
		modelId,
		description,
		databaseId,
		databaseName,
		onProgress,
	} = args;
	if (!modelId) throw new Error("Select a model to use.");
	if (!description.trim())
		throw new Error("Describe the dashboard you want to build.");
	if (!databaseId) throw new Error("Choose a database to build against.");

	onProgress?.("Reading the database schema…");
	const metamodel =
		args.metamodel ?? (await fetchMetamodel(runPixel, databaseId));
	if (!metamodel.length)
		throw new Error("No modeled tables found for this database.");

	onProgress?.("Designing the dashboard…");
	const schemaText = metamodelToText(metamodel);
	const command = [
		`Database id: ${databaseId}`,
		"",
		"Schema:",
		schemaText,
		"",
		`Request: ${description.trim()}`,
	].join("\n");
	const raw = await askLlm(runPixel, modelId, command, SYSTEM_CONTEXT);

	onProgress?.("Assembling visualizations…");
	let spec: AiSpec;
	try {
		spec = extractJson(raw) as AiSpec;
	} catch {
		throw new Error(
			"The model returned a response that could not be parsed. Try again or refine your prompt.",
		);
	}

	// Execute + repair each query so the draft's SQL actually runs, and capture the
	// real output columns to sanitize each viz's config against.
	let headersBySpecQueryId: Record<string, string[]> = {};
	if (args.runSql && Array.isArray(spec.queries) && spec.queries.length) {
		onProgress?.("Validating queries…");
		try {
			headersBySpecQueryId = await validateAndRepairSql(
				runPixel,
				modelId,
				args.runSql,
				databaseId,
				spec.queries,
				schemaText,
				onProgress,
			);
		} catch {
			/* validation is best-effort — fall through with whatever we have */
		}
	}

	const dashboard = specToDashboard(
		spec,
		databaseId,
		databaseName,
		headersBySpecQueryId,
	);
	if (!dashboard.sheets[0].visualizations.length) {
		throw new Error(
			"The model did not produce any valid visualizations. Try a more specific prompt.",
		);
	}
	return dashboard;
}
