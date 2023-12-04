import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { SETTINGS_ROUTES } from './settings.constants';

import { SettingsLayout } from './SettingsLayout';
import { SettingsIndexPage } from './SettingsIndexPage';

import { EngineSettingsIndexPage } from './EngineSettingsIndexPage';
import { EngineSettingsDetailPage } from './EngineSettingsDetailPage';
import { DatabaseSettingsPage } from './DatabaseSettingsPage';
import { ProjectSettingsPage } from './ProjectSettingsPage';
import { AppSettingsDetailPage } from './AppSettingsDetailPage';
import { InsightSettingsPage } from './InsightSettingsPage';
import { InsightSettingsDetailPage } from './InsightSettingsDetailPage';

import { MemberSettingsPage } from './MemberSettingsPage';
import { ConfigurationsPage } from './ConfigurationsPage';
import { AdminQueryPage } from './AdminQueryPage';
import { MyProfilePage } from './MyProfilePage';
import { JobsPage } from '../jobs/JobsPage';

// map each route to a component
const SETTINGS_COMPONETS = {
    '': SettingsIndexPage,
    app: ProjectSettingsPage,
    'app/:id': AppSettingsDetailPage,
    insight: InsightSettingsPage,
    'insight/:id/:projectId': InsightSettingsDetailPage,
    members: MemberSettingsPage,
    'social-properties': ConfigurationsPage,
    'admin-query': AdminQueryPage,
    'my-profile': MyProfilePage,
    jobs: JobsPage,

    // engine
    database: () => <EngineSettingsIndexPage type="DATABASE" />,
    'database/:id': () => <EngineSettingsDetailPage type="DATABASE" />,
    model: () => <EngineSettingsIndexPage type="MODEL" />,
    'model/:id': () => <EngineSettingsDetailPage type="MODEL" />,
    storage: () => <EngineSettingsIndexPage type="STORAGE" />,
    'storage/:id': () => <EngineSettingsDetailPage type="STORAGE" />,
    function: () => <EngineSettingsIndexPage type="FUNCTION" />,
    'function/:id': () => <EngineSettingsDetailPage type="FUNCTION" />,
    vector: () => <EngineSettingsIndexPage type="VECTOR" />,
    'vector/:id': () => <EngineSettingsDetailPage type="VECTOR" />,
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
