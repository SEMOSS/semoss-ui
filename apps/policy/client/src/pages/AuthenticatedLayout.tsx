import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { useInsight } from '@semoss/sdk';

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
    const { isAuthorized } = useInsight();

    // track the location
    const location = useLocation();

    // if security is enabled, we need logins
    if (!isAuthorized) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
