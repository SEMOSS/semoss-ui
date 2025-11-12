import type { StateStore } from "@semoss/renderer";

// ============================================
// TYPES
// ============================================

export type DependencyType =
	| "blocks"
	| "queries"
	| "cells"
	| "variables"
	| "all";

export interface DependencyResult {
	blocks: string[];
	queries: string[];
	cells: string[];
	variables: string[];
}

export interface DependencyOptions {
	type?: DependencyType;
}

// ============================================
// MAIN FUNCTION
// ============================================

export function findDependentElements(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
	options: DependencyOptions = { type: "all" },
): DependencyResult {
	const result: DependencyResult = {
		blocks: [],
		queries: [],
		cells: [],
		variables: [],
	};

	const { type = "all" } = options;

	// Build mustache pattern based on what was provided
	const mustachePattern =
		queryId && cellId
			? `{{${queryId}--${cellId}}}`
			: queryId
				? `{{${queryId}}}`
				: blockId
					? `{{${blockId}}}`
					: variableId
						? `{{${variableId}}}`
						: "";

	if (!mustachePattern) {
		return result;
	}

	// Helper function to recursively check all string values in an object
	const containsMustachePattern = (obj: unknown): boolean => {
		if (!obj) return false;

		if (typeof obj === "string") {
			return obj.includes(mustachePattern);
		}

		if (Array.isArray(obj)) {
			return obj.some((item) => containsMustachePattern(item));
		}

		if (typeof obj === "object") {
			return Object.values(obj).some((value) =>
				containsMustachePattern(value),
			);
		}

		return false;
	};

	// ============================================
	// SCAN BLOCKS
	// ============================================
	if (type === "all" || type === "blocks") {
		Object.keys(state.blocks || {}).forEach((blockKey) => {
			const block = state.blocks?.[blockKey];
			if (!block) return;

			let found = false;

			// For cell deletion: Check listeners payload for exact queryId + cellId match
			if (queryId && cellId && block.listeners) {
				Object.values(block.listeners).forEach((listener) => {
					if (listener.order && Array.isArray(listener.order)) {
						listener.order.forEach((orderItem) => {
							if (
								orderItem.payload &&
								orderItem.payload.queryId === queryId &&
								orderItem.payload.cellId === cellId
							) {
								found = true;
							}
						});
					}
				});
			}

			// Check all data key-value pairs for mustache pattern
			if (!found && block.data) {
				found = containsMustachePattern(block.data);
			}

			// Check slots for mustache pattern
			if (!found && block.slots) {
				found = containsMustachePattern(block.slots);
			}

			if (found && !result.blocks.includes(blockKey)) {
				result.blocks.push(blockKey);
			}
		});
	}

	// ============================================
	// SCAN QUERIES/CELLS
	// ============================================
	if (type === "all" || type === "queries" || type === "cells") {
		Object.keys(state.queries || {}).forEach((queryKey) => {
			const query = state.queries?.[queryKey];
			if (!query || !query.cells) return;

			const cellsArray = Array.isArray(query.cells)
				? query.cells
				: Object.values(query.cells);

			// For cell deletion: Add the parent query where the target cell belongs
			if (queryId && cellId && queryKey === queryId) {
				if (
					(type === "all" || type === "queries") &&
					!result.queries.includes(queryKey)
				) {
					result.queries.push(queryKey);
				}
			}

			cellsArray.forEach((cell) => {
				if (cell && cell.parameters) {
					// Check all parameters key-value pairs for mustache pattern
					if (containsMustachePattern(cell.parameters)) {
						// Add the query that contains the dependent cell
						if (
							(type === "all" || type === "queries") &&
							!result.queries.includes(queryKey)
						) {
							result.queries.push(queryKey);
						}
						// Add the specific cell that has the dependency
						if (type === "all" || type === "cells") {
							const cellRef = `${queryKey}--${cell.id}`;
							if (!result.cells.includes(cellRef)) {
								result.cells.push(cellRef);
							}
						}
					}
				}
			});
		});
	}

	// ============================================
	// SCAN VARIABLES
	// ============================================
	if (type === "all" || type === "variables") {
		Object.keys(state.variables || {}).forEach((varKey) => {
			const variable = state.variables?.[varKey];
			if (!variable) return;

			let found = false;

			if (queryId && cellId) {
				// For cell deletion: Check if variable points to this exact cell
				if (
					variable.type === "cell" &&
					variable.to === queryId &&
					variable.cellId === cellId
				) {
					found = true;
				}
			} else if (queryId) {
				// For query deletion: Check if variable points to this query
				if (
					(variable.type === "query" && variable.to === queryId) ||
					(variable.type === "cell" && variable.to === queryId)
				) {
					found = true;
				}
			} else if (blockId) {
				// For block deletion: Check if variable references the block
				if (variable.to === blockId) {
					found = true;
				}
			} else if (variableId) {
				// For variable deletion: Check if any variable references this variable
				found = containsMustachePattern(variable);
			}

			if (found && !result.variables.includes(varKey)) {
				result.variables.push(varKey);
			}
		});
	}

	return result;
}

// ============================================
// CONVENIENCE GETTER FUNCTIONS
// ============================================

/**
 * Gets only dependent blocks
 * @returns Array of block IDs that depend on the target element
 */
export function getDependentBlocks(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "blocks",
	}).blocks;
}

/**
 * Gets only dependent queries
 * @returns Array of query IDs that depend on the target element
 */
export function getDependentQueries(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "queries",
	}).queries;
}

/**
 * Gets only dependent cells
 * @returns Array of cell references (format: "queryId--cellId") that depend on the target element
 */
export function getDependentCells(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "cells",
	}).cells;
}

/**
 * Gets only dependent variables
 * @returns Array of variable IDs that depend on the target element
 */
export function getDependentVariables(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "variables",
	}).variables;
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*

// Example 1: Get all dependencies for a cell
const allDeps = findDependentElements(state, "note1", "1");
// Returns: { blocks: ["text--1"], queries: ["note1"], cells: ["note1--2"], variables: ["note1--1"] }

// Example 2: Get only block dependencies for a cell
const blockDeps = getDependentBlocks(state, "note1", "1");
// Returns: ["text--1"]

// Example 3: Get only query dependencies
const queryDeps = getDependentQueries(state, "note1", "1");
// Returns: ["note1"]

// Example 4: Get dependencies with type option
const cellsOnly = findDependentElements(state, "note1", "1", undefined, undefined, { type: 'cells' });
// Returns: { blocks: [], queries: [], cells: ["note1--2"], variables: [] }

// Example 5: Check before deletion
const deps = findDependentElements(state, "note1", "1");
const canDelete = deps.blocks.length === 0 && deps.cells.length === 0;
if (!canDelete) {
  console.warn("Cannot delete - has dependencies:", deps);
}

// Example 6: Query deletion check
const queryDeps = findDependentElements(state, "note1");
console.log(`Query "note1" is used by ${queryDeps.blocks.length} blocks`);

// Example 7: Block deletion check
const blockDeps = findDependentElements(state, undefined, undefined, "text--1");
console.log("Block dependencies:", blockDeps);

// Example 8: Variable deletion check
const varDeps = findDependentElements(state, undefined, undefined, undefined, "mock_var");
console.log("Variable dependencies:", varDeps);

*/
