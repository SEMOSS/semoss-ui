import { makeAutoObservable } from 'mobx';

import { RootStore } from '@/stores';

interface WorkspaceAppStoreInterface {
    /** Id of the app */
    appId: string;

    /** ID of the App */
    insightId: string;

    /** Options associated with the loaded app */
    options: {
        /** Name of the app */
        name: string;
    };
}

export class WorkspaceApp {
    private _root: RootStore;
    private _store: WorkspaceAppStoreInterface = {
        appId: '',
        insightId: '',
        options: {
            name: '',
        },
    };

    constructor(
        root: RootStore,
        appId: string,
        insightId: string,
        options: Partial<WorkspaceAppStoreInterface['options']>,
    ) {
        // register the rootStore
        this._root = root;

        // set the ids
        this._store.appId = appId;
        this._store.insightId = insightId;

        // update the options
        this.updateOptions(options);

        // make it observale
        makeAutoObservable(this);
    }

    // *********************************************************
    // Getters
    // *********************************************************
    /**
     * Get app id
     */
    get id() {
        return this._store.insightId;
    }

    /**
     * Get app url
     */
    get url() {
        return this._store.appId;
    }

    /**
     * Get the options information associated with the app
     */
    get options() {
        return this._store.options;
    }

    /**
     * Update the options associated with the app
     * @param options - options for the app
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
