import { makeAutoObservable, runInAction, toJS } from 'mobx';

import { setValueByPath } from '@/utility';

import { Cell, CellDef } from './state.types';
import { StateStore } from './state.store';
import { QueryState } from './query.state';

export interface CellStateStoreInterface<D extends CellDef = CellDef> {
    /** Id of the cell */
    id: string;

    /** Track if the cell is loading */
    isLoading: boolean;

    /** Track when the cell began */
    executionStart: string | undefined;

    /** Track how long the cell took */
    executionDurationMilliseconds: number | undefined;

    /** Operation associated with the cell */
    operation: string[];

    /** Output associated with the cell */
    output: unknown | undefined;

    /** Prints and logs */
    messages: string[] | undefined;

    /** Widget to bind the cell to */
    widget: D['widget'];

    /** Parameters associated with the cell */
    parameters: D['parameters'];
}

export interface CellStateConfig<D extends CellDef = CellDef> {
    /** Id of the cell */
    id: string;

    /** Widget to bind the cell to */
    widget: D['widget'];

    /** Parameters associated with the cell */
    parameters: D['parameters'];
}

/**
 * Store that manages each cell in a query
 */
export class CellState<D extends CellDef = CellDef> {
    private _state: StateStore;
    private _query: QueryState;
    private _store: CellStateStoreInterface<D> = {
        id: '',
        isLoading: false,
        executionStart: undefined,
        executionDurationMilliseconds: undefined,
        operation: [],
        output: undefined,
        messages: [],
        widget: '',
        parameters: {},
    };

