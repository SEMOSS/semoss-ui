/**
 * Shared-query model helpers.
 *
 * A {@link DashboardQuery} is a reusable `{database + sql + parameters}` defined
 * once on the dashboard and referenced by many visualizations via `queryId`, so
 * the data is fetched a single time and shared across every chart bound to it.
 *
 * These helpers are deliberately structural (generic over a minimal viz shape)
 * so both the main app (`@/types/dashboard`) and the portal (`portal/types`)
 * can use them without coupling their two structurally-identical type sets.
 */
import type {
	DashboardQuery,
	JoinSpec,
	Parameter,
	QuerySourceLeg,
} from "@/types/dashboard";

/** The data-source fields a visualization needs to run, wherever they come from. */
export interface QuerySource {
	databaseId: string;
	databaseName: string;
	query: string;
	parameters: Parameter[];
	/** Cross-source data product legs (present ⇒ this source is a multi-frame join). */
	sources?: QuerySourceLeg[];
	/** Joins that merge the {@link sources} legs. */
	joins?: JoinSpec[];
}

/** Minimal visualization shape the resolver reads. */
export interface QueryRef extends QuerySource {
	queryId?: string;
}

/** Minimal sheet shape the migration reads. */
interface SheetLike<V extends QueryRef> {
	visualizations: V[];
}

/**
 * Reserved id for the auto-created Parameters sheet. Editor and viewers both
 * use this id so a saved dashboard round-trips without churning sheet ids.
 */
export const PARAM_SHEET_ID = "sheet-0";

/**
 * Resolve the effective data source for a visualization: the referenced shared
 * query when `queryId` points at a known query, otherwise the viz's own embedded
 * fields (legacy / not-yet-migrated dashboards).
 */
export function resolveQuery<V extends QueryRef>(
	viz: V,
	queries: DashboardQuery[] | undefined,
): QuerySource {
	if (viz.queryId && queries) {
		const q = queries.find((x) => x.id === viz.queryId);
		if (q) return q;
	}
	return viz;
}

