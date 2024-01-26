import { makeAutoObservable, runInAction } from 'mobx';

import { CellState, CellStateConfig } from './cell.state';
import { StateStore } from './state.store';
import { setValueByPath } from '@/utility';

export interface QueryStateStoreInterface {
    /** Id of the query */
    id: string;

    /** Track if the cell is loading */
    isLoading: boolean;

    /** Is the query automatically run or manully */
    mode: 'automatic' | 'manual';

    /** Error associated with the Query */
    error: Error | null;

    /** Pixel Cells in the query */
    cells: Record<string, CellState>;

    /** Ordered list of the cells in the query */
    list: string[];
}

export interface QueryStateConfig {
    /** Id of the query */
    id: string;

    /** Is the query automatically run or manully */
    mode: 'automatic' | 'manual';

    /** Cells in the query */
    cells: CellStateConfig[];
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class QueryState {
    private _state: StateStore;
    private _store: QueryStateStoreInterface = {
        id: '',
        isLoading: false,
        mode: 'manual',
        error: null,
        cells: {},
        list: [],
    };

    constructor(config: QueryStateConfig, state: StateStore) {
        // register the state
        this._state = state;

        // set the id
        this._store.id = config.id;
        this._store.mode = config.mode;

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
        for (const s of this._store.list) {
            const cell = this._store.cells[s];
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

        for (const s of this._store.list) {
            const cell = this._store.cells[s];
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
        for (const s of this._store.list) {
            const cell = this._store.cells[s];
            if (!cell.isExecuted || cell.isError) {
                return false;
            }
        }

        return true;
    }

    /**
     * Mode of the query
     */
    get mode() {
        return this._store.mode;
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
            mode: this._store.mode,
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

            // convert the cells to the raw pixel
            const raw = this.toPixel();

            // fill the braces {{ }} to create the final pixel
            const filled = this._state.flattenVariable(raw);

            // run as a single pixel block;
            const { pixelReturn } = await this._state._runPixel(filled);

            const cellLen = this._store.list.length;
            if (pixelReturn.length !== cellLen) {
                throw new Error(
                    'Error processing pixel. Cells do not equal pixelReturn',
                );
            }

            runInAction(() => {
                // update the existing cells with the pixel blocks
                // let data = undefined;
                for (let cellIdx = 0; cellIdx < cellLen; cellIdx++) {
                    const cellId = this._store.list[cellIdx];

                    // get the cell
                    const cell = this._store.cells[cellId];

                    const { operationType, output } = pixelReturn[cellIdx];

                    // sync step information
                    cell._sync(operationType, output, true);
                }

                // clear the error
                this._store.error = null;
            });
        } catch (e) {
            // TODO - because we use _sync cells instead of _processRun on them individually
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
        this._store.list.splice(previousCellIdx + 1, 0, cellId);
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
            mode: this.mode,
            output: this.output,
            list: this.list,
        };
    }
}
