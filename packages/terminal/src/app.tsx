import { I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { LoginPage } from "@semoss/shared";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { EmbedTerminal } from "./components/embed-terminal/embed-terminal";

Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY,
	SECRET_KEY: import.meta.env.SECRET_KEY,
});

// "playground" is currently the only namespace I18nBuilder accepts; the
// shared FileExplorer/Toast components fall back to common keys for anything
// it doesn't define, so re-using it here is safe.
const i18n = new I18nBuilder("playground").i18n;

export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<InsightProvider>
				<ThemeProvider
					defaultTheme="light"
					storageKey="smss-ui-theme-terminal"
				>
					<LoginPage
						branding={
							<div className="font-semibold text-lg">
								Terminal
							</div>
						}
					>
						<EmbedTerminal />
					</LoginPage>
					<Toaster position="top-center" closeButton />
				</ThemeProvider>
			</InsightProvider>
		</I18nextProvider>
	);
};
