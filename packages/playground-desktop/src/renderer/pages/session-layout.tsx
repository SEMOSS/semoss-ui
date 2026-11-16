import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useSession, useSessionRetry } from "@semoss/sdk/react";
import { Button, Spinner } from "@semoss/ui/next";

/**
 * The routes that need a signed in user. It waits for the session, sends a
 * signed out user to sign in (and back here after), and offers Retry when the
 * server could not be read.
 */
export const SessionLayout = () => {
	const { t } = useTranslation("common");
	const status = useSession((state) => state.status);
	const { isRetrying, retry } = useSessionRetry();
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
				className="flex h-full w-full flex-col items-center justify-center gap-4"
			>
				<Button onClick={retry} disabled={isRetrying}>
					{isRetrying ? <Spinner aria-hidden /> : null}
					{t("buttons.retry")}
				</Button>
			</div>
		);
	}
	return <Outlet />;
};
