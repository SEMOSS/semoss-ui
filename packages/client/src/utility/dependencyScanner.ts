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

export type DependencyDirection = "dependents" | "dependencies";

export interface DependencyResult {
	blocks: string[];
	queries: string[];
	cells: string[];
	variables: string[];
}

export interface DependencyOptions {
	type?: DependencyType;
	direction?: DependencyDirection;
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
	options: DependencyOptions = { type: "all", direction: "dependents" },
): DependencyResult {
	const result: DependencyResult = {
		blocks: [],
		queries: [],
		cells: [],
		variables: [],
	};

	const { type = "all", direction = "dependents" } = options;

	// Handle reverse lookup - finding what the element uses
	if (direction === "dependencies") {
		return findElementDependencies(
			state,
			queryId,
			cellId,
			blockId,
			variableId,
			type,
		);
	}

	// Original logic - finding what uses the element (dependents)
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
								typeof orderItem.payload === "object" &&
								"queryId" in orderItem.payload &&
								"cellId" in orderItem.payload &&
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
// HELPER: FIND WHAT AN ELEMENT USES (REVERSE)
// ============================================

function findElementDependencies(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
	type: DependencyType = "all",
): DependencyResult {
	const result: DependencyResult = {
		blocks: [],
		queries: [],
		cells: [],
		variables: [],
	};

	// Helper to extract mustache variables from a string
	const extractMustacheVariables = (str: string): string[] => {
		const regex = /\{\{([^}]+)\}\}/g;
		const matches: string[] = [];
		let match: RegExpExecArray | null;

		match = regex.exec(str);

		while (match !== null) {
			matches.push(match[1].trim());
			match = regex.exec(str);
		}

		return matches;
	};

	// Helper to recursively extract all mustache variables from an object
	const extractAllMustacheVariables = (obj: unknown): string[] => {
		const variables: string[] = [];

		if (typeof obj === "string") {
			variables.push(...extractMustacheVariables(obj));
		} else if (Array.isArray(obj)) {
			for (const item of obj) {
				variables.push(...extractAllMustacheVariables(item));
			}
		} else if (obj && typeof obj === "object") {
			for (const value of Object.values(obj)) {
				variables.push(...extractAllMustacheVariables(value));
			}
		}

		return variables;
	};

	// Helper to categorize extracted references
	const categorizeReference = (ref: string) => {
		// Check if it's a cell reference (format: queryId--cellId)
		if (ref.includes("--")) {
			const [refQueryId] = ref.split("--");
			if (type === "all" || type === "cells") {
				if (!result.cells.includes(ref)) {
					result.cells.push(ref);
				}
			}
			if (type === "all" || type === "queries") {
				if (!result.queries.includes(refQueryId)) {
					result.queries.push(refQueryId);
				}
			}
		} else {
			// Check if it's a variable
			const variable = state.variables?.[ref];
			if (variable) {
				if (type === "all" || type === "variables") {
					if (!result.variables.includes(ref)) {
						result.variables.push(ref);
					}
				}
				// If variable points to a query/cell, add those too
				if (variable.to) {
					if (variable.type === "cell" && variable.cellId) {
						const cellRef = `${variable.to}--${variable.cellId}`;
						if (type === "all" || type === "cells") {
							if (!result.cells.includes(cellRef)) {
								result.cells.push(cellRef);
							}
						}
					}
					if (type === "all" || type === "queries") {
						if (!result.queries.includes(variable.to)) {
							result.queries.push(variable.to);
						}
					}
				}
			} else if (state.queries?.[ref]) {
				// It's a direct query reference
				if (type === "all" || type === "queries") {
					if (!result.queries.includes(ref)) {
						result.queries.push(ref);
					}
				}
			} else if (state.blocks?.[ref]) {
				// It's a block reference
				if (type === "all" || type === "blocks") {
					if (!result.blocks.includes(ref)) {
						result.blocks.push(ref);
					}
				}
			}
		}
	};

	// Find what the specified element uses
	if (blockId) {
		const block = state.blocks?.[blockId];
		if (block) {
			if (block.data) {
				const refs = extractAllMustacheVariables(block.data);
				refs.forEach(categorizeReference);
			}
			if (block.slots) {
				const refs = extractAllMustacheVariables(block.slots);
				refs.forEach(categorizeReference);
			}
			if (block.listeners) {
				Object.values(block.listeners).forEach((listener) => {
					if (listener.order) {
						listener.order.forEach((orderItem) => {
							if (
								orderItem.payload &&
								typeof orderItem.payload === "object" &&
								"queryId" in orderItem.payload
							) {
								const payload = orderItem.payload as {
									queryId?: string;
									cellId?: string;
								};
								if (payload.queryId) {
									if (type === "all" || type === "queries") {
										if (
											!result.queries.includes(
												payload.queryId,
											)
										) {
											result.queries.push(
												payload.queryId,
											);
										}
									}
									if (payload.cellId) {
										const cellRef = `${payload.queryId}--${payload.cellId}`;
										if (
											type === "all" ||
											type === "cells"
										) {
											if (
												!result.cells.includes(cellRef)
											) {
												result.cells.push(cellRef);
											}
										}
									}
								}
							}
						});
					}
				});
			}
		}
	} else if (queryId && cellId) {
		const query = state.queries?.[queryId];
		if (query) {
			const cellsArray = Array.isArray(query.cells)
				? query.cells
				: Object.values(query.cells);
			const cell = cellsArray.find((c) => c.id === cellId);
			if (cell?.parameters) {
				const refs = extractAllMustacheVariables(cell.parameters);
				refs.forEach(categorizeReference);
			}
		}
	} else if (queryId) {
		const query = state.queries?.[queryId];
		if (query) {
			const cellsArray = Array.isArray(query.cells)
				? query.cells
				: Object.values(query.cells);
			cellsArray.forEach((cell) => {
				if (cell?.parameters) {
					const refs = extractAllMustacheVariables(cell.parameters);
					refs.forEach(categorizeReference);
				}
			});
		}
	} else if (variableId) {
		const variable = state.variables?.[variableId];
		if (variable) {
			if (variable.to) {
				if (variable.type === "query") {
					if (type === "all" || type === "queries") {
						if (!result.queries.includes(variable.to)) {
							result.queries.push(variable.to);
						}
					}
				} else if (variable.type === "cell" && variable.cellId) {
					const cellRef = `${variable.to}--${variable.cellId}`;
					if (type === "all" || type === "cells") {
						if (!result.cells.includes(cellRef)) {
							result.cells.push(cellRef);
						}
					}
					if (type === "all" || type === "queries") {
						if (!result.queries.includes(variable.to)) {
							result.queries.push(variable.to);
						}
					}
				}
			}
		}
	}

	return result;
}

