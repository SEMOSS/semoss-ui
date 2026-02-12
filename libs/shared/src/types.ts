export interface Engine {
	app_id: string;
	app_name: string;
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

		uploadedFiles?: string[];
	};
}
