/**
 * Per-visualization filter ("Filter Visualization" tool).
 *
 * Unlike the cross-frame Filter *widget* (see `dashboardFilters`), which is a
 * top-down control a viewer interacts with to filter many target charts, this is
 * a fixed, author-defined filter that always applies to a SINGLE visualization's
 * own rows. It is expressed as a tree of rules and nested groups joined by AND/OR,
 * e.g. `col >= 1 && (col <= 2 || col > 0)`, and evaluated client-side before the
 * chart aggregates/render.
 *
 * The types live here (engine-adjacent) and are referenced by both the main app
 * (`@/types/dashboard`) and the portal so the shared tool + evaluator stay in sync.
 */

export type VizFilterComparator =
	| "eq"
	| "neq"
	| "gt"
	| "gte"
	| "lt"
	| "lte"
	| "contains"
	| "notContains"
	| "isEmpty"
	| "isNotEmpty";

/** Human labels for the comparator dropdown. */
export const VIZ_FILTER_COMPARATORS: {
	value: VizFilterComparator;
	label: string;
}[] = [
	{ value: "eq", label: "equal" },
	{ value: "neq", label: "not equal" },
	{ value: "gt", label: "greater than" },
	{ value: "gte", label: "greater or equal" },
	{ value: "lt", label: "less than" },
	{ value: "lte", label: "less or equal" },
	{ value: "contains", label: "contains" },
	{ value: "notContains", label: "does not contain" },
	{ value: "isEmpty", label: "is empty" },
	{ value: "isNotEmpty", label: "is not empty" },
];

/** Comparators that take no value(s). */
export function comparatorTakesValues(c: VizFilterComparator): boolean {
	return c !== "isEmpty" && c !== "isNotEmpty";
}

/** A single rule: `<column> <comparator> <values>`. */
export interface VizFilterCondition {
	id: string;
	kind: "condition";
	column: string;
	comparator: VizFilterComparator;
	/** Selected values; multi-value comparators (eq/neq/contains/numeric) OR across them. */
	values: string[];
}

/** A group of rules / nested groups joined by a single conjunction. */
export interface VizFilterGroup {
	id: string;
	kind: "group";
	conjunction: "AND" | "OR";
	children: VizFilterNode[];
}

export type VizFilterNode = VizFilterCondition | VizFilterGroup;

/** Stable id with a Math.random fallback (matches the rest of the codebase). */
export function vizFilterId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	)
		return crypto.randomUUID();
	return `vf_${Math.random().toString(36).slice(2)}`;
}

export function makeVizFilterCondition(column = ""): VizFilterCondition {
	return {
		id: vizFilterId(),
		kind: "condition",
		column,
		comparator: "eq",
		values: [],
	};
}

export function makeVizFilterGroup(
	conjunction: "AND" | "OR" = "AND",
): VizFilterGroup {
	return { id: vizFilterId(), kind: "group", conjunction, children: [] };
}

/**
 * Does a condition impose a real constraint? A rule with no column, or one whose
 * comparator needs values but has none, is treated as inactive (passes every row)
 * so a half-built rule never blanks the chart.
 */
function conditionIsActive(c: VizFilterCondition): boolean {
	if (!c.column) return false;
	if (!comparatorTakesValues(c.comparator)) return true;
	return (c.values?.length ?? 0) > 0;
}

function evalCondition(
	row: Record<string, unknown>,
	c: VizFilterCondition,
): boolean {
	if (!c.column) return true;
	const raw = row?.[c.column];
	if (c.comparator === "isEmpty")
		return raw == null || String(raw).trim() === "";
	if (c.comparator === "isNotEmpty")
		return !(raw == null || String(raw).trim() === "");

	const values = c.values ?? [];
	if (!values.length) return true; // inactive — no constraint

	const cellStr = raw == null ? "" : String(raw);
	switch (c.comparator) {
		case "eq":
			return values.some((v) => cellStr === v);
		case "neq":
			return values.every((v) => cellStr !== v);
		case "contains":
			return values.some((v) =>
				cellStr.toLowerCase().includes(v.toLowerCase()),
			);
		case "notContains":
			return values.every(
				(v) => !cellStr.toLowerCase().includes(v.toLowerCase()),
			);
		case "gt":
		case "gte":
		case "lt":
		case "lte": {
			const cellNum = Number(raw);
			if (Number.isNaN(cellNum)) return false;
			return values.some((v) => {
				const n = Number(v);
				if (Number.isNaN(n)) return false;
				if (c.comparator === "gt") return cellNum > n;
				if (c.comparator === "gte") return cellNum >= n;
				if (c.comparator === "lt") return cellNum < n;
				return cellNum <= n;
			});
		}
		default:
			return true;
	}
}

/** Evaluate a node (group or condition) against a row. */
export function evalVizFilterNode(
	row: Record<string, unknown>,
	node: VizFilterNode,
): boolean {
	if (node.kind === "group") {
		const active = node.children.filter((ch) =>
			ch.kind === "group" ? true : conditionIsActive(ch),
		);
		if (!active.length) return true;
		return node.conjunction === "AND"
			? active.every((ch) => evalVizFilterNode(row, ch))
			: active.some((ch) => evalVizFilterNode(row, ch));
	}
	return evalCondition(row, node);
}

/** Whether a filter tree contains at least one active constraint. */
export function vizFilterIsActive(root?: VizFilterGroup): boolean {
	if (!root) return false;
	const walk = (n: VizFilterNode): boolean =>
		n.kind === "group" ? n.children.some(walk) : conditionIsActive(n);
	return root.children.some(walk);
}

/** Filter row objects through a Filter-Visualization tree. No-op when inactive. */
export function applyVizFilter<T extends Record<string, unknown>>(
	rows: T[],
	root?: VizFilterGroup,
): T[] {
	if (!Array.isArray(rows) || !rows.length || !vizFilterIsActive(root))
		return rows;
	return rows.filter((row) => evalVizFilterNode(row, root as VizFilterGroup));
}

/**
 * Filter a `{headers, values[][]}` result matrix (the portal's row shape) through a
 * Filter-Visualization tree. No-op when inactive.
 */
export function filterRowMatrix<R extends unknown[]>(
	headers: string[],
	values: R[],
	root?: VizFilterGroup,
): R[] {
	if (!Array.isArray(values) || !values.length || !vizFilterIsActive(root))
		return values;
	return values.filter((rowArr) => {
		const obj: Record<string, unknown> = {};
		headers.forEach((h, i) => {
			obj[h] = rowArr[i];
		});
		return evalVizFilterNode(obj, root as VizFilterGroup);
	});
}
