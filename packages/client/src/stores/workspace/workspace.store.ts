import { makeAutoObservable, reaction } from 'mobx';

import { WorkspaceLayout, WorkspaceOptions } from '@/stores';

import { Model } from 'flexlayout-react';

export interface WorkspaceStoreInterface {
    /**
     * name
     */
    name: string;

    /**
     * Show Loading or not
     */
    isLoading: boolean;

    /**
     * Optional Model Engine to use
     */
    agentModelEngine: string;

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

    /**
     * Default Options. These will be used when the cache is reset.
     */
    defaultOptions: WorkspaceOptions;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class WorkspaceStore {
    private _store: WorkspaceStoreInterface = {
        name: '',
        isLoading: false,
        agentModelEngine: '',
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
        defaultOptions: {
            version: '',
            drawer: {
                isOpen: false,
            },
            layout: {
                selected: '',
                available: {},
            },
        },
    };

    constructor(name: string, options: WorkspaceOptions) {
        // set the name of the workspace
        this._store.name = name;

        // try to load from catch, otherwise use the default options.
        let isLoaded = false;
        try {
            const item = localStorage.getItem(this.cacheKey);
            if (item) {
                isLoaded = this.load(JSON.parse(item));
            }
        } catch (e) {
            console.error(e);
        }

        // load the default if can't get from catch
        if (!isLoaded) {
            this.load(options);
        }

        // save the default
        this._store.defaultOptions = options;

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
                this.saveToCache();
            },
        );
    }

    /**
     * Getters
     */
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
     * The key for the local storage cache
     */
    get cacheKey() {
        return `smss-workspace--${this._store.name}`;
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
     * Reset the selected layout
     */
    resetLayout = (): void => {
        // get the selected
        const selected = this.selectedLayout;
        if (!selected) {
            return;
        }

        // only reset the selected layout
        const defaultLayout: WorkspaceLayout =
            this._store.defaultOptions.layout.available[selected.id];

        if (!defaultLayout) {
            return;
        }

        // update the layout
        this._store.layout.available[selected.id] = {
            ...selected,
            model: Model.fromJson(defaultLayout.data),
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
     * Load the workspace
     * @param options - options to configure the workspace with
     */
    private load = (options: Partial<WorkspaceOptions>): boolean => {
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
}
