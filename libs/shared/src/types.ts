export interface Engine {
	app_id: string;
	app_name: string;
	engine_display_name?: string;
	app_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
	description?: string;
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
		 * Content to show in the sidebar
		 */
		sidebar: {
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
			tokenLength?: number;
		};

		/**
		 * The number of tools that should be auto-executed at once
		 */
		toolAutoExecutionLimit?: number;

		/**
		 * The uploaded files that should be added to the file tool in the room
		 */
		allowedFileTypes?: string[];

		/**
		 * Whether to run MakeEngineMCP after creating a new knowledge source.
		 * Defaults to true when not set.
		 */
		enableKnowledgeMCP?: boolean;

		/**
		 * Default embedding engine UUID to use when allowEmbeddingOptions is false.
		 */
		defaultEmbedderId?: string;

		/**
		 * Whether to show the embedding model selector in the new knowledge form.
		 * Defaults to true when not set.
		 */
		allowEmbeddingOptions?: boolean;

		/**
		 * Whether to show the Knowledge library picker in the chat input menu.
		 * Defaults to true when not set.
		 */
		showKnowledgeMenu?: boolean;

		/**
		 * Whether to show the Toolbox picker in the chat input menu.
		 * Defaults to true when not set.
		 */
		showToolboxMenu?: boolean;

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
		 * When false, hides external links that navigate users to the SEMOSS platform.
		 * Defaults to true (links shown).
		 */
		showPlatformLinks?: boolean;

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
			 * Same shape as customSteps but inserted AFTER the Chat History
			 * step instead of after Search. Use this for footer-area items
			 * (e.g. Support, Bug Report).
			 */
			trailingCustomSteps?: {
				navItemPath: string;
				title: string;
				content: string;
				placement?: "top" | "bottom" | "left" | "right";
			}[];
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
