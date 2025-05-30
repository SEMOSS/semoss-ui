import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';

import { ENGINE_TYPES } from '@/types';
import { useRootStore } from '@/hooks';

import { ImportLayout } from './ImportLayout';
import { ImportPage } from './ImportPage';

export const ImportRouter = observer(() => {
    const [searchParams] = useSearchParams();

    const { configStore } = useRootStore();

    let type: ENGINE_TYPES | '' = '';
    if (searchParams.get('type')) {
        type = searchParams.get('type').toUpperCase() as ENGINE_TYPES;
    }

    const isRestricted = type
        ? !configStore.isEngineOperationAvailable(type, 'add')
        : false;

    if (isRestricted) {
        return <Navigate to="/" replace />;
    }

    return (
        <Routes>
            <Route path="/" element={<ImportLayout />}>
                <Route index element={<ImportPage />} />
            </Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
