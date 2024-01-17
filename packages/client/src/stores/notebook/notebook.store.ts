import { makeAutoObservable } from 'mobx';

import { StateStore } from '../state';

export interface NotebookStoreInterface {
    /** Current selected query */
    selectedQueryId: string;

    /** Store the previously selected query -> step */
    selectedSteps: Record<string, string>;
}

/**
 * Internal state management of the notebook object
 */
export class NotebookStore {
    private _state: StateStore;
    private _store: NotebookStoreInterface = {
        selectedQueryId: '',
        selectedSteps: {},
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
     * Get the selected step
     */
    get selectedStep() {
        const selectedQuery = this.selectedQuery;
        if (!selectedQuery) {
            return null;
        }

        const selectedStepId = this._store.selectedSteps[selectedQuery.id];
        if (!selectedStepId) {
            return null;
        }
        const selectedStep = this.selectedQuery.getStep(selectedStepId);
        if (!selectedStep) {
            return null;
        }

        return selectedStep;
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
    }

    /**
     * Set the selected step
     * @param queryId - id of the block that is selected
     */
    selectStep(queryId: string, stepId: string) {
        // select the step
        this._store.selectedSteps[queryId] = stepId;
    }

    getQueryById(id: string) {
        return this._state.queries[id];
    }
}
