import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { getLanguageDirection, LANGUAGES } from "./constants";
import { clientResources } from "./resources/client";
import { coreResources } from "./resources/core";
import { playgroundResources } from "./resources/playground";
import { terminalResources } from "./resources/terminal";

export const defaultNS = "common";

// Mirror i18next's active language onto <html lang> and <html dir> so RTL
// scripts (Arabic, Hebrew, Persian, Urdu) get correct bidi behavior and
// screen readers announce the right locale.
const syncHtmlLangAndDir = (language: string) => {
	if (typeof document === "undefined") return;
	const html = document.documentElement;
	html.lang = language;
	html.dir = getLanguageDirection(language);
};

export class I18nBuilder {
	/** Register i18n instance */
	i18n: typeof i18n;

	constructor(type: "playground" | "terminal" | "client") {
		this.i18n = i18n;

		let resources = coreResources;
		if (type === "playground") {
			resources = playgroundResources;
		} else if (type === "terminal") {
			resources = terminalResources;
		} else if (type === "client") {
			resources = clientResources;
		}

		if (!resources) {
			throw new Error("Invalid i18n type");
		}

		// The client app hasn't been localized yet — lock it to English so the
		// shared components (file explorer, dialogs, etc.) render their default
		// English copy instead of leaking raw i18n keys. Skip language detection
		// entirely so a stale `smss-language` localStorage value can't flip it.
		const lockToEnglish = type === "client";

		const instance = this.i18n.use(initReactI18next);
		if (!lockToEnglish) {
			instance.use(LanguageDetector);
		}

		instance.init({
			resources,
			fallbackLng: "en",
			defaultNS,
			interpolation: {
				escapeValue: false, // React already escapes
			},

			// Pin the client to English; everyone else gets language detection.
			...(lockToEnglish
				? { lng: "en" }
				: {
						detection: {
							order: ["localStorage", "navigator"],
							caches: ["localStorage"],
							lookupLocalStorage: "smss-language",
						},
					}),
			supportedLngs: LANGUAGES.map((lang) => lang.code),

			// Development settings
			debug: false,

			// React settings
			react: {
				useSuspense: false,
			},
		});

		syncHtmlLangAndDir(this.i18n.language);
		this.i18n.on("languageChanged", syncHtmlLangAndDir);
	}
}
