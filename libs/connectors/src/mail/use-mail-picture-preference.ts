import { useCallback, useSyncExternalStore } from "react";

/**
 * Which pictures an email shows without being asked: none (`ask`), the ones
 * it embeds, which come from the mailbox, or those and the ones on the web.
 */
export type MailPicturePreference = "ask" | "embedded" | "all";

/** Where the choice is kept; the version changes if its values ever do. */
export const MAIL_PICTURE_PREFERENCE_KEY = "semoss.connectors.mail.pictures.v1";

const PREFERENCES: readonly MailPicturePreference[] = [
	"ask",
	"embedded",
	"all",
];

/** What the viewer chose, once read, so every email reads it the same. */
let current: MailPicturePreference | undefined;

const listeners = new Set<() => void>();

/**
 * A kept choice, or `ask` when there is none or it is not one of the choices.
 *
 * @param value - What was kept.
 * @return The choice.
 */
export const parseMailPicturePreference = (
	value: unknown,
): MailPicturePreference =>
	PREFERENCES.find((preference) => preference === value) ?? "ask";

const readPreference = (): MailPicturePreference => {
	if (current === undefined) {
		try {
			current = parseMailPicturePreference(
				window.localStorage.getItem(MAIL_PICTURE_PREFERENCE_KEY),
			);
		} catch {
			current = "ask";
		}
	}
	return current;
};

const notify = (): void => {
	for (const listener of listeners) {
		listener();
	}
};

/**
 * Follow the choice as it changes here, and in other tabs of the same app.
 *
 * @param listener - Runs whenever the choice may have changed.
 * @return Stops following it.
 */
const subscribe = (listener: () => void): (() => void) => {
	const handleStorage = (event: StorageEvent) => {
		if (event.key === MAIL_PICTURE_PREFERENCE_KEY) {
			current = parseMailPicturePreference(event.newValue);
			listener();
		}
	};
	listeners.add(listener);
	window.addEventListener("storage", handleStorage);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", handleStorage);
	};
};

/**
 * Change the choice for every email shown, and keep it for next time.
 *
 * @param preference - The new choice.
 */
export const setMailPicturePreference = (
	preference: MailPicturePreference,
): void => {
	current = preference;
	try {
		window.localStorage.setItem(MAIL_PICTURE_PREFERENCE_KEY, preference);
	} catch {
		// without storage the choice still holds until the page is left
	}
	notify();
};

/** What {@link useMailPicturePreference} returns. */
export interface MailPicturePreferenceState {
	preference: MailPicturePreference;
	setPreference: (preference: MailPicturePreference) => void;
}

/**
 * Which pictures emails show without being asked, as this viewer chose it in
 * this browser. It is a convenience: when the browser keeps nothing, every
 * email asks.
 *
 * @return The choice, and how to change it.
 */
export const useMailPicturePreference = (): MailPicturePreferenceState => {
	const preference = useSyncExternalStore(
		subscribe,
		readPreference,
		(): MailPicturePreference => "ask",
	);
	const setPreference = useCallback(
		(next: MailPicturePreference) => setMailPicturePreference(next),
		[],
	);
	return { preference: preference, setPreference: setPreference };
};
