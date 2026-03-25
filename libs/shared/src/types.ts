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
			expandedByDefault?: boolean;
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
