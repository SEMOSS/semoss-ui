import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore, WorkspaceStore, WorkspaceConfigInterface } from '@/stores';
import { runPixel } from '@/api';
import { AppMetadata } from '@/components/app';
import { darkTheme, lightTheme, CustomThemeOptions } from '@semoss/ui';

interface ConfigStoreInterface {
    /** Status of the application */
    status: 'INITIALIZING' | 'MISSING AUTHENTICATION' | 'SUCCESS' | 'ERROR';
    /** Mark if the store is authenticated (user is logged in) */
    authenticated: boolean;
    /** InsightID to run actions against */
    insightID: string;
    /** User information (if logged in) */
    user: {
        loggedIn: boolean;
        id: string;
        name: string;
        email: string;
        admin: boolean;
    };
    /** Config information */
    config: {
        databaseMetaKeys: {
            display_options:
                | 'input'
                | 'textarea'
                | 'markdown'
                | 'single-checklist'
                | 'multi-checklist'
                | 'single-select'
                | 'multi-select'
                | 'single-typeahead'
                | 'multi-typeahead'
                | 'select-box';
            display_order: number;
            metakey: string;
            single_multi: string;
            display_values?: string;
        }[];
        projectMetaKeys: {
            display_options:
                | 'input'
                | 'textarea'
                | 'markdown'
                | 'single-checklist'
                | 'multi-checklist'
                | 'single-select'
                | 'multi-select'
                | 'single-typeahead'
                | 'multi-typeahead'
                | 'select-box';
            display_order: number;
            metakey: string;
            single_multi: string;
            display_values?: string;
        }[];
        /**
         * List of available providers (logins) that are available
         */
        providers: string[];
        version: {
            datetime: string;
            version: string;
        };
        [key: string]: unknown;
    };
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class ConfigStore {
    private _root: RootStore;
    private _store: ConfigStoreInterface = {
        status: 'INITIALIZING',
        authenticated: false,
        insightID: '',
        user: {
            loggedIn: false,
            id: '',
            name: '',
            email: '',
            admin: false,
        },
        config: {
            databaseMetaKeys: [],
            projectMetaKeys: [],
            providers: [],
            version: {
                version: '',
                datetime: '',
            },
        },
    };
    private _generalReactors: Array<string> = [];

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
     * Get data from the current store
     */
    get store(): ConfigStoreInterface {
        return this._store;
    }

    /**
     * Get the list of reactors
     */
    get generalReactors() {
        return this._generalReactors;
    }

    // *********************************************************
    // Actions
    // *********************************************************
    /**
     * Initialize the data
     */
    async initialize(): Promise<void> {
        // set the config
        await this.setConfig();

        // if there is an error in the config, don't do anything
        if (
            this._store.status === 'ERROR' ||
            this._store.status === 'MISSING AUTHENTICATION'
        ) {
            return;
        }

        // get the user information
        await this.getUser();

        //set the reactors
        await this.setGeneralReactors();
    }

    /**
     * Get the config data
     */
    private async setConfig(): Promise<void> {
        const { monolithStore } = this._root;

        try {
            // get the response
            const data = await monolithStore.config();

            runInAction(() => {
                // set the user information
                if (Object.keys(data.logins).length > 0) {
                    this._store.user.loggedIn = true;
                }

                // save the providers
                this._store.config.providers = [];
                for (const provider in data.loginsAllowed) {
                    if (data.loginsAllowed[provider]) {
                        this._store.config.providers.push(provider);
                    }
                }

                // save the other config data
                for (const key in data) {
                    this._store.config[key] = data[key];
                }

                // I need to set a theme with material
                const map = JSON.parse(data['theme']['THEME_MAP']);
                const material_map = {
                    ...map,
                    materialTheme: lightTheme,
                };

                console.log(JSON.stringify(material_map));
                // monolithStore.createAdminTheme({
                //     name: 'SEMOSS-TEST-DARK',
                //     isActive: true,
                //     json: material_map,
                // });

                // sort the keys
                if (this._store.config.databaseMetaKeys) {
                    this._store.config.databaseMetaKeys.sort((a, b) =>
                        a.display_order > b.display_order ? 1 : -1,
                    );
                }

                if (this._store.config.projectMetaKeys) {
                    this._store.config.projectMetaKeys.sort((a, b) =>
                        a.display_order > b.display_order ? 1 : -1,
                    );
                }

                if (!this._store.user.loggedIn) {
                    this._store.status = 'MISSING AUTHENTICATION';
                    return;
                }
            });
        } catch (error) {
            console.error(error);

            // set the status as an error
            runInAction(() => {
                this._store.status = 'ERROR';
            });
        }
    }

    /**
     * Set the user information
     */
    private async getUser(): Promise<void> {
        const { monolithStore } = this._root;

        try {
            const { pixelReturn, insightId } = await monolithStore.run(
                'new',
                `GetUserInfo();`,
            );

            // track if the user is an admin
            const isAdmin = await monolithStore.isAdminUser();

            const output = pixelReturn[0].output;
            const type = pixelReturn[0].operationType;

            if (type.indexOf('ERROR') > -1) {
                throw Error(output as string);
            }

            runInAction(() => {
                // set the insight ID
                this._store.insightID = insightId;

                let user = {
                    id: '',
                    name: '',
                    email: '',
                    admin: false,
                };

                if (output['SAML']) {
                    user = output['SAML'];
                } else if (output['NATIVE']) {
                    user = output['NATIVE'];
                } else if (output && Object.keys(output).length > 0) {
                    user = output[Object.keys(output)[0]];
                }

                this._store.user.id = user.id || '';
                this._store.user.name = user.name || '';
                this._store.user.email = user.email || '';

                this._store.user.admin = isAdmin;

                // set the status as an success
                this._store.status = 'SUCCESS';
            });
        } catch (error) {
            console.error(error);

            runInAction(() => {
                // set the status as an error
                this._store.status = 'ERROR';
            });
        }
    }

    /**
     * Allow the user to login
     *
     * @param username - username to login with
     * @param password - password to login with
     * @returns true if successful
     */
    async login(username: string, password: string): Promise<boolean> {
        const { monolithStore } = this._root;

        // try to login
        await monolithStore.login(username, password);

        // set the response data
        runInAction(() => {
            // clear the info and reset the user
            this._store.user = {
                loggedIn: true,
                admin: false,
                id: '',
                name: '',
                email: '',
            };
        });

        // get the user information
        await this.getUser();

        // success
        return true;
    }

    async loginLDAP(username: string, password: string): Promise<boolean> {
        const { monolithStore } = this._root;

        // try to login
        await monolithStore.loginLDAP(username, password);

        // set the response data
        runInAction(() => {
            // clear the info and reset the user
            this._store.user = {
                loggedIn: true,
                admin: false,
                id: '',
                name: '',
                email: '',
            };
        });

        // get the user information
        await this.getUser();

        // success
        return true;
    }

    /**
     * Allow the user to login with lin otp
     *
     * @param username - username to login with
     * @param password - password to login with
     * @returns true if successful
     */
    async loginOTP(username: string, password: string): Promise<boolean> {
        const { monolithStore } = this._root;

        // login that preceeds sending of OTP
        const response = await monolithStore.loginOTP(username, password);

        // we need to change the password, navigate to the reset screen
        if (response === 'change-password') {
            return false;
        }

        // success
        return true;
    }

    /**
     * Confirm the OTP from LinOTP
     *
     * @param otp - otp to login with
     * @returns true if successful
     */
    async confirmOTP(otp: string): Promise<boolean> {
        const { monolithStore } = this._root;

        // try to login
        await monolithStore.confirmOTP(otp);

        // if status is pending OTP
        // set the response data
        runInAction(() => {
            // clear the info and reset the user
            this._store.user = {
                loggedIn: true,
                admin: false,
                id: '',
                name: '',
                email: '',
            };
        });

        // get the user information
        await this.getUser();

        // success
        return true;
    }

    /**
     * Allow the user to login with lin otp
     *
     * @param username - username to login with
     * @param password - password to login with
     * @returns true if successful
     */
    async register(
        name: string,
        username: string,
        email: string,
        password: string,
        phone: string,
        phoneextension: string,
        countrycode: string,
    ): Promise<boolean> {
        const { monolithStore } = this._root;

        // login that preceeds sending of OTP
        const response = await monolithStore.registerUser(
            name,
            username,
            email,
            password,
            phone,
            phoneextension,
            countrycode,
        );

        runInAction(() => {
            // clear the info and reset the user
            this._store.user = {
                loggedIn: true,
                admin: false,
                id: '',
                name: '',
                email: '',
            };
        });

        // success
        return true;
    }

    /**
     * Allow the user to login using oauth
     *
     * @param provider - provider to login with
     * @returns true if successful
     */
    async oauth(provider: string): Promise<boolean> {
        const { monolithStore } = this._root;

        // try to login
        await monolithStore.oauth(provider);

        // set the response data
        runInAction(() => {
            // clear the info and reset the user
            this._store.user = {
                loggedIn: true,
                admin: false,
                id: '',
                name: '',
                email: '',
            };
        });

        // get the user information
        await this.getUser();

        // success
        return true;
    }

    /**     *
     * @returns true if successful
     */
    async logout() {
        const { monolithStore } = this._root;

        // wait for logout
        await monolithStore.logout();

        runInAction(() => {
            // clear the info and reset the user
            this._store.user = {
                loggedIn: false,
                admin: false,
                id: '',
                name: '',
                email: '',
            };

            this._store.status = 'MISSING AUTHENTICATION';
        });
    }

    /**
     * Run a pixel string
     *
     * @param pixel - pixel to execute
     */
    async runPixel<O extends unknown[] | []>(pixel: string) {
        return await runPixel<O>(
            this._store.insightID ? this._store.insightID : 'new',
            pixel,
        );
    }

    /**
     * Load an app into a new workspace
     *
     * @param appId - id of app to load into the workspace
     */
    async createWorkspace(appId: string) {
        // check the permission
        const getUserProjectPermission =
            await this._root.monolithStore.getUserProjectPermission(appId);

        // get the role and throw an error if it is missing
        const role = getUserProjectPermission.permission;
        if (!role) {
            throw new Error('Unauthorized');
        }

        // get the metadata
        const getAppInfo = await this._root.monolithStore.runQuery<
            [AppMetadata]
        >(`ProjectInfo(project=["${appId}"]);`);

        // throw the errors if there are any
        if (getAppInfo.errors.length > 0) {
            throw new Error(getAppInfo.errors.join(''));
        }

        const metadata = {
            ...getAppInfo.pixelReturn[0].output,
        };

        const workspace: WorkspaceConfigInterface = {
            appId: appId,
            type: 'CODE',
            role: role,
            metadata: metadata,
        };

        // set it as blocks
        if (metadata.project_type === 'BLOCKS') {
            workspace.type = 'BLOCKS';
        }

        // create the newly loaded workspace
        return new WorkspaceStore(this._root, workspace);
    }

    /**
     * Set general reactors used for pixel cell suggestions
     */
    async setGeneralReactors() {
        try {
            const res = await runPixel('META|HelpJson();');

            runInAction(() => {
                const generalReactorList = res.pixelReturn[0].output['General'];

                this._generalReactors = generalReactorList;
            });
        } catch {
            console.error('Failed response from help pixel');
            return;
        }
    }
}
