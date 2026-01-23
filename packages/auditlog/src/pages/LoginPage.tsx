import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";
import loginBackground from "@/assets/img/login-background.svg";
import { AppLogo } from "@/components/app-logo";

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
	const { isAuthorized, ...insightProps } = useInsight();
	const location = useLocation();
	console.log(insightProps, "insightProps");
	// get the path the user is coming from
	const path = (location.state as { from: Location })?.from?.pathname || "/";

	// navigate if already logged in
	if (isAuthorized) {
		return <Navigate to={path} replace />;
	}

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<div className="flex items-center gap-2 font-medium">
						<AppLogo />
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginForm />
					</div>
				</div>
			</div>
			<div className="relative hidden bg-muted lg:block">
				<img
					src={loginBackground}
					alt="Background"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
});
