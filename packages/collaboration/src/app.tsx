import {
	I18nBuilder,
	I18nextProvider,
	playgroundResources,
} from "@semoss/i18n";
import { Env } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "./pages/router";

// The server writes MODULE into index.html (semoss-env tag, read when the SDK
// loads) and it always wins; .env, then "/Monolith", cover a page without one.
Env.update({
	MODULE: Env.MODULE || import.meta.env.MODULE || "/Monolith",
});

// The access keys are for local development only.
if (import.meta.env.DEV) {
	Env.update({
		ACCESS_KEY: import.meta.env.ACCESS_KEY,
		SECRET_KEY: import.meta.env.SECRET_KEY,
	});
}

const i18nBuilder = new I18nBuilder(playgroundResources);

/**
 * The collaboration app's root. The file panels need no provider here: they
 * read resource permissions from the SDK's `Session.permissions`. The app's
 * insight is made by `AuthorizedLayout` once the user signs in.
 */
export const App = () => (
	<I18nextProvider i18n={i18nBuilder.i18n}>
		<ThemeProvider
			defaultTheme="light"
			storageKey="smss-ui-theme-collaboration"
		>
			<div className="min-h-screen">
				<Router />
			</div>
			<Toaster position="top-center" />
		</ThemeProvider>
	</I18nextProvider>
);
