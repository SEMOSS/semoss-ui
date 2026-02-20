import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";

/**
 * Wrap the authenticated routes and check if user is logged in
 */
export const AuthenticatedLayout = () => {
	const { isAuthorized } = useInsight();

	// track the location
	const location = useLocation();

	if (!isAuthorized) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
};
