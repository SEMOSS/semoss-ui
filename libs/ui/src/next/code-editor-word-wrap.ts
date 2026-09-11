import * as React from "react";

/**
 * Word wrap is one preference shared by every editor in the app rather than a
 * per-editor setting: a file opened in a second panel, or opened again later,
 * reads the way the last one did. It is remembered across sessions.
 */
const STORAGE_KEY = "semoss.code-editor.word-wrap";

const readStoredWordWrap = (): boolean => {
	try {
		return globalThis.localStorage?.getItem(STORAGE_KEY) === "on";
	} catch {
		// storage access throws in some privacy modes; the default still applies
		return false;
	}
};

let wordWrap = readStoredWordWrap();

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getSnapshot = () => wordWrap;

/** Read the word-wrap preference outside React. */
export const getCodeEditorWordWrap = (): boolean => wordWrap;

/** Set the word-wrap preference for every editor and remember it. */
export const setCodeEditorWordWrap = (next: boolean): void => {
	if (next === wordWrap) {
		return;
	}

	wordWrap = next;
	try {
		globalThis.localStorage?.setItem(STORAGE_KEY, next ? "on" : "off");
	} catch {
		// the preference still applies for the rest of this session
	}

	for (const listener of listeners) {
		listener();
	}
};

/** Flip the word-wrap preference for every editor. */
export const toggleCodeEditorWordWrap = (): void => {
	setCodeEditorWordWrap(!wordWrap);
};

/**
 * Subscribe to the word-wrap preference. Every editor and every control that
 * draws its state re-renders together when it changes.
 */
export const useCodeEditorWordWrap = (): boolean =>
	React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
