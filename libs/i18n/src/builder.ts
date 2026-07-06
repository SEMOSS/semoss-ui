import i18n, {
	type BackendModule,
	type ReadCallback,
	type Resource,
} from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { getLanguageDirection, LANGUAGES } from "./constants";
import type { LazyResources } from "./resources/types";

export const defaultNS = "common";

export interface I18nBuilderOptions {
	/**
	 * Pin the instance to English and skip language detection entirely. Used by
	 * the client app, which isn't localized yet and must render shared
	 * components' default English copy instead of leaking raw i18n keys (and so
	 * a stale `smss-language` localStorage value can't flip it).
	 */
	lockToEnglish?: boolean;
}

// Mirror i18next's active language onto <html lang> and <html dir> so RTL
// scripts (Arabic, Hebrew, Persian, Urdu) get correct bidi behavior and
// screen readers announce the right locale.
const syncHtmlLangAndDir = (language: string) => {
	if (typeof document === "undefined") return;
	const html = document.documentElement;
	html.lang = language;
	html.dir = getLanguageDirection(language);
};

// A minimal i18next backend that resolves a namespace by dynamically importing
// the matching language JSON. This is what makes languages lazy: i18next calls
// read() for each (language, namespace) it needs — at init for the active
// language and again whenever changeLanguage() runs — so only the language in
// use is ever fetched. A missing file for a locale (e.g. shared/* has no `nl`)
// resolves to an empty bundle, letting i18next fall back per-key to English.
const createDynamicBackend = (load: LazyResources["load"]): BackendModule => ({
	type: "backend",
	init: () => {},
	read: (language: string, namespace: string, callback: ReadCallback) => {
		const loader = load[namespace];
		if (!loader) {
			callback(null, {});
			return;
		}
		loader(language).then(
			(mod) => {
				const data = (mod as { default?: unknown })?.default ?? mod;
				callback(null, (data as Resource) ?? {});
			},
			() => callback(null, {}),
		);
	},
});

export class I18nBuilder {
	/** Shared i18next instance. */
	i18n: typeof i18n;

	/**
	 * Resolves once the initial language + namespaces have loaded. Await this
	 * before rendering so the first paint has its strings instead of raw keys.
	 */
	ready: Promise<unknown>;

	// Each app passes only the lazy resource config it needs (clientResources,
	// playgroundResources, terminalResources). The actual locale JSON lives
	// behind dynamic imports in that config, so none of it lands in the initial
	// bundle — see resources/types.ts.
	constructor(resources: LazyResources, options: I18nBuilderOptions = {}) {
		this.i18n = i18n;

		if (!resources?.load) {
			throw new Error("i18n resources are required");
		}

		const { lockToEnglish = false } = options;

		const instance = this.i18n
			.use(createDynamicBackend(resources.load))
			.use(initReactI18next);
		if (!lockToEnglish) {
			instance.use(LanguageDetector);
		}

		this.ready = instance.init({
			ns: resources.ns,
			defaultNS,
			fallbackLng: "en",
			// Only ever load base languages ("en", not "en-US") — our JSON is keyed
			// by base code, so region variants would just 404 through the backend.
			load: "languageOnly",
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

			// React settings. Re-render when a namespace finishes loading or a
			// bundle is added so on-demand namespaces (e.g. the terminal) swap
			// their keys for real copy as soon as they arrive.
			react: {
				useSuspense: false,
				bindI18n: "languageChanged loaded",
				bindI18nStore: "added",
			},
		});

		this.ready
			.then(() => syncHtmlLangAndDir(this.i18n.language))
			.catch(() => {});
		this.i18n.on("languageChanged", syncHtmlLangAndDir);
	}
}
