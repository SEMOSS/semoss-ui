export const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Español" },
	{ code: "fr", label: "Français" },
	{ code: "hi", label: "हिन्दी" },
	{ code: "ar", label: "العربية" },
	{ code: "ja", label: "日本語" },
];

// Right-to-left script languages. Listed by ISO 639-1 code; includes future
// candidates (he, fa, ur) so adding them to LANGUAGES alone is enough.
const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);

/**
 * Returns "rtl" for right-to-left scripts, "ltr" otherwise. Accepts full
 * locale tags ("ar-EG") — only the base subtag matters.
 */
export const getLanguageDirection = (language: string): "rtl" | "ltr" => {
	const base = language.split("-")[0].toLowerCase();
	return RTL_LANGUAGES.has(base) ? "rtl" : "ltr";
};

export const isRtlLanguage = (language: string): boolean =>
	getLanguageDirection(language) === "rtl";
