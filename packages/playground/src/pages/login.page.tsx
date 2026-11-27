import { Navigate, useLocation } from "react-router";
import { useSession } from "@semoss/sdk/react";
import { LoginForm } from "@semoss/shared";
import { useTheme } from "@semoss/ui/next";
import { AppLogo } from "@/features/navigation/app-logo";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/**
 * The sign in page: the shared `LoginForm` beside the theme's login image. A
 * signed in user goes back to the page they came from.
 */
export const LoginPage = () => {
	const theme = usePlaygroundTheme();
	const status = useSession((state) => state.status);
	const { theme: colorMode } = useTheme();

	// dark, or system while the OS prefers dark
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	const location = useLocation();

	// `AuthenticatedLayout` passes the page the user was sent here from
	const returnPath =
		(location.state as { from: Location })?.from?.pathname || "/";

	if (status === "AUTHENTICATED") {
		return <Navigate to={returnPath} replace />;
	}

	const illustrationSrc = isDark
		? theme.images.loginDark
		: theme.images.login;

	return (
		<div
			className={`grid min-h-svh bg-muted/30 ${illustrationSrc ? "lg:grid-cols-2" : ""}`}
		>
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<div className="flex items-center gap-2 font-medium">
						<AppLogo full={true} />
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
						<LoginForm />
					</div>
				</div>
			</div>
			{illustrationSrc && (
				<div className="relative hidden border-s bg-sidebar lg:block">
					<img
						src={illustrationSrc}
						alt=""
						className="absolute inset-0 h-full w-full select-none object-cover"
					/>
				</div>
			)}
		</div>
	);
};
