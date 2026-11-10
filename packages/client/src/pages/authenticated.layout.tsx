import { Suspense, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
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
	const refresh = useSession((state) => state.refresh);
	const [isRetrying, setIsRetrying] = useState(false);
	const location = useLocation();

	// wait till the config is authenticated to load the view
	if (status === "UNAUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// the config or the user could not be read, so no page has what it needs
	if (status === "ERROR") {
		const handleRetry = async () => {
			setIsRetrying(true);
			// never rejects: a failure shows as the ERROR status again
			await refresh();
			setIsRetrying(false);
		};

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
					onClick={handleRetry}
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
