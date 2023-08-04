import axios from 'axios';
import { getSystemConfig, login, logout, oauth, runPixel } from './api';

interface InsightStoreInterface {
    /** Track if initialized */
    isInitialized: boolean;

    /** Track if authorized */
    isAuthorized: boolean;

    /** Error if in the error state */
    error: Error | null;

    /** App information */
    app: {
        /** InsightId of the app */
        insightId: string;

        /** Configuration information of the app */
        config: Record<string, unknown>;
    } | null;

    /** System Information */
    system: {
        /** Config information */
        config: {
            logins: Record<string, unknown>;
            security: boolean;
            providers: string[];
            [key: string]: unknown;
        };
    } | null;
}

export class Insight {
    private _store: InsightStoreInterface = {
        isInitialized: true,
        isAuthorized: false,
        error: null,
        app: null,
        system: null,
    };

    /** Getters */
    /**
     * If the insight is initialied
     */
    get isInitialized() {
        return this._store.isInitialized;
    }

    /**
     * If the user is authorized
     */
    get isAuthorized() {
        return this._store.isAuthorized;
    }

    /**
     * Error if the status is set to "ERROR"
     */
    get error() {
        return this._store.error;
    }

    /**
     * App information
     */
    get app() {
        return this._store.app;
    }

    /**
     * System information
     */
    get system() {
        return this._store.system;
    }

    /** Helpers */
    /**
     * Initialize the insight
     *
     * insightId - insightId to initialize with
     */
    initialize = async (insightId?: string): Promise<void> => {
        // try to set the insightID from the url if it is there
        let id = insightId;
        try {
            if (!id) {
                const urlParams = new URLSearchParams(window.location.search);
                id = urlParams.get('semoss-insight-id');
            }
        } catch (e) {
            console.error(e);
        }

        try {
            // get the system information
            await this.initializeSystem();

            // if security is not enabled or the user is logged in, load the app
            if (
                !this._store.system.config.security ||
                Object.keys(this._store.system.config.logins).length > 0
            ) {
                // initialize the app
                await this.initializeApp(id);

                // track that the user is authorized
                this._store.isAuthorized = true;
            }

            // track if it is initialized
            this._store.isInitialized = true;
        } catch (error) {
            // log it
            console.error(error);

            // store the error
            this._store.error = error;
        }
    };

    /**
     * Destroy the insight
     */
    destroy = async () => {
        try {
            // destroy the app
            await this.destroyApp();

            // destroy the system
            this.destroySystem();

            // track that the user is authorized
            this._store.isAuthorized = false;

            // track if it is initialized
            this._store.isInitialized = false;
        } catch (error) {
            // log it
            console.error(error);

            // store the error
            this._store.error = error;
        }
    };

    /**
     * Initialize the system wide information
     */
    private initializeSystem = async (): Promise<void> => {
        // get the response
        const data = await getSystemConfig();

        let system: InsightStoreInterface['system'] = null;
        if (data) {
            // create the system
            system = {
                config: {
                    logins: {},
                    security: false,
                    providers: [],
                },
            };

            // add the provideres
            for (const provider in data.loginsAllowed) {
                if (data.loginsAllowed[provider]) {
                    system.config.providers.push(provider);
                }
            }

            // save the other config data
            for (const key in data) {
                system.config[key] = data[key];
            }
        }

        // update the system
        this._store.system = system;
    };

    /**
     * Initialize the system wide information
     */
    private destroySystem = () => {
        // clear the system
        this._store.system = null;
    };

    /**
     * Initialize the app
     *
     * @param id? - id to initialize the app with
     */
    private initializeApp = async (id?: string): Promise<void> => {
        const { insightId, errors, pixelReturn } = await runPixel<
            [Record<string, unknown>]
        >(`GetAppConfig()`, id);

        // log errors if it exists
        if (errors.length) {
            throw new Error(errors[0]);
        }

        // set the insight ID
        this._store.app = {
            insightId: insightId,
            config: pixelReturn[0].output,
        };
    };

    /**
     * Destroy the app
     */
    private destroyApp = async (): Promise<void> => {
        if (!this._store.app.insightId) {
            return;
        }

        const { errors } = await runPixel<[Record<string, unknown>]>(
            `DropInsight()`,
            this._store.app.insightId,
        );

        // log errors if it exists
        if (errors.length) {
            throw new Error(errors[0]);
        }

        // set the insight ID
        this._store.app = null;
    };

    /**
     * Process and error in action
     * @param error - error to process
     */
    private processActionError = (error: Error) => {
        // ignore 302 errors
        if (axios.isAxiosError(error)) {
            if (error.response.status === 302) {
                this._store.isAuthorized = false;
                return;
            }
        }

        // propagate it forward
        throw error;
    };

    /** Actions */
    /** Accessible by the end user */
    actions = {
        /**
         * Allow the user to login
         * @param credentials
         * @returns
         */
        login: async (
            credentials:
                | {
                      type: 'native';
                      username: string;
                      password: string;
                  }
                | {
                      type: 'oauth';
                      provider: string;
                  },
        ): Promise<boolean> => {
            // try to login
            try {
                let loggedIn = false;
                if (credentials.type === 'native') {
                    const response = await login(
                        credentials.username,
                        credentials.password,
                    );
                    if (response) {
                        loggedIn = true;
                    }
                } else if (credentials.type === 'oauth') {
                    const response = await oauth(credentials.provider);
                    if (response) {
                        loggedIn = true;
                    }
                }

                if (loggedIn) {
                    // get the new app with the new user
                    await this.initializeApp();

                    // track that the user is now authorized
                    this._store.isAuthorized = true;
                }

                // success
                return loggedIn;
            } catch (error) {
                this.processActionError(error);
            }
        },

        /**
         * Allow the user to logout
         */
        logout: async (): Promise<boolean> => {
            try {
                const response = await logout();
                if (!response) {
                    return;
                }

                // success
                return true;
            } catch (error) {
                this.processActionError(error);
            }
        },

        /**
         * Run a pixel and save it the recipe
         */
        run: async <O extends unknown[] | []>(pixel: string) => {
            try {
                const response = await runPixel<O>(
                    pixel,
                    this._store.app.insightId,
                );
                if (!response) {
                    return;
                }

                // success
                return response;
            } catch (error) {
                this.processActionError(error);
            }
        },

        /**
         * Query the application with pixel
         */
        query: async <O extends unknown[] | []>(pixel: string) => {
            try {
                const response = await runPixel<O>(pixel);
                if (!response) {
                    return;
                }

                // success
                return response;
            } catch (error) {
                this.processActionError(error);
            }
        },

        /**
         * Set the config
         * @param {object} config
         */
        setConfig: async (config: Record<string, unknown>) => {
            try {
                const { errors, pixelReturn } = await this.actions.run<
                    [Record<string, unknown>]
                >(`SetAppConfig(${JSON.stringify(config)})`);

                // log errors if it exists
                if (errors.length) {
                    const errorMessage = errors.join(',');
                    throw new Error(errorMessage);
                }

                // update the config
                this._store.app.config = pixelReturn[0].output;
            } catch (error) {
                this.processActionError(error);
            }
        },

        /**
         * Get the config
         */
        getConfig: async () => {
            try {
                const { errors, pixelReturn } = await this.actions.run<
                    [Record<string, unknown>]
                >(`GetAppConfig()`);

                // log errors if it exists
                if (errors.length) {
                    const errorMessage = errors.join(',');
                    throw new Error(errorMessage);
                    return;
                }

                // set it
                this._store.app.config = pixelReturn[0].output;
            } catch (error) {
                this.processActionError(error);
            }
        },
    };
}
