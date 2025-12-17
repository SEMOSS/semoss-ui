import { makeAutoObservable, runInAction, toJS } from "mobx";
import { download, Env, runPixel } from "@semoss/sdk/react";
import {
	cancellablePromise,
	getValueByPath,
	syncronousPromise,
} from "../../utility";
import type { CellStateConfig } from "./cell.state";
import { STATE_VERSION } from "./migration/MigrationManager";
import { QueryState, type QueryStateConfig } from "./query.state";
import {
	ActionMessages,
	type Actions,
	type AddBlockAction,
	type MoveBlockAction,
	type RemoveBlockAction,
} from "./state.actions";
import type {
	Block,
	BlockJSON,
	CellRegistry,
	Frame,
	ListenerActions,
	SerializedState,
	Variable,
	VariableType,
	VariableWithId,
} from "./state.types";

interface StateStoreInterface {
	/** Mode */
	mode: "interactive" | "static";

	/** insightID to load */
	insightId: string;

	/** token to reference (blocks, cells, constants) */
	variables: Record<string, Variable>;

	/** Queries rendered in the insight */
	queries: Record<string, QueryState>;

	/** Blocks rendered in the insight */
	blocks: Record<string, Block>;

	/** Frames stored in the insight */
	frames: Record<string, Frame>;

	/** Cells registered to the insight */
	cellRegistry: CellRegistry;

	/** What version the state store we currently are on link: https://semver.org/ */
	version: string;

	/** Order of how we consume app as API */
	executionOrder: string[];
}

export class StateStoreConfig {
	/** Mode */
	mode: "interactive" | "static";

	/** insightID to load */
	insightId: string;

	/** State to load into the store */
	state: SerializedState;

	/** Cells registered to the insight */
	cellRegistry: CellRegistry;
}

/**
 * Hold the state information for the insight
 */
export class StateStore {
	private _store: StateStoreInterface = {
		mode: "interactive",
		insightId: "",
		version: "",
		queries: {},
		blocks: {},
		frames: {},
		cellRegistry: {},
		variables: {},
		executionOrder: [],
	};

	/**
	 * Utility variables
	 */
	private _utils: {
		/**
		 * Track any executing queries
		 */
		queryPromises: Record<
			string,
			ReturnType<typeof cancellablePromise> | null
		>;
	} = {
		queryPromises: {},
	};

	constructor(config: StateStoreConfig) {
		// save the connected insight
		this._store.insightId = config.insightId;

		// set the mode of the store based on how it is being used
		this._store.mode = config.mode;

		// register the cells
		this._store.cellRegistry = config.cellRegistry || {};

		// make it observable
		makeAutoObservable(this);

		// set the initial state after reactive to invoke it
		this.setState(config.state);
	}

	/**
	 * Getters
	 */
	/**
	 * Get the mode
	 * @returns the mode
	 */
	get mode() {
		return this._store.mode;
	}

	/**
	 * Get the Insight ID
	 * @returns the Insight ID
	 */
	get insightId() {
		return this._store.insightId;
	}

	/**
	 * Get the blocks
	 * @returns the blocks
	 */
	get blocks() {
		return this._store.blocks;
	}

	/**
	 * Get the queries
	 * @returns the queries
	 */
	get queries() {
		return this._store.queries;
	}

	/**
	 * Gets all tokens
	 * @returns the tokens
	 */
	get variables() {
		return this._store.variables;
	}

	/**
	 * Gets ordered list of sheet ids
	 * @returns the order sheets should be executed
	 */
	get executionOrder() {
		return this._store.executionOrder;
	}

	/**
	 * Get the cell type registry
	 * @returns the cell type registry
	 */
	get cellRegistry() {
		return this._store.cellRegistry;
	}

	/**
	 * Get the specific block information
	 * @param id - id of the block to get
	 * @returns the specific block information
	 */
	getBlock(id: string) {
		if (this._store.blocks[id]) {
			return this._store.blocks[id];
		}

		return null;
	}

	/**
	 * Get all blocks of a specific type
	 * @param type - type of the block to get
	 * @returns all blocks of the specific type
	 */
	getAllBlocksOfType(type: string) {
		return Object.values(this._store.blocks).filter(
			(block) => block.widget === type,
		);
	}

	/**
	 * Get all parents of a block
	 * @param nodeId - id of the block to get the parents of
	 * @returns all parents of the block
	 */
	getAllParents(nodeId: string) {
		let selected = nodeId;
		const parents = [];
		while (selected) {
			parents.push(selected);
			selected = this._store.blocks[selected]?.parent?.id;
		}
		return parents;
	}

	/**
	 * Get a specific queries's state
	 * @param id - id of the queries to get
	 * @returns the specific block information
	 */
	getQuery(id: string): QueryState | null {
		if (this._store.queries[id]) {
			return this._store.queries[id];
		}

		return null;
	}

	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// TODO: Sorry, trying to start getting team to see ai gen while im out
	// Decouple this code below and handle in workspace via dispatch
	// Create classes for cell and variable
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------

	/**
	 * Apply the suggested variable name changes throughout the state store
	 * This method handles the JSON manipulation to update all references
	 * @param suggestedChanges - Object mapping old variable names to new suggested names
	 * @returns boolean indicating success
	 */
	async applyVariableRenames(
		suggestedChanges: Record<string, string>,
	): Promise<boolean> {
		try {
			console.log("Applying variable renames:", suggestedChanges);

			// 1. Update variables object - rename the keys
			Object.entries(suggestedChanges).forEach(([oldName, newName]) => {
				if (this._store.variables[oldName]) {
					// Copy the variable data to the new name
					this._store.variables[newName] =
						this._store.variables[oldName];
					// Remove the old variable
					delete this._store.variables[oldName];
				}
			});

			// 2. Update all blocks data - replace variable references in strings
			Object.values(this._store.blocks).forEach((block) => {
				this.updateBlockVariableReferences(block, suggestedChanges);
			});

			// 3. Update all queries and cells - replace variable references
			Object.values(this._store.queries).forEach((query) => {
				this.updateQueryVariableReferences(query, suggestedChanges);
			});

			console.log("Variable renames applied successfully");
			return true;
		} catch (error) {
			console.error("Error applying variable renames:", error);
			return false;
		}
	}

	/**
	 * Update variable references within a block's data
	 * @param block - The block to update
	 * @param suggestedChanges - Mapping of old to new variable names
	 */
	private updateBlockVariableReferences(
		block: Block,
		suggestedChanges: Record<string, string>,
	): void {
		// Update the entire block data at once
		const updatedData = this.updateObjectVariableReferences(
			block.data,
			suggestedChanges,
		);
		this.setBlockData(block.id, null, updatedData);

		// Update listeners if they contain variable references
		if (block.listeners) {
			Object.entries(block.listeners).forEach(
				([listenerName, listener]) => {
					if (listener.order) {
						const updatedOrder = listener.order.map((action) =>
							this.updateObjectVariableReferences(
								action,
								suggestedChanges,
							),
						);
						// Update the listener order
						block.listeners[listenerName].order = updatedOrder;
					}
				},
			);
		}
	}

	/**
	 * Update variable references within a query and its cells
	 * @param query - The query to update
	 * @param suggestedChanges - Mapping of old to new variable names
	 */
	private updateQueryVariableReferences(
		query: QueryState,
		suggestedChanges: Record<string, string>,
	): void {
		// Update query-level data - we can't directly update _exposed as it's a getter
		// The _exposed data is computed from the internal store, so we need to update the store directly

		// Update all cells in the query
		Object.values(query.cells).forEach((cell) => {
			if (cell.parameters) {
				// Use the cell's _update method to update parameters
				const updatedParameters = this.updateObjectVariableReferences(
					cell.parameters,
					suggestedChanges,
				);
				cell._update("parameters", updatedParameters);
			}
		});
	}

