import { makeAutoObservable, runInAction, toJS } from 'mobx';

import { setValueByPath } from '@/utility';

import { Cell, CellDef } from './state.types';
import { StateStore } from './state.store';
import { QueryState } from './query.state';
import { ActionMessages } from './state.actions';

export interface StepStateStoreInterface<D extends CellDef = CellDef> {
    /** Id of the step */
    id: string;

    /** Track if the step is loading */
    isLoading: boolean;

    /** Operation associated with the step */
    operation: string[];

    /** Output associated with the step */
    output: unknown | undefined;

    /** Widget to bind the step to */
    widget: D['widget'];

    /** Parameters associated with the step */
    parameters: D['parameters'];
}

export interface StepStateConfig<D extends CellDef = CellDef> {
    /** Id of the step */
    id: string;

    /** Widget to bind the step to */
    widget: D['widget'];

    /** Parameters associated with the step */
    parameters: D['parameters'];
}

/**
 * Store that manages each step in a query
 */
export class StepState<D extends CellDef = CellDef> {
    private _state: StateStore;
    private _query: QueryState;
    private _store: StepStateStoreInterface<D> = {
        id: '',
        isLoading: false,
        operation: [],
        output: undefined,
        widget: '',
        parameters: {},
    };

    constructor(config: StepStateConfig, query: QueryState, state: StateStore) {
        // register the query + state
        this._query = query;
        this._state = state;

        // set the initial state information
        this._store.id = config.id;
        this._store.widget = config.widget;
        this._store.parameters = config.parameters;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Id of the step
     */
    get id() {
        return this._store.id;
    }

    /**
     * Query associated with the step
     */
    get query() {
        return this._query;
    }

    /**
     * Track if the step is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /**
     * Track if the step has errored loading
     */
    get isError() {
        if (this._store.operation.indexOf('ERROR') > -1) {
            return true;
        }

        return false;
    }

    /**
     * Track if the step was successfully run
     */
    get isSuccessful() {
        if (
            this._store.operation.length > 0 &&
            this._store.operation.indexOf('ERROR') === -1
        ) {
            return true;
        }

        return false;
    }

    /**
     * Track if the query is executed (there is an output or an error)
     */
    get isExecuted() {
        if (this._store.operation.length > 0) {
            return true;
        }

        return false;
    }

    /**
     * Get any errors associated with the step
     */
    get error() {
        if (this.isError) {
            return this.output as string;
        }

        return '';
    }

    /**
     * Get the operation of the step
     */
    get operation() {
        return this._store.operation;
    }

    /**
     * Get the output of the step
     */
    get output() {
        return this._store.output;
    }

    /**
     * Get the widget associated with the step
     */
    get widget() {
        return this._store.widget;
    }

    /**
     * Get the cell associated with the step
     */
    get cell(): Cell | null {
        if (this._state.cellRegistry[this._store.widget]) {
            return this._state.cellRegistry[this._store.widget];
        }

        return null;
    }

    /**
     * Get the parameters associated with the step
     */
    get parameters() {
        return this._store.parameters;
    }

    /**
     * Actions
     */
    /**
     * Serialize to JSON
     */
    toJSON = (): StepStateConfig => {
        return {
            id: this._store.id,
            widget: this._store.widget,
            parameters: toJS(this._store.parameters),
        };
    };

    /**
     * Helpers
     */
    /**
     * Convert the parameters to pixel
     *
     * @param parameters - Convert the step with these parameters
     */
    _toPixel(
        parameters: Record<string, unknown> = this._store.parameters,
    ): string {
        const cell = this.cell;

        // use the toPixel from the cell
        if (cell) {
            return cell.toPixel(parameters);
        }

        return Object.keys(parameters)
            .map((key) => {
                return `${key}=[${JSON.stringify(parameters[key])}]`;
            })
            .join(', ');
    }
    /**
     * Process State
     */
    /**
     * Update the parameters of the step
     * @param operation - new operationType of the step
     * @param output - new output of the step
     */
    _sync(
        /** operation associated with the step */
        operation: string[],

        /** Output associated with the step */
        output: unknown,
    ) {
        this._store.operation = operation;
        this._store.output = output;
    }

    private findValueByDynamicKey(obj, keyToFind) {
        let result = null;

        for (const key in obj) {
            if (typeof obj[key] === 'object') {
                result = this.findValueByDynamicKey(obj[key], keyToFind);
                if (result !== null) {
                    return result;
                }
            } else if (
                typeof obj[key] === 'string' &&
                obj[key].includes(keyToFind)
            ) {
                // Check if the string contains the dynamic key
                return obj[key];
            }
        }

        return result;
    }
    /**
     * Process running of the step
     *
     * @param parameters - Run the step with these parameters. They will be saved if successful
     */
    async _processRun(parameters: Partial<Record<string, unknown>> = {}) {
        debugger;
        try {
            // check the loading state
            if (this._store.isLoading) {
                throw new Error('Step is loading');
            }

            // start the loading screen
            this._store.isLoading = true;

            // Go set all blocks to disabled that are dependent on this running query
            Object.values(this._state.blocks).forEach((b) => {
                const found = this.findValueByDynamicKey(b.data, this.query.id);
                if (found) {
                    const copiedBlock = b;
                    copiedBlock.data.disabled = true;
                    // set block to loading
                    this._state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: b.id,
                            path: 'disabled',
                            value: true,
                        },
                    });
                }
            });

            // merge the options
            const merged = {
                ...this._store.parameters,
                ...parameters,
            };

            // convert the steps to the raw pixel
            const raw = this._toPixel();

            // QUESTION(JOHN): Do we run the pixel if {{}} bracket is still not fulfilled
            // fill the braces {{ }} to create the final pixel
            const filled = this._state.flattenParameter(raw);

            // run the pixel
            const { pixelReturn } = await this._state._runPixel(filled);

            debugger;
            if (pixelReturn.length !== 1) {
                throw new Error('Unexpected number of pixel statements');
            }

            // assume there is 1 pixelReturn + step
            const { output, operationType } = pixelReturn[0];
            runInAction(() => {
                // update the parameters
                if (operationType.indexOf('ERROR') > -1) {
                    this._store.parameters = merged;
                }

                this._store.operation = operationType;
                this._store.output = output;
            });
        } finally {
            // stop the loading screen
            runInAction(() => {
                this._store.isLoading = false;
            });
        }
    }

    /**
     * Update the the store of the step
     * @param path - path of the data to set
     * @param value - value of the data
     */
    _processUpdate(path: string | null, value: unknown) {
        if (!path) {
            // set the value
            this._store = value as StepStateStoreInterface<D>;
            return;
        }

        // update the parameters
        setValueByPath(this._store, path, value);
    }
}
