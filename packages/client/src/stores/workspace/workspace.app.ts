import { makeAutoObservable, runInAction } from 'mobx';

import { RootStore } from '@/stores';
import { runPixel } from '@/api';

interface WorkspaceAppStoreInterface {
    /** ID of the App */
    id: string;

    /** Track if the app is loading */
    isLoading: boolean;

    /** Track if the app has errored */
    isError: boolean;

    /** Options associated with the app */
    options: {
        /** Name of the app */
        name: string;
    };

    /** Configuration information associated with the app */
    config: Record<string, unknown>;
}

export class WorkspaceApp {
    private _root: RootStore;
    private _store: WorkspaceAppStoreInterface = {
        id: '',
        isLoading: false,
        isError: false,
        options: {
            name: '',
        },
        config: {},
    };

    constructor(
        root: RootStore,
        id: string,
        options: Partial<WorkspaceAppStoreInterface['options']>,
        config: Partial<WorkspaceAppStoreInterface['config']>,
    ) {
        // register the rootStore
        this._root = root;

        // set the id
        this._store.id = id;

        // update the options
        this.updateOptions(options);

        // update the config
        this.updateConfig(config);

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
     * Get if the app is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /**
     * Get if the app has errored
     */
    get isError() {
        return this._store.isError;
    }

    /**
     * Get options associated with the app
     */
    get options() {
        return this._store.options;
    }

    /**
     * Get the config associated with the app
     */
    get config() {
        return this._store.config;
    }

    /**
     * Update the config associated with the app
     * @param config - config to update on the app
     */
    private updateConfig(
        config: Partial<WorkspaceAppStoreInterface['config']>,
    ) {
        // merge the options in
        this._store.config = {
            ...this._store.config,
            ...config,
        };
    }

    /**
     * Update options associated with the app
     * @param options - options to update on the app
     */
    private updateOptions(
        options: Partial<WorkspaceAppStoreInterface['options']>,
    ) {
        // merge the options in
        this._store.options = {
            ...this._store.options,
            ...options,
        };
    }
}
