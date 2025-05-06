import { Env } from "../../env";
import { Space, Script } from "../../types";
import {
    getSystemConfig,
    login,
    logout,
    oauth,
    runPixel,
    upload,
    download,
} from "../../api";
import { UnauthorizedError } from "../../utility";

interface InsightStoreInterface {
    /** insightId of the app */
    insightId: string;

    /** Track if the insight is loaded */
    isInitialized: boolean;

    /** Track if the user is authorized */
    isAuthorized: boolean;

    /** Track if the insight is ready for user input */
    isReady: boolean;

    /** Error if in the error state */
    error: Error | null;

    /** System Information */
    system: {
        /** Config information */
        config: {
            logins: Record<string, unknown>;
            /**
             * List of available providers (logins) that are available
             */
            availableProviders: {
                provider: string;
                name: string;
                isOauth: boolean;
            }[];
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
        insightId: "",
        isInitialized: false,
        isAuthorized: false,
        isReady: false,
        error: null,
        system: null,
        options: {
            appId: "",
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
     * Track if the insight is ready for user input
     */
    get isReady() {
        return this._store.isReady;
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
        app?: string | false;

        /**
         * Python file to load into an insight
         */
        python?:
            | {
                  type: "detect";
              }
            | {
                  type: "file";
                  path: string;
                  alias: string;
              }
            | {
                  type: "script";
                  script: string;
                  alias: string;
              }
            | false;
    }): Promise<void> => {
        // reset it
        this._store.isInitialized = false;
        this._store.isAuthorized = false;
        this._store.isReady = false;

        const merged: NonNullable<typeof options> = {
            app: options && options.app ? options.app : "",
            python:
                options && typeof options.python !== "undefined"
                    ? options.python
                    : {
                          type: "detect",
                      },
        };

        // save the initial appId
        this._store.options.appId = "";
        if (merged.app) {
            this._store.options.appId = merged.app;
        }

        // save the python
        this._store.options.python = null;
        if (merged.python) {
            if (merged.python.type === "detect") {
                this._store.options.python = await this.detectScript();
            } else if (merged.python.type === "file") {
                this._store.options.python = await this.loadScript(
                    merged.python,
                );
            } else if (merged.python.type === "script") {
                this._store.options.python = {
                    script: merged.python.script,
                    alias: merged.python.alias,
                };
            }
        }

        // load the environment from the document (production)
        try {
            if (!document) {
                return;
            }

            const env = JSON.parse(
                document.getElementById("semoss-env")?.textContent || "",
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
            // noop
        }

        try {
            // reset the id based on the Environment if set
            if (Env.APP) {
                this._store.options.appId = Env.APP;
            }

            // validate that the module is available
            if (!Env.MODULE) {
                throw new Error("module is required");
            }

            // get the system information
            await this.setupSystem();

            // break if no system
            if (!this._store.isInitialized) {
                throw new Error("Error loading system");
            }

            // if security is not enabled or the user is logged in, load the app
            if (
                (this._store.system &&
                    Object.keys(this._store.system.config.logins).length > 0) ||
                (Env.ACCESS_KEY && Env.SECRET_KEY)
            ) {
                // track that the user is authorized
                this._store.isAuthorized = true;

                // setup the insight
                await this.setupInsight();
            } else {
                // track that the user is unauthorized
                this._store.isAuthorized = false;
            }
        } catch (error) {
            // log it
            console.warn(error);

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
        } catch (error) {
            // log it
            console.warn(error);

            // store the error
            this._store.error = error as Error;
        } finally {
            // reset it
            this._store.isInitialized = false;
            this._store.isAuthorized = false;
            this._store.isReady = false;
        }
    };

    /** Helpers */
    /**
     * Initialize the system wide information
     */
    private setupSystem = async (): Promise<void> => {
        // reset it
        this._store.isInitialized = false;

        // get the response
        const data = await getSystemConfig();

        let system: InsightStoreInterface["system"] = null;
        if (data) {
            // create the system
            system = {
                config: {
                    logins: {},
                    availableProviders: [],
                },
            };

            // save the other config data
            for (const key in data) {
                system.config[key] = data[key];
            }
        }

        this._store.system = system;
        if (this._store.system) {
            this._store.isInitialized = true;
        } else {
            this._store.isInitialized = false;
        }
    };

    /**
     * Initialize the system wide information
     */
    private destroySystem = () => {
        // clear the system
        this._store.system = null;
    };

    /**
     * Setup the insight after login
     */
    private setupInsight = async (): Promise<void> => {
        // set as not ready
        this._store.isReady = false;

        // load the app reactors (if they exist)
        let pixel = "";
        if (this._store.options.appId) {
            pixel += `SetContext("${this._store.options.appId}");`;
        }

        // load the python code int
        if (this._store.options.python && this._store.options.python.script) {
            // validate the alias
            let alias = this._store.options.python.alias;
            if (!alias) {
                alias = "smss";
                console.warn(`Alias not found. Loading python as ${alias}`);
            }

            pixel += `
WriteObjectToFile(value="${this._store.options.python.script}", filePath = "temp.py");
LoadPyFromFile(alias="${alias}", filePath="temp.py");    
            `;
        }

        // default if there is no command to preload
        if (!pixel) {
            pixel = "1+1;";
        }

        // create the new insight
        const { insightId, errors } = await runPixel<[Record<string, unknown>]>(
            pixel,
            "new",
        );

        // log errors if it exists
        if (errors.length) {
            throw new Error(errors[0]);
        }

        // set the insight ID
        this._store.insightId = insightId;

        // set as ready
        this._store.isReady = true;
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
        this._store.insightId = "";
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
            script: "",
            alias: "",
        };

        try {
            const scriptEle = document.querySelector("[data-semoss-py]");
            const content = scriptEle?.textContent;
            if (!content) {
                return null;
            }

            // get the script
            output.script = content;

            // get the alias
            output.alias = scriptEle?.getAttribute("data-alias") || "";
        } catch (e) {
            console.warn(e);
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
            script: "",
            alias: config.alias,
        };
        try {
            // get the script
            const response = await fetch(config.path);

            const text = await response.text();
            if (!text) {
                throw new Error("No Text");
            }

            // set the text if it exists
            output.script = text;
        } catch (e) {
            console.warn(e);

            // don't load anything
            return null;
        }

        return output;
    };

    /**
     * Get the id of the space
     * @param space - where to get it
     * @returns id of the space
     */
    private getSpaceId(space: Space) {
        let id = "";
        if (space === "insight") {
            id = this._store.insightId;
        } else if (space === "app") {
            if (!this._store.options.appId) {
                throw new Error("An app is required to run in the app space");
            }

            // set it
            id = this._store.options.appId;
        }

        return id;
    }

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
                      type: "native";
                      username: string;
                      password: string;
                  }
                | {
                      type: "oauth";
                      provider: string;
                  },
        ): Promise<boolean> => {
            // try to login
            try {
                let loggedIn = false;
                if (credentials.type === "native") {
                    const response = await login(
                        credentials.username,
                        credentials.password,
                    );

                    if (response) {
                        loggedIn = true;
                    }
                } else if (credentials.type === "oauth") {
                    const response = await oauth(credentials.provider);
                    if (response) {
                        loggedIn = true;
                    }
                }

                if (loggedIn) {
                    // track that the user is now authorized
                    this._store.isAuthorized = true;

                    // get the new insight with the new user
                    await this.setupInsight();
                } else {
                    // track that the user is unauthorized
                    this._store.isAuthorized = false;
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
            space: Space = "insight",
        ) => {
            try {
                let id = "";
                if (space === "insight") {
                    id = this._store.insightId;
                } else if (space === "app") {
                    if (!this._store.options.appId) {
                        throw new Error(
                            "An app is required to run in the app space",
                        );
                    }

                    // set it
                    id = this._store.options.appId;
                }

                const { errors, pixelReturn } = await runPixel<O>(pixel, id);

                if (errors.length) {
                    throw new Error(errors.join(""));
                }

                return { pixelReturn };
            } catch (error) {
                this.processActionError(error as Error);
            }

            // throw an error
            throw new Error("No response");
        },

        /**
         * Run a pixel against the insight
         * @param pixel - pixel command to run
         * @param space - where to run it
         */
        runPy: async <O>(python: string, space: Space = "insight") => {
            const { pixelReturn } = await this.actions.run<
                [
                    [
                        {
                            output: O;
                        },
                    ],
                ]
            >(`Py("<encode>${python}</encode>")`, space);

            return {
                output: pixelReturn[0].output[0].output,
            };
        },

        /**
         * Ask a model a question
         * @param engineId - engine to ask
         * @param command - command to ask
         * @param space - where to run it
         */
        askModel: async (
            engineId: string,
            command: string,
            space: Space = "insight",
        ) => {
            const { pixelReturn } = await this.actions.run<
                [{ response: string }]
            >(
                `LLM(engine=["${engineId}"], command=["<encode>${command}</encode>"]);`,
                space,
            );

            return {
                output: pixelReturn[0].output,
            };
        },

        /**
         * Query a database
         * @param databaseId - database to query
         * @param query - command to query
         * @param options - options to query with
         * @param space - where to run it
         */
        queryDatabase: async (
            databaseId: string,
            query: string,
            options: {
                collect: number;
            } = {
                collect: -1,
            },
            space: Space = "insight",
        ) => {
            const { pixelReturn } = await this.actions.run<
                [
                    data: {
                        values: unknown[][];
                        headers: string[];
                    },
                    numCollected: number,
                    taskId: string,
                ]
            >(
                `Database(database=["${databaseId}"]) | Query("<encode>${query}</encode>") | Collect(${
                    typeof options.collect === "number" ? options.collect : -1
                });;`,
                space,
            );

            return {
                output: pixelReturn[0].output,
            };
        },

        /**
         * Upload a file to the project space
         *
         * @param files- file objects to upload
         * @param path - relative path
         * @param space - where to run it
         */
        upload: async (
            files: File | File[],
            path: string,
            space: Space = "insight",
        ): Promise<
            {
                fileName: string;
                fileLocation: string;
            }[]
        > => {
            try {
                const response = await upload(
                    files,
                    this._store.insightId,
                    space === "app" ? this._store.options.appId : "",
                    path,
                );

                return response;
            } catch (error) {
                this.processActionError(error as Error);
            }

            // throw an error
            throw new Error("No upload");
        },

        /**
         * Download a file from the app
         *
         * @param path - relative path to the file
         * @param space - where to det it
         */
        download: async (
            path: string | null,
            space: Space = "insight",
        ): Promise<boolean> => {
            const id = this.getSpaceId(space);

            const { pixelReturn } = await this.actions.run<[string]>(
                `DownloadAsset(filePath=["${path}"], space=["${id}"]);`,
                "insight",
            );

            // get the file key
            const fileKey = pixelReturn[0].output;

            try {
                await download(this._store.insightId, fileKey);

                return true;
            } catch (error) {
                this.processActionError(error as Error);
            }

            // throw an error
            throw new Error("No download");
        },
    };
}
