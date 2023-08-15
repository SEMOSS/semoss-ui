import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from './AppLayout';
import { AppPage } from './AppPage';

export const AppRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<AppPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
