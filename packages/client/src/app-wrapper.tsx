import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { LoadingScreen, ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";
import { CookieWrapper } from "./components/cookies";
import { useRootStore } from "./hooks";

export const AppWrapper = observer(() => {
	const { configStore } = useRootStore();

	useEffect(() => {
		try {
			document.title = configStore.theme.name;

			const faviconLink = configStore.theme.logo;
			const link = document.createElement("link");
			link.rel = "icon";
			link.href = faviconLink;
			document.head.appendChild(link);
		} catch {
			console.error("Unable to set title on page");
		}
	}, [configStore.theme]);

	return (
		<ThemeProvider defaultTheme="light">
			<Toaster />
			<LoadingScreen>
				<CookieWrapper>
					<HashRouter>
						<Router />
					</HashRouter>
				</CookieWrapper>
			</LoadingScreen>
		</ThemeProvider>
	);
});
