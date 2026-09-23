import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
	const authentication = useSession(
		(state) => state.lifecycle.authentication,
	);
	const location = useLocation();

	// wait till the config is authenticated to load the view
	if (authentication === "unauthenticated") {
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
