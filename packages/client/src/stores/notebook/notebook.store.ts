import { makeAutoObservable } from 'mobx';

import { StateStore } from '../state';

export interface NotebookStoreInterface {
    /** Current selected query */
    selectedQueryId: string;

    /** Store the previously selected query -> cell */
    selectedCells: Record<string, string>;
}

/**
 * Internal state management of the notebook object
 */
export class NotebookStore {
    private _state: StateStore;
    private _store: NotebookStoreInterface = {
        selectedQueryId: '',
        selectedCells: {},
    };

    constructor(state: StateStore) {
        // set the state
        this._state = state;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get the queries
     * @returns the queries
     */
    get queriesList() {
        return Object.values(this._state.queries).sort((a, b) => {
            const aId = a.id.toLowerCase(),
                bId = b.id.toLowerCase();

            if (aId < bId) {
                return -1;
            }
            if (aId > bId) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * Get the selected query
     */
    get selectedQuery() {
        return this._state.queries[this._store.selectedQueryId];
    }

    /**
     * Get the selected cell
     */
    get selectedCell() {
        const selectedQuery = this.selectedQuery;
        if (!selectedQuery) {
            return null;
        }

        const selectedCellId = this._store.selectedCells[selectedQuery.id];
        if (!selectedCellId) {
            return null;
        }
        const selectedCell = this.selectedQuery.getCell(selectedCellId);
        if (!selectedCell) {
            return null;
        }

        return selectedCell;
    }

    /**
     * Actions
     */
    /**
     * Set the selected query
     * @param queryId - id of the block that is selected
     */
    selectQuery(queryId: string) {
        // set the id
        this._store.selectedQueryId = queryId;
        // automatically select last cell of query
        let queryCells = this._state.queries[queryId].list;
        if (queryCells.length) {
            this.selectCell(queryId, queryCells[queryCells.length - 1]);
        }
    }

    /**
     * Set the selected cell
     * @param queryId - id of the block that is selected
     */
    selectCell(queryId: string, cellId: string) {
        // select the cell
        this._store.selectedCells[queryId] = cellId;
    }
}
