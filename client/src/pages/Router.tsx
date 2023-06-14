import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '@/hooks/';
import { LoadingScreen } from '@/components/ui';

import { TempPage } from './TempPage';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { LoginPage } from './LoginPage';
import { CatalogPage } from './CatalogPage';
import {
    DatabaseLayout,
    DatabaseIndexPage,
    DatabaseMetadataPage,
    DatabaseSettingsPage,
} from './database';
import { ImportPage } from './ImportPage';

import { SettingsLayout, TempSettings } from './settings';
import { SettingsPage } from './SettingsPage';
import { DatabasePermissionsPage } from './DatabasePermissionsPage';
import { InsightPermissionsPage } from './InsightPermissionsPage';
import { ProjectPermissionsPage } from './ProjectPermissionsPage';
import { MemberSettingsPage } from './MemberSettingsPage';
import { AdminQueryPage } from './AdminQueryPage';
import { SocialPropertiesPage } from './SocialPropertiesPage';
import {
    ImportedDatabaseLayout,
    ImportedDatabaseAccessPage,
    ImportedDatabaseIndexPage,
    ImportedDatabaseMetaModelPage,
    ImportedDatabaseQueryDataPage,
    ImportedDatabaseReplaceDataPage,
} from './importedDatabase';
import { JobsPage } from './jobs';

export const Router = observer(() => {
    const { configStore } = useRootStore();
    console.log(configStore.store.status);
    // don't load anything if it is pending
    if (configStore.store.status === 'INITIALIZING') {
        return <LoadingScreen.Trigger />;
    }

    return (
        <Routes>
            <Route path="/" element={<AuthenticatedLayout />}>
                <Route index element={<TempPage title={'Home'} />} />
                <Route path="settings" element={<SettingsLayout />}>
                    <Route index element={<SettingsPage />} />

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
                    <Route path="jobs" element={<JobsPage />} />
                    <Route path="admin-query" element={<AdminQueryPage />} />

                    <Route
                        path="external-connections"
                        element={<TempSettings type={'external-connections'} />}
                    />
                    <Route
                        path="teams"
                        element={<TempSettings type={'teams'} />}
                    />
                    <Route
                        path="teams-management"
                        element={<TempSettings type={'teams-management'} />}
                    />
                    <Route
                        path="teams-permissions"
                        element={<TempSettings type={'teams-permissions'} />}
                    />
                    <Route
                        path="my-profile"
                        element={<TempSettings type={'my-profile'} />}
                    />
                    <Route
                        path="theme"
                        element={<TempSettings type={'theme'} />}
                    />
                </Route>
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="import" element={<ImportPage />} />
                <Route path="importedDatabase" element={<Outlet />}>
                    <Route path=":id" element={<ImportedDatabaseLayout />}>
                        <Route index element={<ImportedDatabaseIndexPage />} />
                        <Route
                            path="metamodel"
                            element={<ImportedDatabaseMetaModelPage />}
                        />
                        <Route
                            path="access"
                            element={<ImportedDatabaseAccessPage />}
                        />
                        <Route
                            path="queryData"
                            element={<ImportedDatabaseQueryDataPage />}
                        />
                        <Route
                            path="replaceData"
                            element={<ImportedDatabaseReplaceDataPage />}
                        />
                    </Route>
                </Route>
                <Route path="database" element={<Outlet />}>
                    <Route path=":id" element={<DatabaseLayout />}>
                        <Route index element={<DatabaseIndexPage />} />
                        <Route
                            path="metadata"
                            element={<DatabaseMetadataPage />}
                        />
                        <Route
                            path="insights"
                            element={<TempPage title={'Database Insights'} />}
                        />
                        <Route
                            path="settings"
                            element={<DatabaseSettingsPage />}
                        />
                    </Route>
                    <Route index element={<Navigate to="/catalog" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/login" element={<LoginPage />}></Route>
        </Routes>
    );
});
