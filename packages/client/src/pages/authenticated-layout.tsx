import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);
	const location = useLocation();

	// the router waits while the session is read; anyone not signed in logs in
	if (status !== "AUTHENTICATED") {
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
