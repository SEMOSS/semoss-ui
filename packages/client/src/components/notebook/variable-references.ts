/**
 * Shared search logic for finding `{{variableName}}` references throughout
 * the notebook (cell parameters) and the UI builder (block data + listeners).
 *
 * Used by the rename dialog (which rewrites the references) and the edit
 * variable popover (which surfaces them as a read-only impact summary so the
 * user understands what existing cells/blocks will be affected when the
 * variable's type or pointer changes).
 */

import { ActionMessages, type StateStore } from "@semoss/renderer";

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
	Object.keys(state.notebooks).forEach((qid) => {
		const notebook = state.notebooks[qid];
		if (!notebook) return;
		notebook.list.forEach((cid) => {
			const cell = notebook.getCell(cid);
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

const getStringByPath = (root: unknown, path: string[]): string | undefined => {
	let node: unknown = root;
	for (const seg of path) {
		if (node == null || typeof node !== "object") return undefined;
		node = (node as Record<string, unknown>)[seg];
	}
	return typeof node === "string" ? node : undefined;
};

/**
 * Rewrite every `{{oldName}}` (and `{{oldName.path}}`) reference found in
 * `refs` to use `newName` instead. Walks cell parameters, block data, and
 * block listeners and dispatches the appropriate update action for each
 * mutation. Caller is responsible for updating the variable alias in the
 * store (via RENAME_VARIABLE or EDIT_VARIABLE) — this helper only fixes the
 * call sites.
 */
export const rewriteVariableReferences = (
	state: StateStore,
	oldName: string,
	newName: string,
	refs: ReferenceHit[],
): void => {
	const escaped = escapeRegex(oldName);
	const replaceRegex = new RegExp(
		`\\{\\{\\s*${escaped}(?:\\.[^}\\s]+)?\\s*\\}\\}`,
		"g",
	);
	const rewriteMatch = (match: string) =>
		match.replace(new RegExp(`\\{\\{\\s*${escaped}`), `{{${newName}`);

	const cellPaths = new Map<
		string,
		{ queryId: string; cellId: string; path: string[] }
	>();
	const blockDataPaths = new Map<
		string,
		{ blockId: string; dataPath: string[] }
	>();
	const blockListeners = new Map<
		string,
		{ blockId: string; listenerName: string }
	>();

	refs.forEach((hit) => {
		if (hit.kind === "cell" && hit.queryId && hit.cellId) {
			const key = `${hit.queryId}--${hit.cellId}--${hit.pathLabel}`;
			if (!cellPaths.has(key)) {
				cellPaths.set(key, {
					queryId: hit.queryId,
					cellId: hit.cellId,
					path: hit.path,
				});
			}
			return;
		}
		if (hit.kind === "block" && hit.blockId) {
			if (hit.path[0] === "data") {
				const dataPath = hit.path.slice(1);
				const key = `${hit.blockId}--${dataPath.join(".")}`;
				if (!blockDataPaths.has(key)) {
					blockDataPaths.set(key, {
						blockId: hit.blockId,
						dataPath,
					});
				}
			} else if (hit.path[0] === "listeners" && hit.path[1]) {
				const listenerName = hit.path[1];
				const key = `${hit.blockId}--${listenerName}`;
				if (!blockListeners.has(key)) {
					blockListeners.set(key, {
						blockId: hit.blockId,
						listenerName,
					});
				}
			}
		}
	});

	cellPaths.forEach(({ queryId, cellId, path }) => {
		const notebook = state.notebooks[queryId];
		if (!notebook) return;
		const cell = notebook.getCell(cellId);
		if (!cell) return;
		const current = getStringByPath({ parameters: cell.parameters }, path);
		if (typeof current !== "string") return;
		const next = current.replace(replaceRegex, rewriteMatch);
		if (next !== current) {
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId,
					cellId,
					path: path.join("."),
					value: next,
				},
			});
		}
	});

	blockDataPaths.forEach(({ blockId, dataPath }) => {
		const block = state.blocks[blockId];
		if (!block) return;
		const current = getStringByPath(
			{ data: (block as { data?: unknown }).data },
			["data", ...dataPath],
		);
		if (typeof current !== "string") return;
		const next = current.replace(replaceRegex, rewriteMatch);
		if (next !== current) {
			state.dispatch({
				message: ActionMessages.SET_BLOCK_DATA,
				payload: {
					id: blockId,
					path: dataPath.join("."),
					value: next,
				},
			});
		}
	});

	// Listeners are JSON trees of action params; the simplest correct rewrite is
	// stringify → regex-replace → parse → SET_LISTENER. Preserves listener type
	// (sync/async) and nested action order.
	blockListeners.forEach(({ blockId, listenerName }) => {
		const block = state.blocks[blockId];
		if (!block) return;
		const listeners = (
			block as {
				listeners?: Record<
					string,
					{ order: unknown[]; type: "sync" | "async" }
				>;
			}
		).listeners;
		const listener = listeners?.[listenerName];
		if (!listener) return;
		const stringified = JSON.stringify(listener);
		const rewritten = stringified.replace(replaceRegex, rewriteMatch);
		if (rewritten === stringified) return;
		let parsed: { order: unknown[]; type: "sync" | "async" };
		try {
			parsed = JSON.parse(rewritten);
		} catch (e) {
			console.error("Failed to parse rewritten listener JSON", e);
			return;
		}
		state.dispatch({
			message: ActionMessages.SET_LISTENER,
			payload: {
				id: blockId,
				listener: listenerName,
				actions: parsed.order as never,
				type: parsed.type,
			},
		});
	});
};
