import { useEffect } from "react";
import { LoadingScreen } from "@semoss/ui/next";
import { usePlatformTheme } from "@/hooks/use-platform-theme";
import { Router } from "@/pages/router";
import { CookieWrapper } from "./components/cookies/cookie-wrapper";

/**
 * The app's root below the providers: sets the page title and favicon from the
 * platform theme, and renders the routes behind the loading screen and the
 * cookie banner.
 */
export const AppWrapper = () => {
	const theme = usePlatformTheme();

	useEffect(() => {
		try {
			document.title = theme.name;

			const faviconLink = theme.logo;
			const link = document.createElement("link");
			link.rel = "icon";
			link.href = faviconLink;
			document.head.appendChild(link);
		} catch {
			console.error("Unable to set title on page");
		}
	}, [theme]);

	return (
		<LoadingScreen>
			<CookieWrapper>
				<Router />
			</CookieWrapper>
		</LoadingScreen>
	);
};
