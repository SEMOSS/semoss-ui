import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppDetailPage } from './AppDetailPage';
import { AppPage } from './AppPage';
import { NewAppPage } from './NewAppPage';

// Fix these
import { NewPromptBuilderAppPage } from './NewPromptBuilderAppPage';

export const AppRouter = observer(() => {
    return (
        <Routes>
            {/* New Apps */}
            <Route path="new" element={<Outlet />}>
                <Route index element={<NewAppPage />} />
                <Route path="prompt" element={<NewPromptBuilderAppPage />} />
            </Route>
            {/* Already Built App */}
            <Route path=":appId" element={<Outlet />}>
                <Route index element={<AppPage />} />
                <Route path="detail" element={<AppDetailPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
