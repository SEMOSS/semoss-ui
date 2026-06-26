import { auditlogResources, I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { LoadingScreen, ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
});

// Responsive i18n instance: unlike the client, the standalone Audit Log app is NOT
// locked to English — it follows the shared `smss-language` value (the one the
// playground language switcher writes) with English fallback. `i18nReady` is awaited
// in main.tsx so the first paint already has its strings.
const i18nBuilder = new I18nBuilder(auditlogResources);
const i18n = i18nBuilder.i18n;
export const i18nReady = i18nBuilder.ready;

/**
 * The App component is the main entry point of the application.
 * It contains the Notification, LoadingScreen, ThemeProvider and Router components.
 * The ThemeProvider is used to set the default theme to "light".
 * The Router is used to render the pages.
 * The LoadingScreen is used to display a loading indicator when the application is loading.
 * The Notification is used to display notifications to the user.
 * The InsightProvider is used to provide insights to the application.
 */
function App() {
	return (
		<I18nextProvider i18n={i18n}>
			<InsightProvider>
				<LoadingScreen>
					<ThemeProvider defaultTheme="light">
						<div className="absolute inset-0 h-screen w-screen overflow-auto">
							<Router />
						</div>
						<Toaster />
					</ThemeProvider>
				</LoadingScreen>
			</InsightProvider>
		</I18nextProvider>
	);
}

export default App;
