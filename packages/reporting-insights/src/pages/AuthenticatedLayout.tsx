import {
	Navigate,
	Outlet,
	useLocation,
	useSearchParams,
} from "react-router-dom";
import { useInsight } from "@semoss/sdk-react";

/**
 * Wraps all protected routes.
 *
 * The SEMOSS SDK initialises asynchronously — `isAuthorized` starts as false
 * even for logged-in users until the session check resolves. We block any
 * redirect decision until `isInitialized` is true so a page refresh never
 * bounces the user through /login.
 *
 * When the app is published inside SEMOSS the SDK resolves immediately and
 * the loading state is imperceptible.
 */
export function AuthenticatedLayout() {
	const { isInitialized, isAuthorized } = useInsight();
	const [searchParams] = useSearchParams();
	const location = useLocation();

	// Strip the sessionToken query-param that SEMOSS injects on OAuth callback
	if (searchParams.has("sessionToken")) {
		return <Navigate to="/" state={{ from: location }} replace />;
	}

	// SDK is still running its async session check — show a neutral loading
	// screen so we never redirect a logged-in user to /login mid-initialisation
	if (!isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-slate-50">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
			</div>
		);
	}

	if (!isAuthorized) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <Outlet />;
}
