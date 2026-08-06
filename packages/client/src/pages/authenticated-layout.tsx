import { observer } from "mobx-react-lite";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "@semoss/ui/next";
import { useRootStore } from "@/hooks/";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = observer(() => {
	const { configStore } = useRootStore();
	const location = useLocation();

	// wait till the config is authenticated to load the view
	if (configStore.store.status === "MISSING AUTHENTICATION") {
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
});
