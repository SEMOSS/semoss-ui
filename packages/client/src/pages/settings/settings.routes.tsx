import type { ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router";
import { AddNewJob } from "../jobs/add-new-job";
import { JobsPage } from "../jobs/jobs-page";
import { AdminQueryPage } from "./admin-query-page";
import { AdminThemePage } from "./admin-theme-page";
import { ConfigurationsPage } from "./configurations-page";
import { EngineSettingsDetailPage } from "./engine-settings-detail-page";
import { EngineSettingsIndexPage } from "./engine-settings-index-page";
import { GitHubAppPage } from "./github-app-page";
import { LLMFeedbackPage } from "./llm-feedback-page";
import { MemberSettingsPage } from "./member-settings-page";
import { MyProfilePage } from "./my-profile-page";
import { ProjectSettingsDetailsPage } from "./project-settings-details-page";
import { ProjectSettingsIndexPage } from "./project-settings-index-page";
import { RDFMapPage } from "./rdf-map-page";
import { ServiceAccountsSettingsPage } from "./service-accounts-settings-page";
import { SETTINGS_ROUTES } from "./settings.constants";
import { SettingsIndexPage } from "./settings-index-page";
import { SettingsLayout } from "./settings-layout";
import { TeamSettingsDetailPage } from "./team-settings-detail-page";
import { TeamsSettingsPage } from "./teams-settings-page";

// map each settings route path to the component that renders it
const SETTINGS_COMPONENTS: Record<string, ComponentType> = {
	"": SettingsIndexPage,
	app: ProjectSettingsIndexPage,
	"app/:id": ProjectSettingsDetailsPage,
	members: MemberSettingsPage,
	"service-accounts": ServiceAccountsSettingsPage,
	"social-properties": ConfigurationsPage,
	"github-app": GitHubAppPage,
	"admin-query": AdminQueryPage,
	"admin-theme": AdminThemePage,
	"my-profile": MyProfilePage,
	jobs: JobsPage,
	"jobs/add-new-job": AddNewJob,
	"jobs/edit-job/:id": AddNewJob,
	"team-permissions": TeamsSettingsPage,
	"team-permissions/:type/:id": TeamSettingsDetailPage,
	"view-rdf-map": RDFMapPage,
	"llm-feedback": LLMFeedbackPage,

	// engine
	database: () => <EngineSettingsIndexPage type="DATABASE" />,
	"database/:id": () => <EngineSettingsDetailPage type="DATABASE" />,
	model: () => <EngineSettingsIndexPage type="MODEL" />,
	"model/:id": () => <EngineSettingsDetailPage type="MODEL" />,
	storage: () => <EngineSettingsIndexPage type="STORAGE" />,
	"storage/:id": () => <EngineSettingsDetailPage type="STORAGE" />,
	function: () => <EngineSettingsIndexPage type="FUNCTION" />,
	"function/:id": () => <EngineSettingsDetailPage type="FUNCTION" />,
	vector: () => <EngineSettingsIndexPage type="VECTOR" />,
	"vector/:id": () => <EngineSettingsDetailPage type="VECTOR" />,
	guardrail: () => <EngineSettingsIndexPage type="GUARDRAIL" />,
	"guardrail/:id": () => <EngineSettingsDetailPage type="GUARDRAIL" />,
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

export const SETTINGS_ROUTE: RouteObject = {
	path: "settings",
	element: <SettingsLayout />,
	children: [
		...SETTINGS_CHILDREN,
		{ path: "*", element: <Navigate to="." replace /> },
	],
};
