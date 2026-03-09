import { I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { Env, InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { Router } from "@/pages";
import {
	PRESET_CSS_KEYS,
	THEME_PRESET_STORAGE_KEY,
	THEME_PRESETS,
} from "@/stores/root/theme-presets";

// use the environment variable to set the module
Env.update({
	MODULE: import.meta.env.MODULE || "/Monolith",
	ACCESS_KEY: import.meta.env.ACCESS_KEY,
	SECRET_KEY: import.meta.env.SECRET_KEY,
});

// create a new i18n instance for the playground
const i18n = new I18nBuilder("playground").i18n;

/**
 * Restore CSS-variable overrides for the stored theme preset.
 * The ThemeProvider already restores light/dark mode from its own
 * localStorage key, but branded presets (e.g. Deloitte) also set
 * custom CSS variables that need to be re-applied on load.
 */
function restorePresetOverrides() {
	try {
		const id = localStorage.getItem(THEME_PRESET_STORAGE_KEY);
		if (!id) return;

		const preset = THEME_PRESETS.find((p) => p.id === id);
		if (!preset?.cssVariables) return;

		const root = document.documentElement;
		for (const key of PRESET_CSS_KEYS) {
			root.style.removeProperty(key);
		}
		for (const [key, value] of Object.entries(preset.cssVariables)) {
			root.style.setProperty(key, value);
		}
	} catch {
		// noop – localStorage may be unavailable
	}
}

// Apply before first paint so users see the correct branded colors
restorePresetOverrides();

export const App = () => {
	return (
		<I18nextProvider i18n={i18n}>
			<InsightProvider>
				<ThemeProvider defaultTheme="light">
					<div className="absolute inset-0 h-screen w-screen overflow-hidden">
						<Router />
					</div>
					<Toaster position="top-center" />
				</ThemeProvider>
			</InsightProvider>
		</I18nextProvider>
	);
};
