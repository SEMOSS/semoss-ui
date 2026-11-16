import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useSession, useSessionRetry } from "@semoss/sdk/react";
import { Button, H1, Muted, Spinner } from "@semoss/ui/next";
import { useSavedServer } from "@/features/server-connection/use-saved-server";

/**
 * The routes that need a signed in user. It waits for the session, sends a
 * signed out user to sign in (and back here after), and, when the server
 * cannot be read, names it and offers Retry or a different server.
 */
export const SessionLayout = () => {
	const { t } = useTranslation(["desktop", "common"]);
	const status = useSession((state) => state.status);
	const { isRetrying, retry } = useSessionRetry();
	const location = useLocation();
	const navigate = useNavigate();
	const server = useSavedServer();

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
				<div className="flex max-w-md flex-col items-center gap-1 text-center">
					<H1 className="text-xl">
						{t("desktop:unreachable.title")}
					</H1>
					<Muted>
						{server
							? t("desktop:unreachable.description", {
									server: `${server.url}${server.module}`,
								})
							: t("desktop:unreachable.descriptionNoServer")}
					</Muted>
				</div>
				<div className="flex flex-wrap justify-center gap-2">
					<Button onClick={retry} disabled={isRetrying}>
						{isRetrying ? <Spinner aria-hidden /> : null}
						{t("common:buttons.retry")}
					</Button>
					{/* the server form is outside this gate, so it opens whatever the session */}
					<Button
						variant="outline"
						onClick={() => navigate("/server")}
					>
						{t("desktop:unreachable.changeServer")}
					</Button>
				</div>
			</div>
		);
	}
	return <Outlet />;
};
