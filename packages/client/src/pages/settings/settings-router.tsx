import { observer } from "mobx-react-lite";
import { Navigate, Route, Routes } from "react-router-dom";
import { AddNewJob } from "../jobs/add-new-job";
import { JobsPage } from "../jobs/jobs-page";
import { AdminQueryPage } from "./admin-query-page";
import { AdminThemePage } from "./admin-theme-page";
import { ConfigurationsPage } from "./configurations-page";
import { EngineSettingsDetailPage } from "./engine-settings-detail-page";
import { EngineSettingsIndexPage } from "./engine-settings-index-page";
import { GitHubAppPage } from "./github-app-page";
import { InsightSettingsDetailPage } from "./InsightSettingsDetailPage";
import { InsightSettingsPage } from "./insight-settings-page";
import { LLMFeedbackPage } from "./llm-feedback-page";
import { MemberSettingsPage } from "./MemberSettingsPage";
import { MyProfilePage } from "./my-profile-page";
import { PlatformProfileDetailPage } from "./platform-profile-detail-page";
import { PlatformProfilesPage } from "./platform-profiles-page";
import { ProjectSettingsDetailsPage } from "./project-settings-details-page";
import { ProjectSettingsPage } from "./project-settings-page";
import { RDFMapPage } from "./rdf-map-page";
import { ServiceAccountsSettingsPage } from "./service-accounts-settings-page";
import { SETTINGS_ROUTES } from "./settings.constants";
import { SettingsIndexPage } from "./settings-index-page";
import { SettingsLayout } from "./settings-layout";
import { TeamSettingsDetailPage } from "./team-settings-detail-page";
import { TeamsSettingsPage } from "./teams-settings-page";

// map each route to a component
const SETTINGS_COMPONETS = {
	"": SettingsIndexPage,
	app: ProjectSettingsPage,
	"app/:id": ProjectSettingsDetailsPage,
	insight: InsightSettingsPage,
	"insight/:id/:projectId": InsightSettingsDetailPage,
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
	"platform-profiles": PlatformProfilesPage,
	"platform-profiles/:profileId": PlatformProfileDetailPage,

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

export const SettingsRouter = observer(() => {
	return (
		<Routes>
			<Route path="/" element={<SettingsLayout />}>
				{SETTINGS_ROUTES.map((r) => {
					const Component = SETTINGS_COMPONETS[r.path];

					if (!Component) {
						throw Error(
							`ERROR ::: missing component for path ${r.path}`,
						);
					}

					if (!r.path) {
						return (
							<Route index key={r.path} element={<Component />} />
						);
					}

					return (
						<Route
							key={r.path}
							path={r.path}
							element={<Component />}
						/>
					);
				})}
			</Route>
			<Route path="*" element={<Navigate to={`.`} replace />} />
		</Routes>
	);
});