	/**
	 * Recursively update variable references in any object
	 * @param obj - The object to update
	 * @param suggestedChanges - Mapping of old to new variable names
	 * @returns Updated object
	 */
	private updateObjectVariableReferences(
		obj: any,
		suggestedChanges: Record<string, string>,
	): any {
		if (obj === null || obj === undefined) {
			return obj;
		}

		// Handle strings - replace variable references
		if (typeof obj === "string") {
			let updatedString = obj;

			// Replace all variable references in the format {{variableName}}
			Object.entries(suggestedChanges).forEach(([oldName, newName]) => {
				// The regex pattern matches the old variable name with an optional . and any characters after it
				const pattern = new RegExp(`{{${oldName}([^}]*?)}}`, "g");
				updatedString = updatedString.replaceAll(
					pattern,
					`{{${newName}$1}}`,
				);
			});

			return updatedString;
		}

		// Handle arrays
		if (Array.isArray(obj)) {
			return obj.map((item) =>
				this.updateObjectVariableReferences(item, suggestedChanges),
			);
		}

		// Handle objects
		if (typeof obj === "object") {
			const updatedObj = {};
			for (const [key, value] of Object.entries(obj)) {
				updatedObj[key] = this.updateObjectVariableReferences(
					value,
					suggestedChanges,
				);
			}
			return updatedObj;
		}

		// Return primitives as-is
		return obj;
	}

	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// TODO: Sorry, trying to start getting team to see ai gen while im out
	// Decouple this code above and handle in workspace via dispatch
	// Create classes for cell and variable
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------
	// --------------------------------------------------------------------------------

	/**
	 * Converts cell and publishes cell as MCP function
	 */
	makeCellMCP = (
		queryId: string,
		cellId: string,
		params: Record<string, unknown>,
	) => {
		const q = this.getQuery(queryId);
		const c = q.getCell(cellId);

		if (c) {
			c.makeCellMCP(params);
		}
	};

	/**
	 * Gets the variable by it's pointer
	 * @param pointer
	 * @param type
	 * @param path - {{.isLoading}} {{.data.value}}
	 * @returns
	 */
	getVariable(
		pointer: string,
		type: VariableType,
		path?: string[],
		cellId?: string,
		value?: string,
	): Variable | unknown {
		try {
			if (pointer) {
				if (type === "block") {
					const block = this._store.blocks[pointer];

					// Old Version of JSON - notebooks, will be dependent on the .value and may crash
					if (path && path.length === 1) {
						return block.data.value as string;
					} else {
						if (block) {
							// get the search path
							const s = path.slice(1).join(".");
							return getValueByPath(block.data, s);
						}
					}
				} else if (type === "query") {
					const query = this._store.queries[pointer];
					if (query) {
						if (path.length === 1) {
							// Just get query output
							return query.output;
						} else {
							const key = path[1];
							if (query) {
								if (key in query._exposed) {
									// get the search path
									const s = path.slice(1).join(".");
									return getValueByPath(query._exposed, s);
								}
							}
						}
					}
					// get the attribute key
				} else if (type === "cell") {
					const query = this.getQuery(pointer);
					const cell = query.getCell(cellId);

					if (cell) {
						if (path.length === 1) {
							return cell.output;
						} else {
							const key = path[1];
							if (key in cell._exposed) {
								// get the search path
								const s = path.slice(1).join(".");
								return getValueByPath(cell._exposed, s);
							}
						}
					}
				}
				return undefined;
			} else {
				if (
					type === "database" ||
					type === "model" ||
					type === "vector" ||
					type === "function" ||
					type === "storage" ||
					type === "string" ||
					type === "date" ||
					type === "number"
				) {
					return value;
				} else if (type === "array" || type === "JSON") {
					let v: unknown;
					if (value === "string") {
						v = JSON.parse(value as string);
					} else v = value;

					return v;
				}
				return undefined;
			}
		} catch (e) {
			console.error("state.store.getVariable: ", e);
			return undefined;
		}
	}

	/**
	 * Gets the variable alias by it's pointer
	 * @param pointer
	 * @param type
	 * @returns
	 */
	getAlias(pointer: string, cellId?: string): string {
		let alias = "";

		// Do we need to change how variables are stored to get rid of this iteration
		Object.entries(this._store.variables).forEach((keyValue) => {
			const variable = keyValue[1];

			if (variable.to === pointer && !cellId && !variable.cellId) {
				alias = keyValue[0];
			} else if (variable.to === pointer && variable.cellId === cellId) {
				alias = keyValue[0];
			}
		});
		return alias;
	}

	/**
	 * Get a frame. Create one if it isn't there
	 * @param name
	 */
	getFrameKey(name: string): Frame["key"] {
		// create the frame if it is not there
		if (!this._store.frames[name]) {
			runInAction(() => {
				this.createFrame(name);
			});
		}

		return this._store.frames[name].key;
	}

