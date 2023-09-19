import { Env } from './env';
import { getSystemConfig, login, logout, oauth, runPixel } from './api';
import { UnauthorizedError } from './error';

interface InsightStoreInterface {
    /** Id of the app */
    appId: string;

    /** insightId of the app */
    insightId: string;

    /** Track if initialized */
    isInitialized: boolean;

    /** Track if authorized */
    isAuthorized: boolean;

    /** Error if in the error state */
    error: Error | null;

    /** System Information */
    system: {
        /** Config information */
        config: {
            logins: Record<string, unknown>;
            providers: string[];
            [key: string]: unknown;
        };
    } | null;
}

export class Insight {
    private _store: InsightStoreInterface = {
        appId: '',
        insightId: '',
        isInitialized: false,
        isAuthorized: false,
        error: null,
        system: null,
    };

    /** Getters */
    /**
     * App Id
     */
    get appId() {
        return this._store.appId;
    }

    /**
     * Insight Id
     */
    get insightId() {
        return this._store.insightId;
    }
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
     * System information
     */
    get system() {
        return this._store.system;
    }

    /** Methods */
    /**
     * Initialize the insight
     *
     * options - options to initialize with
     */
    initialize = async (): Promise<void> => {
        // reset it
        this._store.isInitialized = false;

        // Set from the document
        try {
            const env = JSON.parse(
                document.getElementById('semoss-env')?.textContent || '',
            ) as {
                APP: string;
                MODULE: string;
            };

            if (env) {
                Env.updateVariables({
                    APP: env.APP,
                    MODULE: env.MODULE,
                });
            }
        } catch (e) {
            console.error(e);
        }

        try {
            // validate
            if (!Env.variables.MODULE) {
                throw new Error('module is required');
            }

            if (!Env.variables.APP) {
                throw new Error(`appId is required`);
            }

            // get the system information
            await this.initializeSystem();

            // skip if the system doesn't initialize correctly
            if (!this._store.system) {
                return;
            }

            // if security is not enabled or the user is logged in, load the app
            if (Object.keys(this._store.system.config.logins).length > 0) {
                // initialize the app
                await this.initializeApp();

                // track that the user is authorized
                this._store.isAuthorized = true;
            }

            // track if it is initialized
            this._store.isInitialized = true;
        } catch (error) {
            // log it
            console.error(error);

            // store the error
            this._store.error = error as Error;
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
            this._store.error = error as Error;
        }
    };

    /** Helpers */
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
        const { insightId, errors } = await runPixel<[Record<string, unknown>]>(
            `SetContext("${Env.variables.APP}")`,
            id || 'new',
        );

        // log errors if it exists
        if (errors.length) {
            throw new Error(errors[0]);
        }

        // set the insight ID
        this._store.insightId = insightId;
    };

    /**
     * Destroy the app
     */
    private destroyApp = async (): Promise<void> => {
        if (!this._store.insightId) {
            return;
        }

        const { errors } = await runPixel<[Record<string, unknown>]>(
            `DropInsight()`,
            this._store.insightId,
        );

        // log errors if it exists
        if (errors.length) {
            throw new Error(errors[0]);
        }

        // set the insight ID
        this._store.insightId = '';
    };

    /**
     * Process and error in action
     * @param error - error to process
     */
    private processActionError = (error: Error) => {
        // ignore 302 errors
        if (error instanceof UnauthorizedError) {
            this._store.isAuthorized = false;
            return;
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
                this.processActionError(error as Error);
            }

            return false;
        },

        /**
         * Allow the user to logout
         */
        logout: async (): Promise<boolean> => {
            try {
                const response = await logout();
                if (!response) {
                    return false;
                }

                // success
                return true;
            } catch (error) {
                this.processActionError(error as Error);
            }

            return false;
        },

        /**
         * Run a pixel and save it the recipe
         */
        run: async <O extends unknown[] | []>(pixel: string) => {
            try {
                const response = await runPixel<O>(
                    pixel,
                    this._store.insightId,
                );
                if (!response) {
                    return;
                }

                // success
                return response;
            } catch (error) {
                this.processActionError(error as Error);
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
                this.processActionError(error as Error);
            }
        },

        //     /**
        //      * Upload a file to the project space
        //      *
        //      * @param files- file objects to upload
        //      * @param path - relative path
        //      */
        //     upload: async (
        //         files: File[],
        //         path: string | null,
        //     ): Promise<
        //         {
        //             fileName: string;
        //             fileLocation: string;
        //         }[]
        //     > => {
        //         try {
        //             const response = await upload(
        //                 files,
        //                 this._store.insightId,
        //                 this._store.appId,
        //                 path,
        //             );

        //             return response;
        //         } catch (error) {
        //             this.processActionError(error as Error);
        //         }

        //         return [];
        //     },

        //     /**
        //      * Download a file from the project space
        //      *
        //      * @param path - relative path
        //      */
        //     download: async (fileKey: string): Promise<void> => {
        //         try {
        //             await download(this._store.insightId, fileKey);
        //         } catch (error) {
        //             this.processActionError(error as Error);
        //         }
        //     },
    };
}
