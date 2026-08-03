import type React from "react";
import { createStore } from "zustand/vanilla";
import type { ThemeMap } from "@semoss/shared";

const NAME = import.meta.env.VITE_NAME || "";
const THEME = import.meta.env.VITE_THEME || "{}";

const DEFAULT_THEME: ThemeMap["playground"] = {
	name: "",
	banner: "",
	description: "",
	variables: { backgroundColor: "", primaryColor: "", secondaryColor: "" },
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
	overrides: { "main-layout": {} },
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
	defaultRoomSettings: { model: undefined },
	allowedFileTypes: [],
	allowedUrlPrefixes: [],
	defaultTools: [],
	gracefulErrors: [],
	featureFlags: {
		enableModelSelect: true,
		enableAgent: true,
		enableSuggestions: false,
		enableAgentHarness: false,
		enableRewrite: true,
		enablePromptOptimizer: true,
		enableDarkMode: true,
		hideToolsInIframe: false,
		enableKnowledgeMCP: true,
		allowEmbeddingOptions: true,
		showKnowledgeMenu: true,
		showToolboxMenu: true,
		showActivityLog: true,
		showPlatformLinks: true,
		enableFeedbackText: true,
	},
};

export interface RootState {
	isInitialized: boolean;
	theme: ThemeMap["playground"];
	breadcrumbs: { name: string; path: string }[];
	navbarActions: React.ReactNode | null;
	/** Actions */
	initialize: (theme: Partial<ThemeMap["playground"]>) => Promise<void>;
	setBreadcrumbs: (breadcrumbs: { name: string; path: string }[]) => void;
	clearBreadcrumbs: () => void;
	setNavbarActions: (actions: React.ReactNode | null) => void;
	clearNavbarActions: () => void;
}

function applyThemeToDom(theme: ThemeMap["playground"]) {
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
}

function mergeTheme(
	current: ThemeMap["playground"],
	incoming: Partial<ThemeMap["playground"]> = {},
): ThemeMap["playground"] {
	const legacy = (incoming ?? {}) as Record<string, unknown>;
	const resolvedFeatureFlags = {
		...current.featureFlags,
		...(legacy.hideToolsInIframe !== undefined
			? { hideToolsInIframe: legacy.hideToolsInIframe as boolean }
			: {}),
		...(legacy.enableKnowledgeMCP !== undefined
			? { enableKnowledgeMCP: legacy.enableKnowledgeMCP as boolean }
			: {}),
		...(legacy.allowEmbeddingOptions !== undefined
			? { allowEmbeddingOptions: legacy.allowEmbeddingOptions as boolean }
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
		...(incoming?.featureFlags || {}),
	};

	return {
		...current,
		name: incoming?.name || current.name,
		banner: incoming?.banner || current.banner,
		description: incoming?.description || current.description,
		fileDragDisclaimer:
			incoming?.fileDragDisclaimer ?? current.fileDragDisclaimer,
		variables: { ...current.variables, ...(incoming?.variables || {}) },
		images: { ...current.images, ...(incoming?.images || {}) },
		overrides: { ...current.overrides, ...(incoming?.overrides || {}) },
		footer: incoming?.footer || current.footer,
		landing: incoming?.landing || current.landing,
		altLandingKey: incoming?.altLandingKey || current.altLandingKey,
		altLanding: incoming?.altLanding || current.altLanding,
		sidebar: {
			...current.sidebar,
			...(incoming?.sidebar || {}),
			expandedByDefault:
				incoming?.sidebar?.expandedByDefault !== undefined
					? incoming.sidebar.expandedByDefault
					: current.sidebar.expandedByDefault,
			chatHistoryDate:
				incoming?.sidebar?.chatHistoryDate !== undefined
					? incoming.sidebar.chatHistoryDate
					: current.sidebar.chatHistoryDate,
			headerItems: [
				...current.sidebar.headerItems,
				...(incoming?.sidebar?.headerItems || []),
			],
			footerItems: [
				...current.sidebar.footerItems,
				...(incoming?.sidebar?.footerItems || []),
			],
		},
		dialog: incoming?.dialog || current.dialog,
		defaultRoomSettings: {
			...current.defaultRoomSettings,
			...(incoming?.defaultRoomSettings || {}),
		},
		toolAutoExecutionLimit:
			incoming?.toolAutoExecutionLimit || current.toolAutoExecutionLimit,
		allowedFileTypes:
			incoming?.allowedFileTypes || current.allowedFileTypes || [],
		allowedUrlPrefixes:
			incoming?.allowedUrlPrefixes || current.allowedUrlPrefixes,
		defaultEmbedderId:
			incoming?.defaultEmbedderId || current.defaultEmbedderId,
		defaultTools: [
			...new Map(
				[
					...current.defaultTools,
					...(incoming?.defaultTools || []),
				].map((tool) => [tool.id, tool]),
			).values(),
		],
		gracefulErrors: [
			...current.gracefulErrors,
			...(incoming?.gracefulErrors || []),
		],
		tour: incoming?.tour || current.tour,
		featureFlags: resolvedFeatureFlags,
	};
}

function buildInitialTheme(): ThemeMap["playground"] {
	let theme = { ...DEFAULT_THEME };
	if (NAME) theme.name = NAME;
	try {
		const parsed = JSON.parse(THEME);
		const env = (parsed?.playground || parsed) as Partial<
			ThemeMap["playground"]
		>;
		theme = mergeTheme(theme, env);
	} catch {
		// noop
	}
	return theme;
}

export const createRootStore = () =>
	createStore<RootState>()((set, get) => ({
		isInitialized: false,
		theme: buildInitialTheme(),
		breadcrumbs: [],
		navbarActions: null,

		initialize: async (incoming: Partial<ThemeMap["playground"]>) => {
			const newTheme = mergeTheme(get().theme, incoming);
			applyThemeToDom(newTheme);
			set({ theme: newTheme, isInitialized: true });
		},

		setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
		clearBreadcrumbs: () => set({ breadcrumbs: [] }),
		setNavbarActions: (navbarActions) => set({ navbarActions }),
		clearNavbarActions: () => set({ navbarActions: null }),
	}));

export type RootStore = ReturnType<typeof createRootStore>;
