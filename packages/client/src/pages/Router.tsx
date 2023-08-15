import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useRootStore } from '@/hooks/';
import { LoadingScreen } from '@/components/ui';

import { AuthenticatedLayout } from './AuthenticatedLayout';
import { NavigatorLayout } from './NavigatorLayout';

import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { CatalogPage } from './CatalogPage';

import {
    DatabaseMetadataPage,
    DatabaseSettingsPage,
    DatabaseReplaceDataPage,
    DatabaseQueryDataPage,
    DatabaseImport,
} from './database';

import { ImportShell } from '@/components/engine';

import { EngineLayout, EngineIndexPage } from './engine';

import { SettingsRouter } from './settings';
import { AppRouter } from './app';

export const Router = observer(() => {
    const { configStore } = useRootStore();

    // don't load anything if it is pending
    if (configStore.store.status === 'INITIALIZING') {
        return <LoadingScreen.Trigger message={'Initializing'} />;
    }

    return (
        <Routes>
            <Route path="/" element={<AuthenticatedLayout />}>
                <Route path="app/*" element={<AppRouter />} />
                <Route path="*" element={<NavigatorLayout />}>
                    <Route index element={<HomePage />} />

                    <Route
                        path="import"
                        element={
                            <ImportShell>
                                <DatabaseImport />
                            </ImportShell>
                        }
                    />

                    <Route path="catalog" element={<CatalogPage />} />

                    <Route path="storage" element={<Outlet />}>
                        <Route path=":id" element={<EngineLayout />}>
                            <Route index element={<EngineIndexPage />} />
                            <Route
                                path="metadata"
                                element={<DatabaseMetadataPage />}
                            />
                            <Route
                                path="settings"
                                element={<DatabaseSettingsPage />}
                            />
                        </Route>
                    </Route>

                    <Route path="model" element={<Outlet />}>
                        <Route path=":id" element={<EngineLayout />}>
                            <Route index element={<EngineIndexPage />} />
                            <Route
                                path="metadata"
                                element={<DatabaseMetadataPage />}
                            />
                            <Route
                                path="settings"
                                element={<DatabaseSettingsPage />}
                            />
                        </Route>
                    </Route>

                    <Route path="database" element={<Outlet />}>
                        <Route path=":id" element={<EngineLayout />}>
                            <Route index element={<EngineIndexPage />} />
                            <Route
                                path="metadata"
                                element={<DatabaseMetadataPage />}
                            />
                            <Route path="insights" element={<>TODO</>} />
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
                        </Route>
                        <Route
                            index
                            element={<Navigate to="/catalog" replace />}
                        />
                    </Route>
                    <Route path="settings/*" element={<SettingsRouter />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/login" element={<LoginPage />}></Route>
        </Routes>
    );
});
