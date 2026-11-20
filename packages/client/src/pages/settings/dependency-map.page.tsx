import { Navigate } from "react-router";
import { DependencyMap } from "@/features/dependency-map/dependency-map";
import { useSettings } from "@/hooks/useSettings";

/** Mount the Dependency Map only while Settings is in admin mode. */
export const DependencyMapPage = () => {
	const { adminMode } = useSettings();
	return adminMode ? <DependencyMap /> : <Navigate to="/settings" replace />;
};
