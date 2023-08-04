import { makeAutoObservable } from 'mobx';

import { RootStore } from '@/stores';

interface WorkspaceAppStoreInterface {
    /** ID of the App */
    id: string;

    /** Url of the app */
    url: string;

    /** Options associated with the loaded app */
    options: {
        /** Name of the app */
        name: string;
    };
}

export class WorkspaceApp {
    private _root: RootStore;
    private _store: WorkspaceAppStoreInterface = {
        id: '',
        url: '',
        options: {
            name: '',
        },
    };

    constructor(
        root: RootStore,
        id: string,
        url: string,
        options: Partial<WorkspaceAppStoreInterface['options']>,
    ) {
        // register the rootStore
        this._root = root;

        // set the id and url
        this._store.id = id;
        this._store.url = url;

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
        return this._store.id;
    }

    /**
     * Get app url
     */
    get url() {
        return this._store.url;
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
