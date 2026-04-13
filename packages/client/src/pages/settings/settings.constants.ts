import {
	mdiAccountGroup,
	// mdiTextBoxMultipleOutline,
	mdiArchive,
	// mdiClock,
	mdiChatProcessingOutline,
	mdiClipboardTextOutline,
	mdiCog,
	mdiDatabase,
	mdiDatabaseSearch,
	mdiPalette,
	mdiTabletCellphone,
} from "@mdi/js";

console.log(mdiPalette);

export const SETTINGS_ROUTES: {
	/*** Title of the page */
	title: string;
	/** Relative path to navigate to the page */
	path: string;
	/** Description of the page */
	description: string;

	/** Description of the  page if admin */
	adminDescription?: string;

	/** Icon representing the page */
	icon: string;

	/** Prior Links to nav to */
	history?: string[];

	admin?: boolean;
	hidden?: boolean;
}[] = [
	{
		title: "Settings",
		path: "",
		description: "View and make changes to settings to engines and apps",
		adminDescription:
			"View and make changes to settings to engines and apps. As an admin, view and manage platform settings.",
		icon: mdiCog,
		history: [],
	},
	{
		title: "App Settings",
		path: "app",
		description: "View and edit settings for apps",
		icon: mdiClipboardTextOutline,
		history: ["app"],
	},
	{
		title: "App Settings",
		path: "app/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the app",
		icon: mdiClipboardTextOutline,
		history: ["app", "app/<id>"],
	},
	{
		title: "Database Settings",
		path: "database",
		description: "View and edit settings for databases",
		icon: mdiDatabase,
		history: ["database"],
	},
	{
		title: "Database Settings",
		path: "database/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the database",
		icon: mdiDatabase,
		history: ["database", "database/<id>"],
	},
	{
		title: "Function Settings",
		path: "function",
		description: "View and edit settings for functions",
		icon: mdiDatabase,
		history: ["function"],
	},
	{
		title: "Function Settings",
		path: "function/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the function",
		icon: mdiDatabase,
		history: ["function", "function/<id>"],
	},
	{
		title: "Guardrail Settings",
		path: "guardrail",
		description: "View and edit settings for guardrails",
		icon: mdiDatabase,
		history: ["guardrail"],
	},
	{
		title: "Guardrail Settings",
		path: "guardrail/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the guardrail",
		icon: mdiDatabase,
		history: ["guardrail", "guardrail/<id>"],
	},
	{
		title: "Model Settings",
		path: "model",
		description: "View and edit settings for models",
		icon: mdiDatabase,
		history: ["model"],
	},
	{
		title: "Model Settings",
		path: "model/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the model",
		icon: mdiDatabase,
		history: ["model", "model/<id>"],
	},
	{
		title: "Storage Settings",
		path: "storage",
		description: "View and edit settings for storages",
		icon: mdiArchive,
		history: ["storage"],
	},
	{
		title: "Storage Settings",
		path: "storage/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the storage",
		icon: mdiArchive,
		history: ["storage", "storage/<id>"],
	},
	{
		title: "Vector Settings",
		path: "vector",
		description: "View and edit settings for vector databases",
		icon: mdiDatabase,
		history: ["vector"],
	},
	{
		title: "Vector Settings",
		path: "vector/:id",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the vector database",
		icon: mdiDatabase,
		history: ["vector", "vector/<id>"],
	},
	{
		title: "Insight Settings",
		path: "insight",
		description: "View and edit settings for app insights",
		icon: mdiClipboardTextOutline,
		history: ["insight"],
		hidden: true,
	},
	{
		title: "Insight Settings",
		path: "insight/:id/:projectId",
		description:
			"View member permissions, pending requests, and all other viewable settings pertaining to the app",
		icon: mdiClipboardTextOutline,
		history: ["insight", "insight/<id>/<projectId>"],
		hidden: true,
	},
	{
		title: "Jobs",
		path: "jobs",
		description: "Search by job name or filter using job tags",
		icon: mdiTabletCellphone,
		history: ["settings/"],
		admin: true,
	},
	{
		title: "Member Settings",
		path: "members",
		description:
			"Add new members, reset passwords, and edit member-based permissions.",
		icon: mdiAccountGroup,
		history: ["settings/"],
		admin: true,
	},
	{
		title: "Team Permissions",
		path: "team-permissions",
		description: "View and edit permissions for teams",
		icon: mdiDatabase,
		history: ["team-permissions"],
		admin: true,
	},
	{
		title: "Team Permissions",
		path: "team-permissions/:type/:id",
		description:
			"View team permissions and members assigned to custom teams",
		icon: mdiDatabase,
		history: ["team-permissions", "team-permissions/<type>/<id>"],
		admin: true,
	},
	{
		title: "Configuration",
		path: "social-properties",
		description: "Use this portal to change login configuration settings.",
		icon: mdiTabletCellphone,
		history: ["settings/"],
		admin: true,
	},
	{
		title: "Admin Query",
		path: "admin-query",
		description: "Query the platform databases directly. Use with caution.",
		icon: mdiDatabaseSearch,
		history: ["settings/"],
		admin: true,
	},
	{
		title: "Admin Theme",
		path: "admin-theme",
		description: "Update theming for the instance",
		icon: mdiPalette,
		history: ["settings/"],
		admin: true,
	},
	{
		title: "My Profile",
		path: "my-profile",
		description: "Update settings related to your profile.",
		icon: mdiDatabase,
		history: ["settings/"],
		admin: false,
	},
	{
		title: "View RDF Map",
		path: "view-rdf-map",
		description: "See configuration details in the RDF Map of the instance",
		icon: mdiClipboardTextOutline,
		history: ["settings/"],
		admin: true,
	},
	{
		title: "LLM Feedback",
		path: "llm-feedback",
		description: "Provide feedback on LLM's performance",
		icon: mdiChatProcessingOutline,
		history: ["settings/"],
		admin: true,
	},
];
