import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	InsightProvider,
	useSession,
	useSessionRetry,
} from "@semoss/sdk/react";
import { InsightReadyGate } from "@semoss/shared";
import { Button, Muted, Spinner } from "@semoss/ui/next";

/**
 * Wrap the routes that need a signed in user. It reads the SDK's session:
 * a spinner while it is read, the login page when signed out, and the error
 * with Retry when it could not be read. Once signed in it makes the app's
 * insight and renders the pages once it is ready; they read it through
 * `useInsight`.
 */
export const AuthenticatedLayout = () => {
	const { t } = useTranslation("auditlog");
	const status = useSession((state) => state.status);
	const { isRetrying, retry } = useSessionRetry();

	// track the location
	const location = useLocation();

	if (status === "INITIALIZING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (status === "UNAUTHENTICATED") {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (status === "ERROR") {
		return (
			<div
				role="alert"
				className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
			>
				<Muted className="max-w-md">{t("layout.loadFailed")}</Muted>
				<Button
					type="button"
					variant="outline"
					disabled={isRetrying}
					onClick={retry}
				>
					{isRetrying ? <Spinner /> : null}
					{t("common:buttons.retry")}
				</Button>
			</div>
		);
	}

	return (
		<InsightProvider>
			<InsightReadyGate
				errorFallback={
					<div
						role="alert"
						className="flex h-full w-full items-center justify-center p-6 text-center"
					>
						<Muted className="max-w-md">
							{t("layout.loadFailed")}
						</Muted>
					</div>
				}
			>
				<Outlet />
			</InsightReadyGate>
		</InsightProvider>
	);
};
