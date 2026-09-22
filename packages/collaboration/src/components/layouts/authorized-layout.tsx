import { Navigate, Outlet, useLocation } from "react-router";
import { useInsight } from "@semoss/sdk/react";

/**
 * Sends users to the login page if they are not authorized, shows a loading screen while app data is loading, otherwise renders the child components.
 */
export const AuthorizedLayout = () => {
	const { isAuthorized } = useInsight(); // Read whether the user is authorized
	const { pathname } = useLocation();

	// If the user is not authorized, take them to the login page, and pass their intended route
	if (!isAuthorized)
		return <Navigate to={"/login"} state={{ target: pathname }} />;

	return <Outlet />;
};
