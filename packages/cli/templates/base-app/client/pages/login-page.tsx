import { Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import appImage from "@/assets/img/app.svg";
import loginImage from "@/assets/img/login.svg";
import { LoginForm } from "@/components/login-form";

/**
 * Renders a the login page if the user is not already logged in, otherwise sends them to the home page.
 *
 * @component
 */
export const LoginPage = () => {
	const { isAuthorized } = useInsight();
	const location = useLocation();

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
						<img alt="logo" src={appImage} />
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
					src={loginImage}
					alt="Background"
					className="absolute inset-0 h-full w-full select-none object-cover dark:brightness-[0.2] dark:grayscale"
				/>
			</div>
		</div>
	);
};
