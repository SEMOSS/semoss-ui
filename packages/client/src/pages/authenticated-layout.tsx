import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "@semoss/ui/next";
import { useSession } from "@/hooks/";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);
	const location = useLocation();

	// wait till the config is authenticated to load the view
	if (status === "MISSING AUTHENTICATION") {
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
