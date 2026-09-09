import { useEffect } from "react";
import { LoadingScreen } from "@semoss/ui/next";
import { Router } from "@/pages";
import { CookieWrapper } from "./components/cookies";
import { useConfig } from "./hooks";

export const AppWrapper = () => {
	const theme = useConfig((state) => state.theme);

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
