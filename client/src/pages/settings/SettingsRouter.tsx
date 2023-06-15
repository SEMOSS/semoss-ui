import { Routes, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { SettingsLayout } from './SettingsLayout';
import { SettingsIndexPage } from './SettingsIndexPage';
import { DatabasePermissionsPage } from './DatabasePermissionsPage';
import { InsightPermissionsPage } from './InsightPermissionsPage';
import { ProjectPermissionsPage } from './ProjectPermissionsPage';
import { MemberSettingsPage } from './MemberSettingsPage';
import { AdminQueryPage } from './AdminQueryPage';
import { SocialPropertiesPage } from './SocialPropertiesPage';
import { ExternalConnectionsPage } from './ExternalConnectionsPage';
import { TeamsPage } from './TeamsPage';
import { TeamsManagementPage } from './TeamsManagementPage';
import { TeamsPermissionsPage } from './TeamsPermissionsPage';
import { MyProfilePage } from './MyProfilePage';
import { ThemePage } from './ThemePage';

export const SettingsRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<SettingsLayout />}>
                <Route index element={<SettingsIndexPage />} />
                <Route
                    path="database-permissions"
                    element={<DatabasePermissionsPage />}
                />

                <Route
                    path="project-permissions"
                    element={<ProjectPermissionsPage />}
                />
                <Route
                    path="insight-permissions"
                    element={<InsightPermissionsPage />}
                />
                <Route path="members" element={<MemberSettingsPage />} />
                <Route
                    path="social-properties"
                    element={<SocialPropertiesPage />}
                />
                {/* <Route path="jobs" element={<JobsPage />} /> */}
                <Route path="admin-query" element={<AdminQueryPage />} />

                <Route
                    path="external-connections"
                    element={<ExternalConnectionsPage />}
                />
                <Route path="teams" element={<TeamsPage />} />
                <Route
                    path="teams-management"
                    element={<TeamsManagementPage />}
                />
                <Route
                    path="teams-permissions"
                    element={<TeamsPermissionsPage />}
                />
                <Route path="my-profile" element={<MyProfilePage />} />
                <Route path="theme" element={<ThemePage />} />
            </Route>
        </Routes>
    );
});
