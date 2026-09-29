import { makeAutoObservable } from "mobx";

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
 * What a BLOCKS app's panels share: the insight they run through, the project
 * they belong to, the loading screen, and the model chosen for the AI actions.
 *
 * Not the layout. That belongs to the dock, which persists its own snapshot.
 */
export class WorkspaceStore {
	private _store: WorkspaceStoreInterface = {
		insightId: "",
		isLoading: false,
		projectId: "",
		agentModelEngine: "",
	};

	constructor(config: WorkspaceConfigInterface) {
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
	 * Actions
	 */
	/**
	 * Set the loading screen for the app
	 * @param isLoading - true if loading screen is on
	 */
	setLoading = (isLoading: boolean) => {
		this._store.isLoading = isLoading;
	};

	/**
	 * Set the agentModelEngine
	 */
	setAgentModelEngine = (id: string) => {
		this._store.agentModelEngine = id;
	};
}
