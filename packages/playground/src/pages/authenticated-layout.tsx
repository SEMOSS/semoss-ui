import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { ErrorPage } from "./error-page";

/**
 * Show the app's routes to a signed in user, and send everyone else to sign
 * in, remembering where they were going.
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);

	// track the location
	const location = useLocation();

	if (status === "INITIALIZING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (status === "ERROR") {
		return <ErrorPage />;
	}

	if (status !== "AUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
};
