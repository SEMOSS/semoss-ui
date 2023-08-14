import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from './AppLayout';
import { AppPage } from './AppPage';
import { AppEmbedPage } from './AppEmbedPage';

export const AppRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<AppPage />} />
                <Route path="embed/:projectId/:id" element={<AppEmbedPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
