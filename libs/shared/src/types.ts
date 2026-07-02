export interface Engine {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type:
		| "MODEL"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "VECTOR"
		| "GUARDRAIL";
	engine_subtype?: string;
	engine_favorite?: number;
	engine_global?: boolean;
	engine_discoverable?: boolean;
	engine_user_permission?: number;
	engine_group_permission?: number;
	engine_date_created?: string;
	engine_date_last_edited?: string;
	engine_cost?: string;
	low_engine_name?: string;
	description?: string;
	tag?: string;

	/** @deprecated legacy keys from MyEngines */
	app_id?: string;
	/** @deprecated legacy keys from MyEngines */
	app_name?: string;
	/** @deprecated legacy keys from MyEngines */
	app_type?:
		| "MODEL"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "VECTOR"
		| "GUARDRAIL";
}

export interface Project {
	project_id: string;
	project_name: string;
	project_display_name?: string;
	project_type: "SKILL" | "WORKSPACE" | "BLOCKS" | "CODE" | "INSIGHT";
	project_cost?: string;
	project_global?: string;
	project_created_by?: string;
	project_created_by_type?: string;
	project_date_created?: string;
	project_date_last_edited?: string;
	/** @deprecated  */
	project_has_portal?: boolean;
	/** @deprecated  */
	project_portal_name?: string;
	/** @deprecated  */
	project_portal_published_date?: string;
	project_published_user?: string;
	project_published_user_type?: string;
	project_reactors_compiled_date?: string;
	project_reactors_compiled_user?: string;
	project_reactors_compiled_user_type?: string;
	project_favorite?: string;
	user_permission?: number;
	group_permission?: string;
	"data classification"?: string[];
	"data restrictions"?: string[];
	tag?: string | string[];
	description?: string;
}

export interface App {
	project_id: string;
	project_name: string;
	project_display_name?: string;
	description?: string;
	user_permission?: number;
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

		/**
		 * Optional disclaimer shown in the file drag overlay.
		 * When omitted, the description is hidden entirely.
		 */
		fileDragDisclaimer?: string;

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
				tooltip?: string;
			}[];
			footerItems: {
				name: string;
				icon: string;
				path: string;
				url: string;
				embed: boolean;
				tooltip?: string;
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
			tokenLength?: number;
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
		 * Additional URL prefixes (e.g. custom protocols) allowed in markdown link rendering.
		 * Defaults to ["docubridge://"].
		 */
		allowedUrlPrefixes?: string[];

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
			/** Whether to enable the server-side agent harness mode (RunAgent) in the chat input. */
			enableAgentHarness?: boolean;
			enableRewrite?: boolean;
			enableDarkMode?: boolean;
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
			/** Whether to show the Activity Log (audit logs) option in the room menu. Defaults to true. */
			showActivityLog?: boolean;
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

export interface MCP {
	/** Type of the mcp */
	type: "PROJECT" | "STORAGE" | "DATABASE" | "FUNCTION" | "MODEL" | "VECTOR";
	/** Id of the mcp */
	id: string;
	/** Name of the mcp */
	name: string;
	/** Engine subtype (e.g. POSTGRES, OPEN_AI) */
	subtype?: string;
	/** Description of the mcp */
	description?: string;
	/** Tags of the mcp */
	tags: string[];
	permission: "READ_ONLY" | "EDIT" | "OWNER";
}

export type MCPConfig = Pick<MCP, "type" | "id" | "name"> & {
	/** Flag to indicate if this MCP comes from a workspace */
	fromWorkspace?: boolean;
};

export interface Skill {
	/** Id of the skill (project id) */
	id: string;
	/** Display name of the skill */
	name: string;
	/** Type discriminator — always SKILL */
	type: "SKILL";
	/** URL-friendly identifier */
	slug: string;
}

/**
 * The shape carried in form state and selectors. Mirrors MCPConfig — the
 * name travels with the value so selectors can render chips without a
 * separate lookup. Reduced to IDs only at the EditWorkspace/AddWorkspace
 * pixel boundary.
 */
export type SkillConfig = Pick<Skill, "id" | "name">;

export interface ProjectDependency {
	engine_type:
		| "PROJECT"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "MODEL"
		| "VECTOR";
	engine_id: string;
	engine_name: string;
	engine_subtype?: string;
	description?: string;
	engine_discoverable?: boolean;
	permission_name?: "READ_ONLY" | "EDIT" | "OWNER";
	engine_global?: boolean;
	access_permission?: number;
	tags?: string;
	can_view_dependencies?: boolean;
}

export interface Prompt {
	id: string;
	createdBy: string;
	dateCreated: string;
	version: number;
	intent: string;
	title: string;
	context: string;
	tags: string[];
	global: boolean;
}
