import type {
	Block,
	NotebookState,
	StateStore,
	Variable,
} from "@semoss/renderer";

type ReplaceSection = "blocks" | "notebooks" | "variables" | "all" | "";
type Replacements = Record<string, string>;

export interface ReplaceTargets {
	queryId?: string;
	cellId?: string;
	blockId?: string;
	variableId?: string;
}

export interface ReplaceOptions {
	replaceSection?: ReplaceSection;
	replaceInListenerStrings?: boolean;
}

// ----------------------------
// Helpers
// ----------------------------
const deepClone = <T>(value: T): T => {
	// Check if structuredClone exists in the global scope
	if (typeof structuredClone !== "undefined") {
		try {
			return structuredClone(value);
		} catch {
			// Fall through to JSON clone if structuredClone fails
		}
	}
	// Fallback to JSON clone for environments without structuredClone
	return JSON.parse(JSON.stringify(value)) as T;
};

const buildMustachePattern = (targets: ReplaceTargets): string => {
	if (targets.queryId && targets.cellId)
		return `{{${targets.queryId}--${targets.cellId}}}`;
	if (targets.queryId) return `{{${targets.queryId}}}`;
	if (targets.blockId) return `{{${targets.blockId}}}`;
	if (targets.variableId) return `{{${targets.variableId}}}`;
	return "";
};

const parseReplacementRef = (ref: string, currentQueryId?: string) => {
	if (ref.includes("--")) {
		const [newQueryId, newCellId] = ref.split("--");
		return { newQueryId, newCellId };
	}
	return { newQueryId: currentQueryId, newCellId: ref };
};

const toMustache = (ref: string) => `{{${ref}}}`;

const replaceInString = (text: string, from: string, to: string): string => {
	return text.replaceAll(from, to);
};

// Recursive walk with proper typing
const walkAndReplace = <T>(
	value: T,
	fromPattern: string,
	toPattern: string,
): T => {
	if (typeof value === "string") {
		if (!fromPattern) return value;
		return replaceInString(value, fromPattern, toPattern) as T;
	}
	if (Array.isArray(value)) {
		return value.map((v) => walkAndReplace(v, fromPattern, toPattern)) as T;
	}
	if (value !== null && typeof value === "object") {
		const obj = value as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(obj)) {
			out[k] = walkAndReplace(v, fromPattern, toPattern);
		}
		return out as T;
	}
	return value;
};

const rewriteListenerPayloads = (
	listeners: Block["listeners"] | undefined,
	targets: ReplaceTargets,
	replacementRef: string,
): void => {
	if (!listeners) return;

	const {
		queryId: tgtQ,
		cellId: tgtC,
		blockId: tgtB,
		variableId: tgtV,
	} = targets;

	Object.values(listeners).forEach((listener) => {
		if (!listener.order) return;

		listener.order.forEach((orderItem) => {
			const payload = orderItem.payload as Record<string, unknown>;
			if (!payload) return;

			// Cell-targeted rewrite (RunCellAction)
			if (
				tgtQ &&
				tgtC &&
				"queryId" in payload &&
				"cellId" in payload &&
				(payload.queryId as string) === tgtQ &&
				(payload.cellId as string) === tgtC
			) {
				const { newQueryId, newCellId } = parseReplacementRef(
					replacementRef,
					tgtQ,
				);
				if (newQueryId) (payload.queryId as string) = newQueryId;
				if (newCellId) (payload.cellId as string) = newCellId;
				return;
			}

			// Notebook-targeted rewrite (RunNotebookAction | RunCellAction)
			if (
				tgtQ &&
				!tgtC &&
				"queryId" in payload &&
				(payload.queryId as string) === tgtQ
			) {
				const { newQueryId, newCellId } = parseReplacementRef(
					replacementRef,
					tgtQ,
				);
				if (newQueryId) (payload.queryId as string) = newQueryId;
				if (newCellId && "cellId" in payload)
					(payload.cellId as string) = newCellId;
				return;
			}

			// Block-targeted rewrite (ModifyVariableAction)
			if (
				tgtB &&
				"blockId" in payload &&
				(payload.blockId as string) === tgtB
			) {
				(payload.blockId as string) = replacementRef;
				return;
			}

			// Variable-targeted (ModifyVariableAction)
			if (
				tgtV &&
				"variable" in payload &&
				(payload.variable as string) === tgtV
			) {
				(payload.variable as string) = replacementRef;
			}
		});
	});
};

// ----------------------------
// Section-specific replacers
// ----------------------------
const replaceInBlock = (
	state: StateStore,
	blockId: string,
	targets: ReplaceTargets,
	replacementRef: string,
	opts: Required<Pick<ReplaceOptions, "replaceInListenerStrings">>,
): StateStore => {
	if (!state.blocks?.[blockId]) return state;
	const next = deepClone(state);
	const block = next.blocks?.[blockId];
	if (!block) return state;

	const fromPattern = buildMustachePattern(targets);
	const toPattern = toMustache(replacementRef);

	rewriteListenerPayloads(
		block.listeners as Block["listeners"] | undefined,
		targets,
		replacementRef,
	);

	if (fromPattern) {
		if (block.data)
			block.data = walkAndReplace(block.data, fromPattern, toPattern);
		if (block.slots)
			block.slots = walkAndReplace(block.slots, fromPattern, toPattern);
		if (opts.replaceInListenerStrings && block.listeners) {
			block.listeners = walkAndReplace(
				block.listeners,
				fromPattern,
				toPattern,
			);
		}
	}

	return next;
};

