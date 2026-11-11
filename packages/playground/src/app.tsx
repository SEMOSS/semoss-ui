import {
	I18nBuilder,
	I18nextProvider,
	playgroundResources,
} from "@semoss/i18n";
import { Env } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { LandscapeRestriction } from "@/components/common/landscape-restriction";
import { LanguageDirection } from "@/components/common/language-direction";
import { Router } from "@/pages";

// In production the server writes MODULE into index.html (semoss-env tag, read
// when the SDK loads). In dev a tag still wins; otherwise MODULE and the access keys come from .env.
if (import.meta.env.DEV) {
	Env.update({
		MODULE: Env.MODULE || import.meta.env.MODULE || "/Monolith",
		ACCESS_KEY: import.meta.env.ACCESS_KEY,
		SECRET_KEY: import.meta.env.SECRET_KEY,
	});
}

// create a new i18n instance for the playground. Languages load lazily (one
// chunk per language) via the builder's dynamic backend.
const i18nBuilder = new I18nBuilder(playgroundResources);
const i18n = i18nBuilder.i18n;

// Awaited by main.tsx before the first render so the active language is present.
export const i18nReady = i18nBuilder.ready;

/**
 * The playground's root. It holds no insight: sign in, the user and the config
 * come from the SDK's `Session` and `Config` (started in `main.tsx`), and only
 * rooms mount an `InsightProvider`. The file panels read resource permissions
 * from `Session.permissions`.
 */
export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<LanguageDirection>
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
			</LanguageDirection>
		</I18nextProvider>
	);
};