	/**
	 * -------------------------------------
	 * Actions
	 * -------------------------------------
	 */
	/**
	 * Dispatch a message to update the state
	 *
	 * @param action - Action to execute
	 */
	dispatch = async (action: Actions, callbackMessage?: "sync" | "async") => {
		// TODO: Develop History + Invert + UNDO;
		console.log(
			"ACTION :::",
			JSON.parse(JSON.stringify(action.message)),
			JSON.parse(JSON.stringify(action.payload)),
		);

		try {
			/**
			 * --------------------------------------------------
			 * All
			 * --------------------------------------------------
			 */
			if (ActionMessages.SET_STATE === action.message) {
				const { state } = action.payload;

				this.setState(state);
			} else if (ActionMessages.ADD_VARIABLE === action.message) {
				const { id, to, type, cellId, value } = action.payload;

				return this.addVariable(id, to, type, cellId, value);
			} else if (ActionMessages.EDIT_VARIABLE === action.message) {
				const { id, from, to } = action.payload;

				const newVariable: {
					type: string;
					to?: string;
					cellId?: string;
					value?: string;
				} = {
					type: to.type,
				};

				if (to.to) {
					newVariable.to = to.to;
				}
				if (to.cellId) {
					newVariable.cellId = to.cellId;
				}
				if (to.value) {
					newVariable.value = to.value;
				}

				this.editVariable(id, from, newVariable);
			} else if (ActionMessages.DELETE_VARIABLE === action.message) {
				const { id } = action.payload;

				this.deleteVariable(id);
			} else if (ActionMessages.RENAME_VARIABLE === action.message) {
				const { id, alias } = action.payload;

				return this.renameVariable(id, alias);
			} else if (
				ActionMessages.SET_SHEET_EXECUTION_ORDER === action.message
			) {
				const { list } = action.payload;

				return this.setExecutionOrder(list);
			} else if (ActionMessages.ADD_BLOCK === action.message) {
				/**
				 * --------------------------------------------------
				 * Blocks
				 * --------------------------------------------------
				 */
				const { json, position, isCommunity } = action.payload;

				return this.addBlock(json, position, isCommunity);
			} else if (ActionMessages.MOVE_BLOCK === action.message) {
				const { id, position } = action.payload;

				this.moveBlock(id, position);
			} else if (ActionMessages.REMOVE_BLOCK === action.message) {
				const { id, keep } = action.payload;

				this.removeBlock(id, keep);
			} else if (ActionMessages.SET_BLOCK_DATA === action.message) {
				const { id, path, value } = action.payload;

				this.setBlockData(id, path, value);
			} else if (ActionMessages.DELETE_BLOCK_DATA === action.message) {
				const { id, path } = action.payload;

				this.deleteBlockData(id, path);
			} else if (ActionMessages.SET_LISTENER === action.message) {
				const { id, listener, actions, type } = action.payload;

				this.setListener(id, listener, actions, type);
			} else if (ActionMessages.ADD_DYNAMIC_SLOT === action.message) {
				const { id } = action.payload;

				this.addDynamicSlot(id);
			} else if (ActionMessages.REMOVE_DYNAMIC_SLOT === action.message) {
				console.log(action.payload);
				const { id, indexToRemove } = action.payload;

				const i = JSON.stringify(indexToRemove);
				this.removeDynamicSlot(id, i);
			} else if (ActionMessages.NEW_QUERY === action.message) {
				/**
				 * --------------------------------------------------
				 * Notebooks
				 * --------------------------------------------------
				 */
				const { queryId, config, isCommunity } = action.payload;

				this.newQuery(queryId, config, isCommunity);
			} else if (ActionMessages.DELETE_QUERY === action.message) {
				const { queryId } = action.payload;

				this.deleteQuery(queryId);
			} else if (ActionMessages.UPDATE_QUERY === action.message) {
				const { queryId, path, value } = action.payload;

				this.updateQuery(queryId, path, value);
			} else if (ActionMessages.NEW_CELL === action.message) {
				const { queryId, config, previousCellId } = action.payload;

				return this.newCell(queryId, config, previousCellId);
			} else if (ActionMessages.MOVE_CELL === action.message) {
				const { queryId, activeCellId, overCellId } = action.payload;

				this.moveCell(queryId, activeCellId, overCellId);
			} else if (ActionMessages.DELETE_CELL === action.message) {
				const { queryId, cellId } = action.payload;

				this.deleteCell(queryId, cellId);
			} else if (ActionMessages.UPDATE_CELL === action.message) {
				const { queryId, cellId, path, value } = action.payload;

				this.updateCell(queryId, cellId, path, value);
			} else if (ActionMessages.MAKE_CELL_MCP === action.message) {
				const { queryId, cellId, parameters } = action.payload;

				this.makeCellMCP(queryId, cellId, parameters);
			} else if (ActionMessages.RUN_QUERY === action.message) {
				/**
				 * --------------------------------------------------
				 * Events
				 * --------------------------------------------------
				 */
				const { queryId } = action.payload;

				// If callback is provided, run as async with promise
				if (callbackMessage) {
					return (async () => {
						await this.runQuery(queryId, callbackMessage);
						return this._store.queries[queryId].output;
					})();
				} else {
					return this.runQuery(queryId);
				}
			} else if (ActionMessages.RUN_CELL === action.message) {
				const { queryId, cellId } = action.payload;

				// If callback is provided, run as async with promise
				if (callbackMessage) {
					return (async () => {
						await this.runCell(queryId, cellId, callbackMessage);
						return this._store.queries[queryId].cells[cellId]
							.output;
					})();
				} else {
					this.runCell(queryId, cellId);
				}
			} else if (ActionMessages.DISPATCH_EVENT === action.message) {
				const { name, detail } = action.payload;

				this.dispatchEvent(name, detail);
			} else if (ActionMessages.DISPATCH_OPEN_EVENT === action.message) {
				const { destinationType, destination } = action.payload;

				this.dispatchOpenEvent(destinationType, destination);
			} else if (ActionMessages.MODIFY_VARIABLE === action.message) {
				const { blockId, variable, value } = action.payload;

				// parse the value and assign
				const parsed = this.parseVariable(value as string, blockId);

				this.modifyVariable(variable, parsed);
			}
		} catch (e) {
			console.error(e);
		}
	};

	/** Variable Methods */
	/**
	 * TODO: Clean this fn up (split out iterator parsing?)
	 * Parse a variables and return the value if it exists (otherwise return the expression)
	 */
	parseVariable = (
		expression: string,
		id?: string,
		_depth = 0,
		_seen: Set<string> = new Set(),
	): unknown => {
		if (_depth > 10) return expression;
		if (_seen.has(expression)) return expression;

		_seen.add(expression);

		// trim the whitespace
		let cleaned = expression.trim();

		// Checks if it falls inline with special syntax
		if (
			!cleaned.startsWith("{{") &&
			!cleaned.endsWith("}}") &&
			!cleaned.startsWith("$")
		) {
			return expression;
		}

		// Special Parsing for Iterators
		if (cleaned.startsWith("$")) {
			// See if id is a descendant of an iterator block
			const iteratorBlock = this.isDescendantOfIterator(id);

			if (iteratorBlock) {
				try {
					// Go see what index the iterator block children this id is a descendant of
					const index = this.findIteratorChildIndex(
						iteratorBlock,
						id,
					);

					const iteratorList = iteratorBlock.data.source as string;

					let list = this.parseVariable(iteratorList);

					if (typeof list === "string") {
						try {
							list = JSON.parse(list);
						} catch {
							return expression;
						}
					}

					let variable: string;

					if (expression.includes(".")) {
						variable = expression.match(/\$(.*?)\./)[1];
					} else {
						variable = expression.match(/^\$(\w+)/)?.[1];
					}

					const stripped = iteratorList.trim().slice(2, -2);

					// TODO: how do we handle nested loops $array.warehouse.warehouseSections --> = []
					// Do we just call this recursively
					if (variable === stripped) {
						const path = expression.split(".").splice(1);
						const test = path.join(".");
						const val = getValueByPath(list[index], test);

						// SHOW "" or expression
						return val ? val : "";
					} else {
						return expression;
					}
				} catch {
					return expression;
				}
			} else {
				console.warn(`Unable to find iterator descendant - ${id}: `);
				return expression;
			}
		}

		// remove the brackets
		cleaned = cleaned.slice(2, -2);

		// get the keys in the path
		const path = cleaned.split(".");
		const pointer = path[0];

		// Special syntax to parse by cell order
		const isNumber = !isNaN(parseFloat(path[1]));

		if (isNumber) {
			let q: QueryState;

			if (this._store.variables[pointer]) {
				const variable = this._store.variables[path[0]];
				if (variable.type === "query") {
					q = this._store.queries[variable.to];
				}
			} else if (this._store.queries[pointer]) {
				q = this._store.queries[pointer];
			}

			if (q) {
				try {
					const c = q.cellList[parseFloat(path[1]) - 1];
					const p = path;
					p.splice(0, 2);

					if (p.length === 0) {
						return c.output;
					} else {
						const key = p[0];

						if (key in c._exposed) {
							// get the search path
							const s = p.join(".");

							return getValueByPath(c._exposed, s);
						}
					}
				} catch (e) {
					console.error(e);
					return expression;
				}
			}
		}

		if (this._store.variables[path[0]]) {
			// We should be able to interpret by varaible name as we do below
			const variable = this._store.variables[path[0]];
			const value = this.getVariable(
				variable.to,
				variable.type,
				path,
				variable.cellId,
				variable.type !== "cell" && variable.value
					? variable.value
					: null,
			);

			// TODO: Check this, protects for false values -- (query.isLoading tied to a block.label **bad use-case)
			if (value !== undefined && value !== null) {
				// RECURSIVE: If value is another {{var}}, resolve again
				if (
					typeof value === "string" &&
					value.trim().match(/^{{.*}}$/)
				) {
					return this.parseVariable(value, id, _depth + 1, _seen);
				}
				return value;
			}

			if (value === undefined) {
				return value;
			}
		}

		return expression;
	};

