import { makeAutoObservable } from "mobx";
import { runPixel } from "@semoss/sdk/react";
import type { AppMetadata } from "@/components/app";
import { FlexLayout } from "@/components/flex-layout";
import type { RootStore, WorkspaceOptions } from "@/stores";
import type { Role } from "@/types";

export interface WorkspaceStoreInterface {
	/**
	 * ID of App
	 */
	appId: string;

	/**
	 * ID of Workspace Insight
	 */
	insightId: string;

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
	 * Global flag controlling whether saves require a commit message (modal prompt)
	 */
	requireCommitMessage: boolean;

	/**
	 * Type of the app
	 */
	type: "BLOCKS" | "CODE";

	/**
	 * Model associated with the layout
	 **/
	model: FlexLayout.Model | null;

	/**
	 * Overlay information
	 **/
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
			maxWidth: "sm" | "md" | "lg" | "xl" | null;
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
	 * Get the ID of the Insight tied to app workspace
	 */
	insightId: string;

	/**
	 * User's role relative to the app
	 */
	role: Role;

	/**
	 * Type of the app
	 */
	type: "BLOCKS" | "CODE";

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
		appId: "",
		insightId: "",
		isLoading: false,
		role: "READ_ONLY",
		type: "CODE",
		agentModelEngine: "",
		requireCommitMessage: true,
		metadata: {
			project_id: "",
			project_name: "",
			project_type: "",
			project_cost: "",
			project_global: "",
			project_catalog_name: "",
			project_created_by: "",
			project_date_last_edited: "",
			project_created_by_type: "",
			project_date_created: "",
		},
		model: null,
		overlay: {
			open: false,
			options: {
				maxWidth: "sm",
			},
			content: () => null,
		},
	};

	constructor(root: RootStore, config: WorkspaceConfigInterface) {
		// register the root
		this._root = root;

		// set the app and insight Id
		this._store.appId = config.appId;
		this._store.insightId = config.insightId;
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
	 * Get the ID of the workspace insight
	 */
	get insightId() {
		return this._store.insightId;
	}

	/**
	 * Get the agentModelEngine
	 */
	get agentModelEngine() {
		return this._store.agentModelEngine;
	}

	/**
	 * Get global commit message requirement flag
	 */
	get requireCommitMessage() {
		return this._store.requireCommitMessage;
	}

	/**
	 * Get if the app is loading
	 */
	get isLoading() {
		return this._store.isLoading;
	}

	/**
	 * Get model
	 */
	get model() {
		return this._store.model;
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
		return `smss-workspace--${this._store.appId}-v4`;
	}

	/**
	 * Actions
	 */

	/**
	 * runs pixel off of workspace insight
	 */
	runWorkspacePixel = async (command: string) => {
		return await runPixel(command, this._store.insightId);
	};

	/**
	 * Load the workspace
	 * @param options - options to configure the workspace with
	 */
	load = (options: WorkspaceOptions): boolean => {
		try {
			// add the new layout
			if (options.layout) {
				this._store.model = FlexLayout.Model.fromJson(options.layout);
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
				const options = JSON.parse(item) as WorkspaceOptions;
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
				version: "",
				layout: this._store.model.toJson(),
			};

			// save cache
			localStorage.setItem(this.cacheKey, JSON.stringify(options));
		} catch (e) {
			console.error(e);
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
	 * Update the layout
	 *
	 * @param id - id of the layout
	 * @param layout - layout that is being added
	 */
	updateLayout = (layout: FlexLayout.IJsonModel) => {
		this._store.model = FlexLayout.Model.fromJson(layout);

		// trigger the save manually as the Model is recreated
		this.saveToCache();
	};

	/**
	 * Open the overlay
	 */
	openOverlay = (
		content: WorkspaceStoreInterface["overlay"]["content"],
		options: WorkspaceStoreInterface["overlay"]["options"] = {
			maxWidth: "sm",
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

	/**
	 * Set the agentModelEngine
	 */
	setAgentModelEngine = (id: string) => {
		this._store.agentModelEngine = id;
	};

	/**
	 * Set global commit message requirement
	 */
	setRequireCommitMessage = (val: boolean) => {
		this._store.requireCommitMessage = val;
	};
}
