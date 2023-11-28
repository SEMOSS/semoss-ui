import { makeAutoObservable } from 'mobx';

import {
    ActionMessages,
    StateStoreImplementation,
    StepStateConfig,
} from '../state';

export interface NotebookStoreInterface {
    /** Current selected query */
    selectedQueryId: string;

    /** Store the previously selected query -> step */
    selectedSteps: Record<string, string>;

    /** overlay information */
    overlay: {
        /** track if the overlay is open or closed */
        open: boolean;

        /** content to display in the overlay */
        render: () => JSX.Element;
    };
}

/**
 * Internal state management of the notebook object
 */
export class NotebookStore {
    private _state: StateStoreImplementation;
    private _store: NotebookStoreInterface = {
        selectedQueryId: '',
        selectedSteps: {},
        overlay: {
            open: false,
            render: null,
        },
    };

    constructor(state: StateStoreImplementation) {
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
     * Get the overlay information
     * @returns the overlay information
     */
    get overlay() {
        return this._store.overlay;
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

    /**
     * Run a step
     * @param queryId - id of the query to run
     * @param stepId - id of the step to run
     */
    runStep(queryId: string, stepId: string) {
        this._state.dispatch({
            message: ActionMessages.RUN_STEP,
            payload: {
                queryId: queryId,
                stepId: stepId,
            },
        });
    }

    /**
     * Create a new step
     * @param queryId - id of the query of the step
     * @param stepId - id of the new step
     * @param config - config of the new step
     * @param previousStepId - previous step
     */
    newStep(
        queryId: string,
        stepId: string,
        config: Omit<StepStateConfig, 'id'>,
        previousStepId?: string,
    ) {
        this._state.dispatch({
            message: ActionMessages.NEW_STEP,
            payload: {
                queryId: queryId,
                stepId: stepId,
                previousStepId: previousStepId,
                config: config,
            },
        });
    }

    /**
     * Delete a step
     * @param queryId - id of the step to delete
     * @param stepId - id of the step to delete
     */
    deleteStep(queryId: string, stepId: string) {
        this._state.dispatch({
            message: ActionMessages.DELETE_STEP,
            payload: {
                queryId: queryId,
                stepId: stepId,
            },
        });
    }

    /**
     * Delete a step
     * @param queryId - id of the step to delete
     * @param stepId - id of the step to delete
     */
    updateStep(queryId: string, stepId: string, path: string | null, value) {
        this._state.dispatch({
            message: ActionMessages.UPDATE_STEP,
            payload: {
                queryId: queryId,
                stepId: stepId,
                path: path,
                value: value,
            },
        });
    }

    /**
     * Open the overlay
     */
    openOverlay(content: NotebookStoreInterface['overlay']['render']) {
        // open the overlay
        this._store.overlay.open = true;

        // set the content
        this._store.overlay.render = content;
    }

    /**
     * Close the overlay
     */
    closeOverlay() {
        // close the overlay
        this._store.overlay.open = false;

        // clear the content
        this._store.overlay.render = null;
    }
}
