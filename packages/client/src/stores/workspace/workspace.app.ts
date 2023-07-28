import { makeAutoObservable } from 'mobx';

import { RootStore } from '@/stores';

interface WorkspaceAppStoreInterface {
    /** ID of the App */
    id: string;

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
        options: {
            name: '',
        },
    };

    constructor(
        root: RootStore,
        id: string,
        options: Partial<WorkspaceAppStoreInterface['options']>,
    ) {
        // register the rootStore
        this._root = root;

        // set the id
        this._store.id = id;

        // update the options
        this.updateOptions(options);

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
     * Get options associated with the app
     */
    get options() {
        return this._store.options;
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
