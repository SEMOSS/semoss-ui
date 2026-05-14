export interface Engine {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
	engine_subtype?: string;
	engine_favorite?: number;
	engine_global?: boolean;
	engine_discoverable?: boolean;
	engine_user_permission?: number;
	engine_group_permission?: number;
	engine_date_created?: string;
	engine_cost?: string;
	low_engine_name?: string;
	description?: string;
	tag?: string | string[];
	tags?: string | string[];

	/** @deprecated legacy keys from MyEngines */
	app_id?: string;
	/** @deprecated legacy keys from MyEngines */
	app_name?: string;
	/** @deprecated legacy keys from MyEngines */
	app_type?: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
}

export interface App {
	project_id: string;
	project_name: string;
	description?: string;
}

/**
 * Theme object returned from the backend
 */
export interface ThemeMap {
	playground: {
		/** Name of the app */
		name: string;

		banner: string;

		/** Description of the app */
		description: string;

		/** Styles of the app */
		variables: {
			backgroundColor: string;
			primaryColor: string;
			secondaryColor: string;
		};

		/** Images throughout app */
		images: {
			app: string;
			logo: string;
			login: string;
			landing: string;
			tabIcon: string;
			workspace: string;
			loginDark: string;
			landingDark: string;
			workspaceDark: string;
			error: string;
			errorDark: string;
		};

		/**
		 * Custom CSS to override default styles
		 */
		overrides: {
			"main-layout": React.CSSProperties;
		};

		/**
		 * HTML content tos how in the footer
		 */
		footer: string;

		/**
		 * HTML Content to show on the landing page
		 */
		landing: string;

		/**
		 * Alternate HTML content to show on the landing page
		 */
		altLanding?: string;

		/**
		 * URL search param key that triggers altLanding (e.g. "appt" matches ?appt in the URL)
		 */
		altLandingKey?: string;

		/**
		 * Content to show in the sidebar
		 */
		sidebar: {
			expandedByDefault: boolean;
			chatHistoryDate: boolean;
			headerItems: {
				name: string;
				icon: string;
				path: string;
				url: string;
				embed: boolean;
			}[];
			footerItems: {
				name: string;
				icon: string;
				path: string;
				url: string;
				embed: boolean;
			}[];
		};

		/**
		 * Content to show in the dialog
		 */
		dialog?: {
			key: string;
			title: string;
			content: string;
		};

		/**
		 * The default settings for new rooms
		 */
		defaultRoomSettings?: {
			model?: Engine;
			temperature?: number;
			max_tokens?: number;
			imageHeight?: number;
			imageWidth?: number;
			seed?: number;
			"text-generation"?: boolean;
			"image-generation"?: boolean;
		};

		/**
		 * The number of tools that should be auto-executed at once
		 */
		toolAutoExecutionLimit?: number | null;

		/**
		 * The uploaded files that should be added to the file tool in the room
		 */
		allowedFileTypes?: string[];

		/**
		 * Default embedding engine UUID to use when allowEmbeddingOptions is false.
		 */
		defaultEmbedderId?: string;

		/**
		 * Default tools to show in the room
		 */
		defaultTools: {
			/** Type of the mcp */
			type:
				| "PROJECT"
				| "STORAGE"
				| "DATABASE"
				| "FUNCTION"
				| "MODEL"
				| "VECTOR";

			/** Id of the mcp */
			id: string;

			/** Name of the mcp */
			name: string;
		}[];

		/**
		 * Optional tour customization. When present, custom steps are appended
		 * to the built-in tour steps. Each step targets a sidebar headerItem by
		 * its `path` value — the nav element must be visible for the spotlight to
		 * work. Steps are omitted entirely when this field is absent.
		 */
		tour?: {
			/**
			 * Master switch for the tour. Set to false to disable the tour
			 * entirely — it will never auto-launch and cannot be triggered
			 * manually. Defaults to true when omitted.
			 */
			show?: boolean;
			/**
			 * Built-in step targets to remove from the tour.
			 * Use the `target` string of the step you want to hide:
			 *   "welcome"          — the opening welcome card (no spotlight)
			 *   "tour-input"       — the chat input step
			 *   "tour-input-menu"  — the attach & configure step
			 *   "tour-new-chat"    — the new chat sidebar button
			 *   "tour-agents"      — the agents sidebar button
			 * Steps not listed here are shown as normal.
			 */
			excludedSteps?: string[];
			customSteps?: {
				/**
				 * Must match the `path` of a sidebar.headerItems entry.
				 * The nav element is targeted via data-tour="nav-{navItemPath}".
				 */
				navItemPath: string;
				/** Heading shown in the tour card */
				title: string;
				/** Body text shown in the tour card */
				content: string;
				/** Card placement relative to the highlighted element */
				placement?: "top" | "bottom" | "left" | "right";
			}[];
			/**
			 * Same shape as customSteps but inserted AFTER the Search
			 * step instead of after New Chat. Use this for footer-area items
			 * (e.g. Support, Bug Report).
			 */
			trailingCustomSteps?: {
				navItemPath: string;
				title: string;
				content: string;
				placement?: "top" | "bottom" | "left" | "right";
			}[];
			/**
			 * Override the title and/or content of any built-in step.
			 * Keys are the step's `target` string (or "welcome" for the
			 * opening card). Only the fields you provide are replaced.
			 *
			 * Example:
			 *   "stepOverrides": {
			 *     "welcome":        { "title": "Hi there!", "content": "..." },
			 *     "tour-new-chat":  { "content": "Start a fresh conversation." }
			 *   }
			 */
			stepOverrides?: Record<
				string,
				{ title?: string; content?: string }
			>;
		};

		/**
		 * Graceful error messages to show in the UI
		 */
		gracefulErrors: (
			| {
					pattern: string;
					errorKey: string;
			  }
			| {
					pattern: string;
					text: string;
			  }
		)[];

		/**
		 * Feature flags to enable/disable features in the UI. The keys are the names of the features, and the values are booleans indicating whether the feature is enabled or disabled.
		 */
		featureFlags?: {
			enableModelSelect?: boolean;
			enableAgent?: boolean;
			enableSuggestions?: boolean;
			enablePlan?: boolean;
			enableRewrite?: boolean;
			enableDarkMode?: boolean;
			enableImageGeneration?: boolean;
			enablePromptOptimizer?: boolean;
			/** Whether to hide tools when the app is rendered inside an iframe. */
			hideToolsInIframe?: boolean;
			/** Whether to run MakeEngineMCP after creating a new knowledge source. Defaults to true. */
			enableKnowledgeMCP?: boolean;
			/** Whether to show the embedding model selector in the new knowledge form. Defaults to true. */
			allowEmbeddingOptions?: boolean;
			/** Whether to show the Knowledge library picker in the chat input menu. Defaults to true. */
			showKnowledgeMenu?: boolean;
			/** Whether to show the Toolbox picker in the chat input menu. Defaults to true. */
			showToolboxMenu?: boolean;
			/** Whether to show external links to the SEMOSS platform. Defaults to true. */
			showPlatformLinks?: boolean;
			/** Whether to show a text input for feedback comments when rating a response. Defaults to false. */
			enableFeedbackText?: boolean;
		};
	};
}

export type Role = "OWNER" | "EDIT" | "READ_ONLY";

/**
 * User permission entry for adding/editing permissions
 */
export interface PostUser {
	userid: string;
	permission: Role;
}

/**
 * User details with permission information
 */
export interface User {
	date_added?: string;
	name: string;
	permission: Role;
	id: string;
	type?: string;
	email?: string;
}

/**
 * User access request for approval
 */
export interface UserAccessRequest {
	id: string;
	permission: Role;
}
