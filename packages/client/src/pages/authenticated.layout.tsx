import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession, useSessionRetry } from "@semoss/sdk/react";
import { Button, Muted, Spinner } from "@semoss/ui/next";
import { ErrorState } from "@/components/common/error-state";

/**
 * Layout for the routes that need a signed in user: a signed out user goes to
 * the login page, which returns them here after signing in. When the config
 * or the user could not be read, for any reason other than a signed out user,
 * these routes show the error screen with Retry; the public routes still render.
 */
export const AuthenticatedLayout = () => {
	const status = useSession((state) => state.status);
	const errorMessage = useSession((state) => state.error?.message ?? "");
	const { isRetrying, retry } = useSessionRetry();
	const location = useLocation();

	// wait till the config is authenticated to load the view
	if (status === "UNAUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// the config or the user could not be read, so no page has what it needs
	if (status === "ERROR") {
		return (
			<ErrorState
				title="Something went wrong!"
				description="We couldn't load the platform. Try again, and if the issue persists, please reach out and let us know."
			>
				{errorMessage ? (
					<Muted className="max-w-md break-words">
						{errorMessage}
					</Muted>
				) : null}
				<Button
					type="button"
					variant="outline"
					className="mt-2"
					disabled={isRetrying}
					onClick={retry}
				>
					{isRetrying ? (
						<>
							<Spinner />
							Retrying...
						</>
					) : (
						"Retry"
					)}
				</Button>
			</ErrorState>
		);
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
