import type { SortRule } from "@/types/dashboard";

/** True if a string value looks like a date (parseable, not a plain number). */
function isDateString(v: unknown): boolean {
	if (v == null || v === "") return false;
	const s = String(v);
	if (!isNaN(Number(s))) return false; // plain numbers aren't dates
	return !isNaN(Date.parse(s));
}

/**
 * Returns true if the majority of non-null sample values for a column appear
 * to be dates. Used by the UI to decide whether to show the Chronological button.
 */
export function columnLooksLikeDates(
	rows: Array<Record<string, unknown>>,
	column: string,
): boolean {
	const vals = rows
		.map((r) => r[column])
		.filter((v) => v != null && v !== "")
		.slice(0, 50);
	if (!vals.length) return false;
	const dateCount = vals.filter(isDateString).length;
	return dateCount / vals.length >= 0.5;
}

/** Distinct values for a column from sample rows, in order of appearance. */
export function distinctColumnValues(
	rows: Array<Record<string, unknown>>,
	column: string,
): string[] {
	const seen = new Set<string>();
	for (const row of rows) {
		const v = row[column];
		if (v != null && v !== "") seen.add(String(v));
		if (seen.size >= 200) break;
	}
	return Array.from(seen);
}

/**
 * Apply an ordered list of sort rules to rows. Rules are applied in priority
 * order — the first rule is primary sort, second is tiebreaker, etc.
 * Returns the original array if there are no active rules.
 */
export function applyVizSort(
	rows: Record<string, any>[],
	rules?: SortRule[],
): Record<string, any>[] {
	const active = rules?.filter((r) => r.column && r.direction) ?? [];
	if (!active.length || !rows.length) return rows;

	return [...rows].sort((a, b) => {
		for (const rule of active) {
			const av = a[rule.column];
			const bv = b[rule.column];
			let cmp = 0;

			if (rule.direction === "custom" && rule.customOrder?.length) {
				const ai = rule.customOrder.indexOf(String(av ?? ""));
				const bi = rule.customOrder.indexOf(String(bv ?? ""));
				cmp = (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
			} else if (rule.direction === "chronological") {
				const ad = Date.parse(String(av ?? ""));
				const bd = Date.parse(String(bv ?? ""));
				cmp =
					!isNaN(ad) && !isNaN(bd)
						? ad - bd
						: String(av ?? "").localeCompare(
								String(bv ?? ""),
								undefined,
								{ numeric: true },
							);
			} else {
				const an = Number(av);
				const bn = Number(bv);
				cmp =
					!isNaN(an) && !isNaN(bn)
						? an - bn
						: String(av ?? "").localeCompare(
								String(bv ?? ""),
								undefined,
								{
									numeric: true,
									sensitivity: "base",
								},
							);
				if (rule.direction === "desc") cmp = -cmp;
			}

			if (cmp !== 0) return cmp;
		}
		return 0;
	});
}
