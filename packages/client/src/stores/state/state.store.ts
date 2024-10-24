import { makeAutoObservable, toJS } from 'mobx';

import { cancellablePromise, getValueByPath } from '@/utility';

import {
    ActionMessages,
    Actions,
    AddBlockAction,
    MoveBlockAction,
    RemoveBlockAction,
} from './state.actions';
import {
    Block,
    BlockJSON,
    CellRegistry,
    ListenerActions,
    SerializedState,
    Variable,
    VariableType,
    VariableWithId,
    Variant,
} from './state.types';
import { QueryState, QueryStateConfig } from './query.state';
import { CellStateConfig } from './cell.state';
import { STATE_VERSION } from './migration/MigrationManager';

interface StateStoreInterface {
    /** Mode */
    mode: 'interactive' | 'static';

    /** insightID to load */
    insightId: string;

    /** token to reference (blocks, cells, dependencies) */
    variables: Record<string, Variable>;

    /** Queries rendered in the insight */
    queries: Record<string, QueryState>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;

    /** Cells registered to the insight */
    cellRegistry: CellRegistry;

    /** What version the state store we currently are on link: https://semver.org/ */
    version: string;

    /** Order of how we consume app as API */
    executionOrder: string[];

    /** TODO: Get rid of this, engine dependencies */
    dependencies: Record<string, unknown>;
}

export class StateStoreConfig {
    /** Mode */
    mode: 'interactive' | 'static';

    /** insightID to load */
    insightId: string;

    /** State to load into the store */
    state: SerializedState;

    /** Cells registered to the insight */
    cellRegistry: CellRegistry;

    /** initial params for our variables can come from query params */
    initialParams?: Record<string, unknown>;
}

/**
 * Hold the state information for the insight
 */
