import type { AppDetailPermission } from "@/contexts/AppDetailContext";
import { AppAccessControlPage } from "./app-access-control-page";
import { AppActivityPage } from "./app-activity-page";
import { AppCommitsPage } from "./app-commits-page";
import { AppDependenciesPage } from "./app-dependencies-page";
import { AppFilesPage } from "./app-files-page";
import { AppGithubPage } from "./app-github-page";
import { AppMcpUsagePage } from "./app-mcp-usage-page";
import { AppOverviewPage } from "./app-overview-page";
import { AppSettingsPage } from "./app-settings-page";
import { AppSmssPage } from "./app-smss-page";

export type AppDetailTab = {
	/** Display name of the tab */
	name: string;

	/** URL path segment (empty string = index/default) */
	path: string;

	/** Component rendered for this tab */
	component: React.FunctionComponent;

	/** App permissions allowed to see this tab. `false` = all permissions */
	restrict: Exclude<AppDetailPermission, "">[] | false;

	/** Tab is only available when chrome (breadcrumb/navbar) is visible */
	requiresNav?: boolean;
};

export const APP_DETAIL_TABS: AppDetailTab[] = [
	{
		name: "Overview",
		path: "",
		component: AppOverviewPage,
		restrict: false,
	},
	{
		name: "Dependencies",
		path: "dependencies",
		component: AppDependenciesPage,
		restrict: ["author", "editor", "readOnly"],
	},
	{
		name: "MCP Usage",
		path: "mcp-usage",
		component: AppMcpUsagePage,
		restrict: ["author", "editor", "readOnly"],
	},
	{
		name: "Activity Log",
		path: "activity",
		component: AppActivityPage,
		restrict: ["author", "editor", "readOnly"],
	},
	{
		name: "Commits",
		path: "commits",
		component: AppCommitsPage,
		restrict: ["author", "editor"],
	},
	{
		name: "GitHub",
		path: "github",
		component: AppGithubPage,
		// Connecting/changing/disconnecting all require project ownership on the
		// backend, so only show the tab to owners (authors).
		restrict: ["author"],
	},
	{
		name: "Settings",
		path: "settings",
		component: AppSettingsPage,
		restrict: ["author"],
	},
	{
		name: "Access Control",
		path: "access-control",
		component: AppAccessControlPage,
		restrict: ["author", "editor"],
	},
	{
		name: "Files",
		path: "files",
		component: AppFilesPage,
		restrict: ["author", "editor"],
		requiresNav: true,
	},
	{
		name: "SMSS",
		path: "smss",
		component: AppSmssPage,
		restrict: ["author"],
	},
];
