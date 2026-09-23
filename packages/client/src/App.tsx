import { useEffect } from "react";
import { clientResources, I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { createSessionStore, Env } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { AppWrapper } from "./app-wrapper";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

// The client isn't localized yet, but shared components (file explorer,
// dialogs, etc.) now use i18n. Initialize an English-locked instance so those
// keys resolve to their default copy instead of rendering raw. Languages load
// lazily (one chunk per language) and the embedded terminal's namespaces are
// fetched on demand (preloadNamespaces) so they don't weigh down first paint.
const i18nBuilder = new I18nBuilder(clientResources, { lockToEnglish: true });
const i18n = i18nBuilder.i18n;

// Awaited by main.tsx before the first render so English copy is present
// instead of raw keys.
export const i18nReady = i18nBuilder.ready;

const sessionStore = createSessionStore();

export const App = () => {
	useEffect(() => {
		// load the environment from the document in (production)
		try {
			if (!document) {
				return;
			}

			const env = JSON.parse(
				document.getElementById("semoss-env")?.textContent ||
					JSON.stringify(null),
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

		void sessionStore
			.getState()
			.actions.initialize()
			.catch((error) => {
				console.error("Unable to initialize the session", error);
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
		<SessionProvider store={sessionStore}>
			<I18nextProvider i18n={i18n}>
				<ThemeProvider
					defaultTheme="light"
					storageKey="smss-ui-theme-client"
				>
					<AppWrapper />
					<Toaster />
				</ThemeProvider>
			</I18nextProvider>
		</SessionProvider>
	);
};
