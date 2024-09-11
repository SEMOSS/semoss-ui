import { makeAutoObservable } from 'mobx';

export interface ConductorStoreInterface {
    inputPool: Record<string, unknown>;

    steps: unknown[];

    /**
     * Stores all of our inputs and outputs of apps as steps
     * TODO: We may want to just update this to be renamed to inputPool
     * */
    // inputOutputPool: Record<string, unknown>;

    /**
     * Looks at our input output pool and updates values as they get updated
     * TODO: Same as above ^
     *  */
    // updateInputOutputPool: (key: string, value: unknown) => void;
}

/**
 * Internal state management of the inputs of steps for conductor
 */
export class ConductorStore {
    private _store: ConductorStoreInterface = {
        inputPool: {},

        steps: [],
    };

    constructor(config: ConductorStoreInterface) {
        this._store.inputPool = config.inputPool;

        this._store.steps = config.steps;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    get inputPool() {
        return this._store.inputPool;
    }

    get steps() {
        return this._store.steps;
    }

    /**
     * Actions
     */
    /**
     * Sets the value for the input
     */
    setInputValue(key: string, value: unknown) {
        console.log(key, value);
        this._store.inputPool[key] = value;
    }
}
