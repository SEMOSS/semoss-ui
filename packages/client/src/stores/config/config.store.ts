import { makeAutoObservable, runInAction } from "mobx";
// TODO: Pull from sdk
import { Env, logout, runPixel } from "@semoss/sdk/react";
import {
	getUserProjectPermission as getUserProjectLevelPermission,
	registerUser,
} from "@/api";
import type { AppMetadata } from "@/components/app";
import { THEME } from "@/constants";
import {
	type RootStore,
	type WorkspaceConfigInterface,
	WorkspaceStore,
} from "@/stores";
import type { ALL_TYPES } from "@/types";

interface ConfigStoreInterface {
	/** Status of the application */
	status: "INITIALIZING" | "MISSING AUTHENTICATION" | "SUCCESS" | "ERROR";
	/** Mark if the store is authenticated (user is logged in) */
	authenticated: boolean;
	/** InsightID to run actions against */
	insightID: string;
	/** Session ID */
	userEpoch: string;
	/** User information (if logged in) */
	user: {
		loggedIn: boolean;
		id: string;
		name: string;
		email: string;
		admin: boolean;
	};
	/** Native mode */
	isNative: boolean;
	/** Flag to trigger reloading of the file explorer UI */
	reloadFiles: string;
	/** Config information */
	config: {
		databaseMetaKeys: {
			display_options:
				| "input"
				| "textarea"
				| "markdown"
				| "single-checklist"
				| "multi-checklist"
				| "single-select"
				| "multi-select"
				| "single-typeahead"
				| "multi-typeahead"
				| "select-box";
			display_order: number;
			metakey: string;
			single_multi: string;
			display_values?: string;
		}[];
		projectMetaKeys: {
			display_options:
				| "input"
				| "textarea"
				| "markdown"
				| "single-checklist"
				| "multi-checklist"
				| "single-select"
				| "multi-select"
				| "single-typeahead"
				| "multi-typeahead"
				| "select-box";
			display_order: number;
			metakey: string;
			single_multi: string;
			display_values?: string;
		}[];
		/**
		 * List of available providers (logins) that are available
		 */
		availableProviders: {
			provider: string;
			name: string;
			label: string;
			isOauth: boolean;
		}[];
		/**
		 * Track if native registration is allowed (username/pw)
		 */
		nativeRegistration: boolean;
		/**
		 * Version of the app
		 */
		version: {
			datetime: string;
			version: string;
		};
		/**
		 * Track if r is enabled
		 */
		r: boolean;
		/**
		 * Track if python is enabled
		 */
		python: boolean;
		/**
		 * Track if csrf is enabled
		 */
		csrf: boolean;
		/*
		 * sidemenubar if adminOnlyViewMenuBarFlag is enabled
		 */
		adminOnlyViewMenuBarFlag: boolean;
		/**
		 * Flags
		 */
		adminOnlyDbAdd: boolean;
		adminOnlyDbAddAccess: boolean;
		adminOnlyDbDelete: boolean;
		adminOnlyDbSetDiscoverable: boolean;
		adminOnlyDbSetPublic: boolean;
		adminOnlyFunctionAdd: boolean;
		adminOnlyFunctionAddAccess: boolean;
		adminOnlyFunctionDelete: boolean;
		adminOnlyFunctionSetDiscoverable: boolean;
		adminOnlyFunctionSetPublic: boolean;
		adminOnlyInsightAddAccess: boolean;
		adminOnlyInsightSetPublic: boolean;
		adminOnlyInsightShare: boolean;
		adminOnlyModelAdd: boolean;
		adminOnlyModelAddAccess: boolean;
		adminOnlyModelDelete: boolean;
		adminOnlyModelSetDiscoverable: boolean;
		adminOnlyModelSetPublic: boolean;
		adminOnlyProjectAdd: boolean;
		adminOnlyProjectAddAccess: boolean;
		adminOnlyProjectDelete: boolean;
		adminOnlyProjectSetDiscoverable: boolean;
		adminOnlyProjectSetPublic: boolean;
		adminOnlyStorageAdd: boolean;
		adminOnlyStorageAddAccess: boolean;
		adminOnlyStorageDelete: false;
		adminOnlyStorageSetDiscoverable: boolean;
		adminOnlyStorageSetPublic: boolean;
		adminOnlyVectorAdd: boolean;
		adminOnlyVectorAddAccess: boolean;
		adminOnlyVectorDelete: boolean;
		adminOnlyVectorSetDiscoverable: boolean;
		adminOnlyVectorSetPublic: boolean;

		[key: string]: unknown;
	};
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class ConfigStore {
	private _root: RootStore;
	private _store: ConfigStoreInterface = {
		status: "INITIALIZING",
		authenticated: false,
		insightID: "",
		userEpoch: "",
		isNative: false,
		reloadFiles: "",
		user: {
			loggedIn: false,
			id: "",
			name: "",
			email: "",
			admin: false,
		},
		config: {
			databaseMetaKeys: [],
			projectMetaKeys: [],
			availableProviders: [],
			nativeRegistration: false,
			version: {
				version: "",
				datetime: "",
			},
			r: true,
			python: true,
			csrf: false,
			adminOnlyViewMenuBarFlag: false,
			adminOnlyDbAdd: false,
			adminOnlyDbAddAccess: false,
			adminOnlyDbDelete: false,
			adminOnlyDbSetDiscoverable: false,
			adminOnlyDbSetPublic: false,
			adminOnlyFunctionAdd: false,
			adminOnlyFunctionAddAccess: false,
			adminOnlyFunctionDelete: false,
			adminOnlyFunctionSetDiscoverable: false,
			adminOnlyFunctionSetPublic: false,
			adminOnlyInsightAddAccess: false,
			adminOnlyInsightSetPublic: false,
			adminOnlyInsightShare: false,
			adminOnlyModelAdd: false,
			adminOnlyModelAddAccess: false,
			adminOnlyModelDelete: false,
			adminOnlyModelSetDiscoverable: false,
			adminOnlyModelSetPublic: false,
			adminOnlyProjectAdd: false,
			adminOnlyProjectAddAccess: false,
			adminOnlyProjectDelete: false,
			adminOnlyProjectSetDiscoverable: false,
			adminOnlyProjectSetPublic: false,
			adminOnlyStorageAdd: false,
			adminOnlyStorageAddAccess: false,
			adminOnlyStorageDelete: false,
			adminOnlyStorageSetDiscoverable: false,
			adminOnlyStorageSetPublic: false,
			adminOnlyVectorAdd: false,
			adminOnlyVectorAddAccess: false,
			adminOnlyVectorDelete: false,
			adminOnlyVectorSetDiscoverable: false,
			adminOnlyVectorSetPublic: false,
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

	/**
	 * Get the config
	 */
	get config() {
		return this._store.config;
	}

	/**
	 * Get the config
	 */
	get theme(): {
		name: string;
		logo: string;
		landingPageName: string;
		isLogoUrl: boolean;
		cookiePolicyBannerReact: string;
		cookiePolicyOrderReact: string[];
		cookiePoliciesReact: unknown;
		cookiePolicyModalBodyReact: string;
		cookiePolicyModalHeaderReact: string;
		cookiePolicyNoticePage: string;
		helpBannerOrder: string[];
		helpBannerValues: unknown;
		privacyNoticePage: string;
		termsHeaderReact: string;
		termsReact: string;
		materialTheme: unknown;
	} {
		const defaultTheme = {
			name: THEME.name,
			logo: THEME.logo,
			landingPageName: THEME.name,
			isLogoUrl: false,
			cookiePolicyBannerReact: "",
			cookiePolicyOrderReact: [],
			cookiePoliciesReact: {},
			cookiePolicyModalBodyReact: "",
			cookiePolicyModalHeaderReact: "",
			cookiePolicyNoticePage: "",
			helpBannerOrder: [],
			helpBannerValues: {},
			privacyNoticePage: "",
			termsHeaderReact: "",
			termsReact: "",
			materialTheme: {},
		};

		let customTheme = {};
		try {
			if (
				(this._store.config.theme as { THEME_MAP: string })?.THEME_MAP
			) {
				customTheme = JSON.parse(
					(this._store.config.theme as { THEME_MAP: string })
						.THEME_MAP as string,
				);
			}
		} catch {}

		return {
			...defaultTheme,
			...customTheme,
		};
	}

	/**
	 * Track if an engine operation is available
	 */
	isEngineOperationAvailable = (
		type: ALL_TYPES,
		flag: "access" | "add" | "delete" | "discoverable" | "public",
	): boolean => {
		// it is always available if the user is an admin
		if (this.store.user.admin) {
			return true;
		}

		const moduleMap = {
			PROJECT: "Project",
			DATABASE: "Db",
			FUNCTION: "Function",
			MODEL: "Model",
			STORAGE: "Storage",
			VECTOR: "Vector",
		} as const;

		const operationMap = {
			access: "AddAccess",
			add: "Add",
			delete: "Delete",
			discoverable: "SetDiscoverable",
			public: "SetPublic",
		} as const;

		// if the flag is set to true, the user needs admin access
		return (
			this._store.config[
				`adminOnly${moduleMap[type]}${operationMap[flag]}`
			] === false
		);
	};

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
			this._store.status === "ERROR" ||
			this._store.status === "MISSING AUTHENTICATION"
		) {
			return;
		}

		// get the user information
		await this.getUser();

		// Set CSRF flag to true before setGeneralReactors()
		Env.update({ CSRF: this.store.config.csrf });

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

				// save the other config data
				for (const key in data) {
					this._store.config[key] = data[key];
				}

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
					this._store.status = "MISSING AUTHENTICATION";
					return;
				}
			});
		} catch (error) {
			console.error(error);

			// set the status as an error
			runInAction(() => {
				this._store.status = "ERROR";
			});
		}
	}

	/**
	 * Set the user information
	 */
	private async getUser(): Promise<void> {
		const { monolithStore } = this._root;

		try {
			const { pixelReturn, insightId, errors } = await monolithStore.run<
				[
					{
						[key: string]: {
							id: string;
							name: string;
							email: string;
							admin: boolean;
							userEpoch: string;
						};
					},
				]
			>("new", `GetUserInfo();`);

			// track if the user is an admin
			const isAdmin = await monolithStore.isAdminUser();

			const output = pixelReturn[0].output;
			if (errors.length > 0) {
				throw Error(errors.join(""));
			}

			runInAction(() => {
				// set the insight ID
				this._store.insightID = insightId;

				let user = {
					id: "",
					name: "",
					email: "",
					userEpoch: "",
					admin: false,
				};

				// TODO: remove userEpoch from the backend
				if (output.userEpoch) {
					delete output.userEpoch;
				}

				// get the user based on provider
				if (output.SAML) {
					user = output.SAML;
				} else if (output.NATIVE) {
					user = output.NATIVE;
					this._store.isNative = true;
				} else if (Object.keys(output).length > 0) {
					// This is a hack...since we don't have a single user
					user = output[Object.keys(output)[0]];
				}

				this._store.user.id = user.id || "";
				this._store.user.name = user.name || "";
				this._store.user.email = user.email || "";
				this._store.userEpoch = user.userEpoch;

				this._store.user.admin = isAdmin;

				// set the status as an success
				this._store.status = "SUCCESS";
			});
		} catch (error) {
			console.error(error);

			runInAction(() => {
				// set the status as an error
				this._store.status = "ERROR";
			});
		}
	}

	setReloadFiles(value: string) {
		runInAction(() => {
			this._store.reloadFiles = value;
		});
	}

	/**
	 * Add a recent search to localStorage.
	 * Stores up to 8 items, removes oldest if limit exceeded.
	 * If same id exists, remove it and add new at the end.
	 * @param recentSearch { label: string, id: string, type: string }
	 */
	setRecentSearch(recentSearch: { label: string; id: string; type: string }) {
		const key = `recent-searches--${this._store.userEpoch}`;
		let recent: Array<{ label: string; id: string; type: string }> = [];

		// Get existing searches
		const item = localStorage.getItem(key);
		if (item) {
			try {
				recent = JSON.parse(item);
				// Remove if id already exists
				recent = recent.filter((s) => s.id !== recentSearch.id);
			} catch {
				recent = [];
			}
		}

		// Add new search at the end
		recent.push(recentSearch);

		// Keep only last 8
		if (recent.length > 8) {
			recent = recent.slice(recent.length - 8);
		}

		localStorage.setItem(key, JSON.stringify(recent));
	}

	/**
	 * Get recent searches from localStorage.
	 */
	getRecentSearches(): Array<{ label: string; id: string; type: string }> {
		const key = `recent-searches--${this._store.userEpoch}`;
		const item = localStorage.getItem(key);

		if (item) {
			try {
				return JSON.parse(item);
			} catch {
				return [];
			}
		}
		return [];
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
				id: "",
				name: "",
				email: "",
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
				id: "",
				name: "",
				email: "",
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
		if (response === "change-password") {
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
				id: "",
				name: "",
				email: "",
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
		// const { monolithStore } = this._root;

		// login that preceeds sending of OTP
		await registerUser(
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
				id: "",
				name: "",
				email: "",
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
				id: "",
				name: "",
				email: "",
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
		await logout();
		try {
			runInAction(() => {
				// clear the info and reset the user
				this._store.user = {
					loggedIn: false,
					admin: false,
					id: "",
					name: "",
					email: "",
				};
				this._store.status = "MISSING AUTHENTICATION";
			});
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	/**
	 * Run a pixel string
	 *
	 * @param pixel - pixel to execute
	 */
	async runPixel<O extends unknown[] | []>(pixel: string) {
		return await runPixel<O>(
			pixel,
			this._store.insightID ? this._store.insightID : "new",
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
			await getUserProjectLevelPermission(appId);

		// get the role and throw an error if it is missing
		const role = getUserProjectPermission.permission;
		if (!role) {
			throw new Error("Unauthorized");
		}

		const { insightId } = await runPixel(`SetContext("${appId}")`, "new");

		// get the metadata
		const getAppInfo = await this._root.monolithStore.runQuery<
			[AppMetadata]
		>(`ProjectInfo(project=["${appId}"]);`, insightId);

		// throw the errors if there are any
		if (getAppInfo.errors.length > 0) {
			throw new Error(getAppInfo.errors.join(""));
		}

		const metadata = {
			...getAppInfo.pixelReturn[0].output,
		};

		const workspace: WorkspaceConfigInterface = {
			appId: appId,
			insightId: insightId,
			type: "CODE",
			role: role,
			metadata: metadata,
		};

		// set it as blocks
		if (metadata.project_type === "BLOCKS") {
			workspace.type = "BLOCKS";
		}

		// create the newly loaded workspace
		return new WorkspaceStore(this._root, workspace);
	}

	/**
	 * Set general reactors used for pixel cell suggestions
	 */
	async setGeneralReactors() {
		try {
			const res = await runPixel("META|HelpJson();");

			runInAction(() => {
				const generalReactorList = (
					res.pixelReturn[0].output as { General: string[] }
				)?.General;
				this._generalReactors = generalReactorList;
			});
		} catch {
			console.error("Failed response from help pixel");
			return;
		}
	}
}
