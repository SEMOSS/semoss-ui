import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
	const { isAuthorized } = useInsight();
	const location = useLocation();

	// get the path the user is coming from
	const path =
		(location.state as { from: Location })?.from?.pathname || "/dashboard";

	// navigate if already logged in
	if (isAuthorized) {
		return <Navigate to={path} replace />;
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="font-bold text-3xl">Visual Rule Builder</h1>
					<p className="text-muted-foreground text-sm">
						Sign in to your account to continue
					</p>
				</div>
				<div className="space-y-4">
					<LoginForm />
				</div>
			</div>
		</div>
	);
});
