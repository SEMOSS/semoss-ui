import { I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { Notification } from "@semoss/ui";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY,
	SECRET_KEY: import.meta.env.SECRET_KEY,
});

// create a new i18n instance for the playground
const i18n = new I18nBuilder("playground").i18n;

export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<InsightProvider>
				<Notification>
					{/* TODO: read default theme from theme map somehow */}
					<ThemeProvider
						defaultTheme="light"
						storageKey="smss-ui-theme-playground"
					>
						<div className="absolute inset-0 h-screen w-screen overflow-hidden">
							<Router />
						</div>
						<Toaster position="top-center" />
					</ThemeProvider>
				</Notification>
			</InsightProvider>
		</I18nextProvider>
	);
};
