/**
 * Query → pixel builder, shared by the app AND the portal (portal aliases `@`→`src`).
 *
 * A normal query runs `Database | Query | Collect`. A **data product** query has ≥2
 * `sources` legs (each its own database + SQL) joined via `joins`; SEMOSS can't JOIN
 * across databases in SQL, so we materialize each leg into an in-memory GRID frame
 * and `Merge` them:
 *
 *   F0 = Database(database=["dbA"]) | Query("<encode>…</encode>") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["F0"])]);
 *   F1 = Database(database=["dbB"]) | Query("<encode>…</encode>") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["F1"])]);
 *   Frame(frame=[F0]) | Merge(joins=[(leftCol, inner.join, rightCol)], frame=[F1]) | Collect(N);
 *
 * The single-source branch is byte-identical to the historical pixel, so existing
 * dashboards are unaffected.
 */
import { escapeSqlForPixel } from "@/lib/pixel";
import type { JoinSpec, QuerySourceLeg } from "@/types/dashboard";

/** Minimal shape the builder needs — satisfied by QuerySource / DashboardQuery. */
export interface RunnableQuery {
	databaseId: string;
	query: string;
	sources?: QuerySourceLeg[];
	joins?: JoinSpec[];
}

export function isDataProduct(
	q?: { sources?: QuerySourceLeg[] } | null,
): boolean {
	return !!q?.sources && q.sources.length >= 2;
}

/** Small stable string hash (base36) — used to make frame names unique per query. */
export function hashString(s: string): string {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
	return (h >>> 0).toString(36);
}

// ── Reserved-word-safe frame columns ──────────────────────────────────────────
// A frame's column names come from its source query's output columns. When two
// frames are merged, SEMOSS builds a `CREATE TABLE … AS SELECT B.<col> …` and does
// NOT quote reserved words — so a column literally named `Group`, `Order`, etc.
// (or one with spaces/symbols) makes H2 throw `expected "identifier"`. We defensively
// alias such columns in each leg's SELECT so the frame carries a safe name.
const SQL_RESERVED = new Set(
	(
		"group order select from where user value year month day key table column index constraint " +
		"primary foreign check default unique null not and or as on join inner outer left right full " +
		"cross natural union all distinct having limit offset row rows case when then else end like in " +
		"is between exists count sum avg min max timestamp date time interval array true false by asc desc " +
		"insert update delete create drop alter grant revoke with over partition"
	).split(" "),
);

function sanitizeIdent(name: string): string {
	return name.replace(/[^A-Za-z0-9_]/g, "_").replace(/^([0-9])/, "_$1");
}

/** True when a column name would break an unquoted merge SELECT (reserved / non-ident). */
export function needsColumnAlias(name: string): boolean {
	return (
		SQL_RESERVED.has(name.toLowerCase()) ||
		!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
	);
}

/** A safe alias for a column that {@link needsColumnAlias} — else the name unchanged. */
export function safeColumnName(name: string): string {
	return needsColumnAlias(name) ? `${sanitizeIdent(name)}_c` : name;
}

/**
 * If any of `headers` is reserved/non-ident, wrap the leg SQL so every column is
 * re-selected under a safe alias (`SELECT "Group" AS "Group_c", "Color" AS "Color" …
 * FROM (<sql>) __ri_sub`). Returns the (possibly unchanged) SQL plus a map of the
 * renamed columns so join specs can be remapped. No-op when nothing is unsafe or when
 * headers are unknown.
 */
export function aliasReservedColumns(
	sql: string,
	headers: string[] | undefined,
): { sql: string; renames: Record<string, string> } {
	if (!headers?.length || !headers.some(needsColumnAlias))
		return { sql, renames: {} };
	const renames: Record<string, string> = {};
	const cols = headers.map((h) => {
		const s = safeColumnName(h);
		if (s !== h) renames[h] = s;
		return `"${h.replace(/"/g, '""')}" AS "${s}"`;
	});
	const inner = sql.trim().replace(/;\s*$/, "");
	return {
		sql: `SELECT ${cols.join(", ")} FROM (${inner}) AS __ri_sub`,
		renames,
	};
}

