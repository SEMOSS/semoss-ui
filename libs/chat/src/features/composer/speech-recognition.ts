/** A result of the browser's speech recognition, as the composer reads it. */
export interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
	resultIndex: number;
}

/** A speech recognition failure. */
export interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message: string;
}

/** The browser's speech recognition, which DOM typings do not include. */
export interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start(): void;
	stop(): void;
	onstart: (() => void) | null;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
}

/**
 * The browser's speech recognition constructor, prefixed or not.
 *
 * @returns The constructor, or undefined where the browser has none.
 */
export const getSpeechRecognition = ():
	| (new () => SpeechRecognition)
	| undefined => {
	const speechWindow = window as unknown as {
		SpeechRecognition?: new () => SpeechRecognition;
		webkitSpeechRecognition?: new () => SpeechRecognition;
	};
	return (
		speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
	);
};
