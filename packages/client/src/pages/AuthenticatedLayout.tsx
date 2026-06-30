import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRootStore } from "@/hooks/";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = observer(() => {
	const { configStore, monolithStore } = useRootStore();
	const location = useLocation();

	// biome-ignore lint/correctness/useExhaustiveDependencies: MobX observer handles reactive updates; store object identity is stable
	useEffect(() => {
		if (configStore.store.status === "SUCCESS") {
			monolithStore
				.runQuery("GetUserPlatformFeatures();")
				.then((res) => {
					const { operationType, output } = res.pixelReturn[0];
					if (operationType.indexOf("ERROR") === -1 && output) {
						configStore.store.platformFeatures = output as Record<
							string,
							boolean
						>;
					}
				})
				.catch(() => {
					// fail open
				});
		}
	}, [configStore.store.status, monolithStore]);

	// wait till the config is authenticated to load the view
	if (configStore.store.status === "MISSING AUTHENTICATION") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
});
