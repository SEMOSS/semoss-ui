import { makeAutoObservable } from 'mobx';

import { RootStore } from '@/stores';

interface WorkspaceAppStoreInterface {
    /** ID of the App */
    id: string;

    /** Type of the app */
    type: string;

    /** Environment variables associated with the app */
    env: Record<string, unknown>;

    /** Display information associated with the loaded app */
    display: {
        /** Name of the app */
        name: string;
    };
}

export class WorkspaceApp {
    private _root: RootStore;
    private _store: WorkspaceAppStoreInterface = {
        id: '',
        type: '',
        env: {},
        display: {
            name: '',
        },
    };

    constructor(
        root: RootStore,
        id: string,
        type: string,
        options: Partial<WorkspaceAppStoreInterface['env']>,
        display: Partial<WorkspaceAppStoreInterface['display']>,
    ) {
        // register the rootStore
        this._root = root;

        // set the id and type
        this._store.id = id;
        this._store.type = type;

        // update the options
        this.updateEnv(options);

        // update the display
        this.updateDisplay(display);

        // make it observale
        makeAutoObservable(this);
    }

    // *********************************************************
    // Getters
    // *********************************************************
    /**
     * Get selected app id
     */
    get id() {
        return this._store.id;
    }

    /**
     * Get the type of the app
     */
    get type() {
        return this._store.type;
    }

    /**
     * Get the environment information associated with the app
     */
    get env() {
        return this._store.env;
    }

    /**
     * Get the display information associated with the app
     */
    get display() {
        return this._store.display;
    }

    /**
     * Update env information associated with the app
     * @param env - env information to update on the app
     */
    private updateEnv(env: Partial<WorkspaceAppStoreInterface['env']>) {
        // merge the env in
        this._store.env = {
            ...this._store.env,
            ...env,
        };
    }

    /**
     * Update display information associated with the app
     * @param display - display information to update on the app
     */
    private updateDisplay(
        display: Partial<WorkspaceAppStoreInterface['display']>,
    ) {
        // merge the display in
        this._store.display = {
            ...this._store.display,
            ...display,
        };
    }
}
