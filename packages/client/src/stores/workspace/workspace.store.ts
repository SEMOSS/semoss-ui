import { makeAutoObservable, reaction } from 'mobx';

import { Role } from '@/types';
import { RootStore, WorkspaceOptions } from '@/stores';

import { AppMetadata } from '@/components/app';
import { Model } from 'flexlayout-react';

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
     * User's role relative to the app
     */
    role: Role;

    /**
     * Metadata associated with the loaded app
     */
    metadata: AppMetadata;

    /**
     * Optional Model Engine to use
     */
    agentModelEngine: string;

    /**
     * Type of the app
     */
    type: 'BLOCKS' | 'CODE';

    /** layout information */
    layout: {
        /**
         * Selected layouts
         */
        selected: string;

        /**
         * List of available layouts
         */
        available: Record<
            string,
            {
                /** id of the layout */
                id: string;

                /** name of the layout */
                name: string;

                /** Model associated with the layout */
                model: Model;
            }
        >;
    };

    /** overlay information */
    drawer: {
        /**
         * Track if he drawer is open
         */
        isOpen: boolean;
    };

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
            maxWidth: 'sm' | 'md' | 'lg' | 'xl' | null;
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
        role: 'READ_ONLY',
        type: 'CODE',
        agentModelEngine: '',
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
        layout: {
            selected: '',
            available: {},
        },
        drawer: {
            isOpen: false,
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

        // update the cache automatically when the drawer or layout change
        reaction(
            () => ({
                version: '',
                drawer: {
                    isOpen: this._store.drawer.isOpen,
                },
                layout: {
                    selected: this._store.layout.selected,
                    available: Object.values(
                        this._store.layout.available,
                    ).reduce((acc, val) => {
                        acc[val.id] = {
                            id: val.id,
                            name: val.name,
                            data: {}, // tracked via onModelChange on <Layout
                        };

                        return acc;
                    }, {}),
                },
            }),
            () => {
                console.log('AUTO');
                this.saveToCache();
            },
        );
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
     * Get the agentModelEngine
     */
    get agentModelEngine() {
        return this._store.agentModelEngine;
    }

    /**
     * Get if the app is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /**
     * Get layout
     */
    get layout() {
        return this._store.layout;
    }

    /**
     * Get drawer
     */
    get drawer() {
        return this._store.drawer;
    }

    /**
     * Get the selected layout of the workspace
     */
    get selectedLayout() {
        for (const sId in this._store.layout.available) {
            const s = this._store.layout.available[sId];
            if (s.id === this._store.layout.selected) {
                return s;
            }
        }

        return null;
    }

    /**
     * Get the selected layout of the workspace
     */
    get availableLayouts() {
        return Object.values(this._store.layout.available);
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
     * The key for the local storage cache
     */
    get cacheKey() {
        return `smss-workspace--${this._store.appId}`;
    }

    /**
     * Actions
     */

    /**
     * Load the workspace
     * @param options - options to configure the workspace with
     */
    load = (options: Partial<WorkspaceOptions>): boolean => {
        try {
            // TODO::Version Check

            // update the drawer
            if (options.drawer) {
                this._store.drawer.isOpen = options.drawer.isOpen;
            }

            // add the new layout
            if (options.layout) {
                this._store.layout.selected = options.layout.selected;

                //  add the new options
                for (const lId in options.layout.available) {
                    const l = options.layout.available[lId];

                    // add the layout
                    this._store.layout.available[l.id] = {
                        // add the old
                        ...this._store.layout.available[l.id],

                        // add the new
                        ...l,

                        // recreate the model
                        model: Model.fromJson(l.data),
                    };
                }
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    /**
     * Load from the cache
     */
    loadFromCache = (): boolean => {
        // TODO::Version Check

        let isLoaded = false;
        try {
            const item = localStorage.getItem(this.cacheKey);
            if (item) {
                const options = JSON.parse(item);
                isLoaded = this.load(options);
            }
        } catch (e) {
            console.error(e);
            return false;
        }

        return isLoaded;
    };

    /**
     * Save the workspace to local storage
     */
    saveToCache = (): void => {
        try {
            const options: WorkspaceOptions = {
                version: '',
                drawer: {
                    isOpen: this._store.drawer.isOpen,
                },
                layout: {
                    selected: this._store.layout.selected,
                    available: {},
                },
            };

            // add each layout in manually
            for (const lId in this._store.layout.available) {
                const l = this._store.layout.available[lId];

                const data = l.model.toJson();

                // add the layout
                options.layout.available[l.id] = {
                    id: l.id,
                    name: l.name,
                    data: data,
                };
            }

            // save cache
            localStorage.setItem(this.cacheKey, JSON.stringify(options));
        } catch (e) {
            console.error(e);
            // noop
        }
    };

    /**
     * Set the loading screen for the app
     * @param isLoading - true if loading screen is on
     */
    setLoading = (isLoading: boolean) => {
        this._store.isLoading = isLoading;
    };

    /**
     * Select the layout
     */
    selectLayout = (selected: string) => {
        this._store.layout.selected = selected;
    };

    /**
     * Update the layout
     *
     * @param id - id of the layout
     * @param layout - layout that is being added
     */
    updateLayout = (
        id: string,
        layout: Partial<WorkspaceOptions['layout']['available'][string]>,
    ) => {
        this._store.layout.available[id] = {
            // add the old
            ...this._store.layout.available[id],

            // add the new
            ...layout,

            // recreate the model
            model: Model.fromJson(layout.data),
        };

        // trigger the save manually as the Model is recreated
        this.saveToCache();
    };

    /**
     * Toggle opening and closing of the drawer
     */
    toggleDrawer = () => {
        this._store.drawer.isOpen = !this._store.drawer.isOpen;
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

    /**
     * Helpers
     */
    /**
     * Get overlay information associated with the workspace
     */
    get overlay() {
        return this._store.overlay;
    }
}
