import { Navigate, useLocation, useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";
import { Button, Muted } from "@semoss/ui/next";
import { useSavedServer } from "@/features/server-connection/use-saved-server";
import { formatServerAddress } from "../../contract/server-connection";

/**
 * Sign in to the server, then return to where the user was going. Below the
 * form it names the server and offers a different one, since a wrong address
 * only shows up here.
 */
export const LoginPage = () => {
	const { t } = useTranslation("desktop");
	const status = useSession((state) => state.status);
	const location = useLocation();
	const navigate = useNavigate();
	const server = useSavedServer();
	const from =
		(location.state as { from?: { pathname?: string } } | null)?.from
			?.pathname ?? "/new";

	if (status === "AUTHENTICATED") {
		return <Navigate to={from} replace />;
	}

	return (
		<main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/30 p-6">
			<div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
				<LoginForm />
			</div>
			<div className="flex max-w-sm flex-col items-center gap-1 text-center">
				{server ? (
					<Muted className="break-all">
						{t("connect.current", {
							server: formatServerAddress(server),
						})}
					</Muted>
				) : null}
				{/* the server form is outside the session gate, so it opens signed out */}
				<Button variant="link" onClick={() => navigate("/server")}>
					{t("account.changeServer")}
				</Button>
			</div>
		</main>
	);
};
