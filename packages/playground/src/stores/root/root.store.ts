import { configure, makeAutoObservable } from "mobx";
import type React from "react";
import type { ThemeMap } from "@semoss/shared";
import { TEMPERATURE, TOKEN_LENGTH } from "@/constants";

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
	theme: ThemeMap["playground"];

	/**
	 * Custom breadcrumbs for the main layout
	 */
	breadcrumbs: {
		name: string;
		path: string;
	}[];

	/**
	 * Optional right-side actions to render in the main layout header
	 */
	navbarActions?: React.ReactNode | null;
}

/**
 * Manage global application state including theme
 */
export class RootStore {
	private _store: RootStoreInterface = {
		isInitialized: false,
		breadcrumbs: [],
		navbarActions: null,
		theme: {
			name: "",
			description: "",
			variables: {
				backgroundColor: "",
				primaryColor: "",
				secondaryColor: "",
			},
			images: {
				app: "",
				logo: "",
				login: "",
				landing: "",
				workspace: "",
			},
			overrides: {
				"main-layout": {},
			},
			footer: "",
			landing: "",
			sidebar: {
				//workspaceAlias: "Workspace",
				headerItems: [],
				footerItems: [],
			},
			dialog: undefined,
			toolAutoExecutionLimit: 3,
			defaultRoomSettings: {
				model: undefined,
				temperature: TEMPERATURE,
				tokenLength: TOKEN_LENGTH,
			},
			defaultTools: [],
		},
	};

	constructor() {
		// If parsing fails, fall back to environment variables only
		if (NAME) {
			this._store.theme.name = NAME;
		}

		// merge with the environment variables
		try {
			const theme = JSON.parse(THEME) as Partial<ThemeMap["playground"]>;

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
	initialize = async (
		theme: Partial<ThemeMap["playground"]>,
	): Promise<void> => {
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
	private updateTheme = (theme: Partial<ThemeMap["playground"]>) => {
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
			footer: theme?.footer || this._store.theme.footer,
			landing: theme?.landing || this._store.theme.landing,
			sidebar: {
				...this._store.theme.sidebar,
				...(theme?.sidebar || {}),
			},
			dialog: theme?.dialog || this._store.theme.dialog,
			defaultRoomSettings: {
				...this._store.theme.defaultRoomSettings,
				...(theme?.defaultRoomSettings || {}),
			},
			toolAutoExecutionLimit:
				theme?.toolAutoExecutionLimit ||
				this._store.theme.toolAutoExecutionLimit,
			defaultTools: [
				...new Map(
					[
						...this._store.theme.defaultTools,
						...(theme?.defaultTools || []),
					].map((tool) => [tool.id, tool]),
				).values(),
			],
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
