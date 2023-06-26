import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { SETTINGS_ROUTES } from './settings.constants';

import { SettingsLayout } from './SettingsLayout';
import { SettingsIndexPage } from './SettingsIndexPage';
import { DatabaseSettingsPage } from './DatabaseSettingsPage';
import { ProjectPermissionsPage } from './ProjectPermissionsPage';
import { InsightPermissionsPage } from './InsightPermissionsPage';
import { MemberSettingsPage } from './MemberSettingsPage';
import { SocialPropertiesPage } from './SocialPropertiesPage';
import { AdminQueryPage } from './AdminQueryPage';
import { ExternalConnectionsPage } from './ExternalConnectionsPage';
import { TeamsManagementPage } from './TeamsManagementPage';
import { TeamsPage } from './TeamsPage';
import { TeamsPermissionsPage } from './TeamsPermissionsPage';
import { MyProfilePage } from './MyProfilePage';
import { ThemePage } from './ThemePage';

// map each route to a component
const SETTINGS_COMPONETS = {
    '': SettingsIndexPage,
    'database-settings': DatabaseSettingsPage,
    'project-permissions': ProjectPermissionsPage,
    'insight-permissions': InsightPermissionsPage,
    members: MemberSettingsPage,
    'social-properties': AdminQueryPage,
    'admin-query': SocialPropertiesPage,
    'external-connections': ExternalConnectionsPage,
    teams: TeamsPage,
    'teams-management': TeamsManagementPage,
    'teams-permissions': TeamsPermissionsPage,
    'my-profile': MyProfilePage,
    theme: ThemePage,
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
