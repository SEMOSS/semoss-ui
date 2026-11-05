import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
	const isAuthenticated = useSession(
		(state) => state.status === "AUTHENTICATED",
	);

	// track the location
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
};