/**
 * Resolve every leg's output columns for a cross-source merge:
 *
 *  1. **Collision prefixing** — a column name that appears in more than one leg would
 *     collide when the frames are merged (SEMOSS folds the incoming side into the base's
 *     same-named column instead of keeping both, so an inner join degenerates to "all
 *     base rows" and outer joins null out the shared columns). We prefix each colliding
 *     column with its leg alias (`LETTER` → `s1_LETTER` / `s2_LETTER`) so both sides
 *     survive the merge distinctly.
 *  2. **Reserved-word / identifier safety** — see {@link safeColumnName}.
 *
 * Returns the SELECT-wrapped SQL per leg (re-selecting every column under its safe/
 * prefixed alias) plus a per-leg rename map so join specs can be remapped. Legs whose
 * headers are unknown (never previewed) pass through unchanged.
 */
export function resolveLegColumns(
	legs: { alias: string; query: string }[],
	headersByAlias: Record<string, string[]>,
): {
	sqlByAlias: Record<string, string>;
	renameByAlias: Record<string, Record<string, string>>;
} {
	// Count how many legs each (case-insensitive) column name appears in.
	const legCount = new Map<string, number>();
	for (const leg of legs) {
		const seen = new Set<string>();
		for (const h of headersByAlias[leg.alias] ?? []) {
			const k = h.toLowerCase();
			if (seen.has(k)) continue;
			seen.add(k);
			legCount.set(k, (legCount.get(k) ?? 0) + 1);
		}
	}
	const collides = new Set(
		[...legCount].filter(([, n]) => n > 1).map(([k]) => k),
	);

	const sqlByAlias: Record<string, string> = {};
	const renameByAlias: Record<string, Record<string, string>> = {};
	for (const leg of legs) {
		const headers = headersByAlias[leg.alias] ?? [];
		const renames: Record<string, string> = {};
		const cols = headers.map((h) => {
			const prefixed = collides.has(h.toLowerCase())
				? `${leg.alias}_${h}`
				: h;
			const safe = safeColumnName(prefixed);
			if (safe !== h) renames[h] = safe;
			return `"${h.replace(/"/g, '""')}" AS "${safe}"`;
		});
		renameByAlias[leg.alias] = renames;
		if (headers.length && Object.keys(renames).length) {
			const inner = leg.query.trim().replace(/;\s*$/, "");
			sqlByAlias[leg.alias] =
				`SELECT ${cols.join(", ")} FROM (${inner}) AS __ri_sub`;
		} else {
			sqlByAlias[leg.alias] = leg.query;
		}
	}
	return { sqlByAlias, renameByAlias };
}

/** JoinSpec.type → SEMOSS MergeReactor join vocabulary. */
const JOIN_PIXEL: Record<JoinSpec["type"], string> = {
	inner: "inner.join",
	left: "left.outer.join",
	right: "right.outer.join",
};

/** Sanitize an alias + salt into an uppercase identifier safe as a frame name. */
function frameId(salt: string, alias: string, idx: number): string {
	const a =
		(alias || `leg${idx}`)
			.toUpperCase()
			.replace(/[^A-Z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "") || `LEG${idx}`;
	const s = (salt || "")
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, "")
		.slice(0, 8);
	return `RI_${s}_${a}`;
}

export interface BuildOpts {
	collect: number;
	/** Stable salt (e.g. the query id) so frame names don't collide across queries. */
	salt?: string;
	/** Apply the caller's param interpolation (multiselect expansion, etc.) to each SQL. */
	substitute?: (sql: string) => string;
}

/**
 * Build the pixel for a query. Multi-statement (frame imports + merge + collect)
 * for data products; a single statement otherwise. Read the result with
 * {@link lastPixelOutput} (the Collect is always the last statement).
 */
