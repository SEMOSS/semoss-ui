import { Navigate, Outlet, useLocation } from "react-router";
import { InsightProvider, useSession } from "@semoss/sdk/react";
import { InsightReadyGate, useSessionRetry } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { ErrorPage } from "@/pages/error.page";

/** Shown while the session, then the app's insight, is read. */
const LOADING = (
	<div className="flex h-full w-full items-center justify-center py-4">
		<Spinner aria-label="Loading Collaboration" />
	</div>
);

/**
 * Gates the signed in routes on the SDK's session: a spinner while it is read,
 * the login page (with the intended route) when signed out, and the error with
 * Retry when it could not be read. Once signed in it makes the app's insight
 * and renders the pages once it is ready; they read it through `useInsight`.
 */
export const AuthorizedLayout = () => {
	const status = useSession((state) => state.status);
	const { isRetrying, retry } = useSessionRetry();
	const { pathname } = useLocation();

	if (status === "INITIALIZING") {
		return LOADING;
	}

	// If the user is not signed in, take them to the login page, and pass their intended route
	if (status === "UNAUTHENTICATED")
		return <Navigate to={"/login"} state={{ target: pathname }} />;

	if (status === "ERROR") {
		return <ErrorPage onRetry={retry} isRetrying={isRetrying} />;
	}

	return (
		<InsightProvider>
			<InsightReadyGate
				errorFallback={<ErrorPage />}
				loadingFallback={LOADING}
			>
				<Outlet />
			</InsightReadyGate>
		</InsightProvider>
	);
};