	/**
	 * Flatten a string containing multiple variables
	 * @param expression - expression to flatten
	 * @returns the flatten parameter
	 */
	flattenVariable = (expression: string): string => {
		return expression.replace(/{{(.*?)}}/g, (match) => {
			// try to extract the variable
			const v = this.parseVariable(match);

			// if it is not a string, convert to a string
			if (typeof v !== "string") {
				return JSON.stringify(v);
			}

			return v;
		});
	};

	/** Side effects Methods */
	/**
	 * Run a side effect pixel and process the response
	 *
	 * @param pixel - side effect to run
	 */
	runSideEffect = async <O extends unknown[] | []>(pixel: string) => {
		const response = await runPixel<O>(pixel, this._store.insightId);

		// process the side effects
		for (const { operationType, output } of response.pixelReturn) {
			this.processSideEffects(operationType, output);
		}

		// return the response
		return response;
	};

	/**
	 * Process side-effects from running a pixel
	 *
	 * @param operation - operation that was run
	 * @param output - output fo the operation
	 */
	processSideEffects = (operation: string[], output: unknown) => {
		// download the file
		if (operation.includes("FILE_DOWNLOAD")) {
			download(this.insightId, output as string);
		} else if (
			operation.includes("FRAME_DATA_CHANGE") ||
			operation.includes("FRAME_FILTER_CHANGE")
		) {
			this.syncFrame((output as { name: string }).name);
		} else if (operation.includes("MCP_TOOL_EXECUTION")) {
			this.notifyToolExecution(output as string);
		}
	};

	/**
	 * Serialize to JSON
	 */
	toJSON(): SerializedState {
		return {
			queries: Object.keys(this._store.queries).reduce(
				(acc, val) => {
					acc[val] = this._store.queries[val].toJSON();
					return acc;
				},
				{} as SerializedState["queries"],
			),
			blocks: toJS(this._store.blocks),
			variables: toJS(this._store.variables),
			executionOrder: toJS(this._store.executionOrder),
			version: this._store.version,
		};
	}

	/**
	 *
	 */

	/**
	 * Internal
	 */
	/**
	 * Helpers
	 */

	/**
	 * Generates a unique page ID
	 */
	private generatePageId(): string {
		let pageNum = 2;
		while (this._store.blocks[`page-${pageNum}`]) {
			pageNum++;
		}
		return `page-${pageNum}`;
	}

	/**
	 * Generates a unique ID for non-page widgets
	 * @param generatedBlockIds - list of already generated block ids in this sequential operation
	 */
	private generateNonPageId(
		widget: string,
		isCommunityBlock: boolean,
		generatedBlockIds: string[],
	): string {
		// Try sequential numbers starting from 1
		let blockNum = 1;
		while (
			this._store.blocks[
				`${isCommunityBlock ? "com_" : ""}${widget}--${blockNum}`
			] ||
			generatedBlockIds.includes(
				`${isCommunityBlock ? "com_" : ""}${widget}--${blockNum}`,
			)
		) {
			blockNum++;
		}
		return `${isCommunityBlock ? "com_" : ""}${widget}--${blockNum}`;
	}

	/**
	 * @description creates a new block id
	 * @returns block id - string
	 * @param generatedBlockIds - list of already generated block ids in this sequential operation
	 */
	private generateBlockId = (
		json: BlockJSON,
		isCommunityBlock: boolean,
		generatedBlockIds: string[],
	): string => {
		if (json.widget === "page") {
			return this.generatePageId();
		}
		return this.generateNonPageId(
			json.widget,
			isCommunityBlock,
			generatedBlockIds,
		);
	};

	/**
	 * Generate a new block from the json
	 * @param json - json of the block that we are generating
	 * @param generatedBlockIds - list of already generated block ids in this sequential operation
	 * @returns block
	 */
	private generateBlock = (
		json: BlockJSON,
		isCommunityBlock: boolean,
		communityIdMap: Record<string, string>,
		generatedBlockIds: string[],
		parent?: Block["parent"],
	) => {
		// generate a new id
		const id = this.generateBlockId(
			json,
			isCommunityBlock,
			generatedBlockIds,
		);

		generatedBlockIds.push(id);

		// create the block
		const block = {
			id: id,
			widget: json.widget,
			parent: null,
			data: {},
			listeners: {},
			slots: {},
			communityBlockMapping: {},
		} as Block;

		// add the data
		block.data = json.data;

		if (json.widget === "page") {
			// Defaulting the route to the block id
			block.data.route = id;
		}

		// only for community blocks, need to save the source id for future references
		if (json.id && isCommunityBlock) {
			communityIdMap[json.id] = id;
			block.communityBlockMapping = communityIdMap;
		}

		// add the listeners
		block.listeners = json.listeners;

		if (!json["parent"] && parent) {
			block.parent = parent;
		}

		// generate the slots
		for (const slot in json.slots) {
			if (json.slots[slot]) {
				block.slots[slot] = {
					name: slot,
					children: (Array.isArray(json.slots[slot])
						? json.slots[slot]
						: json.slots[slot]["children"]
					).map((child) => {
						// form the parent object
						const parent = { id: id, slot: slot };

						// build the children, but only store the ids
						const b = this.generateBlock(
							child,
							isCommunityBlock,
							communityIdMap,
							generatedBlockIds,
							parent,
						);

						return b.id;
					}),
				};
			}
		}

		// register it
		this._store.blocks[id] = block;

		// return it
		return block;
	};

	private isDescendantOfIterator = (blockId: string) => {
		console.warn(`Is ${blockId} a descendant of an iterator`);

		let currentBlock = this._store.blocks[blockId];

		while (currentBlock) {
			if (currentBlock.widget === "iteration") {
				return currentBlock;
			}
			if (currentBlock.parent && currentBlock.parent.id) {
				currentBlock = this._store.blocks[currentBlock.parent.id];
			} else {
				break;
			}
		}

		console.warn(`${blockId} is not a descendent of iterator`);
		return false;
	};

	private isDescendant = (containerId, blockId) => {
		const container = this._store.blocks[containerId];

		// TODO: may need to fix
		if (!container || !container.slots || !container.slots.children) {
			return false;
		}

		// TODO: will it always be .children? --> Accordion .content and .header
		const children = container.slots.children.children;
		if (children.includes(blockId)) {
			return true;
		}

		for (const childId of children) {
			if (this.isDescendant(childId, blockId)) {
				return true;
			}
		}

		console.warn(`${blockId} is not a descendent of ${containerId}`);
		return false;
	};

	private findIteratorChildIndex = (iteratorBlock, blockId) => {
		const children = iteratorBlock.slots.children.children;

		for (let i = 0; i < children.length; i++) {
			const iteratorChildId = children[i];

			// No need to search tree
			if (iteratorChildId === blockId) return i;

			if (this.isDescendant(iteratorChildId, blockId)) {
				return i;
			}
		}

		console.warn(`Unable find iterator child`);
		return -1; // Return -1 if not found
	};

	/**
	 * Check if a parent contains the child block
	 * @param parent - id of the parent block
	 * @param child - id of the child block
	 * @returns true if the child is in the parent
	 */
	containsBlock = (parent: string, child: string): boolean => {
		const queue = [parent];
		while (queue.length) {
			const current = queue.shift() as string;

			if (current === child) {
				return true;
			}

			// check if the block exists
			const block = this._store.blocks[current];

			// validate the children
			for (const s in block.slots) {
				queue.push(...block.slots[s].children);
			}
		}

		return false;
	};

