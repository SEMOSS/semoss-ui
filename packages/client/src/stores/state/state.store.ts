import { makeAutoObservable, reaction, runInAction } from 'mobx';

import { cancellablePromise, getValueByPath } from '@/utility';

import {
    ActionMessages,
    Actions,
    AddBlockAction,
    MoveBlockAction,
    RemoveBlockAction,
} from './state.actions';
import { Query, Block, BlockJSON, ListenerActions } from './state.types';

interface StateStoreInterface {
    /** Queries rendered in the insight */
    queries: Record<string, Query>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;
}

/**
 * Block store that helps users build a view
 */
export class StateStore {
    private _store: StateStoreInterface = {
        queries: {},
        blocks: {},
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

        /**
         * Track callbacks
         */
        callbacks: {
            /**
             * onQuery callback that is triggered after a query has been ran
             */
            onQuery: (event: { query: string }) => Promise<{
                data: unknown;
            }>;
        };
    } = {
        queryPromises: {},
        callbacks: {
            onQuery: async () => ({
                data: undefined,
            }),
        },
    };

    constructor(
        config: {
            /** Queries that will be loaed into the view */
            queries?: Record<string, Query>;

            /** Blocks that will be loaded into the view */
            blocks?: Record<string, Block>;
        },
        callbacks: {
            onQuery: (event: { query: string }) => Promise<{
                data: unknown;
            }>;
        },
    ) {
        // set the callbacks
        this._utils.callbacks = callbacks;

        // make it observable
        makeAutoObservable(this);

        // auto update when a query or mode changes
        reaction(
            () => {
                return Object.keys(this._store.queries).reduce<
                    Record<string, string>
                >((acc, val) => {
                    const q = this._store.queries[val];

                    // map id -> actual
                    acc[q.id] = `${this.flattenParameter(q.query)}--${q.mode}`;

                    return acc;
                }, {});
            },
            (curr, prev) => {
                for (const id in curr) {
                    // get the query
                    const q = this._store.queries[id];

                    // if they are the same ignore
                    if (!q || curr[id] === prev[id]) {
                        return;
                    }

                    // ignore if not automatic
                    if (q.mode !== 'automatic') {
                        return;
                    }

                    // run the query
                    this.runQuery(id);
                }
            },
        );

        // set the initial state after reactive to invoke it
        runInAction(() => {
            this._store.blocks = config.blocks || {};
            this._store.queries = config.queries || {};
        });
    }

    /**
     * Getters
     */
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
    getQuery(id: string): Query | null {
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
            } else if (ActionMessages.DELETE_BLOCK_DATA === action.message) {
                const { id, path } = action.payload;

                this.deleteBlockData(id, path);
            } else if (ActionMessages.SET_LISTENER === action.message) {
                const { id, listener, actions } = action.payload;

                this.setListener(id, listener, actions);
            } else if (ActionMessages.SET_QUERY === action.message) {
                const { id, query } = action.payload;

                this.setQuery(id, query);
            } else if (ActionMessages.DELETE_QUERY === action.message) {
                const { id } = action.payload;

                this.deleteQuery(id);
            } else if (ActionMessages.RUN_QUERY === action.message) {
                const { id } = action.payload;

                this.runQuery(id);
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
     * @param id - id of the block to get
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

        const id = split.shift();
        const path = split.join('.');

        // check if it is a block
        if (id && this._store.blocks[id]) {
            return getValueByPath(this._store.blocks[id].data, path);
        }

        // check if it is a query
        if (id && this._store.queries[id]) {
            return getValueByPath(this._store.queries[id], path);
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
            for (const c of children) {
                this.removeBlock(c, keep);
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
     * Set a query
     * @param id - name of the query that we are setting
     * @param query - query that we are setting
     */
    private setQuery = (id: string, query: string): void => {
        this._store.queries[id] = {
            id: id,
            isInitialized: false,
            isLoading: false,
            error: null,
            query: query,
            data: undefined,
            mode: 'manual',
        };
    };

    /**
     * Delete a query
     * @param id - name of the query that we are deleting
     */
    private deleteQuery = (id: string): void => {
        delete this._store.queries[id];
    };

    /**
     * Run a query
     * @param id - name of the query that we are running
     */
    private runQuery = (id: string): void => {
        const q = this._store.queries[id];

        // set the state to show it is initialized and loading
        q.isInitialized = false;
        q.isLoading = true;
        q.error = null;

        // reset
        q.data = undefined;

        // cancel a previous command
        this._utils.queryPromises[id]?.cancel();

        // setup the promise
        const p = cancellablePromise(() => {
            // fill the query
            const filled = this.flattenParameter(q.query);

            // call the callback
            return this._utils.callbacks.onQuery({
                query: filled,
            });
        });

        p.promise
            .then(({ data }) => {
                runInAction(() => {
                    // set the data
                    q.data = data;
                });
            })
            .catch((e) => {
                runInAction(() => {
                    // set in the error state
                    q.error = e;

                    console.error('ERROR:', e);
                });
            })
            .finally(() => {
                runInAction(() => {
                    // set it is initialized
                    q.isInitialized = true;

                    // turn off the loading screen
                    q.isLoading = false;
                });
            });

        // save the promise
        this._utils.queryPromises[id] = p;
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
}
