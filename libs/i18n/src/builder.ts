import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { getLanguageDirection, LANGUAGES } from "./constants";
import { coreResources } from "./resources/core";
import { playgroundResources } from "./resources/playground";

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

	constructor(type: "playground") {
		this.i18n = i18n;

		let resources = coreResources;
		if (type === "playground") {
			resources = playgroundResources;
		}

		if (!resources) {
			throw new Error("Invalid i18n type");
		}

		this.i18n
			.use(LanguageDetector)
			.use(initReactI18next)
			.init({
				resources,
				fallbackLng: "en",
				defaultNS,
				interpolation: {
					escapeValue: false, // React already escapes
				},

				// Language detection order
				detection: {
					order: ["localStorage", "navigator"],
					caches: ["localStorage"],
					lookupLocalStorage: "smss-language",
				},
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