export function buildQueryPixel(q: RunnableQuery, opts: BuildOpts): string {
	const sub = opts.substitute ?? ((s: string) => s);
	const collect = opts.collect;

	if (isDataProduct(q)) {
		const legs = q.sources!;
		const joins = q.joins ?? [];
		// Default salt = a hash of the legs' content so frame names are unique per
		// distinct query even across concurrent runs (override=true handles re-runs).
		const salt =
			opts.salt ??
			hashString(
				legs
					.map((l) => `${l.databaseId}:${l.alias}:${l.query}`)
					.join("|"),
			);
		const frameByAlias = new Map<string, string>();
		const stmts: string[] = [];
		legs.forEach((leg, i) => {
			const fname = frameId(salt, leg.alias, i);
			frameByAlias.set(leg.alias, fname);
			const sql = sub(leg.query);
			stmts.push(
				`Database(database=["${leg.databaseId}"]) | Query("${escapeSqlForPixel(sql)}") | ` +
					`Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["${fname}"])]);`,
			);
		});
		// Merge each subsequent leg INTO the base frame (matching the legacy
		// Import-pipeline pattern): `Frame(base) | QueryAll() | Merge(joins=[…], frame=[other])`
		// as its OWN statement per join, then Collect the (now merged) base frame.
		//
		// SEMOSS's Merge is base-frame-centric: the LEFT join column must be a column of
		// the accumulated base frame, and the RIGHT column belongs to the incoming leg.
		// One side of each join is already merged into the base; the other is the leg
		// being added. Orient the tuple by that (not by the raw UI left/right), so the
		// join works no matter which side the user assigned each column to.
		const baseFrame = frameByAlias.get(legs[0].alias)!;
		const merged = new Set<string>([legs[0].alias]);
		for (const j of joins) {
			const leftIn = merged.has(j.leftAlias);
			const rightIn = merged.has(j.rightAlias);
			// One side of the join is already in the accumulated base frame; the other is
			// the leg being merged in. Pair each column with its owning side.
			let incomingAlias: string;
			let incomingCol: string;
			let baseCol: string;
			if (rightIn && !leftIn) {
				incomingAlias = j.leftAlias;
				incomingCol = j.leftColumn;
				baseCol = j.rightColumn;
			} else {
				incomingAlias = j.rightAlias;
				incomingCol = j.rightColumn;
				baseCol = j.leftColumn;
			}
			const incomingFrame = frameByAlias.get(incomingAlias);
			if (!incomingFrame) continue;
			// MergeReactor.getFrame() returns the `frame=[…]` ARGUMENT (not the piped
			// frame), and the merged result is stored back under that argument's name.
			// So we pipe the INCOMING leg and pass the BASE frame as `frame=[…]` — the
			// base then accumulates every merge and is what we Collect.
			//   Frame(<incoming>) | QueryAll() | Merge(joins=[(baseCol, type, incomingCol)], frame=[<base>])
			//   → generates `FROM <base> A <type> JOIN <incoming> B ON (A.baseCol = B.incomingCol)`.
			// Outer direction: A is the base, B is the incoming leg; keeping the base
			// side → left.outer, keeping the incoming side → right.outer (inner is symmetric).
			const keepAlias =
				j.type === "left"
					? j.leftAlias
					: j.type === "right"
						? j.rightAlias
						: "";
			const jt =
				j.type === "inner"
					? JOIN_PIXEL.inner
					: keepAlias === incomingAlias
						? JOIN_PIXEL.right
						: JOIN_PIXEL.left;
			stmts.push(
				`Frame(frame=[${incomingFrame}]) | QueryAll() | ` +
					`Merge(joins=[(${baseCol}, ${jt}, ${incomingCol})], frame=[${baseFrame}]);`,
			);
			merged.add(incomingAlias);
		}
		stmts.push(
			`Frame(frame=[${baseFrame}]) | QueryAll() | Collect(${collect});`,
		);
		return stmts.join("\n");
	}

	const sql = sub(q.query);
	return `Database(database=["${q.databaseId}"]) | Query("${escapeSqlForPixel(sql)}") | Collect(${collect});`;
}

/**
 * Extract the effective output from a (possibly multi-statement) pixelReturn:
 * the first ERROR anywhere, else the last statement's output (the Collect).
 */
export function lastPixelOutput(
	pixelReturn: Array<{ output?: unknown; operationType?: string[] }>,
): { output: any; error?: string } {
	for (const pr of pixelReturn ?? []) {
		if (
			Array.isArray(pr?.operationType) &&
			pr.operationType.includes("ERROR")
		) {
			return {
				output: pr.output,
				error: String(pr.output ?? "Query failed."),
			};
		}
	}
	const last = pixelReturn?.[pixelReturn.length - 1];
	return { output: last?.output };
}

/** A signature of the source(s) for use in result caches. */
export function sourcesSignature(q: RunnableQuery): string {
	if (!isDataProduct(q)) return q.databaseId;
	const legs = (q.sources ?? [])
		.map((s) => `${s.databaseId}:${s.alias}`)
		.join("|");
	const joins = (q.joins ?? [])
		.map(
			(j) =>
				`${j.leftAlias}.${j.leftColumn}${j.type}${j.rightAlias}.${j.rightColumn}`,
		)
		.join(",");
	return `dp(${legs}#${joins})`;
}