	extractDependenciesFromString = (str) => {
		const regex = /{{\s*([\w_]+)\s*}}/g;
		const deps = [];
		while (true) {
			const match = regex.exec(str);
			if (match === null) {
				break;
			}
			deps.push(match[1]);
		}
		return deps;
	};

	/**
	 * Attach a block to the parent block's slot. At this point, we assume that everything can be attached correctly.
	 * @param parent - id of the block that we are attaching to
	 * @param slot - slot that we are attaching to
	 * @param index - children index where we are attaching
	 * @param id - id of the block that we are attaching
	 */
	private attachBlock = (
		parent: string,
		slot: string,
		index: number,
		id: string,
	) => {
		const parentBlock = this._store.blocks[parent];

		// if the slot is not valid, we cannot attach
		if (!parentBlock.slots[slot]) {
			return;
		}

		// if it is is already there, we cannot attach
		if (parentBlock.slots[slot].children.indexOf(id) !== -1) {
			return;
		}

		// get the block
		const block = this._store.blocks[id];

		// insert it
		parentBlock.slots[slot].children.splice(index, 0, id);

		// update the child block
		block.parent = {
			id: parent,
			slot: slot,
		};

		return;
	};

	/**
	 * Detach a block from the current parent. At this point, we assume that everything can be detached correctly.
	 * @param id - id of the block that we are detaching
	 */
	private detachBlock = (id: string) => {
		const block = this._store.blocks[id];

		// if there is no parent, there is no need to detach
		if (!block.parent) {
			return;
		}

		// get the parent
		const parentBlock = this._store.blocks[block.parent.id];

		// validate that the slot and index are correct
		const parentSlot = parentBlock.slots[block.parent.slot];
		if (!parentSlot) {
			return;
		}

		//
		const blockIdx = parentSlot.children.indexOf(id);
		if (blockIdx === -1) {
			return;
		}

		// remove it from the parent
		parentSlot.children.splice(blockIdx, 1);

		// update the child
		block.parent = null;
	};

	/**
	 * Create a new frame
	 */
	private createFrame = (name: string) => {
		this._store.frames[name] = {
			name: name,
			key: 0,
		};
	};

	/**
	 * Resync the frame and change the data key
	 */
	private syncFrame = (name: string) => {
		// create the frame if it is not there
		if (!this._store.frames[name]) {
			this.createFrame(name);
		}

		// increment the key
		this._store.frames[name].key = this._store.frames[name].key + 1;
	};

	/**
	 * Notifiy that a tool has been run
	 */
	private notifyToolExecution = (response: string) => {
		if (Env.TOOL) {
			window.parent?.postMessage(
				{
					type: "SMSS_EXEC_TOOL",
					tool: {
						type: "MCP",
						message: Env.TOOL.message,
						id: Env.TOOL.id,
						name: Env.TOOL.name,
						response: response,
					},
				},
				"*",
			);
		}
	};

	/**
	 * Actions
	 */
	/**
	 * Set the state information
	 *
	 * @param state - pixel to execute
	 */
	private setState = (state: SerializedState) => {
		// store the block information
		this._store.blocks = state.blocks;

		// load the queries
		this._store.queries = Object.keys(state.queries).reduce((acc, val) => {
			acc[val] = new QueryState(state.queries[val], this);
			return acc;
		}, {});

		// store the variables
		this._store.variables = state.variables ? state.variables : {};

		// store the execution order of notebooks
		let order = [];
		const sheets = Object.keys(this._store.queries);

		if (state.executionOrder.length) {
			order = state.executionOrder;
		} else {
			sheets.forEach((k) => {
				order.push(k);
			});
		}

		sheets.forEach(async (s) => {
			const found = await order.find((o) => {
				return o === s;
			});

			if (!found) {
				order.push(s);
			}
		});

		this._store.executionOrder = order;

		// store the version or the one we currently are on
		this._store.version = state.version ? state.version : STATE_VERSION;
	};

	/**
	 * Create a block and add it to the tree
	 * @param json - json of the block that we are adding
	 * @param position - where is the block going
	 * @returns id of new block
	 */
	private addBlock = (
		json: BlockJSON,
		position?: AddBlockAction["payload"]["position"],
		isCommunity?: boolean,
	): string => {
		// if it is a community block, we need to set up the dependencies
		let variableContainer = [];
		if (isCommunity) {
			const { newJson, variablesList } =
				this.buildCommunityBlockPreDeps(json);
			json = newJson;
			variableContainer = variablesList;
		}
		const generatedBlockIds = [];
		// generate the block
		const block = this.generateBlock(
			json,
			isCommunity,
			{},
			generatedBlockIds,
		);

		// try to place it if position
		if (!position) {
			if (block.widget === "page") return block.id;
			return;
		}

		const { parent, slot } = position;

		// get the parent
		const parentBlock = this._store.blocks[parent];

		if ("sibling" in position) {
			const { sibling, type } = position;

			// get the index of the sibling (it might have changed)
			const siblingIdx =
				parentBlock.slots[slot].children.indexOf(sibling);

			if (type === "before") {
				// attach the block before
				this.attachBlock(parent, slot, siblingIdx, block.id);
			} else if (type === "after") {
				// attach the block after
				this.attachBlock(parent, slot, siblingIdx + 1, block.id);
			}
		} else {
			// attach the block
			this.attachBlock(
				parent,
				slot,
				parentBlock.slots[slot].children.length,
				block.id,
			);
		}
		// if it is a community block, we need to set up the dependencies
		if (isCommunity) {
			this.updateCommunityBlockPostDeps(block.id, variableContainer);
		}
		return block.id;
	};

	/**
	 * Move a block in the tree
	 * @param id - id of the child block that we are moving
	 * @param position - where is the block going
	 */
	private moveBlock = (
		id: string,
		position: MoveBlockAction["payload"]["position"],
	): void => {
		if (!position) {
			// detach the current block (this might not always be possible)
			this.detachBlock(id);
			return;
		}

		// if there is a parent see if you can detach
		const { parent, slot } = position;

		// if the parent block is a child of the moved block, we cannot move
		if (this.containsBlock(id, parent)) {
			return;
		}

		// get the parent
		const parentBlock = this._store.blocks[parent];

		// detach the current block (this might not always be possible)
		this.detachBlock(id);

		if ("sibling" in position) {
			const { sibling, type } = position;

			// get the index of the sibling (it might have changed)
			const siblingIdx =
				parentBlock.slots[slot].children.indexOf(sibling);

			if (type === "before") {
				// attach the block before
				this.attachBlock(parent, slot, siblingIdx, id);
			} else if (type === "after") {
				// attach the block after
				this.attachBlock(parent, slot, siblingIdx + 1, id);
			}
		} else {
			// attach the block
			this.attachBlock(
				parent,
				slot,
				parentBlock.slots[slot].children.length,
				id,
			);
		}
	};

	/**
	 * Remove the block from the tree
	 * @param id - id of the block that we are removing
	 * @param keep - keep the block
	 */
	private removeBlock = (
		id: string,
		keep: RemoveBlockAction["payload"]["keep"],
	): void => {
		// get the block
		const block = this._store.blocks[id];

		if (block) {
			// Remove the variable
			Object.entries(this._store.variables).forEach((keyValue) => {
				const varId = keyValue[0];
				const variable = keyValue[1];

				if (variable.type === "block") {
					if (variable.to === id) {
						delete this._store.variables[varId];
					}
				}
			});

			// remove the children
			for (const slot in block.slots) {
				const { children } = block.slots[slot];
				// use copy of children so we can detach without breaking loop
				for (const c of [...children]) {
					this.removeBlock(c, false);
				}
			}

			// detach the current block (this might not always be possible)
			this.detachBlock(id);

			// delete it
			if (!keep) {
				delete this._store.blocks[id];
			}
		} else {
			console.error("Block doesn't exist. Skipping.");
		}
	};

