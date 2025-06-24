import { createElement } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { ENGINE_ROUTES } from './engine.constants';

import { SettingsContext } from '@/contexts';
import { NavbarHeader, NavbarLeft } from '@/components/shared';
import { Help } from '@/components/help';
import { EngineLayout } from './EngineLayout';
import { EngineIndexPage } from './EngineIndexPage';
import { ImportPage } from '../import';

export const EngineRouter = observer(() => {
    return (
        <>
            <NavbarLeft>
                <NavbarHeader />
            </NavbarLeft>

            <SettingsContext.Provider value={{ adminMode: false }}>
                <Routes>
                    {ENGINE_ROUTES.map((r) => (
                        <Route key={r.path} path={r.path} element={<Outlet />}>
                            <Route
                                index
                                element={<EngineIndexPage route={r} />}
                            />
                            <Route
                                path="new"
                                element={
                                    <ImportPage name={r.name} type={r.type} />
                                }
                            />
                            <Route
                                path=":engineId"
                                element={<EngineLayout route={r} />}
                            >
                                {r.specific.map((s) => (
                                    <Route
                                        key={s.path}
                                        path={s.path}
                                        element={createElement(s.component, {})}
                                    />
                                ))}
                            </Route>
                            <Route
                                path="*"
                                element={<Navigate to="." replace />}
                            />
                        </Route>
                    ))}
                </Routes>
            </SettingsContext.Provider>

            <Help />
        </>
    );
});
