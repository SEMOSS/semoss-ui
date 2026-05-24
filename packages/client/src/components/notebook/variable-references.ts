/**
 * Shared search logic for finding `{{variableName}}` references throughout
 * the notebook (cell parameters) and the UI builder (block data + listeners).
 *
 * Used by the rename dialog (which rewrites the references) and the edit
 * variable popover (which surfaces them as a read-only impact summary so the
 * user understands what existing cells/blocks will be affected when the
 * variable's type or pointer changes).
 */

import type { StateStore } from "@semoss/renderer";

export interface ReferenceHit {
	key: string;
	kind: "cell" | "block";
	// cell-only
	queryId?: string;
	cellId?: string;
	// block-only
	blockId?: string;
	/**
	 * Path under the source root.
	 * - Cell: starts with "parameters", e.g. ["parameters", "code"].
	 * - Block: starts with "data" or "listeners", e.g. ["data", "text"]
	 *   or ["listeners", "onClick", "order", "0", "payload"].
	 */
	path: string[];
	pathLabel: string;
	sourceLabel: string;
	widget: string;
	snippet: string;
}

const escapeRegex = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const makeSnippet = (value: string, idx: number, len: number) => {
	const start = Math.max(0, idx - 28);
	const end = Math.min(value.length, idx + len + 28);
	const prefix = start > 0 ? "…" : "";
	const suffix = end < value.length ? "…" : "";
	return prefix + value.slice(start, end).replace(/\s+/g, " ") + suffix;
};

const walkStrings = (
	node: unknown,
	basePath: string[],
	out: { path: string[]; value: string }[],
) => {
	if (node == null) return;
	if (typeof node === "string") {
		out.push({ path: basePath, value: node });
		return;
	}
	if (Array.isArray(node)) {
		node.forEach((item, i) => {
			walkStrings(item, [...basePath, String(i)], out);
		});
		return;
	}
	if (typeof node === "object") {
		Object.keys(node as Record<string, unknown>).forEach((k) => {
			walkStrings(
				(node as Record<string, unknown>)[k],
				[...basePath, k],
				out,
			);
		});
	}
};

/**
 * Find every `{{name}}` (and dotted `{{name.path}}`) reference in cell
 * parameters + block data/listeners for the given variable name.
 */
export const findVariableReferences = (
	state: StateStore,
	name: string,
): ReferenceHit[] => {
	if (!name) return [];
	const escaped = escapeRegex(name);
	const refRegex = new RegExp(
		`\\{\\{\\s*${escaped}(?:\\.[^}\\s]+)?\\s*\\}\\}`,
		"g",
	);
	const hits: ReferenceHit[] = [];

	// Cells
	Object.keys(state.queries).forEach((qid) => {
		const query = state.queries[qid];
		if (!query) return;
		query.list.forEach((cid) => {
			const cell = query.getCell(cid);
			if (!cell) return;
			const cellLabel = state.getAlias(qid, cid) || cid;
			const leaves: { path: string[]; value: string }[] = [];
			walkStrings(cell.parameters ?? {}, ["parameters"], leaves);
			leaves.forEach((leaf) => {
				refRegex.lastIndex = 0;
				const matches = [...leaf.value.matchAll(refRegex)];
				matches.forEach((m, mi) => {
					hits.push({
						key: `cell--${qid}--${cid}--${leaf.path.join(".")}--${mi}`,
						kind: "cell",
						queryId: qid,
						cellId: cid,
						path: leaf.path,
						pathLabel: leaf.path.join("."),
						sourceLabel: cellLabel,
						widget: cell.widget,
						snippet: makeSnippet(
							leaf.value,
							m.index ?? 0,
							m[0].length,
						),
					});
				});
			});
		});
	});

	// Blocks — data + listeners
	Object.keys(state.blocks ?? {}).forEach((bid) => {
		const block = state.blocks[bid];
		if (!block) return;
		const leaves: { path: string[]; value: string }[] = [];
		walkStrings((block as { data?: unknown }).data ?? {}, ["data"], leaves);
		walkStrings(
			(block as { listeners?: unknown }).listeners ?? {},
			["listeners"],
			leaves,
		);
		leaves.forEach((leaf) => {
			refRegex.lastIndex = 0;
			const matches = [...leaf.value.matchAll(refRegex)];
			matches.forEach((m, mi) => {
				hits.push({
					key: `block--${bid}--${leaf.path.join(".")}--${mi}`,
					kind: "block",
					blockId: bid,
					path: leaf.path,
					pathLabel: leaf.path.join("."),
					sourceLabel: bid,
					widget: block.widget,
					snippet: makeSnippet(leaf.value, m.index ?? 0, m[0].length),
				});
			});
		});
	});

	return hits;
};

/**
 * Style to disable font ligatures (em-dash on `--`, etc.) when rendering
 * variable identifiers in `font-mono` spans. Without this, names like
 * `notebook1--2` visually appear as `notebook1—2`.
 */
export const noLigatureStyle = {
	fontVariantLigatures: "none",
	fontFeatureSettings: '"liga" 0, "calt" 0',
} as const;

/**
 * Count unique source locations (cells + blocks) in a hit list.
 */
export const countAffectedSources = (refs: ReferenceHit[]): number => {
	const set = new Set<string>();
	refs.forEach((r) => {
		set.add(
			r.kind === "cell"
				? `cell--${r.queryId}--${r.cellId}`
				: `block--${r.blockId}`,
		);
	});
	return set.size;
};
