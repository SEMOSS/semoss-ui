import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppDetailPage } from './AppDetailPage';
import { AppPage } from './AppPage';

export const AppRouter = observer(() => {
    return (
        <Routes>
            {/* Already Built App */}
            <Route path=":appId" element={<Outlet />}>
                <Route path="detail" element={<AppDetailPage />} />
                <Route path="*" index element={<AppPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
