import {
	I18nBuilder,
	I18nextProvider,
	playgroundResources,
} from "@semoss/i18n";
import { AccessStoreProvider, createAccessStore } from "@semoss/panels";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { LandscapeRestriction } from "@/components/common/landscape-restriction";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY,
	SECRET_KEY: import.meta.env.SECRET_KEY,
});

// create a new i18n instance for the playground. Languages load lazily (one
// chunk per language) via the builder's dynamic backend.
const i18nBuilder = new I18nBuilder(playgroundResources);
const i18n = i18nBuilder.i18n;

// Awaited by main.tsx before the first render so the active language is present.
export const i18nReady = i18nBuilder.ready;

// The file panels resolve resource permissions off a host-supplied cache. The
// client folds it into its session store, so logging out clears it; the
// playground has no session of its own, so it mounts the cache on its own. One
// per app, not per sidebar -- a permission is a fact about (user, resource) and
// two rooms open on the same one must not disagree.
const accessStore = createAccessStore();

export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<AccessStoreProvider store={accessStore}>
				<InsightProvider>
					{/* TODO: read default theme from theme map somehow */}
					<ThemeProvider
						defaultTheme="light"
						storageKey="smss-ui-theme-playground"
					>
						<LandscapeRestriction />
						<div className="absolute inset-0 h-screen w-screen overflow-hidden">
							<Router />
						</div>
						<Toaster position="top-center" />
					</ThemeProvider>
				</InsightProvider>
			</AccessStoreProvider>
		</I18nextProvider>
	);
};