// ============================================
// CONVENIENCE GETTER FUNCTIONS - DEPENDENTS (what uses this)
// ============================================

export function getDependentBlocks(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "blocks",
		direction: "dependents",
	}).blocks;
}

export function getDependentQueries(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "queries",
		direction: "dependents",
	}).queries;
}

export function getDependentCells(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "cells",
		direction: "dependents",
	}).cells;
}

export function getDependentVariables(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "variables",
		direction: "dependents",
	}).variables;
}

// ============================================
// CONVENIENCE GETTER FUNCTIONS - DEPENDENCIES (what this uses)
// ============================================

export function getDependencyBlocks(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "blocks",
		direction: "dependencies",
	}).blocks;
}

export function getDependencyQueries(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "queries",
		direction: "dependencies",
	}).queries;
}

export function getDependencyCells(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "cells",
		direction: "dependencies",
	}).cells;
}

export function getDependencyVariables(
	state: StateStore,
	queryId?: string,
	cellId?: string,
	blockId?: string,
	variableId?: string,
): string[] {
	return findDependentElements(state, queryId, cellId, blockId, variableId, {
		type: "variables",
		direction: "dependencies",
	}).variables;
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*

// ========== FINDING DEPENDENTS (what uses this element) ==========

// Example 1: Get all dependents for a cell
const dependents = findDependentElements(state, "note1", "1");
// Returns: { blocks: ["text--1"], queries: ["note1"], cells: ["note1--2"], variables: ["note1--1"] }

// Example 2: Get only block dependents
const blockDeps = getDependentBlocks(state, "note1", "1");
// Returns: ["text--1"]

// Example 3: Get only query dependents
const queryDeps = getDependentQueries(state, "note1", "1");
// Returns: ["note1"]

// Example 4: Get only cell dependents
const cellDeps = getDependentCells(state, "note1", "1");
// Returns: ["note1--2"]

// Example 5: Get only variable dependents
const varDeps = getDependentVariables(state, "note1", "1");
// Returns: ["note1--1"]


// ========== FINDING DEPENDENCIES (what this element uses) ==========

// Example 6: Find what a cell uses (all types)
const cellUses = findDependentElements(state, "note1", "2", undefined, undefined, { 
  direction: "dependencies" 
});
// Returns: { blocks: [], queries: [], cells: ["note1--1"], variables: [] }

// Example 7: Get only blocks that a cell uses
const blocksUsed = getDependencyBlocks(state, "note1", "2");
// Returns: []

// Example 8: Get only queries that a cell uses
const queriesUsed = getDependencyQueries(state, "note1", "2");
// Returns: []

// Example 9: Get only cells that a cell uses
const cellsUsed = getDependencyCells(state, "note1", "2");
// Returns: ["note1--1"]

// Example 10: Get only variables that a block uses
const varsUsed = getDependencyVariables(state, undefined, undefined, "text--2");
// Returns: ["mock_var"]

// Example 11: Find what a block uses (all types)
const blockUses = findDependentElements(state, undefined, undefined, "text--1", undefined, { 
  direction: "dependencies" 
});
// Returns: { blocks: [], queries: ["note1"], cells: ["note1--1"], variables: [] }

// Example 12: Get only queries that a block uses
const blockQueriesUsed = getDependencyQueries(state, undefined, undefined, "text--1");
// Returns: ["note1"]

// Example 13: Check before deletion (ensure no dependents)
const deps = findDependentElements(state, "note1", "1");
const canDelete = deps.blocks.length === 0 && deps.cells.length === 0;
if (!canDelete) {
  console.warn("Cannot delete - has dependents:", deps);
}

// Example 14: Analyze impact of modification (what will be affected)
const impact = findDependentElements(state, "note1", "1");
console.log(`Modifying note1--1 will affect:`);
console.log(`- ${impact.blocks.length} blocks`);
console.log(`- ${impact.cells.length} cells`);
console.log(`- ${impact.variables.length} variables`);

*/
