import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";
import { useTheme } from "@semoss/ui/next";
import loginImage from "@/assets/img/login.svg";
import loginImageDark from "@/assets/img/login-darkmode.png";
import { AppLogo } from "@/components";
import { useRoot } from "@/hooks";
import { useThemeTitle } from "@/hooks/use-theme-title";
import { setFavicon } from "@/utility";

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
	const { root } = useRoot();
	const theme = root.theme;
	const { isAuthorized } = useInsight();
	const { theme: colorMode } = useTheme();

	// theme = dark or system matches dark
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches); // gets system preference

	const location = useLocation();

	// get the path the user is coming from
	const path = (location.state as { from: Location })?.from?.pathname || "/";

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

	// navigate if already logged in
	if (isAuthorized) {
		return <Navigate to={path} replace />;
	}

	// handling the login image source based on theme
	const src = isDark
		? root.theme.images.loginDark || loginImageDark
		: root.theme.images.login || loginImage;

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<div className="flex items-center gap-2 font-medium">
						<AppLogo full={true} />
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
					src={src}
					alt="Background"
					className="absolute inset-0 h-full w-full select-none object-cover"
				/>
			</div>
		</div>
	);
});
