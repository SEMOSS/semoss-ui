/** Web Speech API isn't in TypeScript's default DOM lib — ported verbatim from playground's real global.d.ts (used by ChatInput's mic/voice input). */
declare global {
	interface Window {
		SpeechRecognition: {
			new (): SpeechRecognition;
		};
		webkitSpeechRecognition: {
			new (): SpeechRecognition;
		};
	}

	interface SpeechRecognitionEvent extends Event {
		results: SpeechRecognitionResultList;
		resultIndex: number;
	}

	interface SpeechRecognitionErrorEvent extends Event {
		error: string;
		message: string;
	}

	interface SpeechRecognition extends EventTarget {
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
}

export {};
