import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { AppLayout } from './AppLayout';

export const AppRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route path="*" element={<Outlet />} />
            </Route>
            <Route path="*" element={<Navigate to={`.`} replace />} />
        </Routes>
    );
});
