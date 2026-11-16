import type { ThemeMap } from "@semoss/shared";
import { isRecord } from "@semoss/utility/object";

/** The playground's theme, with every default filled in. */
export type PlaygroundTheme = ThemeMap["playground"];

const NAME = import.meta.env.VITE_NAME || "";
const THEME = import.meta.env.VITE_THEME || "{}";

/** The playground's defaults, used for anything a theme leaves out. */
const DEFAULT_THEME: PlaygroundTheme = {
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
		appDark: "",
		logoDark: "",
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
		// the navigation collapses completely, so it starts open
		expandedByDefault: true,
		chatHistoryDate: false,
		headerItems: [],
		footerItems: [],
	},
	dialog: undefined,
	toolAutoExecutionLimit: null,
	defaultRoomSettings: {
		model: undefined,
	},
	allowedFileTypes: [],
	allowedUrlPrefixes: [],
	defaultTools: [],
	gracefulErrors: [],
	featureFlags: {
		// These will be the defaults, used when the user has no theme
		enableModelSelect: true,
		enableAgent: true,
		enableSuggestions: true,
		enableAgentHarness: false,
		modeFollowsAgent: false,
		enableRewrite: true,
		enablePromptOptimizer: true,
		enableDarkMode: true,
		hideToolsInIframe: false,
		hideChatHistory: false,
		enableKnowledgeMCP: true,
		allowEmbeddingOptions: true,
		showActivityLog: true,
		showPlatformLinks: true,
		enableFeedbackText: true,
		enableTemperature: false,
	},
};

/**
 * Lay a theme over a base theme. Several feature flags were once stored as
 * top-level keys; they are read as fallbacks, and an explicit `featureFlags`
 * value always wins.
 *
 * @param base - The theme to fill gaps from.
 * @param theme - The theme to apply.
 * @returns A new theme; neither input changes.
 */
export const mergePlaygroundTheme = (
	base: PlaygroundTheme,
	theme: Partial<PlaygroundTheme> = {},
): PlaygroundTheme => {
	// The cast to `legacy` suppresses @deprecated hints: reading these fields
	// here is intentional — it's the one place responsible for the migration.
	const legacy = (theme ?? {}) as Record<string, unknown>;
	const resolvedFeatureFlags = {
		...base.featureFlags,
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
		...(legacy.showPlatformLinks !== undefined
			? { showPlatformLinks: legacy.showPlatformLinks as boolean }
			: {}),
		// Explicit featureFlags take precedence over everything above
		...(theme?.featureFlags || {}),
	};

	// deep merge onto the base
	return {
		...base,
		name: theme?.name || base.name,
		banner: theme?.banner || base.banner,
		bannerBackgroundColor:
			theme?.bannerBackgroundColor ?? base.bannerBackgroundColor,
		bannerTextColor: theme?.bannerTextColor ?? base.bannerTextColor,
		description: theme?.description || base.description,
		fileDragDisclaimer:
			theme?.fileDragDisclaimer ?? base.fileDragDisclaimer,
		variables: {
			...base.variables,
			...(theme?.variables || {}),
		},
		images: {
			...base.images,
			...(theme?.images || {}),
		},
		overrides: {
			...base.overrides,
			...(theme?.overrides || {}),
		},
		footer: theme?.footer || base.footer,
		landing: theme?.landing || base.landing,
		altLandingKey: theme?.altLandingKey || base.altLandingKey,
		altLanding: theme?.altLanding || base.altLanding,
		sidebar: {
			...base.sidebar,
			...(theme?.sidebar || {}),
			expandedByDefault:
				theme?.sidebar?.expandedByDefault !== undefined
					? theme.sidebar.expandedByDefault
					: base.sidebar.expandedByDefault,
			chatHistoryDate:
				theme?.sidebar?.chatHistoryDate !== undefined
					? theme.sidebar.chatHistoryDate
					: base.sidebar.chatHistoryDate,
			headerItems: [
				...base.sidebar.headerItems,
				...(theme?.sidebar?.headerItems || []),
			],
			footerItems: [
				...base.sidebar.footerItems,
				...(theme?.sidebar?.footerItems || []),
			],
		},
		dialog: theme?.dialog || base.dialog,
		defaultRoomSettings: {
			...base.defaultRoomSettings,
			...(theme?.defaultRoomSettings || {}),
		},
		toolAutoExecutionLimit:
			theme?.toolAutoExecutionLimit || base.toolAutoExecutionLimit,
		defaultCompactionStrategy:
			theme?.defaultCompactionStrategy ?? base.defaultCompactionStrategy,
		allowedFileTypes:
			theme?.allowedFileTypes || base.allowedFileTypes || [],
		allowedUrlPrefixes:
			theme?.allowedUrlPrefixes || base.allowedUrlPrefixes,
		defaultEmbedderId: theme?.defaultEmbedderId || base.defaultEmbedderId,
		defaultTools: [
			...new Map(
				[...base.defaultTools, ...(theme?.defaultTools || [])].map(
					(tool) => [tool.id, tool],
				),
			).values(),
		],
		gracefulErrors: [
			...base.gracefulErrors,
			...(theme?.gracefulErrors || []),
		],
		tour: theme?.tour || base.tour,
		featureFlags: resolvedFeatureFlags,
	};
};

