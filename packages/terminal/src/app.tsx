import { I18nBuilder, I18nextProvider, useTranslation } from "@semoss/i18n";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { LoginPage } from "@semoss/shared";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { EmbedTerminal } from "./components/embed-terminal/embed-terminal";

Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY,
	SECRET_KEY: import.meta.env.SECRET_KEY,
});

const i18n = new I18nBuilder("terminal").i18n;

const Branding = () => {
	const { t } = useTranslation("chrome");
	return <div className="font-semibold text-lg">{t("branding")}</div>;
};

export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<InsightProvider>
				<ThemeProvider
					defaultTheme="light"
					storageKey="smss-ui-theme-terminal"
				>
					<LoginPage branding={<Branding />}>
						<EmbedTerminal />
					</LoginPage>
					<Toaster position="top-center" closeButton />
				</ThemeProvider>
			</InsightProvider>
		</I18nextProvider>
	);
};
