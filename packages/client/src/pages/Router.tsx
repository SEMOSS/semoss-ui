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
    DatabaseReplaceDataPage,
    DatabaseQueryDataPage,
    DatabaseUpdateSMSSPage,
} from './database';

import { SettingsRouter } from './settings';

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
                <Route path="settings/*" element={<SettingsRouter />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="import" element={<TempPage title={'Import'} />} />
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
                        <Route
                            path="replace"
                            element={<DatabaseReplaceDataPage />}
                        />
                        <Route
                            path="query"
                            element={<DatabaseQueryDataPage />}
                        />
                        <Route
                            path="update"
                            element={<DatabaseUpdateSMSSPage />}
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