	/**
	 * Set a block's data
	 * @param id - id of the block
	 * @param path - path of the data to set
	 * @param value - value of the data
	 */
	private setBlockData = (
		id: string,
		path: string | null,
		value: unknown,
	): void => {
		if (!path) {
			// set the value
			this._store.blocks[id].data = value as Record<string, unknown>;
			return;
		}

		// get the keys
		const p = path.split(".");

		// get the last key. If there is none, set the block data
		const last = p.pop();
		if (!last) {
			return;
		}

		// traverse to the correct element
		let current = this._store.blocks[id].data as Record<string, unknown>;
		while (p.length) {
			const key = p.shift();

			if (!key) {
				return;
			}

			// create the object if the key doesn't exist. This will allow us to have partials.
			// TODO Generate with default?
			if (!current[key]) {
				current[key] = {};
			}

			current = current[key] as Record<string, unknown>;
		}

		// set the value
		current[last] = value;
	};

	/**
	 * Delete a block's data
	 * @param id - id of the block
	 * @param path - path of the data to delete
	 */
	private deleteBlockData = (id: string, path: string | null): void => {
		if (!path) {
			// clear the data
			this._store.blocks[id].data = {};

			return;
		}

		// get the keys
		const p = path.split(".");

		// get the last key
		const last = p.pop();
		if (!last) {
			return;
		}

		// traverse to the correct element
		let current = this._store.blocks[id].data as Record<string, unknown>;
		while (p.length) {
			const key = p.shift();

			if (!key || !current) {
				return;
			}

			current = current[key] as Record<string, unknown>;
		}

		// delete the value
		delete current[last];
	};

	/**
	 * Set a listener on a block
	 * @param id - id of the block
	 * @param listener - listener to add to the block
	 * @param actions - actions to add to the block
	 */
	private setListener = (
		id: string,
		listener: string,
		actions: ListenerActions[],
		type: "sync" | "async",
	): void => {
		this._store.blocks[id].listeners[listener] = {
			type: type,
			order: actions,
		};
	};

	/**
	 * Set a listener on a block
	 * @param id - id of the block
	 * @param listener - listener to add to the block
	 * @param actions - actions to add to the block
	 */
	private addDynamicSlot = (id: string): void => {
		const block = this._store.blocks[id];
		if (!block || !block.slots) {
			return;
		}

		// Find the next available slot number
		const slotNames = Object.keys(block.slots)
			.filter((name) => !isNaN(Number(name)))
			.map((name) => Number(name))
			.sort((a, b) => a - b);

		const nextSlotNumber =
			slotNames.length > 0 ? Math.max(...slotNames) + 1 : 1;
		const newSlotName = nextSlotNumber.toString();

		// Add the new slot
		block.slots[newSlotName] = {
			name: newSlotName,
			children: [],
		};
	};

	/**
	 * Set a listener on a block
	 * @param id - id of the block
	 * @param listener - listener to add to the block
	 * @param actions - actions to add to the block
	 */
	private removeDynamicSlot = (id: string, indexToRemove: string): void => {
		const block = this._store.blocks[id];

		if (!block || !block.slots) {
			return;
		}

		// Convert slot names to array and sort them numerically
		const slotNames = Object.keys(block.slots)
			.filter((name) => !isNaN(Number(name)))
			.map((name) => Number(name))
			.sort((a, b) => a - b);

		// Find the slot name at the specified index
		const slotNameToRemove = slotNames[indexToRemove];
		if (slotNameToRemove === undefined) {
			return;
		}
		// Remove the slot at the specified index
		delete block.slots[slotNameToRemove];

		// Shift all subsequent slots down by one
		const slotsToShift = slotNames.filter(
			(name) => name > slotNameToRemove,
		);
		slotsToShift.forEach((oldSlotName) => {
			const newSlotName = oldSlotName - 1;
			block.slots[newSlotName] = block.slots[oldSlotName];
			block.slots[newSlotName].name = newSlotName.toString();
			delete block.slots[oldSlotName];
		});
	};

