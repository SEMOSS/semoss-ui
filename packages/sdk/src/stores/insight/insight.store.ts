import { Env } from '@/env';
import { Space, Script } from '@/types';
import { getSystemConfig, login, logout, oauth, runPixel } from '@/api';
import { UnauthorizedError } from '@/utility';

interface InsightStoreInterface {
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

    /** Options assocaited with the insight */
    options: {
        /** Id of an app if associated with the insight */
        appId: string;

        /** Python code associated with the insight */
        python: Script | null;
    };
}

export class InsightStore {
    private _store: InsightStoreInterface = {
        insightId: '',
        isInitialized: false,
        isAuthorized: false,
        error: null,
        system: null,
        options: {
            appId: '',
            python: null,
        },
    };

    /** Getters */
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
    initialize = async (options?: {
        /**
         * App to load into the insight
         */
        app?: string;

        /**
         * Python file to load into an insight
         */
        python?:
            | {
                  type: 'detect';
              }
            | {
                  type: 'file';
                  path: string;
                  alias: string;
              }
            | {
                  type: 'script';
                  script: string;
                  alias: string;
              };
    }): Promise<void> => {
        // reset it
        this._store.isInitialized = false;

        const merged: NonNullable<typeof options> = {
            app: options && options.app ? options.app : '',
            python:
                options && options.python
                    ? options.python
                    : {
                          type: 'detect',
                      },
        };

        // save the initial appId
        this._store.options.appId = '';
        if (merged.app) {
            this._store.options.appId = merged.app;
        }

        // save the python
        this._store.options.python = null;
        if (merged.python) {
            if (merged.python.type === 'detect') {
                this._store.options.python = await this.detectScript();
            } else if (merged.python.type === 'file') {
                this._store.options.python = await this.loadScript(
                    merged.python,
                );
            } else if (merged.python.type === 'script') {
                this._store.options.python = {
                    script: merged.python.script,
                    alias: merged.python.alias,
                };
            }
        }

        // load the environment from the document (production)
        try {
            const env = JSON.parse(
                document.getElementById('semoss-env')?.textContent || '',
            ) as {
                APP: string;
                MODULE: string;
            };

            // update the enviornment variables with the module
            if (env) {
                Env.update({
                    APP: env.APP,
                    MODULE: env.MODULE,
                });
            }
        } catch (e) {
            console.warn(e);
        }

        try {
            // reset the id based on the Environment if set
            if (Env.APP) {
                this._store.options.appId = Env.APP;
            }

            // validate that the module is available
            if (!Env.MODULE) {
                throw new Error('module is required');
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
                await this.initializeInsight();

                // track that the user is authorized
                this._store.isAuthorized = true;
            } else {
                // track that the user is unauthorized
                this._store.isAuthorized = false;
                return;
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
            // destroy the insight
            await this.destroyInsight();

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
     * Initialize the insight
     */
    private initializeInsight = async (): Promise<void> => {
        // load the app reactors (if they exist)
        let pixel = '';
        if (this._store.options.appId) {
            pixel += `SetContext("${this._store.options.appId}");`;
        }

        // load the python code int
        if (this._store.options.python && this._store.options.python.script) {
            // validate the alias
            let alias = this._store.options.python.alias;
            if (!alias) {
                alias = 'smss';
                console.warn(`Alias not found. Loading python as ${alias}`);
            }

            pixel += `
WriteObjectToFile(value="${this._store.options.python.script}", filePath = "temp.py");
LoadPyFromFile(alias="${alias}", filePath="temp.py");    
            `;
        }

        // default if there is no command to preload
        if (!pixel) {
            pixel = '1+1;';
        }

        // create the new insight
        const { insightId, errors } = await runPixel<[Record<string, unknown>]>(
            pixel,
            'new',
        );

        // log errors if it exists
        if (errors.length) {
            throw new Error(errors[0]);
        }

        // set the insight ID
        this._store.insightId = insightId;
    };

    /**
     * Destroy the insight
     */
    private destroyInsight = async (): Promise<void> => {
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

    /**
     * Detect a script from the html
     */
    private detectScript = async (): Promise<Script | null> => {
        const output = {
            script: '',
            alias: '',
        };
        try {
            const scriptEle = document.querySelector('[data-semoss-py]');
            const content = scriptEle?.textContent;
            if (!content) {
                return null;
            }

            // get the script
            output.script = content;

            // get the alias
            output.alias = scriptEle?.getAttribute('data-alias') || '';
        } catch (e) {
            console.error(e);
            return null;
        }

        return output;
    };

    /**
     * Load an external script
     */
    private loadScript = async (config: {
        path: string;
        alias: string;
    }): Promise<Script | null> => {
        const output = {
            script: '',
            alias: config.alias,
        };
        try {
            // get the script
            const response = await fetch(config.path);

            const text = await response.text();
            if (!text) {
                throw new Error('No Text');
            }

            // set the text if it exists
            output.script = text;
        } catch (e) {
            console.error(e);

            // don't load anything
            return null;
        }

        return output;
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
                    // get the new insight with the new user
                    await this.initializeInsight();

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
         * Run a pixel against the insight
         * @param pixel - pixel command to run
         * @param space - where to run it
         */
        run: async <O extends unknown[] | []>(
            pixel: string,
            space: Space = 'insight',
        ) => {
            try {
                let id = '';
                if (space === 'insight') {
                    id = this._store.insightId;
                } else if (space === 'app') {
                    if (!this._store.options.appId) {
                        throw new Error(
                            'An app is required to run in the app space',
                        );
                    }

                    // set it
                    id = this._store.options.appId;
                }

                const response = await runPixel<O>(pixel, id);
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
         * Run a pixel against the insight
         * @param pixel - pixel command to run
         * @param space - where to run it
         */
        runPy: async <O extends unknown[] | []>(
            python: string,
            space: Space = 'insight',
        ) => {
            return this.actions.run<O>(
                `Py("<encode>${python}</encode>")`,
                space,
            );
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
