import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppPage } from './AppPage';
import { Copy } from './Copy';

export const AppRouter = observer(() => {
    return (
        <Routes>
            <Route path="/:appId" element={<AppPage />}></Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