/** A stable id, preferring crypto.randomUUID with a Math.random fallback. */
function newId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	)
		return crypto.randomUUID();
	return `q_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Fingerprint a data source so visualizations sharing identical
 * `{database + sql + parameter content}` collapse onto one shared query.
 * Parameter `id`s are excluded — two charts with content-identical params are
 * the "same" query for fetch-sharing purposes.
 */
function fingerprint(src: QuerySource): string {
	const params = (src.parameters ?? []).map((p) => ({
		name: p.name,
		label: p.label,
		defaultValue: p.defaultValue,
		inputType: p.inputType,
		required: p.required,
		options: p.options,
		optionsQuery: p.optionsQuery,
		optionsDatabaseId: p.optionsDatabaseId,
	}));
	return JSON.stringify([src.databaseId, src.query, params]);
}

/**
 * Auto-extract & de-dupe: group every visualization that has a SQL query by an
 * identical `{database + sql + parameters}` fingerprint into shared
 * {@link DashboardQuery} entities, binding each viz via `queryId`. Embedded
 * fields are left intact as a fallback, so the result is behaviour-preserving.
 *
 * Idempotent: when `existingQueries` is non-empty the dashboard is assumed
 * already migrated and is returned unchanged.
 *
 * @returns new sheets (with `queryId` set) and the query registry.
 */
export function migrateSheetsToSharedQueries<
	V extends QueryRef & { title?: string },
	S extends SheetLike<V>,
>(
	sheets: S[],
	existingQueries?: DashboardQuery[],
): { sheets: S[]; queries: DashboardQuery[] } {
	if (existingQueries && existingQueries.length) {
		return { sheets, queries: existingQueries };
	}

	const byPrint = new Map<string, DashboardQuery>();
	const queries: DashboardQuery[] = [];

	const nextSheets = sheets.map((sheet) => ({
		...sheet,
		visualizations: sheet.visualizations.map((viz) => {
			// Already bound, or nothing to share (e.g. HTML blocks have no query).
			if (viz.queryId || !viz.query?.trim()) return viz;

			const print = fingerprint(viz);
			let q = byPrint.get(print);
			if (!q) {
				q = {
					id: newId(),
					name: (viz.title?.trim() || "Query") as string,
					databaseId: viz.databaseId,
					databaseName: viz.databaseName,
					query: viz.query,
					parameters: viz.parameters ?? [],
				};
				byPrint.set(print, q);
				queries.push(q);
			}
			return { ...viz, queryId: q.id };
		}),
	})) as S[];

	return { sheets: nextSheets, queries };
}

/**
 * A group of parameters that share the same `name` (the `{{token}}` key) across
 * one or more queries. The param sheet renders one input per group instead of one
 * input per (query × param), deduplicating identical inputs when multiple queries
 * share the same parameter name.
 */
export interface ParamGroup {
	name: string; // param name — the {{token}} key used in SQL
	label: string; // human-readable label, from the first occurrence
	param: Parameter; // full spec (inputType, required, etc.) from first occurrence
	queryIds: string[]; // every query that exposes this param name
	mergedOptions: string[]; // union of all manual `options` arrays across queries
	optionsQuery?: string; // SQL whose first column becomes the option list (first occurrence wins)
	optionsDatabaseId?: string; // database for optionsQuery (first occurrence wins)
	databaseIdFallback: string; // databaseId of the first query — fallback when no optionsDatabaseId
}

/**
 * Group all parameters across all queries by their `name`, merging duplicates.
 * Returns one `ParamGroup` per unique param name, in first-occurrence order.
 * Used by the param sheet to render a single deduplicated input for each param.
 */
export function computeParamGroups(queries: DashboardQuery[]): ParamGroup[] {
	const map = new Map<string, ParamGroup>();
	for (const q of queries) {
		for (const p of q.parameters ?? []) {
			const existing = map.get(p.name);
			if (existing) {
				existing.queryIds.push(q.id);
				for (const o of p.options ?? []) {
					if (!existing.mergedOptions.includes(o))
						existing.mergedOptions.push(o);
				}
			} else {
				map.set(p.name, {
					name: p.name,
					label: p.label || p.name,
					param: p,
					queryIds: [q.id],
					mergedOptions: [...(p.options ?? [])],
					optionsQuery: p.optionsQuery,
					optionsDatabaseId: p.optionsDatabaseId,
					databaseIdFallback: q.databaseId,
				});
			}
		}
	}
	return Array.from(map.values());
}

/** Keep only queries referenced by at least one visualization's `queryId`. */
export function pruneQueries<V extends QueryRef, S extends SheetLike<V>>(
	queries: DashboardQuery[] | undefined,
	sheets: S[],
): DashboardQuery[] {
	if (!queries?.length) return [];
	const referenced = new Set<string>();
	for (const sheet of sheets) {
		for (const viz of sheet.visualizations) {
			if (viz.queryId) referenced.add(viz.queryId);
		}
	}
	return queries.filter((q) => referenced.has(q.id));
}

/** Minimal sheet shape the Parameters-sheet synthesizer needs. */
interface ParamSheetLike {
	id: string;
	name: string;
	color?: string;
	visualizations: unknown[];
	layout: unknown[];
	isParamSheet?: boolean;
}

/**
 * View-time compatibility shim: if any query has parameters and no sheet is
 * flagged `isParamSheet`, prepend a synthesized Parameters sheet so legacy
 * dashboards get the new param-sheet UX without a resave.
 *
 * Idempotent — a no-op when a Parameters sheet already exists or no query has
 * parameters. If `PARAM_SHEET_ID` (`sheet-0`) is already taken by a user sheet
 * the synthesized one gets a distinct fallback id to avoid collisions.
 */
export function ensureParamSheet<S extends ParamSheetLike>(
	sheets: S[],
	queries: DashboardQuery[],
): S[] {
	if (sheets.some((s) => s.isParamSheet)) return sheets;
	if (!queries.some((q) => (q.parameters?.length ?? 0) > 0)) return sheets;
	const id = sheets.some((s) => s.id === PARAM_SHEET_ID)
		? "sheet-params-auto"
		: PARAM_SHEET_ID;
	const synthetic = {
		id,
		name: "Parameters",
		color: "#6366f1",
		visualizations: [],
		layout: [],
		isParamSheet: true,
	} as unknown as S;
	return [synthetic, ...sheets];
}
