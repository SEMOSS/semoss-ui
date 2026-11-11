import type { ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router";
import { AddNewJob } from "../jobs/add-new-job";
import { JobsPage } from "../jobs/jobs.page";
import { AdminQueryPage } from "./admin-query.page";
import { AdminTeamDetailPage } from "./admin-team-detail.page";
import { AdminTeamsPage } from "./admin-teams.page";
import { AdminThemePage } from "./admin-theme-page";
import { AgentRunsPage } from "./agent-runs.page";
import { AuditTrailPage } from "./audit-trail.page";
import { ConfigurationsPage } from "./configurations-page";
import { EnterpriseUsagePage } from "./enterprise-usage.page";
import { GitHubAppPage } from "./github-app.page";
import { LLMFeedbackPage } from "./llm-feedback-page";
import { ManagedTeamDetailPage } from "./managed-team-detail.page";
import { ManagedTeamsPage } from "./managed-teams-page";
import { MemberSettingsPage } from "./member-settings-page";
import { MyFilesPage } from "./my-files-page";
import { MyProfilePage } from "./my-profile.page";
import { RDFMapPage } from "./rdf-map-page";
import { ResourceGovernancePage } from "./resource-governance-page";
import { ServiceAccountsSettingsPage } from "./service-accounts-settings-page";
import { SETTINGS_ROUTES } from "./settings.constants";
import { SettingsLayout } from "./settings.layout";
import { SettingsIndexPage } from "./settings-index-page";
import { TeamAccessManagementPage } from "./team-access-management.page";

// map each settings route path to the component that renders it
const SETTINGS_COMPONENTS: Record<string, ComponentType> = {
	"": SettingsIndexPage,
	members: MemberSettingsPage,
	resources: ResourceGovernancePage,
	"resources/:type": ResourceGovernancePage,
	"resources/:type/:id": ResourceGovernancePage,
	"service-accounts": ServiceAccountsSettingsPage,
	"social-properties": ConfigurationsPage,
	"github-app": GitHubAppPage,
	"admin-query": AdminQueryPage,
	"audit-trail": AuditTrailPage,
	"agent-runs": AgentRunsPage,
	"enterprise-usage": EnterpriseUsagePage,
	"admin-theme": AdminThemePage,
	"my-profile": MyProfilePage,
	"my-files": MyFilesPage,
	jobs: JobsPage,
	"jobs/add-new-job": AddNewJob,
	"jobs/edit-job/:id": AddNewJob,
	"team-permissions": AdminTeamsPage,
	"team-permissions/:type/:id": AdminTeamDetailPage,
	"team-permissions/:type/:id/bulk-access-management": () => (
		<TeamAccessManagementPage admin />
	),
	"managed-teams": ManagedTeamsPage,
	"managed-teams/:id": ManagedTeamDetailPage,
	"managed-teams/:id/bulk-access-management": TeamAccessManagementPage,
	"view-rdf-map": RDFMapPage,
	"llm-feedback": LLMFeedbackPage,
};

const SETTINGS_CHILDREN: RouteObject[] = SETTINGS_ROUTES.map((route) => {
	const Component = SETTINGS_COMPONENTS[route.path];

	if (!Component) {
		throw Error(`ERROR ::: missing component for path ${route.path}`);
	}

	if (!route.path) {
		return { index: true, element: <Component /> };
	}

	return { path: route.path, element: <Component /> };
});

/** The `settings` route: every Settings page inside the settings layout. */
export const SETTINGS_ROUTE: RouteObject = {
	path: "settings",
	element: <SettingsLayout />,
	children: [
		...SETTINGS_CHILDREN,
		{ path: "*", element: <Navigate to="." replace /> },
	],
};
