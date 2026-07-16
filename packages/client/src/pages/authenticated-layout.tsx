import { observer } from "mobx-react-lite";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRootStore } from "@/hooks/";

/** Platform feature visibility map. A missing or true key means the feature is visible. */
export type PlatformFeatures = Record<string, boolean>;

interface PlatformFeaturesContextValue {
	platformFeatures: PlatformFeatures;
}

export const PlatformFeaturesContext =
	createContext<PlatformFeaturesContextValue>({
		platformFeatures: {},
	});

export const usePlatformFeatures = () => useContext(PlatformFeaturesContext);

/**
 * Wrap the database routes and add additional functionality.
 * Loads platform nav feature visibility once per authenticated session.
 */
export const AuthenticatedLayout = observer(() => {
	const { configStore, monolithStore } = useRootStore();
	const location = useLocation();
	const [platformFeatures, setPlatformFeatures] = useState<PlatformFeatures>(
		{},
	);
	const loadedRef = useRef(false);

	const isAuthenticated =
		configStore.store.status !== "MISSING AUTHENTICATION";

	useEffect(() => {
		if (!isAuthenticated || loadedRef.current) return;
		loadedRef.current = true;
		monolithStore
			.runQuery("GetUserPlatformFeatures();")
			.then((response) => {
				const { operationType, output } = response.pixelReturn[0];
				if (
					operationType.indexOf("ERROR") === -1 &&
					output &&
					typeof output === "object"
				) {
					setPlatformFeatures(output as PlatformFeatures);
				}
			})
			.catch(() => {
				// fail open — if the call fails, leave features as empty (all visible)
			});
	}, [isAuthenticated, monolithStore]);

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return (
		<PlatformFeaturesContext.Provider value={{ platformFeatures }}>
			<Outlet />
		</PlatformFeaturesContext.Provider>
	);
});
