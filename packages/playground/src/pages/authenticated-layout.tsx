import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { SessionExpiredModal } from "@/components";

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = () => {
	const { isAuthorized } = useInsight();

	// track the location
	const location = useLocation();

	// Remember whether this tab was ever authorized. A session that times out
	// mid-use (wasAuthorized already true) gets an in-place "session expired"
	// modal instead of a route swap, so state like an unsent chat draft isn't
	// wiped out by unmounting the authenticated tree. A tab that was never
	// authorized (fresh/unauthenticated load) still goes to the login page.
	const wasAuthorized = useRef(false);
	useEffect(() => {
		if (isAuthorized) {
			wasAuthorized.current = true;
		}
	}, [isAuthorized]);

	if (!isAuthorized && !wasAuthorized.current) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return (
		<>
			<Outlet />
			{!isAuthorized && <SessionExpiredModal />}
		</>
	);
};
