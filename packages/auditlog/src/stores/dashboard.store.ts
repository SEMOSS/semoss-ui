import { configure, makeAutoObservable, runInAction } from "mobx";

configure({
	enforceActions: "always",
});

interface Dashboard {
	/**
	 * Selected engine type
	 */
	engineType: string;
	/*
        Selected Engine Id
    */
	engineId: string;
}

interface DashboardStoreInterface {
	/**
	 * Track if the store is initialized
	 */
	isInitialized: boolean;

	dashboard: Dashboard;
}

export class DashboardStore {
	private _store: DashboardStoreInterface = {
		isInitialized: false,
		dashboard: {
			engineType: "",
			engineId: "",
		},
	};
	constructor() {
		this._store = {
			...this._store,
			dashboard: {
				engineType: "",
				engineId: "",
			},
		};
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
	/**
	 * Track if the store is loaded
	 */
	get isInitialized() {
		return this._store.isInitialized;
	}

	/* 
        get the engine type
    */
	get engineType() {
		return this._store.dashboard.engineType;
	}
	/*
        get the engine Id
    */
	get engineId() {
		return this._store.dashboard.engineId;
	}

	/**
	 * Set the default theme
	 */
	initialize = async (
		data: Partial<DashboardStoreInterface>,
	): Promise<void> => {
		this.updateDashboardStore(data);

		runInAction(() => {
			this._store.isInitialized = true;
		});
	};
	/**
	 * Helpers
	 */
	private updateDashboardStore = (
		data: Partial<DashboardStoreInterface> | undefined,
	) => {
		this._store = {
			...this._store,
			dashboard: {
				engineType:
					data?.dashboard?.engineType ||
					this._store.dashboard.engineType,
				engineId:
					data?.dashboard?.engineId || this._store.dashboard.engineId,
			},
		};
	};
}
