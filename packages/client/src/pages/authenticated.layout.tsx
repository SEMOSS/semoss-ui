import { Suspense, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	P,
	Spinner,
} from "@semoss/ui/next";

/**
 * Layout for the routes that need a signed in user: a signed out user goes to
 * the login page, which returns them here after signing in. When the session
 * could not be read, these routes show Retry; the public routes still render.
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
			<div className="flex h-screen w-screen items-center justify-center p-4">
				<Alert variant="destructive" className="max-w-md">
					<AlertTitle>Unable to load your session</AlertTitle>
					<AlertDescription>
						<P className="break-words text-sm">{errorMessage}</P>
						<Button
							type="button"
							variant="outline"
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
					</AlertDescription>
				</Alert>
			</div>
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
