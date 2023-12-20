import { makeAutoObservable, reaction, toJS } from 'mobx';

import { runPixel } from '@/api';
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
} from './state.types';
import { QueryState, QueryStateConfig } from './query.state';
import { StepStateConfig } from './step.state';

interface StateStoreInterface {
    /** insightID to load */
    insightId: string;

    /** Queries rendered in the insight */
    queries: Record<string, QueryState>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;

    /** Cells registered to the insight */
    cellRegistry: CellRegistry;
}

export class StateStoreConfig {
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
        insightId: '',
        queries: {},
        blocks: {},
        cellRegistry: {},
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

        // register the cells
        this._store.cellRegistry = config.cellRegistry || {};

        // make it observable
        makeAutoObservable(this);

        // auto update when a query or mode changes
        reaction(
            () => {
                return Object.keys(this._store.queries).reduce<
                    Record<string, string>
                >((acc, val) => {
                    const q = this._store.queries[val];

                    // debugger;
                    // map id -> actual
                    acc[q.id] = `${this.flattenParameter(q._toPixel())}--${
                        q.mode
                    }`;
                    return acc;
                }, {});
            },
            (curr, prev) => {
                for (const id in curr) {
                    // debugger;
                    // get the query
                    const q = this._store.queries[id];

                    // if they are the same ignore
                    if (!q || curr[id] === prev[id]) {
                        continue;
                    }

                    // ignore if not automatic
                    if (q.mode !== 'automatic') {
                        continue;
                    }

                    // debugger;
                    // run the query
                    this.runQuery(id);
                }
            },
        );

