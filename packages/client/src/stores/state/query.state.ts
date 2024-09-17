import { makeAutoObservable, runInAction } from 'mobx';

import { setValueByPath } from '@/utility';

import { CellState, CellStateConfig } from './cell.state';
import { StateStore } from './state.store';
import { Node } from '@xyflow/react';

export interface QueryStateStoreInterface {
    /** Id of the query */
    id: string;

    /** Track if the cell is loading */
    isLoading: boolean;

    /** Error associated with the Query */
    error: Error | null;

    /** Pixel Cells in the query */
    cells: Record<string, CellState>;

    /** Ordered list of the cells in the query */
    list: string[];

    /** Ordered list of items that represent nodes in our structure -> cells and their params*/
    nodes?: NodeTypes[];

    /** Connections between nodes  */
    edges?: Record<string, unknown>[];
}

type NodeTypes =
    | Node
    | {
          id: string;
          type: 'CELL';
          position: { x: number; y: number };
          data: { to: string };
      }
    | {
          id: string;
          type: 'DEPENDENCY_NODE';
          position: { x: number; y: number };
          data: { to: string };
      };

export interface QueryStateConfig {
    /** Id of the query */
    id: string;

    /** Cells in the query */
    cells: CellStateConfig[];

    nodes?: NodeTypes[];
    edges?: Record<string, unknown>[];
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class QueryState {
    private _state: StateStore;
    private _store: QueryStateStoreInterface = {
        id: '',
        isLoading: false,
        error: null,
        cells: {},
        list: [],
        nodes: [
            {
                id: '44024', // Does it need to be actually uniq could be overlap with other node ids that arent cells
                type: 'CELL_NODE',
                position: { x: 0, y: 300 },
                data: {
                    queryId: 'default',
                    to: '44024',
                },
            },
            {
                id: 'model',
                type: 'DEPENDENCY_NODE',
                position: { x: 0, y: 0 },
                data: {
                    to: 'model',
                },
            },
            {
                id: '28124', // Does it need to be actually uniq could be overlap with other node ids that arent cells
                type: 'CELL_NODE',
                position: { x: 800, y: 300 },
                data: {
                    queryId: 'default',
                    to: '28124',
                },
            },
            {
                id: 'input--7944',
                type: 'BLOCK_NODE',
                position: { x: 800, y: 0 },
                data: {
                    to: 'input--7944',
                },
            },
            {
                id: '85801', // Does it need to be actually uniq could be overlap with other node ids that arent cells
                type: 'CELL_NODE',
                position: { x: 1600, y: 300 },
                data: {
                    queryId: 'default',
                    to: '85801',
                },
            },
            {
                id: 'input--9802',
                type: 'BLOCK_NODE',
                position: { x: 1600, y: 0 },
                data: {
                    to: 'input--9802',
                },
            },
            {
                id: '47294', // Does it need to be actually uniq could be overlap with other node ids that arent cells
                type: 'CELL_NODE',
                position: { x: 2400, y: 300 },
                data: {
                    queryId: 'default',
                    to: '47294',
                },
            },
            {
                id: 'input--3443',
                type: 'BLOCK_NODE',
                position: { x: 2400, y: 0 },
                data: {
                    to: 'input--3443',
                },
            },
        ],

        edges: [
            {
                id: 'target-44024',
                source: 'model',
                target: '44024',
                sourceHandle: 'model',
                targetHandle: 'model--44024',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: '44024-28124',
                source: '44024',
                target: '28124',
                sourceHandle: '44024',
                targetHandle: '44024--28124',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: 'target-input--7944',
                source: 'input--7944',
                target: '28124',
                sourceHandle: 'input--7944',
                targetHandle: 'input--7944--28124',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: '28124-85801',
                source: '28124',
                target: '85801',
                sourceHandle: '28124',
                targetHandle: '28124--85801',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: 'target-input--9802',
                source: 'input--9802',
                target: '85801',
                sourceHandle: 'input--9802',
                targetHandle: 'input--9802--85801',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: '85801-47294',
                source: '85801',
                target: '47294',
                sourceHandle: '85801',
                targetHandle: '85801--47294',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
            {
                id: 'target-input--47294',
                source: 'input--3443',
                target: '47294',
                sourceHandle: 'input--3443',
                targetHandle: 'input--3443--47294',
                data: {
                    label: 'context',
                },
                type: 'start-end',
            },
        ],
    };

    constructor(config: QueryStateConfig, state: StateStore) {
        // register the state
        this._state = state;

        // set the id
        this._store.id = config.id;

        // create the cells
        const { cells, list } = config.cells.reduce(
            (acc, val) => {
                acc.cells[val.id] = new CellState(val, this, this._state);
                acc.list.push(val.id);

                return acc;
            },
            {
                cells: {},
                list: [],
            },
        );

        this._store.cells = cells;
        this._store.list = list;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Id of the query
     */
    get id() {
        return this._store.id;
    }

    /**
     * Track if the query is executed
     */
    get isExecuted() {
        for (const c of this._store.list) {
            const cell = this._store.cells[c];
            if (!cell.isExecuted) {
                return false;
            }
        }

        return true;
    }

    /**
     * Track if the query is loading
     */
    get isLoading() {
        if (this._store.isLoading) {
            return true;
        }

        for (const c of this._store.list) {
            const cell = this._store.cells[c];
            if (cell.isLoading) {
                return true;
            }
        }

        return false;
    }

    /**
     * Track if the query has errored
     */
    get isError() {
        if (this._store.error) {
            return true;
        }

        for (const s of this._store.list) {
            const cell = this._store.cells[s];
            if (cell.isError) {
                return true;
            }
        }

        return false;
    }

    /**
     * Track if the query successfully ran
     */
    get isSuccessful() {
        for (const c of this._store.list) {
            const cell = this._store.cells[c];
            if (!cell.isExecuted || cell.isError) {
                return false;
            }
        }

        return true;
    }

    /**
     * Data associateed with the query
     */
    get error() {
        // display the query error
        if (this._store.error) {
            return this._store.error.message;
        }

        // collect the cell errors
        const messages = [];
        for (const s of this._store.list) {
            const cell = this._store.cells[s];
            if (cell.isError) {
                messages.push(cell.error);
            }
        }

        if (messages.length > 0) {
            return messages.join('\r\n');
        }

        return '';
    }

    /**
     * Output associated with the query
     */
    get output() {
        const cellLen = this._store.list.length;
        if (cellLen > 0) {
            // get the last cell
            const cellId = this._store.list[cellLen - 1];
            return this._store.cells[cellId].output;
        }

        return undefined;
    }

    /**
     * Get list of the cells of the query
     */
    get list() {
        return this._store.list;
    }

    /**
     * Get the cells of the query
     */
    get cells() {
        return this._store.cells;
    }

    /**
     * Get list of the cells of the query
     */
    get nodes() {
        return this._store.nodes;
    }

    /**
     * Get the cells of the query
     */
    get edges() {
        return this._store.edges;
    }

    /**
     * Get a cell from the query
     * @param id - id of the cell to get
     */
    getCell = (id: string): CellState => {
        return this._store.cells[id];
    };

    /**
     * Actions
     */
    /**
     * Serialize to JSON
     */
    toJSON = (): QueryStateConfig => {
        return {
            id: this._store.id,
            cells: this._store.list.map((s) => this._store.cells[s].toJSON()),
        };
    };

    /**
     * Convert the query to pixel
     */
    toPixel = () => {
        return this._store.list
            .map((s) => this._store.cells[s].toPixel())
            .join(';');
    };

    /**
     * Helpers
     */
    /**
     * Process running of a pixel
     */
    _processRun = async () => {
        try {
            // check the loading state
            if (this._store.isLoading) {
                throw new Error('Query is loading');
            }

            // start the loading screen
            this._store.isLoading = true;

            // run each synchronously
            for (const s of this._store.list) {
                const cell = this._store.cells[s];

                // run the cell
                await cell._processRun();
            }
        } catch (e) {
            // if a cell errors out of the runPixel and causes a break/catch here,
            // we're unable to get granular information about which cell caused the error.
            runInAction(() => {
                this._store.error = e;
            });
        } finally {
            // stop the loading screen
            runInAction(() => {
                this._store.isLoading = false;
            });
        }
    };

    /**
     * Update the the store of the query
     * @param path - path of the data to set
     * @param value - value of the data
     */
    _processUpdate = (path: string | null, value: unknown) => {
        if (!path) {
            // set the value
            this._store = value as QueryStateStoreInterface;
            return;
        }

        // update the parameters
        setValueByPath(this._store, path, value);
    };

    /**
     * Process adding a new cell to the query
     * @param cell - new cell being added
     * @param previousCellId - id of the previous cell
     */
    _processNewCell = (
        cellId: string,
        config: Omit<CellStateConfig, 'id'>,
        previousCellId: string,
    ) => {
        // create the new cell
        const cell = new CellState(
            {
                ...config,
                id: cellId,
            },
            this,
            this._state,
        );

        // save the cell
        this._store.cells[cellId] = cell;

        // get the index of the previous one
        let previousCellIdx = -1;
        if (previousCellId) {
            previousCellIdx = this._store.list.indexOf(previousCellId);
        }

        // add to end if there is no previous cell
        if (previousCellIdx === -1) {
            this._store.list.push(cellId);
            return;
        }

        // add it
        if (!this._store.list.includes(cellId)) {
            this._store.list.splice(previousCellIdx + 1, 0, cellId);
        }
    };

    /**
     * Process deleting a cell from the query
     * @param id - id of the cell to delete
     */
    _processDeleteCell = (id: string) => {
        // find the index to delete at
        const deleteCellIdx = this._store.list.indexOf(id);
        if (deleteCellIdx === -1) {
            throw new Error(`Unable to find cell ${id}. This was not deleted`);
        }

        // remove it by index
        this._store.list.splice(deleteCellIdx, 1);

        // remove it by id
        if (this._store.cells[id]) {
            delete this._store.cells[id];
        }
    };

    /**
     * Get the exposed value that can be accesed by a variable
     */
    get _exposed() {
        return {
            id: this._store.id,
            isExecuted: this.isExecuted,
            isLoading: this.isLoading,
            isError: this.isError,
            isSuccessful: this.isSuccessful,
            error: this.error,
            output: this.output,
            list: this.list,
        };
    }
}
