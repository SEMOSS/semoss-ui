import { LANGUAGES } from "@semoss/i18n";
import type { DesktopBridge } from "../../../contract/ipc-contract";

/** The part of the i18next instance the app's language is kept through. */
export interface LanguageSource {
	/** The language in use, as the translations are keyed (`en`, not `en-US`). */
	readonly resolvedLanguage?: string;
	/** Switch languages, loading the new one's translations. */
	changeLanguage: (language: string) => Promise<unknown>;
	/** Hear every switch, such as from the settings dialog's language picker. */
	on: (
		event: "languageChanged",
		listener: (language: string) => void,
	) => void;
}

/**
 * Whether the app has translations for a language.
 *
 * @param language - The language code.
 * @returns True for a language the picker offers.
 */
const isSupportedLanguage = (language: string): boolean =>
	LANGUAGES.some((item) => item.code === language);

/**
 * Keep the app's language in the desktop config, which every server and the
 * connect screen share, rather than only in the server's own storage. A saved
 * language is applied before the first screen renders; with none saved yet,
 * the one detected is saved. Every switch after that is saved too.
 *
 * The language is a preference: when the config cannot be read or written,
 * the app keeps the language it detected.
 *
 * @param i18n - The app's i18next instance, once its first language is in.
 * @param bridge - The desktop bridge.
 * @returns Once the saved language is in use.
 */
export const syncLanguage = async (
	i18n: LanguageSource,
	bridge: Pick<DesktopBridge, "invoke">,
): Promise<void> => {
	const save = (language: string | undefined): void => {
		if (language && isSupportedLanguage(language)) {
			bridge.invoke("language:set", language).catch(() => undefined);
		}
	};

	const saved = await bridge.invoke("language:get").catch(() => null);
	if (saved && isSupportedLanguage(saved)) {
		if (saved !== i18n.resolvedLanguage) {
			await i18n.changeLanguage(saved).catch(() => undefined);
		}
	} else {
		save(i18n.resolvedLanguage);
	}

	// i18next reports the code as asked for; the resolved one is what is kept
	i18n.on("languageChanged", (language) =>
		save(i18n.resolvedLanguage ?? language),
	);
};
