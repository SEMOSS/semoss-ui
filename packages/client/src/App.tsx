import { useEffect } from "react";
import { CSRF, Env } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { RootStoreContext } from "@/contexts";
import { RootStore } from "@/stores";
import { AppWrapper } from "./app-wrapper";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

// create a new root store
const _store = new RootStore();

export const App = () => {
	useEffect(() => {
		// load the environment from the document in (production)
		try {
			if (!document) {
				return;
			}

			const env = JSON.parse(
				document.getElementById("semoss-env")?.textContent || null,
			) as {
				MODULE: string;
			};

			// update the enviornment variables with the module
			if (env) {
				Env.update({
					MODULE: env.MODULE,
				});
			}
		} catch (_e) {}
		// intialize it
		_store.configStore.initialize().then(() => {
			// set as enabled
			CSRF.isEnabled = _store.configStore.store.config.csrf;
			Env.update({ CSRF: _store.configStore.store.config.csrf });
		});
	}, []);

	//  NCRT ASK - (https://play.semoss.org/ncrt/SemossWeb/packages/client/dist/#!/)
	if (window.location.href.includes("client/dist/#!/")) {
		window.location.href = window.location.href.replace(
			/(client\/dist\/)#!/,
			"$1#",
		);
	}

	return (
		<RootStoreContext.Provider value={_store}>
			<ThemeProvider defaultTheme="light">
				<AppWrapper />
				<Toaster />
			</ThemeProvider>
		</RootStoreContext.Provider>
	);
};
