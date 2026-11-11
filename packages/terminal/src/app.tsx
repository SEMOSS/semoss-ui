import {
	I18nBuilder,
	I18nextProvider,
	terminalResources,
	useTranslation,
} from "@semoss/i18n";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { LoginPage } from "@semoss/shared";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { EmbedTerminal } from "./components/embed-terminal/embed-terminal";

// In production the server writes MODULE into index.html (semoss-env tag, read
// when the SDK loads). In dev a tag still wins; otherwise MODULE and the access keys come from .env.
if (import.meta.env.DEV) {
	Env.update({
		MODULE: Env.MODULE || import.meta.env.MODULE || "/Monolith",
		ACCESS_KEY: import.meta.env.ACCESS_KEY,
		SECRET_KEY: import.meta.env.SECRET_KEY,
	});
}

// Languages load lazily (one chunk per language) via the builder's dynamic
// backend.
const i18nBuilder = new I18nBuilder(terminalResources);
const i18n = i18nBuilder.i18n;

// Awaited by main.tsx before the first render so the active language is present.
export const i18nReady = i18nBuilder.ready;

const Branding = () => {
	const { t } = useTranslation("chrome");
	return <div className="font-semibold text-lg">{t("branding")}</div>;
};

/**
 * The standalone terminal. `LoginPage` gates on the SDK's session (started in
 * main.tsx), so the terminal's insight is made only once the user signs in.
 */
export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<ThemeProvider
				defaultTheme="light"
				storageKey="smss-ui-theme-terminal"
			>
				<LoginPage branding={<Branding />}>
					<InsightProvider>
						<EmbedTerminal />
					</InsightProvider>
				</LoginPage>
				<Toaster position="top-center" closeButton />
			</ThemeProvider>
		</I18nextProvider>
	);
};
