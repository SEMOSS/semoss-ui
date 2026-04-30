import { configure, makeAutoObservable } from "mobx";
import type React from "react";
import type { ThemeMap } from "@semoss/shared";
import {
	IMAGE_GENERATION_FLAG,
	IMAGE_HEIGHT,
	IMAGE_WIDTH,
	MAX_TOKENS,
	TEMPERATURE,
	TEXT_GENERATION_FLAG,
} from "@/constants";

configure({
	enforceActions: "always",
});

const NAME = import.meta.env.VITE_NAME || "";
const THEME = import.meta.env.VITE_THEME || "{}";

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
			banner: "",
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
				tabIcon: "",
				workspace: "",
				loginDark: "",
				landingDark: "",
				workspaceDark: "",
				error: "",
				errorDark: "",
			},
			overrides: {
				"main-layout": {},
			},
			footer: "",
			landing: "",
			altLandingKey: "",
			altLanding: "",
			sidebar: {
				expandedByDefault: false,
				chatHistoryDate: false,
				headerItems: [],
				footerItems: [],
			},
			dialog: undefined,
			toolAutoExecutionLimit: null,
			defaultRoomSettings: {
				model: undefined,
				temperature: TEMPERATURE,
				max_tokens: MAX_TOKENS,
				imageHeight: IMAGE_HEIGHT,
				imageWidth: IMAGE_WIDTH,
				seed: undefined,
				"text-generation": TEXT_GENERATION_FLAG,
				"image-generation": IMAGE_GENERATION_FLAG,
			},
			allowedFileTypes: [],
			defaultTools: [],
			gracefulErrors: [],
			featureFlags: {
				// These will be the defaults, used when the user has no theme
				enableModelSelect: true,
				enableAgent: true,
				enableSuggestions: false,
				enablePlan: false,
				enableRewrite: true,
				enableImageGeneration: false,
				enablePromptOptimizer: true,
				enableDarkMode: true,
				hideToolsInIframe: false,
				enableKnowledgeMCP: true,
				allowEmbeddingOptions: true,
				showKnowledgeMenu: true,
				showToolboxMenu: true,
				showPlatformLinks: true,
			},
		},
	};

	constructor() {
		// If parsing fails, fall back to environment variables only
		if (NAME) {
			this._store.theme.name = NAME;
		}

		// merge with the environment variables
		try {
			const parsed = JSON.parse(THEME);
			// Support both wrapped ({ playground: {...} }) and flat formats
			const theme = (parsed?.playground || parsed) as Partial<
				ThemeMap["playground"]
			>;

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
	 * Get the current navbar actions
	 */
	get navbarActions() {
		return this._store.navbarActions;
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
	 * Set right-side navbar actions
	 */
	setNavbarActions = (actions: React.ReactNode | null) => {
		this._store.navbarActions = actions;
	};

	/**
	 * Clear right-side navbar actions
	 */
	clearNavbarActions = () => {
		this._store.navbarActions = null;
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
	private updateTheme = (theme: Partial<ThemeMap["playground"]> = {}) => {
		// Resolve featureFlags before building the merged theme. Several flags
		// were historically stored as top-level keys on the theme object; new
		// themes should put them inside featureFlags instead. Top-level values
		// are treated as migration fallbacks so old stored themes continue to
		// work — explicit featureFlags always wins over the promoted top-level value.
		//
		// The cast to `legacy` suppresses @deprecated hints: reading these fields
		// here is intentional — it's the one place responsible for the migration.
		const legacy = (theme ?? {}) as Record<string, unknown>;
		const resolvedFeatureFlags = {
			...this._store.theme.featureFlags,
			// Migrate top-level booleans for old stored themes
			...(legacy.hideToolsInIframe !== undefined
				? { hideToolsInIframe: legacy.hideToolsInIframe as boolean }
				: {}),
			...(legacy.enableKnowledgeMCP !== undefined
				? { enableKnowledgeMCP: legacy.enableKnowledgeMCP as boolean }
				: {}),
			...(legacy.allowEmbeddingOptions !== undefined
				? {
						allowEmbeddingOptions:
							legacy.allowEmbeddingOptions as boolean,
					}
				: {}),
			...(legacy.showKnowledgeMenu !== undefined
				? { showKnowledgeMenu: legacy.showKnowledgeMenu as boolean }
				: {}),
			...(legacy.showToolboxMenu !== undefined
				? { showToolboxMenu: legacy.showToolboxMenu as boolean }
				: {}),
			...(legacy.showPlatformLinks !== undefined
				? { showPlatformLinks: legacy.showPlatformLinks as boolean }
				: {}),
			// Explicit featureFlags take precedence over everything above
			...(theme?.featureFlags || {}),
		};

		// deep merge from the environment
		this._store.theme = {
			...this._store.theme,
			name: theme?.name || this._store.theme.name,
			banner: theme?.banner || this._store.theme.banner,
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
			altLandingKey:
				theme?.altLandingKey || this._store.theme.altLandingKey,
			altLanding: theme?.altLanding || this._store.theme.altLanding,
			sidebar: {
				...this._store.theme.sidebar,
				...(theme?.sidebar || {}),
				expandedByDefault:
					theme?.sidebar?.expandedByDefault !== undefined
						? theme.sidebar.expandedByDefault
						: this._store.theme.sidebar.expandedByDefault,
				chatHistoryDate:
					theme?.sidebar?.chatHistoryDate !== undefined
						? theme.sidebar.chatHistoryDate
						: this._store.theme.sidebar.chatHistoryDate,
				headerItems: [
					...this._store.theme.sidebar.headerItems,
					...(theme?.sidebar?.headerItems || []),
				],
				footerItems: [
					...this._store.theme.sidebar.footerItems,
					...(theme?.sidebar?.footerItems || []),
				],
			},
			dialog: theme?.dialog || this._store.theme.dialog,
			defaultRoomSettings: {
				...this._store.theme.defaultRoomSettings,
				...(theme?.defaultRoomSettings || {}),
			},
			toolAutoExecutionLimit:
				theme?.toolAutoExecutionLimit ||
				this._store.theme.toolAutoExecutionLimit,
			allowedFileTypes:
				theme?.allowedFileTypes ||
				this._store.theme.allowedFileTypes ||
				[],
			defaultEmbedderId:
				theme?.defaultEmbedderId || this._store.theme.defaultEmbedderId,
			defaultTools: [
				...new Map(
					[
						...this._store.theme.defaultTools,
						...(theme?.defaultTools || []),
					].map((tool) => [tool.id, tool]),
				).values(),
			],
			gracefulErrors: [
				...this._store.theme.gracefulErrors,
				...(theme?.gracefulErrors || []),
			],
			tour: theme?.tour || this._store.theme.tour,
			featureFlags: resolvedFeatureFlags,
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
