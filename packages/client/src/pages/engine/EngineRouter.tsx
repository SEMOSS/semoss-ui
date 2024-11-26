import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { ENGINE_ROUTES } from './engine.constants';

import { EngineLayout } from './EngineLayout';
import { EngineCatalogPage } from './EngineCatalogPage';

import { createElement } from 'react';
import { SettingsContext } from '@/contexts';

export const EngineRouter = observer(() => {
    return (
        <SettingsContext.Provider value={{ adminMode: false }}>
            <Routes>
                <Route path="/" element={<Outlet />}>
                    {ENGINE_ROUTES.map((g) => (
                        <Route key={g.path} path={g.path} element={<Outlet />}>
                            {g.specific.length > 0 ? (
                                <>
                                    <Route
                                        index
                                        element={
                                            <EngineCatalogPage type={g.type} />
                                        }
                                    />
                                    <Route
                                        path=":id"
                                        element={<EngineLayout type={g.type} />}
                                    >
                                        {g.specific.map((s) => (
                                            <Route
                                                key={s.path}
                                                path={s.path}
                                                element={createElement(
                                                    s.component,
                                                    {
                                                        type: g.type,
                                                    },
                                                )}
                                            />
                                        ))}
                                    </Route>
                                </>
                            ) : null}

                            <Route
                                path="*"
                                element={<Navigate to="." replace />}
                            />
                        </Route>
                    ))}
                </Route>
                <Route path="*" element={<Navigate to={`.`} replace />} />
            </Routes>
        </SettingsContext.Provider>
    );
});
