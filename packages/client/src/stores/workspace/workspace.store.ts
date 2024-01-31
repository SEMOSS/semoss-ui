import { makeAutoObservable } from 'mobx';

import { Role } from '@/types';
import { RootStore } from '@/stores';

import { AppMetadata } from '@/components/app';

export interface WorkspaceStoreInterface {
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
    view: string;

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
    type: 'BLOCKS' | 'CODE';

    /** overlay information */
    overlay: {
        /**
         * Track if the overlay is open or closed
         */
        open: boolean;

        /**
         * Options associated with the overlay
         */
        options: {
            /**
             * Set the maxWidth of the overlay
             */
            maxWidth: 'sm' | 'md' | 'lg' | 'xl' | false;
        };

        /**
         * Content to display in the overlay
         */
        content: () => JSX.Element;
    };
}

export interface WorkspaceConfigInterface {
    /**
     * Get the ID of the connected app
     */
    appId: string;

    /**
     * User's role relative to the app
     */
    role: Role;

    /**
     * Type of the app
     */
    type: 'BLOCKS' | 'CODE';

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
        view: '',
        role: 'READ_ONLY',
        type: 'CODE',
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
            options: {
                maxWidth: 'sm',
            },
            content: () => null,
        },
    };

    constructor(root: RootStore, config: WorkspaceConfigInterface) {
        // register the root
        this._root = root;

        // set the appId
        this._store.appId = config.appId;
        this._store.type = config.type;

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
     * Get the ID of the connected app
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
     * Configure the worksapce based on the settings
     * @param settings - settings to configure the workspace with
     */
    configure = (settings: {
        /** Initial View */
        view: string;
    }) => {
        this._store.view = settings.view;
    };
    /**
     * Set the loading screen for the app
     * @param isLoading - true if loading screen is on
     */
    setLoading = (isLoading: boolean) => {
        this._store.isLoading = isLoading;
    };

    /**
     * Set if the workspace is in edit mode
     * @param editMode - track if the workspace is in editmode
     */

    setEditMode = (editMode: boolean) => {
        this._store.isEditMode = editMode;
    };

    /**
     * Set the view of the workspack
     * @param view - new view
     */

    setView = (view: string) => {
        this._store.view = view;
    };

    /**
     * Open the overlay
     */
    openOverlay = (
        content: WorkspaceStoreInterface['overlay']['content'],
        options: WorkspaceStoreInterface['overlay']['options'] = {
            maxWidth: 'sm',
        },
    ) => {
        // open the overlay
        this._store.overlay.open = true;

        // set the content
        this._store.overlay.content = content;
        this._store.overlay.options = options;
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
