import { observer } from "mobx-react-lite";
import { Navigate, Route, Routes } from "react-router-dom";
import { JobsPage } from "../jobs/JobsPage";
import { AdminQueryPage } from "./AdminQueryPage";
import { AppSettingsDetailPage } from "./AppSettingsDetailPage";
import { AdminThemePage } from "./admin-theme-page";
import { ConfigurationsPage } from "./ConfigurationsPage";
import { EngineSettingsDetailPage } from "./EngineSettingsDetailPage";
import { EngineSettingsIndexPage } from "./EngineSettingsIndexPage";
import { InsightSettingsDetailPage } from "./InsightSettingsDetailPage";
import { InsightSettingsPage } from "./InsightSettingsPage";
import { MemberSettingsPage } from "./MemberSettingsPage";
import { MyProfilePage } from "./MyProfilePage";
import { ProjectSettingsPage } from "./ProjectSettingsPage";
import { RDFMapPage } from "./rdf-map-page";
import { SettingsIndexPage } from "./SettingsIndexPage";
import { SETTINGS_ROUTES } from "./settings.constants";
import { SettingsLayout } from "./settings-layout";
import { TeamSettingsDetailPage } from "./team-settings-detail-page";
import { TeamsSettingsPage } from "./teams-settings-page";

// map each route to a component
const SETTINGS_COMPONETS = {
	"": SettingsIndexPage,
	app: ProjectSettingsPage,
	"app/:id": AppSettingsDetailPage,
	insight: InsightSettingsPage,
	"insight/:id/:projectId": InsightSettingsDetailPage,
	members: MemberSettingsPage,
	"social-properties": ConfigurationsPage,
	"admin-query": AdminQueryPage,
	"admin-theme": AdminThemePage,
	"my-profile": MyProfilePage,
	jobs: JobsPage,
	"team-permissions": TeamsSettingsPage,
	"team-permissions/:type/:id": TeamSettingsDetailPage,
	"view-rdf-map": RDFMapPage,

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
