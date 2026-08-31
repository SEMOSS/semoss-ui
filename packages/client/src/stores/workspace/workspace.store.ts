import { makeAutoObservable } from "mobx";
import { FlexLayout } from "@semoss/shared";
import type { RootStore, WorkspaceOptions } from "@/stores";

interface WorkspaceStoreInterface {
	/**
	 * ID of Workspace Insight
	 */
	insightId: string;

	/**
	 * Show Loading or not
	 */
	isLoading: boolean;

	/**
	 * ID of the loaded project
	 */
	projectId: string;

	/**
	 * Optional Model Engine to use
	 */
	agentModelEngine: string;

	/**
	 * Model associated with the layout
	 **/
	model: FlexLayout.Model | null;
}

interface WorkspaceConfigInterface {
	/**
	 * Get the ID of the Insight tied to app workspace
	 */
	insightId: string;

	/**
	 * ID of the loaded project
	 */
	projectId: string;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class WorkspaceStore {
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: kept for future use
	private _root: RootStore;
	private _store: WorkspaceStoreInterface = {
		insightId: "",
		isLoading: false,
		projectId: "",
		agentModelEngine: "",
		model: null,
	};

	constructor(root: RootStore, config: WorkspaceConfigInterface) {
		// register the root
		this._root = root;

		this._store.insightId = config.insightId;

		this._store.projectId = config.projectId;

		// make it observable
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
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
	 * The key for the local storage cache
	 */
	get cacheKey() {
		return `smss-workspace--${this._store.projectId}-v7`;
	}

	/**
	 * Actions
	 */
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
}
