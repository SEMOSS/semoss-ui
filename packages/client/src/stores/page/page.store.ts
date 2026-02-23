import { autorun, makeAutoObservable } from "mobx";
import type { PageCache } from "./page.types";

const CACHE_KEY = `PAGE_STORE_CACHE--1`;

export interface PageStoreInterface {
	/**
	 * Navigation bar information
	 **/
	navbar: {
		/**
		 *  Save the element of the navbar
		 */
		element: HTMLElement;

		/**
		 *  Show the logo
		 */
		logo: boolean;

		/**
		 *  Show the search
		 */
		search: boolean;
	};

	/**
	 * Sidebar information
	 **/
	sidebar: {
		/**
		 * Track if it is open or closed
		 */
		open: boolean;

		/**
		 * Track if it is pinned
		 */
		pinned: boolean;
	};
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class PageStore {
	private _store: PageStoreInterface = {
		navbar: {
			element: null,
			logo: true,
			search: true,
		},
		sidebar: {
			open: false,
			pinned: false,
		},
	};

	constructor() {
		// set from the catch
		try {
			const cached = JSON.parse(
				localStorage.getItem(CACHE_KEY),
			) as PageCache;

			if (cached) {
				this._store.sidebar.pinned = cached.sidebar.pinned;
			}
		} catch (e) {
			console.error(e);
		}

		// make it observable
		makeAutoObservable(this);

		// auto run and save to cache
		autorun(() => {
			try {
				const item: PageCache = {
					sidebar: {
						pinned: this._store.sidebar.pinned,
					},
				};

				// save cache
				localStorage.setItem(CACHE_KEY, JSON.stringify(item));
			} catch (e) {
				console.error(e);
			}
		});
	}

	/**
	 * Getters
	 */
	/**
	 * Get top navigation information
	 */
	get navbar() {
		return this._store.navbar;
	}

	/**
	 * Get sidebar information
	 */
	get sidebar() {
		return this._store.sidebar;
	}

	/**
	 * Actions
	 */
	/**
	 * Update the navbar logo
	 */
	setNavbarElement = (ele: HTMLElement) => {
		this._store.navbar.element = ele;
	};

	/**
	 * Update the navbar logo
	 */
	updateNavbarLogo = (logo = true) => {
		this._store.navbar.logo = logo;
	};

	/**
	 * Update the navbar search
	 */
	updateNavbarSearch = (search = true) => {
		this._store.navbar.search = search;
	};

	/**
	 * Set the sidebar
	 */
	setSidebar = (
		content: PageStoreInterface["sidebar"] = { open: false, pinned: false },
	) => {
		this._store.sidebar = content;
	};

	/**
	 * Open the sidebar
	 */
	openSidebar = () => {
		this._store.sidebar.open = true;
	};

	/**
	 * Close the sidebar
	 */
	closeSidebar = () => {
		this._store.sidebar.pinned = false;
		this._store.sidebar.open = false;
	};

	/**
	 * Pin the sidebar
	 */
	pinSidebar = () => {
		this._store.sidebar.pinned = true;
	};

	/**
	 * Unpin the sidebar
	 */
	unpinSidebar = () => {
		this._store.sidebar.pinned = false;
	};
}
