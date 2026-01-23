import { configure, makeAutoObservable, runInAction } from "mobx";
import type { Theme } from "@/types";

configure({
	enforceActions: "always",
});

const APP_NAME = import.meta.env.VITE_APP_NAME
	? import.meta.env.VITE_APP_NAME
	: "";
const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION
	? import.meta.env.VITE_APP_DESCRIPTION
	: "";
const APP_LOGO_PATH = import.meta.env.VITE_APP_LOGO_PATH
	? import.meta.env.VITE_APP_LOGO_PATH
	: "";

const APP_THEME = import.meta.env.VITE_APP_THEME
	? import.meta.env.VITE_APP_THEME
	: "{}";

interface UserInfo {
	id: string;
	name: string;
	email: string;
	isAdmin: boolean;
}

interface RootStoreInterface {
	/**
	 * Track if the store is initialized
	 */
	isInitialized: boolean;

	/**
	 * Current theme setting
	 */
	theme: Theme;

	/**
	 * current user info
	 */
	user: UserInfo;
}

/**
 * Manage global application state including theme
 */
export class RootStore {
	private _store: RootStoreInterface = {
		isInitialized: false,
		theme: {
			name: "",
			description: "",
			styles: {
				backgroundColor: "",
				primaryColor: "",
			},
			images: {
				logo: "",
			},
		},
		user: {
			id: "",
			name: "",
			email: "",
			isAdmin: false,
		},
	};

	constructor() {
		// If parsing fails, fall back to environment variables only
		if (APP_NAME) {
			this._store.theme.name = APP_NAME;
		}

		if (APP_DESCRIPTION) {
			this._store.theme.description = APP_DESCRIPTION;
		}

		if (APP_LOGO_PATH) {
			this._store.theme.images.logo = APP_LOGO_PATH;
		}

		// merge with the environment variables
		try {
			const theme = JSON.parse(APP_THEME) as Partial<Theme>;

			// update the theme
			this.updateTheme(theme);
		} catch (_e) {
			// noop
		}

		// make it observable
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

	/**
	 * Get the current theme
	 */
	get theme() {
		return this._store.theme;
	}

	/**
	 *
	 * Get the current user
	 */
	get user() {
		return this._store.user;
	}

	/**
	 * Set the default theme
	 */
	initialize = async (theme: Partial<Theme>): Promise<void> => {
		this.updateTheme(theme);

		runInAction(() => {
			this._store.isInitialized = true;
		});
	};

	/**
	 *
	 * @param user will have id, name, and possibly email and isAdmin
	 */

	initializeUser = (user: UserInfo): void => {
		this._store.user = user;
	};

	/**
	 * Helpers
	 */

	/**
	 * Update the theme
	 * @param theme Theme
	 */
	private updateTheme = (theme: Partial<Theme> | undefined) => {
		// deep merge from the environmentf
		this._store.theme = {
			name: theme?.name || this._store.theme.name,
			description: theme?.description || this._store.theme.description,
			styles: {
				...this._store.theme.styles,
				...(theme?.styles || {}),
			},
			images: {
				...this._store.theme.images,
				...(theme?.images || {}),
			},
		};

		// apply the theme to document root
		const root = document.documentElement;
		if (this._store.theme.styles.backgroundColor) {
			root.style.setProperty(
				"--background",
				this._store.theme.styles.backgroundColor,
			);
		}

		if (this._store.theme.styles.primaryColor) {
			root.style.setProperty(
				"--primary",
				this._store.theme.styles.primaryColor,
			);
		}
	};
}
