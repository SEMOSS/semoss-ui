/** A heading the Settings page lists its tiles under. */
type SettingsGroup = "ACCOUNT" | "ACCESS" | "MONITORING" | "PLATFORM";

/** The Settings page's headings, in the order it shows them. */
export const SETTINGS_GROUPS: readonly {
	value: SettingsGroup;
	label: string;
}[] = [
	{ value: "ACCOUNT", label: "Your Account" },
	{ value: "ACCESS", label: "Resources & Access" },
	{ value: "MONITORING", label: "Monitoring" },
	{ value: "PLATFORM", label: "Platform" },
];

export const SETTINGS_ROUTES: {
	/*** Title of the page */
	title: string;
	/** Relative path to navigate to the page */
	path: string;
	/** Description of the page */
	description: string;

	/** Description of the  page if admin */
	adminDescription?: string;

	/** Prior Links to nav to */
	history?: string[];

	/** The heading its tile is listed under on the Settings page; a page with no tile has none */
	group?: SettingsGroup;

	admin?: boolean;
	hidden?: boolean;
}[] = [
	{
		title: "Settings",
		path: "",
		description:
			"Manage your profile, your files, and the teams you manage.",
		adminDescription:
			"Manage your profile, your files, and the teams you manage. As an admin, manage resources, people, and the platform, and see how it is used.",
		history: [],
	},
	{
		title: "My Profile",
		path: "my-profile",
		description: "Update settings related to your profile.",
		history: ["settings/"],
		group: "ACCOUNT",
		admin: false,
	},
	{
		title: "My Files",
		path: "my-files",
		description: "Browse, upload, and manage the files in your user space.",
		history: ["settings/"],
		group: "ACCOUNT",
		admin: false,
	},
	{
		title: "My Teams",
		path: "managed-teams",
		description:
			"Add and remove the members and managers of the teams you manage.",
		history: ["managed-teams"],
		group: "ACCOUNT",
		admin: false,
	},
	{
		title: "Resource Delegated Access",
		path: "resource-delegated-access",
		description:
			"See which apps, agents and engines can use the engines and projects you can edit, and give access to many at once.",
		history: ["settings/"],
		group: "ACCOUNT",
		admin: false,
	},
	{
		title: "My Teams",
		path: "managed-teams/:id",
		description: "A team you manage",
		history: ["managed-teams", "managed-teams/<id>"],
	},
	{
		title: "Bulk Access Management",
		path: "managed-teams/:id/bulk-access-management",
		description: "Change who is in a team and who manages it",
		history: [
			"managed-teams",
			"managed-teams/<id>",
			"managed-teams/<id>/bulk-access-management",
		],
	},
	{
		title: "Resource Governance",
		path: "resources",
		description:
			"Manage the access, visibility, and settings of every project and engine.",
		history: ["resources"],
		group: "ACCESS",
		admin: true,
	},
	{
		title: "Resource Governance",
		path: "resources/:type",
		description:
			"Manage the access, visibility, and settings of every project and engine.",
		history: ["resources"],
		admin: true,
		hidden: true,
	},
	{
		title: "Resource Governance",
		path: "resources/:type/:id",
		description:
			"Manage the access, visibility, and settings of every project and engine.",
		history: ["resources"],
		admin: true,
		hidden: true,
	},
	{
		title: "All Resource Delegated Access",
		path: "all-resource-delegated-access",
		description:
			"See which apps, agents and engines can use every engine and project, and give access to many at once.",
		history: ["settings/"],
		group: "ACCESS",
		admin: true,
	},
	{
		title: "Member Settings",
		path: "members",
		description:
			"Add new members, reset passwords, and edit member-based permissions.",
		history: ["settings/"],
		group: "ACCESS",
		admin: true,
	},
	{
		title: "Team Permissions",
		path: "team-permissions",
		description:
			"Create teams, choose their members and managers, and give them access to projects and engines.",
		history: ["team-permissions"],
		group: "ACCESS",
		admin: true,
	},
	{
		title: "Team Permissions",
		path: "team-permissions/:type/:id",
		description: "A team's members, managers, and access",
		history: ["team-permissions", "team-permissions/<type>/<id>"],
		admin: true,
	},
	{
		title: "Bulk Access Management",
		path: "team-permissions/:type/:id/bulk-access-management",
		description: "Change who is in a team and who manages it",
		history: [
			"team-permissions",
			"team-permissions/<type>/<id>",
			"team-permissions/<type>/<id>/bulk-access-management",
		],
		admin: true,
	},
	{
		title: "Service Accounts",
		path: "service-accounts",
		description: "Create and manage service accounts for system access.",
		history: ["settings/"],
		group: "ACCESS",
		admin: true,
	},
	{
		title: "Enterprise Usage & Activity",
		path: "enterprise-usage",
		description:
			"Explore model usage, adoption, performance, and activity across the platform, and changes to access, settings, and limits.",
		history: ["settings/"],
		group: "MONITORING",
		admin: true,
	},
	{
		title: "Audit Trail",
		path: "audit-trail",
		description:
			"Review sign-ins, permissions, and resource changes across the platform.",
		history: ["settings/"],
		group: "MONITORING",
		admin: true,
	},
	{
		title: "Agent Runs",
		path: "agent-runs",
		description:
			"Review every user's conversations with agents and how each run went.",
		history: ["settings/"],
		group: "MONITORING",
		admin: true,
	},
	{
		title: "LLM Feedback",
		path: "llm-feedback",
		description: "Provide feedback on LLM's performance",
		history: ["settings/"],
		group: "MONITORING",
		admin: true,
	},
	{
		title: "Configuration",
		path: "social-properties",
		description:
			"Change the login configuration settings and the General Platform Limit.",
		history: ["settings/"],
		group: "PLATFORM",
		admin: true,
	},
	{
		title: "Admin Theme",
		path: "admin-theme",
		description: "Update theming for the instance",
		history: ["settings/"],
		group: "PLATFORM",
		admin: true,
	},
	{
		title: "GitHub App",
		path: "github-app",
		description:
			"Create and manage the GitHub App used for project linking and webhooks.",
		history: ["settings/"],
		group: "PLATFORM",
		admin: true,
	},
	{
		title: "Jobs",
		path: "jobs",
		description: "Manage and schedule cron jobs for the platform",
		history: ["jobs"],
		group: "PLATFORM",
		admin: true,
	},
	{
		title: "Add Jobs",
		path: "jobs/add-new-job",
		description:
			"Fill out all the details in order to add the model to the catalog.",
		history: ["jobs", "add-new-job"],
		admin: true,
	},
	{
		title: "Edit Jobs",
		path: "jobs/edit-job/:id",
		description:
			"Fill out all the details in order to edit the model in the catalog.",
		history: ["jobs", "edit-job/:id"],
		admin: true,
	},
	{
		title: "Admin Query",
		path: "admin-query",
		description: "Query the platform databases directly. Use with caution.",
		history: ["settings/"],
		group: "PLATFORM",
		admin: true,
	},
	{
		title: "View RDF Map",
		path: "view-rdf-map",
		description: "See configuration details in the RDF Map of the instance",
		history: ["settings/"],
		group: "PLATFORM",
		admin: true,
	},
];
