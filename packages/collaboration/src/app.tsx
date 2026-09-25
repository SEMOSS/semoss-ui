import {
	I18nBuilder,
	I18nextProvider,
	playgroundResources,
} from "@semoss/i18n";
import { AccessStoreProvider, createAccessStore } from "@semoss/panels";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "./pages/router";

Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY,
	SECRET_KEY: import.meta.env.SECRET_KEY,
});

const i18nBuilder = new I18nBuilder(playgroundResources);
const accessStore = createAccessStore();

export const App = () => (
	<I18nextProvider i18n={i18nBuilder.i18n}>
		<AccessStoreProvider store={accessStore}>
			<InsightProvider>
				<ThemeProvider
					defaultTheme="light"
					storageKey="smss-ui-theme-collaboration"
				>
					<div className="min-h-screen">
						<Router />
					</div>
					<Toaster position="top-center" />
				</ThemeProvider>
			</InsightProvider>
		</AccessStoreProvider>
	</I18nextProvider>
);
