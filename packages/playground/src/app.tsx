import {
	I18nBuilder,
	I18nextProvider,
	playgroundResources,
} from "@semoss/i18n";
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

export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
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
		</I18nextProvider>
	);
};
