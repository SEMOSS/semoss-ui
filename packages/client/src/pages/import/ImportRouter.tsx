import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ImportPage } from './ImportPage';

import { ImportLayout } from './ImportLayout';

export const ImportRouter = observer(() => {
    return (
        <Routes>
            <Route path="/" element={<ImportLayout />}>
                <Route index element={<ImportPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
