import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { forgetSessionLoginState } from "@/features/teamwork/connectors/connectors.api";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
	const { isAuthorized } = useInsight();

	// track the location
	const location = useLocation();

	// A sign in on this page, after signing out or on the login page, starts a
	// new session, so the connectors' reads of the old one's logins are stale.
	useEffect(() => {
		if (isAuthorized) {
			forgetSessionLoginState();
		}
	}, [isAuthorized]);

	if (!isAuthorized) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
};
