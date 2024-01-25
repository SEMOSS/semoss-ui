import { makeAutoObservable, runInAction } from 'mobx';

import { StepState, StepStateConfig } from './step.state';
import { StateStore } from './state.store';
import { setValueByPath } from '@/utility';

export interface QueryStateStoreInterface {
    /** Id of the query */
    id: string;

    /** Track if the step is loading */
    isLoading: boolean;

    /** Is the query automatically run or manully */
    mode: 'automatic' | 'manual';

    /** Error associated with the Query */
    error: Error | null;

    /** Pixel Steps in the query */
    steps: Record<string, StepState>;

    /** Ordered list of the steps in the query */
    list: string[];
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
        isLoading: false,
        mode: 'manual',
        error: null,
        steps: {},
        list: [],
    };

    constructor(config: QueryStateConfig, state: StateStore) {
        // register the state
        this._state = state;

        // set the id
        this._store.id = config.id;
        this._store.mode = config.mode;

        // create the steps
        const { steps, list } = config.steps.reduce(
            (acc, val) => {
                acc.steps[val.id] = new StepState(val, this, this._state);
                acc.list.push(val.id);

                return acc;
            },
            {
                steps: {},
                list: [],
            },
        );

        this._store.steps = steps;
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
            const step = this._store.steps[s];
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

        for (const s of this._store.list) {
            const step = this._store.steps[s];
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

        for (const s of this._store.list) {
            const step = this._store.steps[s];
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
        for (const s of this._store.list) {
            const step = this._store.steps[s];
            if (!step.isExecuted || step.isError) {
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
        for (const s of this._store.list) {
            const step = this._store.steps[s];
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
     * Output associated with the query
     */
    get output() {
        const stepLen = this._store.list.length;
        if (stepLen > 0) {
            // get the last step
            const sId = this._store.list[stepLen - 1];
            return this._store.steps[sId].output;
        }

        return undefined;
    }

    /**
     * Get list of the steps of the query
     */
    get list() {
        return this._store.list;
    }

    /**
     * Get the steps of the query
     */
    get steps() {
        return this._store.steps;
    }

    /**
     * Get a step from the query
     * @param id - id of the step to get
     */
    getStep = (id: string): StepState => {
        return this._store.steps[id];
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
            steps: this._store.list.map((s) => this._store.steps[s].toJSON()),
        };
    };

    /**
     * Convert the query to pixel
     */
    toPixel = () => {
        return this._store.list
            .map((s) => this._store.steps[s].toPixel())
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

            // convert the steps to the raw pixel
            const raw = this.toPixel();

            // fill the braces {{ }} to create the final pixel
            const filled = this._state.flattenVariable(raw);

            // run as a single pixel block;
            const { pixelReturn } = await this._state._runPixel(filled);

            const stepLen = this._store.list.length;
            if (pixelReturn.length !== stepLen) {
                throw new Error(
                    'Error processing pixel. Steps do not equal pixelReturn',
                );
            }

            runInAction(() => {
                // update the existing steps with the pixel blocks
                // let data = undefined;
                for (let stepIdx = 0; stepIdx < stepLen; stepIdx++) {
                    const sId = this._store.list[stepIdx];

                    // get the step
                    const step = this._store.steps[sId];

                    const { operationType, output } = pixelReturn[stepIdx];

                    // sync step information
                    // if we are dealing with a python code cell, modify output
                    if (
                        step.widget === 'code' &&
                        step.parameters?.type === 'py'
                    ) {
                        if (
                            operationType.includes('CODE_EXECUTION') &&
                            output != undefined
                        ) {
                            const modifiedOutput = Array.isArray(output)
                                ? output.length > 0
                                    ? output[0].output
                                    : null
                                : output;
                            step._sync(operationType, modifiedOutput);
                        } else {
                            step._sync(operationType, output);
                        }
                    } else {
                        step._sync(operationType, output);
                    }
                }

                // clear the error
                this._store.error = null;
            });
        } catch (e) {
            // TODO - because we use _sync steps instead of _processRun on them individually
            // if a step errors out of the runPixel and causes a break/catch here,
            // we're unable to get granular information about which step caused the error.
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

        // save the step
        this._store.steps[stepId] = step;

        // get the index of the previous one
        let previousStepIdx = -1;
        if (previousStepId) {
            previousStepIdx = this._store.list.indexOf(previousStepId);
        }

        // add to end if there is no previous step
        if (previousStepIdx === -1) {
            this._store.list.push(stepId);
            return;
        }

        // add it
        this._store.list.splice(previousStepIdx + 1, 0, stepId);
    };

    /**
     * Process deleting a step from the query
     * @param id - id of the step to delete
     */
    _processDeleteStep = (id: string) => {
        // find the index to delete at
        const deleteStepIdx = this._store.list.indexOf(id);
        if (deleteStepIdx === -1) {
            throw new Error(`Unable to find step ${id}. This was not deleted`);
        }

        // remove it by index
        this._store.list.splice(deleteStepIdx, 1);

        // remove it by id
        if (this._store.steps[id]) {
            delete this._store.steps[id];
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
