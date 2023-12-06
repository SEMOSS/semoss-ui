import { makeAutoObservable, runInAction } from 'mobx';

import { StepState, StepStateConfig } from './step.state';
import { StateStore } from './state.store';
import { setValueByPath } from '@/utility';

export interface QueryStateStoreInterface {
    /** Id of the query */
    id: string;

    /** Track if the query is initialized */
    isInitialized: boolean;

    /** Track if the step is loading */
    isLoading: boolean;

    /** Is the query automatically run or manully */
    mode: 'automatic' | 'manual';

    /** Error associated with the Query */
    error: Error | null;

    /** Pixel Steps in the query */
    steps: StepState[];
}

export interface QueryStateConfig {
    /** Id of the query */
    id: string;

    /** Is the query automatically run or manully */
    mode: 'automatic' | 'manual';

    /** Steps in the query */
    steps: StepStateConfig[];
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class QueryState {
    private _state: StateStore;
    private _store: QueryStateStoreInterface = {
        id: '',
        isInitialized: false,
        isLoading: false,
        mode: 'manual',
        error: null,
        steps: [],
    };

    constructor(config: QueryStateConfig, state: StateStore) {
        // register the state
        this._state = state;

        // set the id
        this._store.id = config.id;
        this._store.mode = config.mode;

        // create the steps
        this._store.steps = config.steps.map((s) => {
            return new StepState(s, this, this._state);
        }, {});

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
     * Track if the query is initialized
     */
    get isInitialized() {
        for (const step of this._store.steps) {
            if (!step.isExecuted) {
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

        for (const step of this._store.steps) {
            if (step.isLoading) {
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

        for (const step of this._store.steps) {
            if (step.isError) {
                return true;
            }
        }

        return false;
    }

    /**
     * Track if the query successfully ran
     */
    get isSuccessful() {
        for (const step of this._store.steps) {
            if (step.output === undefined) {
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

        // collect the step errors
        const messages = [];
        for (const step of this._store.steps) {
            if (step.isError) {
                messages.push(step.error);
            }
        }
        if (messages.length > 0) {
            return messages.join('\r\n');
        }

        return '';
    }

    /**
     * Data associated with the query
     */
    get data() {
        const stepLen = this._store.steps.length;
        if (stepLen > 0) {
            return Array.isArray(this._store.steps[stepLen - 1].output)
                ? this._store.steps[stepLen - 1].output[0]
                : this._store.steps[stepLen - 1].output;
        }

        return undefined;
    }

    /**
     * Get the steps of the query
     */
    get steps() {
        return this._store.steps;
    }

    /**
     * Get the index of a step
     * @param id - id of the step to get index for
     */
    getStepIdx = (id: string): number => {
        for (
            let stepIdx = 0, stepLen = this._store.steps.length;
            stepIdx < stepLen;
            stepIdx++
        ) {
            if (this._store.steps[stepIdx].id === id) {
                return stepIdx;
            }
        }

        return -1;
    };

    /**
     * Get a step from the query
     * @param id - id of the step to get index for
     */
    getStep = (id: string): StepState => {
        // get the index
        const stepIdx = this.getStepIdx(id);

        return this._store.steps[stepIdx];
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
            steps: this._store.steps.map((s) => s.toJSON()),
        };
    };

    /**
     * Helpers
     */
    /**
     * Convert the query to pixel
     */
    _toPixel = () => {
        return this._store.steps.map((s) => s._toPixel()).join(';');
    };

    /**
     * Process running of a pixel
     */
    /**
     * Process running of the query
     */
    _processRun = async () => {
        try {
            // check the loading state
            if (this._store.isLoading) {
                throw new Error('Query is loading');
            }

            // start the loading screen
            this._store.isLoading = true;

            // convert the steps to the raw pixel
            const raw = this._toPixel();

            // fill the braces {{ }} to create the final pixel
            const filled = this._state.flattenParameter(raw);

            // run as a single pixel block;
            const { pixelReturn } = await this._state._runPixel(filled);

            const stepLen = this._store.steps.length;
            if (pixelReturn.length !== stepLen) {
                throw new Error(
                    'Error processing pixel. Steps do not equal pixelReturn',
                );
            }

            // update the existing steps with the pixel blocks
            // let data = undefined;
            for (let stepIdx = 0; stepIdx < stepLen; stepIdx++) {
                const step = this._store.steps[stepIdx];

                const { operationType, output } = pixelReturn[stepIdx];

                // // save the last successful data
                // if (operationType.indexOf('ERROR') === -1) {
                //     data = output;
                // }

                // sync the new operation type and output
                step._sync(operationType, output);
            }

            runInAction(() => {
                // // save the data as the last step of the output
                // const { output } = pixelReturn[stepLen - 1];
                // // update the data
                // this._store.data = output;
            });
        } catch (e) {
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
     * Process adding a new step to the query
     * @param step - new step being added
     * @param previousStepId - id of the previous step
     */
    _processNewStep = (
        stepId: string,
        config: Omit<StepStateConfig, 'id'>,
        previousStepId: string,
    ) => {
        // create the new step
        const step = new StepState(
            {
                ...config,
                id: stepId,
            },
            this,
            this._state,
        );

        if (!previousStepId) {
            this._store.steps.push(step);
            return;
        }

        // get the index of the previous one
        const addStepIdx = this.getStepIdx(previousStepId);

        // add it
        this._store.steps.splice(addStepIdx + 1, 0, step);
    };

    /**
     * Process deleting a step from the query
     * @param id - id of the step to delete
     */
    _processDeleteStep = (id: string) => {
        // find the index to delete at
        const deleteStepIdx = this.getStepIdx(id);
        if (deleteStepIdx === -1) {
            throw new Error(`Unable to find step ${id}. This was not deleted`);
        }

        // remove it
        this._store.steps.splice(deleteStepIdx, 1);
    };
}
