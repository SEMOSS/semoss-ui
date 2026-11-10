import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { useSessionRetry } from "@semoss/shared";
import { ErrorPage } from "./error-page";

/**
 * Layout for the routes that need a signed in user: a signed out user goes to
 * the login page, which returns them here after signing in. When the config
 * or the user could not be read, for any reason other than a signed out user,
 * these routes show the error page with Retry; the login page still renders.
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);
	const { isRetrying, retry } = useSessionRetry();
	const location = useLocation();

	if (status === "UNAUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (status === "ERROR") {
		return <ErrorPage onRetry={retry} isRetrying={isRetrying} />;
	}

	return <Outlet />;
};
