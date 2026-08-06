import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { LoadingScreen } from "@semoss/ui/next";
import { Router } from "@/pages";
import { getRouterBasename } from "@/utility/router";
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
		<LoadingScreen>
			<CookieWrapper>
				<BrowserRouter basename={getRouterBasename()}>
					<Router />
				</BrowserRouter>
			</CookieWrapper>
		</LoadingScreen>
	);
});
