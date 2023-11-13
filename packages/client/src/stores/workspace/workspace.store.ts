import { makeAutoObservable } from 'mobx';

import { Role, WorkspaceView } from '@/types';
import { RootStore } from '@/stores';

import { AppMetadata } from '@/components/app';

interface WorkspaceStoreInterface {
    /**
     * ID of App
     */
    appId: string;

    /**
     * Show Loading or not
     */
    isLoading: boolean;

    /**
     * Track if the workspace is in edit mode
     */
    isEditMode: boolean;

    /**
     *  View of the workspace when in edit mode
     */
    view: WorkspaceView;

    /**
     * User's role relative to the app
     */
    role: Role;

    /**
     * Metadata associated with the loaded app
     */
    metadata: AppMetadata;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class WorkspaceStore {
    private _root: RootStore;
    private _store: WorkspaceStoreInterface = {
        appId: '',
        isLoading: false,
        isEditMode: false,
        view: 'design',
        role: 'READ_ONLY',
        metadata: {
            project_id: '',
            project_name: '',
            project_type: '',
            project_cost: '',
            project_global: '',
            project_catalog_name: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: '',
        },
    };

    constructor(
        root: RootStore,
        appId: string,
        config: Partial<{
            role: Role;
            metadata: AppMetadata;
        }>,
    ) {
        // register the root
        this._root = root;

        // set the appId
        this._store.appId = appId;

        // update the data
        if (config.role) {
            this._store.role = config.role;
        }

        if (config.role) {
            this._store.metadata = config.metadata;
        }

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get the ID of the app
     */
    get appId() {
        return this._store.appId;
    }

    /**
     * Get if the app is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /**
     * Track if the workspace is in edit mode
     */
    get isEditMode() {
        return this._store.isEditMode;
    }

    /**
     * Get the view of the app when it is in edit mode
     */
    get view() {
        // if (!this._store.isEditMode) {
        //     throw new Error('Not in Edit Mode');
        // }

        return this._store.view;
    }

    /**
     * Get the user's role in relation to the app
     */
    get role() {
        return this._store.role;
    }

    /**
     * Get metadata associated with the app
     */
    get metadata() {
        return this._store.metadata;
    }

    /**
     * Actions
     */
    /**
     * Set the loading screen for the app
     * @param isLoading - true if loading screen is on
     */
    setLoading = (isLoading: boolean) => {
        this._store.isLoading = isLoading;
    };

    /**
     * Set if the workspace is in edit mode
     * @param isEditMode - track if the workspace is in editmode
     */
    setEditMode = (isEditMode: boolean) => {
        this._store.isEditMode = isEditMode;
    };

    /**
     * Set the view of the app, only can be done in edit mode
     * @param view - true if it is in edit mode
     */
    setView = (view: WorkspaceView) => {
        if (!this._store.isEditMode) {
            throw new Error('Not in Edit Mode');
        }

        this._store.view = view;
    };
}