        // set the initial state after reactive to invoke it
        this.loadState(config.state);
    }

    /**
     * Getters
     */
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
     * Get the cell registry
     * @returns the cell registry
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
                const { blocks, queries } = action.payload;

                this.setState(blocks, queries);
            } else if (ActionMessages.ADD_BLOCK === action.message) {
                const { json, position } = action.payload;

                this.addBlock(json, position);
            } else if (ActionMessages.MOVE_BLOCK === action.message) {
                const { id, position } = action.payload;

                this.moveBlock(id, position);
            } else if (ActionMessages.REMOVE_BLOCK === action.message) {
                const { id, keep } = action.payload;

                this.removeBlock(id, keep);
            } else if (ActionMessages.SET_BLOCK_DATA === action.message) {
                const { id, path, value } = action.payload;

                this.setBlockData(id, path, value);
            } else if (ActionMessages.SET_BLOCK_QUERIES === action.message) {
                const { id, queries } = action.payload;

                this.setBlockQueries(id, queries);
            } else if (ActionMessages.DELETE_BLOCK_DATA === action.message) {
                const { id, path } = action.payload;

                this.deleteBlockData(id, path);
            } else if (ActionMessages.SET_LISTENER === action.message) {
                const { id, listener, actions } = action.payload;

                this.setListener(id, listener, actions);
            } else if (ActionMessages.NEW_QUERY === action.message) {
                const { queryId, config } = action.payload;

                this.newQuery(queryId, config);
            } else if (ActionMessages.DELETE_QUERY === action.message) {
                const { queryId } = action.payload;

                this.deleteQuery(queryId);
            } else if (ActionMessages.UPDATE_QUERY === action.message) {
                const { queryId, path, value } = action.payload;

                this.updateQuery(queryId, path, value);
            } else if (ActionMessages.RUN_QUERY === action.message) {
                const { queryId } = action.payload;

                this.runQuery(queryId);
            } else if (ActionMessages.NEW_STEP === action.message) {
                const { queryId, stepId, config, previousStepId } =
                    action.payload;

                this.newStep(queryId, stepId, config, previousStepId);
            } else if (ActionMessages.DELETE_STEP === action.message) {
                const { queryId, stepId } = action.payload;

                this.deleteStep(queryId, stepId);
            } else if (ActionMessages.UPDATE_STEP === action.message) {
                const { queryId, stepId, path, value } = action.payload;

                this.updateStep(queryId, stepId, path, value);
            } else if (ActionMessages.RUN_STEP === action.message) {
                const { queryId, stepId } = action.payload;

                this.runStep(queryId, stepId);
            } else if (ActionMessages.DISPATCH_EVENT === action.message) {
                const { name, detail } = action.payload;

                this.dispatchEvent(name, detail);
            }
        } catch (e) {
            console.error(e);
        }
    };

    /**
     * Calculate the value of a parameter
     * @param parameter - string with mustach syntax for inputs
     * @param getQueryState we do not want to set block settings the evaluated query unless its the data
     * @returns the specific block information
     */
    calculateParameter(parameter: string): unknown {
        // check if there is actually a parameter (we only handle 1 for now)
        let cleaned = parameter.trim();
        if (!cleaned.startsWith('{{') || !cleaned.endsWith('}}')) {
            return parameter;
        }

        // remove the brackets
        cleaned = cleaned.slice(2, -2);

        // extract the id and path
        const split = cleaned.split('.');

        // only continue loop if here is something meaninful to be split
        // ex don't continue for something like {{query1}} or {{query1.}}
        if (split.length > 1 && split[1]) {
            const id = split.shift();
            const path = split.join('.');

            // check if it is in the block's data
            if (id && this._store.blocks[id]) {
                return getValueByPath(this._store.blocks[id].data, path);
            }

            // check if it is in a query
            if (id && this._store.queries[id]) {
                return getValueByPath(this._store.queries[id], path);
            }
        }

        return parameter;
    }

    /**
     * Flatten a parameter into a string
     * @param parameter - parameter to flatten
     * @returns the flatten parameter
     */
    flattenParameter = (parameter: string): string => {
        return parameter.replace(/{{(.*?)}}/g, (match) => {
            const v = this.calculateParameter(match);

            if (typeof v === 'string') {
                return v;
            }

            return JSON.stringify(v);
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
        };
    }

    /**
     * Internal
     */
    /**
     * Helpers
     */

    /**
     * Load the state
     * @param state - state to load into the store
     */
    private loadState = (state: SerializedState) => {
        // store the block information
        this._store.blocks = state.blocks;

        // load the queries
        this._store.queries = Object.keys(state.queries).reduce((acc, val) => {
            acc[val] = new QueryState(state.queries[val], this);
            return acc;
        }, {});
    };

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
     * Run a pixel string
     *
     * @param pixel - pixel to execute
     */
    private setState = (
        blocks?: StateStoreInterface['blocks'],
        queries?: StateStoreInterface['queries'],
    ) => {
        // add the blocks and queries
        this._store.blocks = blocks || {};
        this._store.queries = queries || {};
    };

    /**
     * Create a block and add it to the tree
     * @param json - json of the block that we are adding
     * @param position - where is the block going
     */
    private addBlock = (
        json: BlockJSON,
        position?: AddBlockAction['payload']['position'],
    ): void => {
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
     * Set Block to loading if query is currently loading
     * @param id
     * @param queries
     */
    private setBlockQueries = (id: string, queries: string): void => {
        const loading = JSON.parse(
            this.flattenParameter(queries).toLowerCase(),
        );

        this._store.blocks[id]['queries'] = queries;
        this._store.blocks[id].data['loading'] = loading;
    };

    /**
     * Set load state for blocks dependendent on query id
     * @param queryId
     * @param loading
     */
    private setBlocksLoading = (queryId: string, loading: boolean) => {
        const blocks = this._store.blocks;
        for (const key in blocks) {
            const block = blocks[key];
            if (block['queries']) {
                const match = (block['queries'] as string).match(/{{([^.]*)\./);

                if (match && match[1] === queryId) {
                    block['data']['loading'] = loading;
                } else {
                    console.error('query not found');
                }
            }
        }
    };

    /**
     * Create a new query
     * @param queryId - name of the query that we are setting
     */
    private newQuery = (
        queryId: string,
        config: Omit<QueryStateConfig, 'id'>,
    ): void => {
        this._store.queries[queryId] = new QueryState(
            {
                ...config,
                id: queryId,
            },
            this,
        );
    };

    /**
     * Delete a query
     * @param queryId - name of the query that we are deleting
     */
    private deleteQuery = (queryId: string): void => {
        delete this._store.queries[queryId];
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

        // look at blocks that have queryId and turn on loading
        this.setBlocksLoading(queryId, true);

        // setup the promise
        const p = cancellablePromise(async () => {
            // Check which blocks that were dependent on that query,
            // And shut that blocks loading state on

            // run the query
            await q._processRun();

            // turn it off
            return true;
        });

        p.promise
            .then(() => {
                // noop

                // Turn off loading
                this.setBlocksLoading(queryId, false);
            })
            .catch((e) => {
                console.error('ERROR:', e);

                // Turn off blocks loading
                this.setBlocksLoading(queryId, false);
                // TODO: Turn on Error State
            });

        // save the promise
        this._utils.queryPromises[key] = p;
    };

    /**
     * Create a new step
     * @param queryId - id of the updated query
     * @param stepId - id of the new step
     * @param config - config of the
     * @param previousStepId: id of the previous step,
     */
    private newStep = (
        queryId: string,
        stepId: string,
        config: Omit<StepStateConfig, 'id'>,
        previousStepId: string,
    ): void => {
        // get the query
        const q = this._store.queries[queryId];

        // add the step
        q._processNewStep(stepId, config, previousStepId);
    };

    /**
     * Delete a step
     * @param queryId - id of the updated query
     * @param stepId - id of the deleted step
     */
    private deleteStep = (queryId: string, stepId: string): void => {
        // get the query
        const q = this._store.queries[queryId];

        // add the step
        q._processDeleteStep(stepId);
    };

    /**
     * Update the store in the step
     * @param queryId - id of the updated query
     * @param stepId - id of the updated step
     * @param path - path of the data to set
     * @param value - value of the data
     */
    private updateStep = (
        queryId: string,
        stepId: string,
        path: string | null,
        value: unknown,
    ): void => {
        const q = this._store.queries[queryId];
        const s = q.getStep(stepId);

        // set the value
        s._processUpdate(path, value);
    };

    /**
     * Run the step
     * @param queryId - id of the updated query
     * @param stepId - id of the deleted step
     */
    private runStep = (queryId: string, stepId: string): void => {
        const q = this._store.queries[queryId];
        const s = q.getStep(stepId);

        const key = `step--${stepId} (query--${queryId});`;

        // cancel a previous command
        this._utils.queryPromises[key]?.cancel();

        // look at blocks that have queryId and turn on loading
        this.setBlocksLoading(queryId, true);

        // setup the promise
        const p = cancellablePromise(async () => {
            // run the step
            await s._processRun();

            // turn it off
            return true;
        });

        p.promise
            .then(() => {
                // noop

                // Turn off blocks loading
                this.setBlocksLoading(queryId, false);
            })
            .catch((e) => {
                console.error('ERROR:', e);
                // Turn off blocks loading
                this.setBlocksLoading(queryId, false);
                // TODO: Turn on Error State
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

    /**
     * Run a pixel string
     *
     * @param pixel - pixel to execute
     */
    async _runPixel<O extends unknown[] | []>(pixel: string) {
        return await runPixel<O>(pixel, this._store.insightId);
    }
}
