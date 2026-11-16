import type { ThemeMap } from "@semoss/shared";

/** The chat theme, with every default filled in. */
export type ChatTheme = ThemeMap["playground"];

/** The chat theme's defaults, used for anything a theme leaves out. */
export const DEFAULT_CHAT_THEME: ChatTheme = {
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
export const mergeChatTheme = (
	base: ChatTheme,
	theme: Partial<ChatTheme> = {},
): ChatTheme => {
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
