import { makeAutoObservable } from 'mobx';

import { Role, WorkspaceDef, WorkspaceView } from '@/types';
import { RootStore } from '@/stores';

import { AppMetadata } from '@/components/app';

export interface WorkspaceStoreInterface<
    D extends WorkspaceDef = WorkspaceDef,
> {
    /**
     * ID of App
     */
    id: string;

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

    /**
     * Type of the app
     */
    type: D['type'];

    /**
     * Options associated with the app
     */
    options: D['options'];

    /** overlay information */
    overlay: {
        /** track if the overlay is open or closed */
        open: boolean;

        /** content to display in the overlay */
        content: () => JSX.Element;
    };
}

export interface WorkspaceConfigInterface<
    D extends WorkspaceDef = WorkspaceDef,
> {
    /**
     * ID of App
     */
    id: string;

    /**
     * User's role relative to the app
     */
    role: Role;

    /**
     * Type of the app
     */
    type: D['type'];

    /**
     * Options associated with the app
     */
    options: D['options'];

    /**
     * Metadata associated with the loaded app
     */
    metadata: AppMetadata;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class WorkspaceStore<D extends WorkspaceDef = WorkspaceDef> {
    private _root: RootStore;
    private _store: WorkspaceStoreInterface<D> = {
        id: '',
        isLoading: false,
        isEditMode: false,
        view: 'design',
        role: 'READ_ONLY',
        type: 'code',
        options: {},
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
        overlay: {
            open: false,
            content: () => null,
        },
    };

    constructor(root: RootStore, config: WorkspaceConfigInterface) {
        // register the root
        this._root = root;

        // set the appId
        this._store.id = config.id;
        this._store.type = config.type;
        this._store.options = config.options;

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
        return this._store.id;
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
        return this._store.view;
    }

    /**
     * Get the user's role in relation to the app
     */
    get role() {
        return this._store.role;
    }
    /**
     * Type of the app
     */
    get type() {
        return this._store.type;
    }

    /**
     * Options associated with the app
     */
    get options() {
        return this._store.options;
    }

    /**
     * Get metadata associated with the app
     */
    get metadata() {
        return this._store.metadata;
    }

    /**
     * Get overlay information associated with the workspace
     */
    get overlay() {
        return this._store.overlay;
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

    /**
     * Open the overlay
     */
    openOverlay = (content: WorkspaceStoreInterface['overlay']['content']) => {
        // open the overlay
        this._store.overlay.open = true;

        // set the content
        this._store.overlay.content = content;
    };

    /**
     * Close the overlay
     */
    closeOverlay = () => {
        // close the overlay
        this._store.overlay.open = false;

        // clear the content
        this._store.overlay.content = null;
    };
}
