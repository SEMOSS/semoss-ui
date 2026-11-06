import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { AppLoading } from "../components/app-loading";

/**
 * Show the app's routes to a signed in user, and send everyone else to sign
 * in, remembering where they were going.
 *
 * @component
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);
	const location = useLocation();

	if (status === "INITIALIZING") {
		return <AppLoading />;
	}
	if (status !== "AUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}
	return <Outlet />;
};