const replaceInVariable = (
	state: StateStore,
	variableId: string,
	targets: ReplaceTargets,
	replacementRef: string,
): StateStore => {
	if (!state.variables?.[variableId]) return state;
	const next = deepClone(state);
	const v = next.variables?.[variableId];
	if (!v) return state;

	const fromPattern = buildMustachePattern(targets);
	const toPattern = toMustache(replacementRef);

	if (v.type === "cell" && targets.queryId && targets.cellId) {
		if (v.to === targets.queryId && v.cellId === targets.cellId) {
			const { newQueryId, newCellId } = parseReplacementRef(
				replacementRef,
				targets.queryId,
			);
			if (newQueryId) v.to = newQueryId;
			if (newCellId) v.cellId = newCellId;
		}
	} else if (v.type === "query" && targets.queryId && !targets.cellId) {
		if (v.to === targets.queryId) {
			const { newQueryId } = parseReplacementRef(
				replacementRef,
				targets.queryId,
			);
			if (newQueryId) v.to = newQueryId;
		}
	}

	if (fromPattern) {
		(next.variables as Record<string, Variable>)[variableId] =
			walkAndReplace(v, fromPattern, toPattern);
	}

	return next;
};

const replaceInNotebook = (
	state: StateStore,
	queryKey: string,
	targets: ReplaceTargets,
	replacementRef: string,
): StateStore => {
	if (!state.notebooks?.[queryKey]) return state;
	const next = deepClone(state);
	const query = next.notebooks?.[queryKey];
	if (!query) return state;

	const fromPattern = buildMustachePattern(targets);
	const toPattern = toMustache(replacementRef);

	// Handle both array and object-based cells
	if (Array.isArray(query.cells)) {
		const updatedCells = query.cells.map((cell) => {
			if (!cell?.parameters) return cell;

			const updatedParameters = walkAndReplace(
				cell.parameters,
				fromPattern,
				toPattern,
			);

			// Return a new cell with all properties preserved
			return {
				...cell,
				parameters: updatedParameters,
			};
		});

		// Create a new query object with updated cells
		(next.notebooks as Record<string, NotebookState>)[queryKey] = {
			...query,
			cells: updatedCells,
		} as unknown as NotebookState;
	} else if (query.cells && typeof query.cells === "object") {
		const cellsObject = { ...(query.cells as Record<string, unknown>) };

		for (const [cellId, cell] of Object.entries(cellsObject)) {
			if (cell && typeof cell === "object" && "parameters" in cell) {
				const typedCell = cell as {
					parameters: unknown;
					[key: string]: unknown;
				};

				if (typedCell.parameters) {
					const updatedParameters = walkAndReplace(
						typedCell.parameters,
						fromPattern,
						toPattern,
					);

					cellsObject[cellId] = {
						...typedCell,
						parameters: updatedParameters,
					};
				}
			}
		}

		// Create a new query object with updated cells
		(next.notebooks as Record<string, NotebookState>)[queryKey] = {
			...query,
			cells: cellsObject,
		} as typeof query;
	}

	return next;
};

// ----------------------------
// Main API
// ----------------------------
export function replaceDependentReferences(
	state: StateStore,
	replacements: Replacements,
	targets: ReplaceTargets,
	options: ReplaceOptions = {},
): StateStore {
	const replaceSection = options.replaceSection ?? "all";
	const replaceInListenerStrings = options.replaceInListenerStrings ?? true;

	let next = deepClone(state);

	const applyByKey = (key: string, value: string) => {
		const isBlocks =
			replaceSection === "blocks" ||
			replaceSection === "all" ||
			replaceSection === "";
		const isNotebooks =
			replaceSection === "notebooks" ||
			replaceSection === "all" ||
			replaceSection === "";
		const isVars =
			replaceSection === "variables" ||
			replaceSection === "all" ||
			replaceSection === "";

		if (isBlocks && next.blocks?.[key]) {
			next = replaceInBlock(next, key, targets, value, {
				replaceInListenerStrings,
			});
			return;
		}
		if (isNotebooks && next.notebooks?.[key]) {
			next = replaceInNotebook(next, key, targets, value);
			return;
		}
		if (isVars && next.variables?.[key]) {
			next = replaceInVariable(next, key, targets, value);
			return;
		}

		if (replaceSection === "blocks" && next.blocks?.[key]) {
			next = replaceInBlock(next, key, targets, value, {
				replaceInListenerStrings,
			});
		} else if (replaceSection === "notebooks" && next.notebooks?.[key]) {
			next = replaceInNotebook(next, key, targets, value);
		} else if (replaceSection === "variables" && next.variables?.[key]) {
			next = replaceInVariable(next, key, targets, value);
		}
	};

	for (const [k, v] of Object.entries(replacements)) {
		applyByKey(k, v);
	}

	return next;
}

// ----------------------------
// Convenience wrappers
// ----------------------------
export const replaceInBlocks = (
	state: StateStore,
	replacements: Replacements,
	targets: ReplaceTargets,
	options?: Omit<ReplaceOptions, "replaceSection">,
): StateStore =>
	replaceDependentReferences(state, replacements, targets, {
		...options,
		replaceSection: "blocks",
	});

export const replaceInNotebooks = (
	state: StateStore,
	replacements: Replacements,
	targets: ReplaceTargets,
	options?: Omit<ReplaceOptions, "replaceSection">,
): StateStore =>
	replaceDependentReferences(state, replacements, targets, {
		...options,
		replaceSection: "notebooks",
	});

export const replaceInVariables = (
	state: StateStore,
	replacements: Replacements,
	targets: ReplaceTargets,
	options?: Omit<ReplaceOptions, "replaceSection">,
): StateStore =>
	replaceDependentReferences(state, replacements, targets, {
		...options,
		replaceSection: "variables",
	});
