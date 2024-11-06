import { runPixel } from '@/api';
import { makeAutoObservable } from 'mobx';
import { SerializedState } from '../state';

interface AppInterface {
    /**
     * id
     */
    project_id: string;

    /**
     * App Name
     */
    project_name: string;

    /**
     * App Description
     */
    description: string;

    /**
     * State behind the App
     */
    state: SerializedState;
}

export interface SubtaskStoreInterface {
    /**
     * id of the subtask
     */
    id: string;

    /**
     * Description of task
     */
    description: string;

    /**
     * Is the subtask loading
     */
    isLoading: boolean;

    /**
     * Is the subtask executed
     */
    isExecuted: boolean;

    /**
     * Is the subtask ready to be executed, has all inputs
     */
    isReady: boolean;

    /**
     * Apps that have been tied to the subtask
     */
    apps: AppInterface[];

    /**
     * The selected app for the subtask
     */
    selectedApp: string;

    /**
     * inputs tied to the subtask
     */
    inputs?: Record<string, unknown>;

    /**
     * outputs tied to the subtask
     */
    outputs?: Record<string, unknown>;
}

export interface SubtaskConfig {
    /**
     * id of the subtask
     */
    id: string;

    /**
     * Description of task
     */
    description: string;

    /**
     * List of app ids for subtask
     */
    apps: string[];
}

export class SubtaskState {
    private _store: SubtaskStoreInterface = {
        id: '',
        description: '',
        isLoading: false,
        isExecuted: false,
        isReady: false,
        apps: [],
        selectedApp: '',
        inputs: {},
        outputs: {},
    };

    constructor(config: SubtaskConfig) {
        // Set the id
        this._store.id = config.id;

        //Set the subtask description
        this._store.description = config.description;

        // clear the selected app
        this._store.selectedApp = '';

        // Get additional app meta that comes back with apps
        this.setApps(config.apps);

        makeAutoObservable(this); // make it observable
    }

    private async setApps(apps) {
        const appConfigList = [];

        // Use Promise.all to wait for all async operations to complete
        await Promise.all(
            apps.map(async (appId) => {
                let pixel = '';
                pixel += `ProjectInfo(project=["${appId}"]);`;
                pixel += `GetAppBlocksJson(project=["${appId}"]);`;

                const { errors, insightId, pixelReturn } = await runPixel(
                    pixel,
                );

                if (errors.length) {
                    window.alert(JSON.stringify(errors));
                    return; // Skip this iteration if there are errors
                }

                let appInterface = {};
                let resp = pixelReturn[0];
                appInterface = resp.output;
                resp = pixelReturn[1];
                appInterface = {
                    ...appInterface,
                    state: resp.output as Record<string, unknown>,
                };

                appConfigList.push(appInterface);
            }),
        );

        // Now all async operations are complete
        this._store.apps = appConfigList;
    }
    /**
     * Get the id
     */
    get id() {
        return this._store.id;
    }

    /**
     * Get the description
     */
    get description() {
        return this._store.description;
    }

    /**
     * Track if the subtask is loading
     */
    get isLoading() {
        if (this._store.isLoading) {
            return true;
        }

        return false;
    }

    /**
     * Track if the subtask has been executed
     */
    get isExecuted() {
        if (this._store.isExecuted) {
            return true;
        }
        return false;
    }

    /**
     * Track if the subtask has all required inputs and ready to be executed
     */
    get isReady() {
        if (this._store.isReady) {
            return true;
        }
        return false;
    }

    /**
     * Gets the apps
     */
    get apps() {
        return this._store.apps;
    }

    /**
     * Gets the selected app
     */
    get selectedApp() {
        return this._store.selectedApp;
    }

    /**
     * Gets the inputs
     */
    get inputs() {
        return this._store.inputs;
    }

    /**
     * Gets the outputs
     */
    get outputs() {
        return this._store.outputs;
    }

    /**
     * ACTIONS
     */

    setIsLoading = (bool: boolean) => {
        this._store.isLoading = bool;
    };

    setSelectedApp = (id?: string) => {
        if (!id) {
            this._store.selectedApp = '';
            this._store.isReady = false;
            this._store.inputs = {};
            this._store.outputs = {};

            return;
        }

        const app = this._store.apps.find((app) => app.project_id === id);

        if (app) {
            this._store.selectedApp = id;

            const inputs = {};
            const outputs = {};

            Object.entries(app.state.variables).forEach((kv) => {
                const key = kv[0];
                const reference = kv[1];

                if (reference.isInput) {
                    inputs[key] = '';
                }

                if (reference.isOutput) {
                    outputs[key] = '';
                }
            });

            // Set the inputs for the task
            this._store.inputs = inputs;

            // Set the outputs for the task
            this._store.outputs = outputs;
        }
    };

    setSubtaskInputs = (map: Record<string, unknown>) => {
        this._store.isReady = true;

        this._store.inputs = map;
    };

    setSubtaskOutputs = (map: Record<string, unknown>) => {
        this._store.isExecuted = true;
        this._store.isLoading = false;

        this._store.outputs = map;
    };
}