    constructor(config: CellStateConfig, query: QueryState, state: StateStore) {
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
     * Id of the cell
     */
    get id() {
        return this._store.id;
    }

    /**
     * Query associated with the cell
     */
    get query() {
        return this._query;
    }

    /**
     * Track if the cell is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /** Track when the cell began */
    get executionStart() {
        return this._store.executionStart;
    }

    /** Track how long the cell took */
    get executionDurationMilliseconds() {
        return this._store.executionDurationMilliseconds;
    }

    /**
     * Track if the cell has errored loading
     */
    get isError() {
        if (this._store.operation.indexOf('ERROR') > -1) {
            return true;
        }

        return false;
    }

    /**
     * Track if the cell was successfully run
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
     * Get any errors associated with the cell
     */
    get error() {
        if (this.isError) {
            return this.output as string;
        }

        return '';
    }

    /**
     * Get the operation of the cell
     */
    get operation() {
        return this._store.operation;
    }

    /**
     * Get the output of the cell
     */
    get output() {
        return this._store.output;
    }

    /**
     * Get the messages of the cell
     */
    get messages() {
        return this._store.messages;
    }

    /**
     * Get the widget associated with the cell
     */
    get widget() {
        return this._store.widget;
    }

    /**
     * Get the cell type associated with the cell
     */
    get cellType(): Cell | null {
        if (this._state.cellTypeRegistry[this._store.widget]) {
            return this._state.cellTypeRegistry[this._store.widget];
        }

        return null;
    }

    /**
     * Get the parameters associated with the cell
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
    toJSON = (): CellStateConfig => {
        return {
            id: this._store.id,
            widget: this._store.widget,
            parameters: toJS(this._store.parameters),
        };
    };

    /**
     * Convert the parameters to pixel
     *
     * @param parameters - Convert the cell with these parameters
     */
    toPixel(
        parameters: Record<string, unknown> = this._store.parameters,
    ): string {
        const cellType = this.cellType;

        // use the toPixel from the cell
        if (cellType) {
            return cellType.toPixel(parameters);
        }

        return Object.keys(parameters)
            .map((key) => {
                return `${key}=[${JSON.stringify(parameters[key])}]`;
            })
            .join(', ');
    }

    /**
     * Helpers
     */
    /**
     * Process State
     */
    /**
     * Update the parameters of the cell
     * @param operation - new operationType of the cell
     * @param output - new output of the cell
     */
    _sync(
        /** operation associated with the cell */
        operation: string[],

        /** Output associated with the cell */
        output: unknown,

        /** Messages, logs and prints */
        message?: string[],

        resetExecutionTracking?: boolean,
    ) {
        this._store.operation = operation;

        // Prints and messages
        this._store.messages = message;

        // Let Operations handle how things get interpretted
        this._store.output = output;

        // // if we are dealing with a CODE_EXECUTION operation, modify output
        // if (operation.includes('CODE_EXECUTION') && output != undefined) {
        //     this._store.output = Array.isArray(output)
        //         ? output.length > 0
        //             ? output[0].output
        //             : null
        //         : output;
        // } else {
        //     this._store.output = output;
        // }

        // syncing from query - we don't have granular information about execution
        if (resetExecutionTracking) {
            this._store.executionStart = undefined;
            this._store.executionDurationMilliseconds = undefined;
        }
    }

    /**
     * Process running of the cell
     *
     * @param parameters - Run the cell with these parameters. They will be saved if successful
     */
    async _processRun(parameters: Partial<Record<string, unknown>> = {}) {
        try {
            // check the loading state
            if (this._store.isLoading) {
                throw new Error('Cell is loading');
            }

            // start the loading screen
            runInAction(() => {
                this._store.isLoading = true;
            });

            const now = new Date();
            this._store.executionStart = `${now.toDateString()} ${now.toLocaleTimeString(
                'en-US',
            )}`;

            // merge the options
            const merged = {
                ...this._store.parameters,
                ...parameters,
            };

            // convert the cells to the raw pixel
            const raw = this.toPixel();

            // fill the braces {{ }} to create the final pixel
            const filled = this._state.flattenVariable(raw);

            const { jobId, status, messages, results } =
                await this._state._runPixelAsync(filled);

            // How do we want results to be mapped to cell
            // We currently can have multiple results per cell which I'm not sure if thats ideal
            // Do we want one output per cell
            // For example if I chain: MyEngines(); MyProjects(); -> results will give me results for both
            // Will it be expected they run these two independently

            if (!results) {
                throw new Error('Unable to parse pixel results');
            }
            let output;

            // Set output per operation
            if (results[1].pixelType === 'CUSTOM_DATA_STRUCTURE') {
                output = results[1].value;
            } else if (results[1].pixelType === 'FORMATTED_DATA_SET') {
                output = results[1].value[0];
            } else if (results[1].pixelType === 'CODE') {
                output = results[1].value[0].value[0];
            } else if (results[1].pixelType === 'ERROR') {
                output = results[1].value[0];
            } else if (results[1].pixelType === 'CONST_STRING') {
                output = results[1].value[0];
            } else if (results[1].pixelType === 'INVALID_SYNTAX') {
                output = results[1].value[0];
            } else {
                output = results[1].value;
            }

            runInAction(() => {
                // update the parameters
                if (results[1].opType.indexOf('ERROR') > -1) {
                    this._store.parameters = merged;
                }

                // any previous errors will be cleared on operation type sync
                this._sync(results[1].opType, output, messages);
            });
        } catch (e) {
            // catch and set errors
            this._sync(['ERROR'], e.message);
        } finally {
            const end = new Date();
            const start = new Date(this._store.executionStart);
            runInAction(() => {
                this._store.executionDurationMilliseconds =
                    end.getTime() - start.getTime();
                // stop the loading screen
                this._store.isLoading = false;
            });
        }
    }

    /**
     * Update the the store of the cell
     * @param path - path of the data to set
     * @param value - value of the data
     */
    _processUpdate(path: string | null, value: unknown) {
        if (!path) {
            // set the value
            this._store = value as CellStateStoreInterface<D>;
            return;
        }

        // update the parameters
        setValueByPath(this._store, path, value);
    }

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
            messages: this.messages,
            operation: this.operation,
        };
    }
}
