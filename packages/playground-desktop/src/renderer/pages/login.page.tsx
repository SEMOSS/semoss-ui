import { Navigate, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";

/** Sign in to the server, then return to where the user was going. */
export const LoginPage = () => {
	const status = useSession((state) => state.status);
	const location = useLocation();
	const from =
		(location.state as { from?: { pathname?: string } } | null)?.from
			?.pathname ?? "/new";

	if (status === "AUTHENTICATED") {
		return <Navigate to={from} replace />;
	}

	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
			<div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
				<LoginForm />
			</div>
		</main>
	);
};
