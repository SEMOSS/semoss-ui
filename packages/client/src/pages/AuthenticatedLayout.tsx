import { observer } from 'mobx-react-lite';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { useRootStore } from '@/hooks/';

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = observer(() => {
    const { configStore } = useRootStore();
    const location = useLocation();

    // wait till the config is authenticated to load the view
    if (configStore.store.status === 'MISSING AUTHENTICATION') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
});
