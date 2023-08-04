import { makeAutoObservable, runInAction } from 'mobx';

import { RootStore } from '@/stores';
import { runPixel } from '@/api';

import { WorkspaceApp } from './workspace.app';

interface WorkspaceStoreInterface {
    /**
     * Get if the workspace is loading
     */
    isLoading: boolean;

    /** Currently open apps */
    apps: Record<string, WorkspaceApp>;

    /** Currently selected app */
    selectedApp: WorkspaceApp | null;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class WorkspaceStore {
    private _root: RootStore;
    private _store: WorkspaceStoreInterface = {
        isLoading: false,
        apps: {},
        selectedApp: null,
    };

    constructor(root: RootStore) {
        // register the root
        this._root = root;

        // make it observable
        makeAutoObservable(this);
    }

    // *********************************************************
    // Getters
    // *********************************************************
    /**
     * Get if the workspace is loading
     */
    get isLoading() {
        return this._store.isLoading;
    }

    /**
     * Get a map of the workspace apps
     */
    get apps() {
        return this._store.apps;
    }

    /**
     * Get the selectedApp
     */
    get selectedApp() {
        return this._store.selectedApp;
    }

    /**
     * Get a list of all of the apps sorted by the name
     */
    get appList() {
        return Object.values(this._store.apps).sort((a, b) => {
            if (a.options.name < b.options.name) {
                return -1;
            }
            if (a.options.name > b.options.name) {
                return 1;
            }
            return 0;
        });
    }

    // *********************************************************
    // Actions
    // *********************************************************
    /**
     * Open a new insight
     *
     * @param url - url of the app
     * @param options - options to associate with the app
     * @param config - configuration to load with the app
     */
    async openNewApp(
        url: string,
        options: Partial<WorkspaceApp['options']> = {},
        config: Record<string, unknown> = {},
    ): Promise<WorkspaceApp> {
        // get the response
        const response = await this.run<
            [
                {
                    insightData: {
                        insightID: string;
                    };
                },
            ]
        >(
            `OpenEmptyInsight(recipe=["<sEncode>SetAppConfig(${JSON.stringify(
                config,
            )});</sEncode>"])`,
        );

        // ignore if no response
        if (!response) {
            return;
        }

        // get the output
        const { output } = response[0];

        // create a new app
        const app = new WorkspaceApp(
            this._root,
            output.insightData.insightID,
            url,
            {
                name: `App ${Object.keys(this._store.apps).length + 1}`,
                ...options,
            },
        );

        // select it loading
        runInAction(() => {
            // store it
            this._store.apps[app.id] = app;

            // select it
            this._store.selectedApp = app;
        });

        return app;
    }

    /**
     * Close an app
     *
     * @param id - id of the app to close
     */
    async closeApp(id: string): Promise<void> {
        // start loading
        this._store.isLoading = true;

        try {
            // get the app
            const app = this._store.apps[id];
            if (!app) {
                return;
            }

            // start loading
            this._store.isLoading = true;

            // delete it
            delete this._store.apps[id];

            // deselect it
            if (
                this._store.selectedApp &&
                this._store.selectedApp.id === app.id
            ) {
                this._store.selectedApp = null;
            }

            // destroy it
            await runPixel(app.id, `DropInsight();`);
        } catch (e) {
            console.error(e);
        } finally {
            // stop loading
            runInAction(() => {
                this._store.isLoading = false;
            });
        }
    }

    /**
     * Select an app
     * @param id - id of the selected app
     */
    selectApp(id: string) {
        // set the app if it is different
        if (!this._store.selectedApp || this._store.selectedApp.id !== id) {
            this._store.selectedApp = this._store.apps[id] || null;
        }

        // return the selected app
        return this._store.selectedApp;
    }

    // *********************************************************
    // Helpers
    // *********************************************************

    /**
     * Run a pixel in the workspace
     * @param pixel - pixel to execute
     * @returns void
     */
    private async run<O extends unknown[] | []>(pixel: string) {
        // get the configStore
        const { configStore } = this._root;

        // start loading
        this._store.isLoading = true;

        try {
            // run the pixel
            const { pixelReturn, errors } = await configStore.runPixel<O>(
                pixel,
            );

            // return the error
            if (errors.length > 0) {
                console.error(errors);
                return null;
            }

            return pixelReturn;
        } catch (e) {
            return null;
        } finally {
            // stop loading
            runInAction(() => {
                this._store.isLoading = false;
            });
        }
    }
}
