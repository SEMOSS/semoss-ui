import { makeAutoObservable } from "mobx";
import { runPixel } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import type { AppMetadata } from "@/components/app";
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
	 * Type of the app
	 */
	type: "BLOCKS" | "CODE" | "SKILL" | "WORKSPACE";

	/**
	 * Model associated with the layout
	 **/
	model: FlexLayout.Model | null;

	/**
	 * insightId of the active terminal tab. Each terminal tab owns its own
	 * insight; the "Insight" file explorer binds to this so INSIGHT-scoped
	 * browsing/upload targets the same insight the user runs commands in.
	 * `null` until a terminal tab's insight is ready.
	 */
	activeTerminalInsightId: string | null;
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
	type: "BLOCKS" | "CODE" | "SKILL" | "WORKSPACE";

	/**
	 * Metadata associated with the loaded app
	 */
	metadata: AppMetadata;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class WorkspaceStore {
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: kept for future use
	private _root: RootStore;
	private _store: WorkspaceStoreInterface = {
		appId: "",
		insightId: "",
		isLoading: false,
		role: "READ_ONLY",
		type: "CODE",
		agentModelEngine: "",
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
		activeTerminalInsightId: null,
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
	 * insightId of the active terminal tab (or null before one is ready). The
	 * Insight file explorer binds to this so its listing/upload stay in sync
	 * with the terminal the user is running commands in.
	 */
	get activeTerminalInsightId() {
		return this._store.activeTerminalInsightId;
	}

	/**
	 * The key for the local storage cache
	 */
	get cacheKey() {
		return `smss-workspace--${this._store.appId}-v6`;
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
			if (!this._store.model) {
				return;
			}

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
	 * Set the agentModelEngine
	 */
	setAgentModelEngine = (id: string) => {
		this._store.agentModelEngine = id;
	};

	/**
	 * Record the insightId of the active terminal tab so the Insight file
	 * explorer can bind to it. Called by the terminal panel as tabs are
	 * focused/opened/closed.
	 */
	setActiveTerminalInsightId = (insightId: string | null) => {
		this._store.activeTerminalInsightId = insightId;
	};
}