	/**
	 * Create a new query
	 * @param queryId - name of the query that we are setting
	 */
	private newQuery = (
		queryId: string,
		config: Omit<QueryStateConfig, "id">,
		isCommunity?: boolean,
	): string => {
		this._store.queries[queryId] = new QueryState(
			{
				...config,
				id: queryId,
			},
			this,
		);

		// TODO: Do we want this to be done here

		// Automate variable creation for notebook and new cell
		this.dispatch({
			message: ActionMessages.ADD_VARIABLE,
			payload: {
				id: queryId,
				type: "query",
				to: queryId,
			},
		});

		if (!isCommunity) {
			Object.entries(this._store.queries[queryId].cells).forEach((c) => {
				// Automate variable creation for notebook and new cell
				const cId = c[0];
				this.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${queryId}--${cId}`,
						type: "cell",
						to: queryId,
						cellId: cId,
					},
				});
			});
		}

		this._store.executionOrder.push(queryId);

		return queryId;
	};

	/**
	 * Delete a query
	 * @param queryId - name of the query that we are deleting
	 */
	private deleteQuery = (queryId: string): void => {
		// Delete the query
		delete this._store.queries[queryId];

		// Remove it from our execition order tracking
		const index = this._store.executionOrder.indexOf(queryId);
		this._store.executionOrder.splice(index, 1);

		// clean up variables
		Object.entries(this._store.variables).forEach((keyValue) => {
			const id = keyValue[0];
			const variable = keyValue[1];
			if (variable.type === "query" || variable.type === "cell") {
				if (variable.to === queryId) {
					delete this._store.variables[id];
				}
			}
		});
	};

	/**
	 * Update the store in the query
	 * @param queryId - id of the updated query
	 * @param path - path of the data to set
	 * @param value - value of the data
	 */
	private updateQuery = (
		queryId: string,
		path: string | null,
		value: unknown,
	): void => {
		const q = this._store.queries[queryId];

		// set the value
		q._update(path, value);
	};

	/**
	 * Run a query
	 * @param queryId - name of the query that we are running
	 */
	private runQuery = (
		queryId: string,
		type?: "sync" | "async",
	): void | Promise<boolean> => {
		const q = this._store.queries[queryId];

		const key = `query--${queryId};`;

		// cancel a previous command
		this._utils.queryPromises[key]?.cancel();

		let p: { promise: Promise<boolean>; cancel: () => void };
		let sync: boolean;

		if (!type || type === "async") {
			sync = false;
		} else {
			sync = true;
		}

		if (sync) {
			p = syncronousPromise(async () => {
				await q._run();
				return true;
			});
		} else {
			p = cancellablePromise(async () => {
				await q._run();
				return true;
			});
		}
		if (sync) {
			return p.promise;
		} else {
			p.promise
				.then((resp) => {
					// noop
				})
				.catch((e) => {
					console.error("ERROR:", e);
				});
		}

		// save the promise
		this._utils.queryPromises[key] = p;
	};

	/**
	 * Create a new cell
	 * @param queryId - id of the updated query
	 * @param cellId - id of the new cell
	 * @param config - config of the
	 * @param previousCellId: id of the previous cell,
	 */
	private newCell = (
		queryId: string,
		config: Omit<CellStateConfig, "id">,
		previousCellId: string,
	): string => {
		// get the query
		const q = this._store.queries[queryId];

		// add the cell
		return q._addCell(config, previousCellId) as string;
	};

	/**
	 * Move a cell
	 * @param queryId - id of the updated query
	 * @param activeCellId - id of the active cell
	 * @param overCellId - id of the cell we are moving over
	 */
	private moveCell = (
		queryId: string,
		activeCellId: string,
		overCellId: string,
	): void => {
		// get the query
		const q = this._store.queries[queryId];

		// move the cell
		q._moveCell(activeCellId, overCellId);
	};

	/**
	 * Delete a cell
	 * @param queryId - id of the updated query
	 * @param cellId - id of the deleted cell
	 */
	private deleteCell = (queryId: string, cellId: string): void => {
		// get the query
		const q = this._store.queries[queryId];

		// remove the cell
		q._removeCell(cellId);

		// clean up variables
		Object.entries(this._store.variables).forEach((keyValue) => {
			const id = keyValue[0];
			const variable = keyValue[1];
			if (variable.type === "cell") {
				if (variable.to === queryId && cellId === variable.cellId) {
					delete this._store.variables[id];
				}
			}
		});

		// always have at least one cell
		if (q.list.length === 0) {
			this.newCell(
				queryId,
				{
					parameters: {
						code: "",
						type: "py",
					},
					widget: "code",
				} as Omit<CellStateConfig, "id">,
				"",
			);
		}
	};

	/**
	 * Update the store in the cell
	 * @param queryId - id of the updated query
	 * @param cellId - id of the updated cell
	 * @param path - path of the data to set
	 * @param value - value of the data
	 */
	private updateCell = (
		queryId: string,
		cellId: string,
		path: string | null,
		value: unknown,
	): void => {
		const q = this._store.queries[queryId];
		const s = q.getCell(cellId);

		// set the value
		s._update(path, value);
	};

	/**
	 * Run the cell
	 * @param queryId - id of the updated query
	 * @param cellId - id of the deleted cell
	 */
	private runCell = (
		queryId: string,
		cellId: string,
		type?: string,
	): void | Promise<boolean> => {
		const q = this._store.queries[queryId];
		const c = q.getCell(cellId);

		const key = `cell--${cellId} (query--${queryId});`;

		// cancel a previous command
		this._utils.queryPromises[key]?.cancel();

		let p: { promise: Promise<boolean>; cancel: () => void };
		let sync: boolean;

		if (!type || type === "async") {
			sync = false;
		} else {
			sync = true;
		}

		if (sync) {
			p = syncronousPromise(async () => {
				await c._run();
				return true;
			});
		} else {
			p = cancellablePromise(async () => {
				// run the cell
				await c._run();
				// turn it off
				return true;
			});
		}

		if (sync) {
			return p.promise;
		} else {
			p.promise
				.then((resp) => {
					// noop
				})
				.catch((e) => {
					console.error("ERROR:", e);
				});
		}

		// save the promise
		this._utils.queryPromises[key] = p;
	};

	/**
	 * Dispatch a custom event
	 * @param name - name of the event
	 * @param detail - payload associated with event
	 */
	private dispatchEvent = (
		name: string,
		detail: Record<string, unknown> = {},
	): void => {
		const event = new CustomEvent(name, {
			detail: detail,
		});

		// dispatch the event to the window
		window.dispatchEvent(event);
	};

	private dispatchOpenEvent = (
		destinationType: string,
		destination: string,
	): void => {
		const event = new CustomEvent("OPEN_EVENT", {
			detail: { destinationType, destination },
		});

		if (this.mode === "interactive") {
			if (destinationType === "Internal") {
				const hash = window.location.hash;
				// Match either #/s/:id/ or #/:id/view
				const appPageMatch = hash.match(/^#\/app\/([^/]+)/);
				const sharePageMatch = hash.match(/^#\/s\/([^/]+)/);

				if (appPageMatch || sharePageMatch) {
					const base = appPageMatch
						? appPageMatch[0] + "/view"
						: sharePageMatch[0]; // This will be either #/s/:id/ or #/:id/view

					const pageBlocks = this.getAllBlocksOfType("page");

					const urlPageRouteMatch = pageBlocks.find(
						(page) => page.data.route === destination,
					);

					if (urlPageRouteMatch) {
						const newHash = destination.startsWith("/")
							? base.replace(/\/$/, "") + destination
							: base.replace(/\/$/, "") + "/" + destination; // Avoid double slashes

						window.location.hash = newHash;
					}

					return;
				}
				4;
			} else if (destinationType === "External") {
				window.location.href = destination;
			}
		}

		// dispatch the event to the window
		window.dispatchEvent(event);
	};

	// -----------------------------------
	// REVIEW VARIABLE AND DEPENDENCY CODE
	// -----------------------------------
	/**
	 * Adds to variable that can be referenced
	 * @param id - referenced as
	 * @param to - points to
	 * @param type - type of variable
	 */
	private addVariable = (
		id: string,
		to: string,
		type: VariableType,
		cellId?: string,
		value?: unknown,
	) => {
		if (id.includes(".")) {
			return false;
		}

		if (this._store.variables[id]) {
			return false;
		}

		const token = { type };

		if (to) {
			token["to"] = to;
		}
		if (cellId) {
			token["cellId"] = cellId;
		}
		if (value) {
			token["value"] = value;
		}

		this._store.variables[id] = token as Variable;

		return token;
	};

	private modifyVariable = (id: string, value: unknown) => {
		this._store.variables[id].value = value;
	};

	/**
	 * Renames variable that can be referenced
	 * @param old - points to old id
	 * @param id - new id for variable
	 */
	private renameVariable = (old: string, id: string): boolean => {
		if (id.includes(".")) {
			return false;
		}

		if (this._store.variables[id]) {
			return false;
		} else {
			this._store.variables[id] = this._store.variables[old];

			delete this._store.variables[old];

			return true;
		}
	};

	/**
	 * Replace old variable and remove old dependency
	 * @param from
	 * @param to
	 */
	private editVariable = (id: string, oldVar: VariableWithId, newVar) => {
		if (oldVar.id !== id) {
			delete this._store.variables[oldVar.id];
		}

		this._store.variables[id] = newVar;
	};

	/**
	 * Deletes variable and corresponding dependency that can be referenced
	 * @param id - id to delete
	 */
	private deleteVariable = async (id: string) => {
		// Stringify blocks
		const blocksToMutate = JSON.stringify(this._store.blocks);
		// remove the references of it from ui (don't touch users code notebook)
		const regex = RegExp(`{{${id}(\\.[^}]+)?}}`, "g");

		const modifiedBlocks = await blocksToMutate.replace(regex, "");

		this._store.blocks = JSON.parse(modifiedBlocks);

		delete this._store.variables[id];
	};

	/**
	 *
	 */
	private setExecutionOrder = (orderedList: string[]) => {
		this._store.executionOrder = orderedList;
		return;
	};

	/**
	 * This function is used to build the community block pre-dependencies.
	 * It takes in the community block JSON and returns a new version of the community block JSON
	 * with the queryId and variableId replaced with the newId.
	 * It also returns the list of variables that were created
	 * during the dispatchDependencyQueriesAndVars function.
	 * @param json - the community block JSON
	 * @returns an object with the updated community block JSON and the list of variables
	 */
	private buildCommunityBlockPreDeps = (json) => {
		let newJson = json;
		let variablesList = [];
		if (json["queries"] || json["variables"]) {
			const { placeholderJson, variableStack } =
				this.dispatchDependencyQueriesAndVars(
					json,
					json["queries"],
					json["variables"],
				);
			newJson = placeholderJson;
			variablesList = variableStack;
		}
		return {
			newJson,
			variablesList,
		};
	};

	/**
	 * This function is used to dispatch the community block queries and variables
	 * to the store when the community block is added to the user's notebook.
	 * It takes in the community block JSON, queries and variables as arguments.
	 * It creates a new version of the community block JSON with the queryId and
	 * variableId replaced with the newId.
	 * It also dispatches the new query and variable to the store.
	 * @param placeholderJson - the community block JSON
	 * @param queries - the queries of the community block
	 * @param variables - the variables of the community block
	 * @returns an object with the updated community block JSON and the variableStack
	 */
	private dispatchDependencyQueriesAndVars = (
		placeholderJson: BlockJSON,
		queries: Record<string, QueryStateConfig>,
		variables: Record<string, Variable | VariableWithId>,
	): { placeholderJson: BlockJSON; variableStack: Variable[] } => {
		const queryVariableMap: Record<string, string> = {};
		const queryStack = [];
		const variableStack = [];

		if (Object.keys(queries).length) {
			Object.entries(queries).forEach(([key, value]) => {
				/**
				 * Create a new query object with the queryId replaced with the newId
				 * if the queryId already exists in the store
				 */
				const newQueryId = `com_${key}_${Math.floor(Math.random() * 1000)}`;
				const newQuery = {
					queryId: newQueryId,
					config: value as QueryStateConfig,
				};

				/**
				 * Add the new query to the queryStack
				 */
				queryStack.push(newQuery);

				/**
				 * Add the new queryId to the queryVariableMap
				 */
				queryVariableMap[key] = newQuery.queryId;
			});
		}

		if (Object.keys(variables).length) {
			Object.entries(variables).forEach(([key, value]) => {
				if (value.type !== "query") {
					/**
					 * Create a new variable object with the to property replaced with the newId
					 * if the to property already exists in the store
					 */
					const newVariableId = `com_${key}_${Math.floor(Math.random() * 1000)}`;
					const newVariable = {
						...value,
						id: newVariableId,
						to: queryVariableMap[value.to] || value.to,
					};

					/**
					 * Add the new variable to the variableStack
					 */
					variableStack.push(newVariable);

					/**
					 * Add the new variableId to the queryVariableMap
					 */
					queryVariableMap[key] = newVariable.id;
				}
			});
		}

		/**
		 * Recursively walk the input object and replace any exact string matches with the mapped value
		 * and replace any Mustache variables ({{key}}) with the mapped value
		 * and skip any subtree if the key is present in skipKeys set.
		 * This function is used to update the queryId and variableId in the community block JSON
		 * after the community block is added to the user's notebook.
		 * @param input - any value to be processed
		 * @param replacementMap - map of oldId to newId
		 * @param skipKeys - set of keys to skip entire subtree
		 * @returns the processed value
		 */
		placeholderJson = this.updateQueryAndVarsInBlocks(
			placeholderJson,
			queryVariableMap,
			new Set(["queries", "variables"]),
		);

		queryStack.forEach((newQuery) => {
			newQuery = this.updateQueryAndVarsInBlocks(
				newQuery,
				queryVariableMap,
			);
			this.dispatch({
				message: ActionMessages.NEW_QUERY,
				payload: { ...newQuery, isCommunity: true },
			});
		});

		variableStack.forEach((newVariable) => {
			this.dispatch({
				message: ActionMessages.ADD_VARIABLE,
				payload: newVariable,
			});
		});

		return { placeholderJson, variableStack };
	};

	/**
	 * Recursively walks the input object and:
	 * 1. Replaces any exact string matches with the mapped value.
	 * 2. Replaces any Mustache variables ({{key}}) with the mapped value.
	 * 3. Skips any subtree if the key is present in skipKeys set.
	 * This function is used to update the queryId and variableId in the community block JSON
	 * after the community block is added to the user's notebook.
	 * @param input - any value to be processed
	 * @param replacementMap - map of oldId to newId
	 * @param skipKeys - set of keys to skip entire subtree
	 * @returns the processed value
	 */
	private updateQueryAndVarsInBlocks<T>(
		input: T,
		replacementMap: Record<string, string>,
		skipKeys: Set<string> = new Set(["variables", "queries"]),
	): T {
		// Create a global regex to match all keys in the map within Mustache
		const mustacheRE = new RegExp(
			`{{\\s*(${Object.keys(replacementMap).join(
				"|",
			)})(\\.[^{}\\s]*)?\\s*}}`,
			"g",
		);

		function cloneAndReplace(node) {
			if (node == null) return node;

			/* -------- strings -------- */
			if (typeof node === "string") {
				// Exact match replacement
				if (replacementMap[node]) return replacementMap[node];

				// Mustache replacement
				return node.replace(mustacheRE, (_, key: string, rest = "") => {
					return `{{${replacementMap[key]}${rest}}}`;
				});
			}

			/* -------- arrays -------- */
			if (Array.isArray(node)) {
				return node.map(cloneAndReplace);
			}

			/* -------- objects -------- */
			if (typeof node === "object") {
				const result = {};
				for (const [key, value] of Object.entries(node)) {
					// Skip entire subtree
					if (skipKeys.has(key)) {
						result[key] = value;
						continue;
					}

					// Replace queryId or any other field with mapped value
					if (typeof value === "string" && replacementMap[value]) {
						result[key] = replacementMap[value];
					} else {
						result[key] = cloneAndReplace(value);
					}
				}
				return result;
			}

			// Primitives
			return node;
		}

		return cloneAndReplace(input);
	}

	/**
	 * Sets up dependencies for community block variables of type 'block'.
	 * Filters the provided variables to find those of type 'block' and updates their dependencies.
	 * @param blockId - The ID of the community block whose variables are being setup.
	 * @param variableContainer - An array containing all variables associated with the block.
	 */
	private updateCommunityBlockPostDeps = (
		blockId: string,
		variableContainer: VariableWithId[],
	) => {
		// Filter variables to include only those with type 'block'
		const blockVariables = variableContainer.filter(
			(v) => v.type === "block",
		);

		// If there are block variables, update their dependencies
		if (blockVariables.length) {
			this.updateBlockDependencyVariables(blockVariables, blockId);
		}
	};

	/**
	 * Updates the blockId of variables that have type 'block'.
	 * This is used after a community block has been added to the canvas
	 * to update the blockId of variables that point to the community block.
	 * @param blockVariables - The block variables to update.
	 * @param communityBlockId - The id of the parent community block that the variables point to.
	 */
	private updateBlockDependencyVariables = (
		blockVariables: VariableWithId[],
		communityBlockId: string,
	) => {
		const communityBlock = this.getBlock(communityBlockId);
		const blockIdMapper = communityBlock?.communityBlockMapping || {};

		blockVariables.forEach((variable) => {
			// Get the new blockId from the community block mapping
			// If the variable's id is not in the mapping, use the variable's to property
			const newTo =
				blockIdMapper[variable.id] ||
				blockIdMapper[variable.to] ||
				variable.to;

			// Create a new variable with the updated blockId
			const newVar = {
				...variable,
				to: newTo,
			};

			try {
				// Dispatch the updated variable
				this.dispatch({
					message: ActionMessages.EDIT_VARIABLE,
					payload: {
						id: variable.id,
						from: variable,
						to: newVar,
					},
				});
			} catch (error) {
				console.error("Error dispatching dependency variables", error);
			}
		});
	};
}
