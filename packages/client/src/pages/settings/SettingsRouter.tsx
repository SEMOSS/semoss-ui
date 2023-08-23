import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { SETTINGS_ROUTES } from './settings.constants';

import { SettingsLayout } from './SettingsLayout';
import { SettingsIndexPage } from './SettingsIndexPage';

import { DatabaseSettingsDetailPage } from './DatabaseSettingsDetailPage';
import { DatabaseSettingsPage } from './DatabaseSettingsPage';
import { ProjectSettingsPage } from './ProjectSettingsPage';
import { ProjectSettingsDetailPage } from './ProjectSettingsDetailPage';
import { InsightSettingsPage } from './InsightSettingsPage';
import { InsightSettingsDetailPage } from './InsightSettingsDetailPage';

import { MemberSettingsPage } from './MemberSettingsPage';
import { SocialPropertiesPage } from './SocialPropertiesPage';
import { AdminQueryPage } from './AdminQueryPage';
import { ExternalConnectionsPage } from './ExternalConnectionsPage';
import { TeamsManagementPage } from './TeamsManagementPage';
import { TeamsPage } from './TeamsPage';
import { TeamsPermissionsPage } from './TeamsPermissionsPage';
import { MyProfilePage } from './MyProfilePage';
import { ThemePage } from './ThemePage';
import { JobsPage } from '../jobs/JobsPage';

import { ModelSettingsPage } from './ModelSettingsPage';
import { ModelSettingsDetailPage } from './ModelSettingsDetailPage';

import { StorageSettingsPage } from './StorageSettingsPage';
import { StorageSettingsDetailPage } from './StorageSettingsDetailPage';

// map each route to a component
const SETTINGS_COMPONETS = {
    '': SettingsIndexPage,

    database: DatabaseSettingsPage,
    'database/:id': DatabaseSettingsDetailPage,
    app: ProjectSettingsPage,
    'app/:id': ProjectSettingsDetailPage,
    insight: InsightSettingsPage,
    'insight/:id/:projectId': InsightSettingsDetailPage,

    members: MemberSettingsPage,
    'social-properties': SocialPropertiesPage,
    'admin-query': AdminQueryPage,
    'external-connections': ExternalConnectionsPage,
    teams: TeamsPage,
    'teams-management': TeamsManagementPage,
    'teams-permissions': TeamsPermissionsPage,
    'my-profile': MyProfilePage,
    jobs: JobsPage,
    theme: ThemePage,

    model: ModelSettingsPage,
    'model/:id': ModelSettingsDetailPage,
    storage: StorageSettingsPage,
    'storage/:id': StorageSettingsDetailPage,
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
