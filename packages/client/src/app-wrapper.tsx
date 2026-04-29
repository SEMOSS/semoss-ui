import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { HashRouter } from "react-router-dom";
import { LoadingScreen, ThemeProvider, Toaster, useTheme } from "@semoss/ui/next";
import { Router } from "@/pages";
import { CookieWrapper } from "./components/cookies";
import { useRootStore } from "./hooks";

export const AppWrapper = observer(() => {
	const { configStore } = useRootStore();
	const { theme: selectedTheme } = useTheme();

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

	const themeMode = useMemo<"light" | "dark">(() => {
		if (selectedTheme === "dark") {
			return "dark";
		}

		if (selectedTheme === "light") {
			return "light";
		}

		if (typeof window !== "undefined") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}

		return "light";
	}, [selectedTheme]);

	return (
		<ThemeProvider defaultTheme="light" type={themeMode}>
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
