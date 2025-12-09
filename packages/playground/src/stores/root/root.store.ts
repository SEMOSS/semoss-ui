import { configure, makeAutoObservable } from "mobx";
import appImage from "@/assets/img/app.svg";
import landingImage from "@/assets/img/landing.png";
import loginImage from "@/assets/img/login.svg";
import logoImage from "@/assets/img/logo.svg";
import workspaceImage from "@/assets/img/workspace.png";
import type { Theme } from "@/types";

configure({
	enforceActions: "always",
});

const NAME = import.meta.env.VITE_NAME ? import.meta.env.VITE_NAME : "";
const THEME = import.meta.env.VITE_THEME ? import.meta.env.VITE_THEME : "{}";

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
	 * Custom breadcrumbs for the main layout
	 */
	breadcrumbs: {
		name: string;
		path: string;
	}[];
}

/**
 * Manage global application state including theme
 */
export class RootStore {
	private _store: RootStoreInterface = {
		isInitialized: false,
		breadcrumbs: [],
		theme: {
			name: "",
			description: "",
			variables: {
				backgroundColor: "",
				primaryColor: "",
				secondaryColor: "",
			},
			images: {
				app: appImage,
				logo: logoImage,
				login: loginImage,
				landing: landingImage,
				workspace: workspaceImage,
			},
			overrides: {
				"main-layout": {},
			},
			header: "",
			footer: "",
			landing: "",
			sidebar: {
				headerItems: [],
				footerItems: [],
			},
			dialog: undefined,
		},
	};

	constructor() {
		// If parsing fails, fall back to environment variables only
		if (NAME) {
			this._store.theme.name = NAME;
		}

		// merge with the environment variables
		try {
			const theme = JSON.parse(THEME) as Partial<Theme>;

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
	 * Get the current breadcrumbs
	 */
	get breadcrumbs() {
		return this._store.breadcrumbs;
	}

	/**
	 * Set custom breadcrumbs
	 */
	setBreadcrumbs = (breadcrumbs: RootStore["breadcrumbs"]) => {
		this._store.breadcrumbs = breadcrumbs;
	};

	/**
	 * Clear breadcrumbs (use default route-based breadcrumbs)
	 */
	clearBreadcrumbs = () => {
		this._store.breadcrumbs = [];
	};

	/**
	 * Set the default theme
	 */
	initialize = async (theme: Partial<Theme>): Promise<void> => {
		this.updateTheme(theme);

		// set as initialized
		this._store.isInitialized = true;
	};

	/**
	 * Helpers
	 */

	/**
	 * Update the theme
	 * @param theme Theme
	 */
	private updateTheme = (theme: Partial<Theme> | undefined) => {
		// deep merge from the environment
		this._store.theme = {
			...this._store.theme,
			name: theme?.name || this._store.theme.name,
			description: theme?.description || this._store.theme.description,
			variables: {
				...this._store.theme.variables,
				...(theme?.variables || {}),
			},
			images: {
				...this._store.theme.images,
				...(theme?.images || {}),
			},
			overrides: {
				...this._store.theme.overrides,
				...(theme?.overrides || {}),
			},

			header: theme?.header || this._store.theme.header,
			footer: theme?.footer || this._store.theme.footer,
			landing: theme?.landing || this._store.theme.landing,
			sidebar: {
				...this._store.theme.sidebar,
				...(theme?.sidebar || {}),
			},

			dialog: theme?.dialog || this._store.theme.dialog,
		};

		// apply the theme to document root
		const root = document.documentElement;
		if (this._store.theme.variables.backgroundColor) {
			root.style.setProperty(
				"--background",
				this._store.theme.variables.backgroundColor,
			);
		}

		if (this._store.theme.variables.primaryColor) {
			root.style.setProperty(
				"--primary",
				this._store.theme.variables.primaryColor,
			);
		}

		if (this._store.theme.variables.secondaryColor) {
			root.style.setProperty(
				"--secondary",
				this._store.theme.variables.secondaryColor,
			);
		}
	};
}
