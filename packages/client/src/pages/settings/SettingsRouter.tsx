import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { SettingsLayout } from './SettingsLayout';

import { SETTINGS_ROUTES } from './settings.constants';

export const SettingsRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<SettingsLayout />}>
                {SETTINGS_ROUTES.map((r) => {
                    const Component = r.component;

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
