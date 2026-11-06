import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";

/**
 * Layout for the routes that need a signed in user: a signed out user goes to
 * the login page, which returns them here after signing in.
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);
	const location = useLocation();

	// wait till the config is authenticated to load the view
	if (status === "UNAUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return (
		<Suspense
			fallback={
				<div className="flex h-screen w-screen items-center justify-center">
					<Spinner />
				</div>
			}
		>
			<Outlet />
		</Suspense>
	);
};
