import { Navigate, useLocation } from "react-router-dom";

/**
 * Redirect from legacy /engine/* paths to top-level routes
 */
export const EngineRedirect = () => {
	const location = useLocation();
	// Remove /engine prefix from the path
	const newPath = location.pathname.replace(/^\/engine/, "");
	console.error(
		`Redirecting from legacy path ${location.pathname} to ${newPath || "/"}`,
	);
	return <Navigate to={newPath || "/"} replace />;
};
