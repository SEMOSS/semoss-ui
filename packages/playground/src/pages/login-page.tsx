import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { SessionLoginForm } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { setFavicon } from "@semoss/utility/browser";
import { AppLogo } from "@/components/common/app-logo";
import { useIsDarkMode } from "@/hooks/use-is-dark-mode";
import { useRoot } from "@/hooks/use-root";
import { useThemeTitle } from "@/hooks/use-theme-title";

/**
 * LoginPage
 */
export const LoginPage = () => {
	const { root } = useRoot();
	const theme = root.theme;
	const status = useSession((state) => state.status);

	// theme = dark or system matches dark
	const isDark = useIsDarkMode();

	const location = useLocation();

	// get the path the user is coming from
	const path = (location.state as { from: Location })?.from?.pathname || "/";

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

	// the first read of the session decides whether to sign in at all
	if (status === "INITIALIZING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// navigate if already logged in
	if (status === "AUTHENTICATED") {
		return <Navigate to={path} replace />;
	}

	// handling the login image source based on theme
	const src = isDark ? root.theme.images.loginDark : root.theme.images.login;

	return (
		<div
			className={`grid min-h-svh bg-muted/30 ${src ? "lg:grid-cols-2" : ""}`}
		>
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<div className="flex items-center gap-2 font-medium">
						<AppLogo full={true} />
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
						<SessionLoginForm />
					</div>
				</div>
			</div>
			{src && (
				<div className="relative hidden border-s bg-sidebar lg:block">
					<img
						src={src}
						alt=""
						className="absolute inset-0 h-full w-full select-none object-cover"
					/>
				</div>
			)}
		</div>
	);
};
