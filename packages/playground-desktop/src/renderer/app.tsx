import type { ReactNode } from "react";
import { desktopResources, I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { ThemeProvider, Toaster } from "@semoss/ui/next";

// Languages load lazily (one chunk per language) through the builder's backend.
const i18nBuilder = new I18nBuilder(desktopResources);

/** Resolves once the active language's translations are in. */
export const i18nReady = i18nBuilder.ready;

/** Props for {@link App}. */
interface AppProps {
	/** The screen to show: the connect screen or the router. */
	children: ReactNode;
}

/**
 * The app's root: translations, light and dark theme, and toasts. It holds no
 * session, so the connect screen can render before any server is saved.
 */
export const App = ({ children }: AppProps) => (
	<I18nextProvider i18n={i18nBuilder.i18n}>
		<ThemeProvider defaultTheme="system" storageKey="smss-ui-theme-desktop">
			<div className="absolute inset-0 h-screen w-screen overflow-hidden">
				{children}
			</div>
			<Toaster position="top-center" />
		</ThemeProvider>
	</I18nextProvider>
);