export class StateStore {
    private _store: StateStoreInterface = {
        mode: 'interactive',
        insightId: '',
        version: '',
        queries: {},
        blocks: {},
        cellRegistry: {},
        variables: {},
        dependencies: {}, // Maher said change to constants
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
        this.setState(config.state, config.initialParams);
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
     * Gets all tokens
     * @returns the tokens
     */
    get dependencies() {
        return this._store.dependencies;
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
                if (type === 'block') {
                    const block = this._store.blocks[pointer];

                    // Old Version of JSON - notebooks, will be dependent on the .value and may crash
                    if (path && path.length === 1) {
                        return block.data.value as string;
                    } else {
                        if (block) {
                            // get the search path
                            const s = path.slice(1).join('.');
                            return getValueByPath(block.data, s);
                        }
                    }
                } else if (type === 'query') {
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
                                    const s = path.slice(1).join('.');
                                    return getValueByPath(query._exposed, s);
                                }
                            }
                        }
                    }
                    // get the attribute key
                } else if (type === 'cell') {
                    const query = this.getQuery(pointer);
                    const cell = query.getCell(cellId);

                    if (cell) {
                        if (path.length === 1) {
                            return cell.output;
                        } else {
                            const key = path[1];
                            if (key in cell._exposed) {
                                // get the search path
                                const s = path.slice(1).join('.');
                                return getValueByPath(cell._exposed, s);
                            }
                        }
                    }
                }
                return undefined;
            } else {
                if (
                    type === 'database' ||
                    type === 'model' ||
                    type === 'vector' ||
                    type === 'function' ||
                    type === 'storage' ||
                    type === 'string' ||
                    type === 'date' ||
                    type === 'number'
                ) {
                    return value;
                } else if (type === 'array' || type === 'JSON') {
                    let v;
                    if (value === 'string') {
                        v = JSON.parse(value as string);
                    } else v = value;

                    return v;
                }
                return undefined;
            }
        } catch (e) {
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
        let alias = '';

        // Do we need to change how variables are stored to get rid of this iteration
        Object.entries(this._store.variables).forEach((keyValue) => {
            const variable = keyValue[1];

            if (variable.to === pointer && !cellId) {
                alias = keyValue[0];
            } else if (variable.to === pointer && variable.cellId === cellId) {
                alias = keyValue[0];
            }
        });
        return alias;
    }

    /**
     * Actions
     */
    /**
     * Dispatch a message to update the state
     *
     * @param action - Action to execute
     */
    dispatch = (action: Actions) => {
        // TODO: Develop History + Invert + UNDO;
        console.log(
            'ACTION :::',
            JSON.parse(JSON.stringify(action.message)),
            JSON.parse(JSON.stringify(action.payload)),
        );

        try {
            // apply the action
            if (ActionMessages.SET_STATE === action.message) {
                const { state } = action.payload;

                this.setState(state);
            } else if (ActionMessages.ADD_BLOCK === action.message) {
                const { json, position } = action.payload;

                return this.addBlock(json, position);
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
                const { id, listener, actions } = action.payload;

                this.setListener(id, listener, actions);
            } else if (ActionMessages.NEW_QUERY === action.message) {
                const { queryId, config } = action.payload;

                return this.newQuery(queryId, config);
            } else if (ActionMessages.DELETE_QUERY === action.message) {
                const { queryId } = action.payload;

                this.deleteQuery(queryId);
            } else if (ActionMessages.UPDATE_QUERY === action.message) {
                const { queryId, path, value } = action.payload;

                this.updateQuery(queryId, path, value);
            } else if (ActionMessages.RUN_QUERY === action.message) {
                const { queryId } = action.payload;

                this.runQuery(queryId);
            } else if (ActionMessages.NEW_CELL === action.message) {
                const { queryId, cellId, config, previousCellId } =
                    action.payload;

                this.newCell(queryId, cellId, config, previousCellId);
            } else if (ActionMessages.DELETE_CELL === action.message) {
                const { queryId, cellId } = action.payload;

                this.deleteCell(queryId, cellId);
            } else if (ActionMessages.UPDATE_CELL === action.message) {
                const { queryId, cellId, path, value } = action.payload;

                this.updateCell(queryId, cellId, path, value);
            } else if (ActionMessages.RUN_CELL === action.message) {
                const { queryId, cellId } = action.payload;

                this.runCell(queryId, cellId);
            } else if (ActionMessages.DISPATCH_EVENT === action.message) {
                const { name, detail } = action.payload;

                this.dispatchEvent(name, detail);
            } else if (ActionMessages.RENAME_VARIABLE === action.message) {
                const { id, alias } = action.payload;

                return this.renameVariable(id, alias);
            } else if (ActionMessages.ADD_VARIABLE === action.message) {
                const { id, to, type, cellId, value, isInput, isOutput } =
                    action.payload;

                return this.addVariable(
                    id,
                    to,
                    type,
                    cellId,
                    value,
                    isInput,
                    isOutput,
                );
            } else if (ActionMessages.EDIT_VARIABLE === action.message) {
                const { id, from, to } = action.payload;

                const newVariable = {
                    type: to.type,
                };

                if (to.to) newVariable['to'] = to.to;
                if (to.cellId) newVariable['cellId'] = to.cellId;
                if (to.value) newVariable['value'] = to.value;

                newVariable['isInput'] = to.isInput ? to.isInput : false;
                newVariable['isOutput'] = to.isOutput ? to.isOutput : false;

                this.editVariable(id, from, newVariable);
            } else if (ActionMessages.DELETE_VARIABLE === action.message) {
                const { id } = action.payload;

                this.deleteVariable(id);
            } else if (ActionMessages.ADD_DEPENDENCY === action.message) {
                const { id, type } = action.payload;

                return this.addDependency(id, type);
            } else if (ActionMessages.REMOVE_DEPENDENCY === action.message) {
                const { id } = action.payload;

                return this.removeDependency(id);
            } else if (
                ActionMessages.SET_SHEET_EXECUTION_ORDER === action.message
            ) {
                const { list } = action.payload;

                return this.setExecutionOrder(list);
            }
        } catch (e) {
            console.error(e);
        }
    };

    /** Variable Methods */
    /**
     * Parse a variables and return the value if it exists (otherwise return the expression)
     */
    parseVariable = (expression: string): unknown => {
        // trim the whitespace
        let cleaned = expression.trim();
        if (!cleaned.startsWith('{{') && !cleaned.endsWith('}}')) {
            return expression;
        }

        // remove the brackets
        cleaned = cleaned.slice(2, -2);

        // get the keys in the path
        const path = cleaned.split('.');

        if (this._store.variables[path[0]]) {
            const variable = this._store.variables[path[0]];
            const value = this.getVariable(
                variable.to,
                variable.type,
                path,
                variable.cellId,
                variable.type !== 'cell' && variable.value
                    ? variable.value
                    : null,
            );

            // TODO: Check this, protects for false values
            // (query.isLoading tied to a block.label **bad use-case)
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    // From the list of responses in the variable, find and return the one that is 'selected'
                    const selectedValue = value.find((val) => val.selected);
                    if (!selectedValue) {
                        console.log(
                            'ERROR: could not find a selected value for the cell',
                        );
                        return undefined;
                    } else {
                        return selectedValue.response;
                    }
                } else {
                    return value;
                }
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
            if (typeof v !== 'string') {
                return JSON.stringify(v);
            }

            return v;
        });
    };

    /**
     * Serialize to JSON
     */
    toJSON(): SerializedState {
        return {
            queries: Object.keys(this._store.queries).reduce((acc, val) => {
                acc[val] = this._store.queries[val].toJSON();
                return acc;
            }, {} as SerializedState['queries']),
            blocks: toJS(this._store.blocks),
            variables: toJS(this._store.variables),
            dependencies: toJS(this._store.dependencies),
            executionOrder: toJS(this._store.executionOrder),
            version: this._store.version,
        };
    }

    /**
     * Internal
     */
    /**
     * Helpers
     */
    /**
     * Generate a new block from the json
     * @param json - json of the block that we are generating
     * @returns block
     */
    private generateBlock = (json: BlockJSON) => {
        // generate a new id
        const id = `${json.widget}--${Math.floor(Math.random() * 10000)}`;

        // create the block
        const block = {
            id: id,
            widget: json.widget,
            parent: null,
            data: {},
            listeners: {},
            slots: {},
        } as Block;

        // add the data
        block.data = json.data;

        // add the listeners
        block.listeners = json.listeners;

        // generate the slots
        for (const slot in json.slots) {
            if (json.slots[slot]) {
                block.slots[slot] = {
                    name: slot,
                    children: json.slots[slot].map((child) => {
                        // build the children, but only store the ids
                        const b = this.generateBlock(child);

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
     * Actions
     */
    /**
     * Set the state information
     *
     * @param state - pixel to execute
     */
    private setState = (
        state: SerializedState,
        initialParams?: Record<string, unknown>,
    ) => {
        // store the block information
        this._store.blocks = state.blocks;

        // load the queries
        this._store.queries = Object.keys(state.queries).reduce((acc, val) => {
            acc[val] = new QueryState(state.queries[val], this);
            return acc;
        }, {});

        // store the variables
        this._store.variables = state.variables ? state.variables : {};

        // TODO: Remove, store the dependencies
        this._store.dependencies = state.dependencies ? state.dependencies : {};

        // store the execution order of notebooks
        this._store.executionOrder = state.executionOrder
            ? state.executionOrder
            : [];

        // Replace initial param values provided from URL
        if (initialParams) {
            Object.entries(initialParams).forEach((keyValue) => {
                const key = keyValue[0];
                const value = keyValue[1];

                const variable = this._store.variables[key];

                if (variable) {
                    // retrieve the "to" value
                    const toValue = variable.to;
                    if (variable.type == 'block') {
                        // Look into blocks section
                        if (this._store.blocks[toValue]) {
                            this._store.blocks[toValue].data.value = value;
                        }
                    } else if (
                        variable.type == 'cell' ||
                        variable.type == 'query'
                    ) {
                        // TODO: Handle query and cell types do we just swap output?
                    } else {
                        this._store.variables[key]['value'] = value;
                    }
                }
            });
        }

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
        position?: AddBlockAction['payload']['position'],
    ): string => {
        // generate the block
        const block = this.generateBlock(json);

        // try to place it if position
        if (!position) {
            return;
        }

        const { parent, slot } = position;

        // get the parent
        const parentBlock = this._store.blocks[parent];

        if ('sibling' in position) {
            const { sibling, type } = position;

            // get the index of the sibling (it might have changed)
            const siblingIdx =
                parentBlock.slots[slot].children.indexOf(sibling);

            if (type === 'before') {
                // attach the block before
                this.attachBlock(parent, slot, siblingIdx, block.id);
            } else if (type === 'after') {
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
        return block.id;
    };

    /**
     * Move a block in the tree
     * @param id - id of the child block that we are moving
     * @param position - where is the block going
     */
    private moveBlock = (
        id: string,
        position: MoveBlockAction['payload']['position'],
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

        if ('sibling' in position) {
            const { sibling, type } = position;

            // get the index of the sibling (it might have changed)
            const siblingIdx =
                parentBlock.slots[slot].children.indexOf(sibling);

            if (type === 'before') {
                // attach the block before
                this.attachBlock(parent, slot, siblingIdx, id);
            } else if (type === 'after') {
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
        keep: RemoveBlockAction['payload']['keep'],
    ): void => {
        // get the block
        const block = this._store.blocks[id];

        if (block) {
            // Remove the variable
            Object.entries(this._store.variables).forEach((keyValue) => {
                const varId = keyValue[0];
                const variable = keyValue[1];

                if (variable.type === 'block') {
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
        const p = path.split('.');

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
        const p = path.split('.');

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
    ): void => {
        this._store.blocks[id].listeners[listener] = actions;
    };

    /**
     * Create a new query
     * @param queryId - name of the query that we are setting
     */
    private newQuery = (
        queryId: string,
        config: Omit<QueryStateConfig, 'id'>,
    ): string => {
        this._store.queries[queryId] = new QueryState(
            {
                ...config,
                id: queryId,
            },
            this,
        );

        return queryId;
    };

    /**
     * Delete a query
     * @param queryId - name of the query that we are deleting
     */
    private deleteQuery = (queryId: string): void => {
        delete this._store.queries[queryId];

        // clean up variables
        Object.entries(this._store.variables).forEach((keyValue) => {
            const id = keyValue[0];
            const variable = keyValue[1];
            if (variable.type === 'query') {
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
        q._processUpdate(path, value);
    };

    /**
     * Run a query
     * @param queryId - name of the query that we are running
     */
    private runQuery = (queryId: string): void => {
        const q = this._store.queries[queryId];

        const key = `query--${queryId};`;

        // cancel a previous command
        this._utils.queryPromises[key]?.cancel();

        // setup the promise
        const p = cancellablePromise(async () => {
            // run the query
            await q._processRun();

            // turn it off
            return true;
        });

        p.promise
            .then(() => {
                // noop
            })
            .catch((e) => {
                console.error('ERROR:', e);
            });

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
        cellId: string,
        config: Omit<CellStateConfig, 'id'>,
        previousCellId: string,
    ): void => {
        // get the query
        const q = this._store.queries[queryId];

        // add the cell
        q._processNewCell(cellId, config, previousCellId);
    };

    /**
     * Delete a cell
     * @param queryId - id of the updated query
     * @param cellId - id of the deleted cell
     */
    private deleteCell = (queryId: string, cellId: string): void => {
        // get the query
        const q = this._store.queries[queryId];

        // add the cell
        q._processDeleteCell(cellId);

        // clean up variables
        Object.entries(this._store.variables).forEach((keyValue) => {
            const id = keyValue[0];
            const variable = keyValue[1];
            if (variable.type === 'cell') {
                if (variable.to === queryId && cellId === variable.cellId) {
                    delete this._store.variables[id];
                }
            }
        });

        // always have at least one cell
        if (q.list.length === 0) {
            const newCellId = `${Math.floor(Math.random() * 100000)}`;

            this.newCell(
                queryId,
                newCellId,
                {
                    parameters: {
                        code: '',
                        type: 'pixel',
                    },
                    widget: 'code',
                    type: 'code',
                } as Omit<CellStateConfig, 'id'>,
                '',
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
        s._processUpdate(path, value);
    };

    /**
     * Run the cell
     * @param queryId - id of the updated query
     * @param cellId - id of the deleted cell
     */
    private runCell = (queryId: string, cellId: string): void => {
        const q = this._store.queries[queryId];
        const s = q.getCell(cellId);

        const key = `cell--${cellId} (query--${queryId});`;

        // cancel a previous command
        this._utils.queryPromises[key]?.cancel();

        // setup the promise
        const p = cancellablePromise(async () => {
            // run the cell
            await s._processRun();

            // turn it off
            return true;
        });

        p.promise
            .then(() => {
                // noop
            })
            .catch((e) => {
                console.error('ERROR:', e);
            });

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
        value?,
        isInput?,
        isOutput?,
    ) => {
        if (id.includes('.')) {
            return false;
        }

        if (this._store.variables[id]) {
            return false;
        }

        const token = { type };

        if (to) token['to'] = to;
        if (cellId) token['cellId'] = cellId;
        if (isInput) token['isInput'] = isInput;
        if (isOutput) token['isOutput'] = isOutput;
        if (value) token['value'] = value;

        this._store.variables[id] = token as Variable;

        return token;
    };

    /**
     * Renames variable that can be referenced
     * @param old - points to old id
     * @param id - new id for variable
     */
    private renameVariable = (old: string, id: string): boolean => {
        if (id.includes('.')) {
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
            console.log('----------------------------');
            console.log('remove old variable due to name change');
            console.log('----------------------------');
            delete this._store.variables[oldVar.id];
        }

        this._store.variables[id] = newVar;
    };

    /**
     * Deletes variable and corresponding dependency that can be referenced
     * @param id - id to delete
     */
    private deleteVariable = async (id: string) => {
        const variable = this._store.variables[id];
        if (
            variable.type !== 'block' &&
            variable.type !== 'query' &&
            variable.type !== 'cell'
        ) {
            delete this._store.dependencies[variable.to];
        }

        // remove the references of it from ui (don't touch users code notebook)
        // Stringify blocks
        const blocksToMutate = JSON.stringify(this._store.blocks);
        const regex = RegExp(`{{${id}(\\.[^}]+)?}}`, 'g');

        const modifiedBlocks = await blocksToMutate.replace(regex, '');

        this._store.blocks = JSON.parse(modifiedBlocks);

        delete this._store.variables[id];
    };

    /**
     * Adds a constant/dependency to use as a token
     * @param value can be an engine id, string, number, date, and etc
     * @param type - what type of dependency - Model, Database, String, Date, Number
     * @returns id of newly added dependency for token value
     */
    private addDependency = (value: unknown, type: string) => {
        let id;

        do {
            id = `${type}--${Math.floor(Math.random() * 10000)}`;
        } while (this._store.dependencies[id]);

        this._store.dependencies[id] = value;

        return id;
    };

    /**
     * Removes a dependency if unsuccesful variable creation
     * @param id id to remove
     */
    private removeDependency = (id: string) => {
        delete this._store.dependencies[id];
    };

    /**
     *
     */
    private setExecutionOrder = (orderedList: string[]) => {
        this._store.executionOrder = orderedList;
        return;
    };
}
