import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { EngineLayout } from './EngineLayout';
import { EngineIndexPage } from './EngineIndexPage';
import { EngineUsagePage } from './EngineUsagePage';

import { EngineMetadataPage } from './EngineMetadataPage';
import { EngineSettingsPage } from './EngineSettingsPage';
import { EngineQueryDataPage } from './EngineQueryDataPage';
import { EngineReplaceDataPage } from './EngineReplaceDataPage';

export const EngineRouter = observer(() => {
    return (
        <Routes>
            <Route path="*" element={<Outlet />}>
                <Route path="model" element={<Outlet />}>
                    <Route path=":id" element={<EngineLayout />}>
                        <Route index element={<EngineIndexPage />} />
                        <Route
                            path="metadata"
                            element={<EngineMetadataPage />}
                        />
                        <Route path="usage" element={<EngineUsagePage />} />
                        <Route
                            path="settings"
                            element={<EngineSettingsPage />}
                        />
                    </Route>
                    <Route
                        index
                        element={<Navigate to="/catalog?type=model" replace />}
                    />
                </Route>

                <Route path="function" element={<Outlet />}>
                    <Route path=":id" element={<EngineLayout />}>
                        <Route index element={<EngineIndexPage />} />
                        <Route
                            path="metadata"
                            element={<EngineMetadataPage />}
                        />
                        <Route path="usage" element={<EngineUsagePage />} />
                        <Route
                            path="settings"
                            element={<EngineSettingsPage />}
                        />
                    </Route>
                    <Route
                        index
                        element={
                            <Navigate to="/catalog?type=function" replace />
                        }
                    />
                </Route>

                <Route path="vector" element={<Outlet />}>
                    <Route path=":id" element={<EngineLayout />}>
                        <Route index element={<EngineIndexPage />} />
                        <Route
                            path="metadata"
                            element={<EngineMetadataPage />}
                        />
                        <Route path="usage" element={<EngineUsagePage />} />
                        <Route
                            path="settings"
                            element={<EngineSettingsPage />}
                        />
                    </Route>
                    <Route
                        index
                        element={<Navigate to="/catalog?type=vector" replace />}
                    />
                </Route>

                <Route path="database" element={<Outlet />}>
                    <Route path=":id" element={<EngineLayout />}>
                        <Route index element={<EngineIndexPage />} />
                        <Route
                            path="metadata"
                            element={<EngineMetadataPage />}
                        />
                        <Route path="usage" element={<EngineUsagePage />} />
                        <Route
                            path="settings"
                            element={<EngineSettingsPage />}
                        />
                        <Route
                            path="replace"
                            element={<EngineReplaceDataPage />}
                        />
                        <Route path="query" element={<EngineQueryDataPage />} />
                    </Route>
                    <Route
                        index
                        element={
                            <Navigate to="/catalog?type=database" replace />
                        }
                    />
                </Route>

                <Route path="storage" element={<Outlet />}>
                    <Route path=":id" element={<EngineLayout />}>
                        <Route index element={<EngineIndexPage />} />
                        <Route
                            path="metadata"
                            element={<EngineMetadataPage />}
                        />
                        <Route path="usage" element={<EngineUsagePage />} />
                        <Route
                            path="settings"
                            element={<EngineSettingsPage />}
                        />
                    </Route>
                    <Route
                        index
                        element={
                            <Navigate to="/catalog?type=storage" replace />
                        }
                    />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to={`.`} replace />} />
        </Routes>
    );
});