/**
 * Read the build's theme: `VITE_NAME`, then `VITE_THEME` (wrapped as
 * `{ playground: {...} }` or flat) over the defaults.
 *
 * @returns The build's theme.
 */
const readEnvTheme = (): PlaygroundTheme => {
	const base = NAME ? { ...DEFAULT_THEME, name: NAME } : DEFAULT_THEME;
	try {
		const parsed: unknown = JSON.parse(THEME);
		// both wrapped and flat build themes are supported
		const theme =
			isRecord(parsed) && isRecord(parsed.playground)
				? parsed.playground
				: parsed;
		return isRecord(theme)
			? mergePlaygroundTheme(base, theme as Partial<PlaygroundTheme>)
			: base;
	} catch {
		// a malformed build theme keeps the defaults
		return base;
	}
};

/** The build's theme, read once: the base for every server theme. */
const ENV_THEME = readEnvTheme();

/** One merged theme per server theme, so a selector returns the same object. */
const themeCache = new WeakMap<Record<string, unknown>, PlaygroundTheme>();

/**
 * Lay the playground's defaults and the build's theme under the server's.
 *
 * @param serverTheme - The server's parsed `THEME_MAP` (`useConfig`'s
 * `theme`), or null when it has none.
 * @returns The playground's theme. The same server theme always returns the
 * same object.
 */
export const withPlaygroundDefaults = (
	serverTheme: Record<string, unknown> | null,
): PlaygroundTheme => {
	if (!serverTheme || !isRecord(serverTheme.playground)) {
		return ENV_THEME;
	}
	const cached = themeCache.get(serverTheme);
	if (cached) {
		return cached;
	}
	const theme = mergePlaygroundTheme(
		ENV_THEME,
		serverTheme.playground as Partial<PlaygroundTheme>,
	);
	themeCache.set(serverTheme, theme);
	return theme;
};

/**
 * Apply the theme's colors to the document root.
 *
 * @param theme - The theme to apply.
 */
export const applyPlaygroundThemeVariables = (theme: PlaygroundTheme): void => {
	const root = document.documentElement;
	if (theme.variables.backgroundColor) {
		root.style.setProperty("--background", theme.variables.backgroundColor);
	}

	if (theme.variables.primaryColor) {
		root.style.setProperty("--primary", theme.variables.primaryColor);
	}

	if (theme.variables.secondaryColor) {
		root.style.setProperty("--secondary", theme.variables.secondaryColor);
	}
};
