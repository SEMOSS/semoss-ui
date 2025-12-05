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

interface RootStoreInterface {
	/**
	 * Track if the store is initialized
	 */
	isInitialized: boolean;

	/**
	 * Current theme setting
	 */
	theme: Theme;
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
			variables: {
				backgroundColor: "",
				primaryColor: "",
				secondaryColor: "",
			},
			images: {
				logo: "",
				defaultWorkspace: "",
				appName: "",
			},
			overrides: {
				"main-layout": {},
			},
			playground: {
				playgroundSidebar: [],
				playgroundSecondarySidebar: [],
				playgroundModelRequest: {
					label: "",
					url: "",
				},
				playgroundBanner: "",
				playgroundHeader: "",
				playgroundFooter: "",
				playgroundModal: {
					header: "",
					message: "",
				},
			},
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
	 * Set the default theme
	 */
	initialize = async (theme: Partial<Theme>): Promise<void> => {
		this.updateTheme(theme);

		runInAction(() => {
			this._store.isInitialized = true;
		});
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
			// additional playground fields
			elsaSidebar: theme?.elsaSidebar || this._store.theme.elsaSidebar,
			playground: {
				images: {
					...this._store.theme?.playground?.images,
					...(theme?.playground?.images || {}),
				},
				playgroundSidebar: Array.isArray(
					theme?.playground?.playgroundSidebar,
				)
					? theme.playground?.playgroundSidebar
					: Array.isArray(this._store.theme.playgroundSidebar)
						? this._store.theme.playgroundSidebar
						: [],
				playgroundSecondarySidebar: Array.isArray(
					theme?.playground?.playgroundSecondarySidebar,
				)
					? theme.playground?.playgroundSecondarySidebar
					: Array.isArray(
								this._store.theme.playground
									.playgroundSecondarySidebar,
							)
						? this._store.theme.playground
								.playgroundSecondarySidebar
						: [],
				playgroundModelRequest: {
					...this._store.theme.playground.playgroundModelRequest,
					...(theme?.playground?.playgroundModelRequest || {}),
				},
				playgroundBanner:
					typeof theme?.playground?.playgroundBanner === "string"
						? theme.playground?.playgroundBanner
						: typeof this._store.theme.playgroundBanner === "string"
							? this._store.theme.playgroundBanner
							: "",

				playgroundHeader:
					typeof theme?.playground?.playgroundHeader === "string"
						? theme.playground?.playgroundHeader
						: typeof this._store.theme.playgroundHeader === "string"
							? this._store.theme.playgroundHeader
							: "",
				playgroundFooter:
					typeof theme?.playground?.playgroundFooter === "string"
						? theme.playground?.playgroundFooter
						: typeof this._store.theme.playgroundFooter === "string"
							? this._store.theme.playgroundFooter
							: "",
				playgroundModal:
					theme?.playground?.playgroundModal &&
					typeof theme.playground.playgroundModal === "object" &&
					typeof theme.playground.playgroundModal.message ===
						"string" &&
					typeof theme.playground.playgroundModal.header === "string"
						? {
								message:
									theme.playground.playgroundModal.message,
								header: theme.playground.playgroundModal.header,
							}
						: this._store.theme.playground.playgroundModal &&
								typeof this._store.theme.playground
									.playgroundModal.message === "string" &&
								typeof this._store.theme.playground
									.playgroundModal.header === "string"
							? {
									message:
										this._store.theme.playground
											.playgroundModal.message,
									header: this._store.theme.playground
										.playgroundModal.header,
								}
							: {
									message: "",
									header: "",
								},
			},
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
