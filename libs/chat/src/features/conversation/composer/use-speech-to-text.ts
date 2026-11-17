/// <reference path="../../../speech-recognition.d.ts" />
import { $getRoot, type LexicalEditor } from "lexical";
import { type RefObject, useEffect, useRef, useState } from "react";
import { $setRootText } from "./replace-editor-text";

/** What {@link useSpeechToText} returns. */
interface SpeechToText {
	/** Whether the browser offers speech recognition. */
	readonly canListen: boolean;
	/** Whether it is listening now. */
	readonly isListening: boolean;
	/** Starts listening, or stops while it listens. */
	readonly toggle: () => void;
}

/**
 * Speech-to-text into the composer, where the browser offers the Web Speech
 * API: each finished phrase is added to the end of the draft, and the editor
 * takes focus back when listening stops.
 *
 * @param editorRef - The composer's editor.
 * @returns Whether it can and does listen, and a toggle.
 */
export const useSpeechToText = (
	editorRef: RefObject<LexicalEditor | null>,
): SpeechToText => {
	const Recognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;
	const [isListening, setIsListening] = useState(false);
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	useEffect(() => {
		if (!Recognition) return;
		const recognition = new Recognition();
		recognition.continuous = true; // Keep listening until stopped
		recognition.interimResults = true; // Get real-time results
		recognition.lang = "en-US";
		recognition.onstart = () => setIsListening(true);
		recognition.onresult = (event) => {
			// Collect only finalized transcription results
			let transcript = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) {
					transcript += event.results[i][0].transcript;
				}
			}
			transcript = transcript.trim();
			if (!transcript) return;
			// the transcript goes after what the draft already holds
			editorRef.current?.update(() => {
				const current = $getRoot().getTextContent();
				$setRootText(current ? `${current} ${transcript}` : transcript);
			});
		};
		recognition.onerror = (event) => {
			console.error(event);
			setIsListening(false);
			editorRef.current?.focus();
		};
		recognition.onend = () => {
			setIsListening(false);
			editorRef.current?.focus();
		};
		recognitionRef.current = recognition;
		return () => {
			recognition.stop();
			if (recognitionRef.current === recognition) {
				recognitionRef.current = null;
			}
		};
	}, [Recognition, editorRef]);

	return {
		canListen: Boolean(Recognition),
		isListening,
		toggle: () => {
			if (isListening) recognitionRef.current?.stop();
			else recognitionRef.current?.start();
		},
	};
};
