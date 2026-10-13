import { useSyncExternalStore } from "react";

// "calm": Petrona headings with Hanken Grotesk text; "standard": the shared SEMOSS font (Geist)
export const TYPEFACES = ["calm", "standard"] as const;
export type Typeface = (typeof TYPEFACES)[number];

// Change this one line to put every browser without a saved choice back on Geist
export const DEFAULT_TYPEFACE: Typeface = "calm";

const TYPEFACE_KEY = "collaboration.typeface";
const listeners = new Set<() => void>();

function isTypeface(value: unknown): value is Typeface {
	return TYPEFACES.includes(value as Typeface);
}

/** The font this browser picked in Settings, or the default. */
export function readTypeface(): Typeface {
	try {
		const saved = window.localStorage.getItem(TYPEFACE_KEY);
		return isTypeface(saved) ? saved : DEFAULT_TYPEFACE;
	} catch {
		return DEFAULT_TYPEFACE;
	}
}

/** index.css keys the font variables off this attribute. */
export function applyTypeface(typeface: Typeface = readTypeface()): void {
	document.documentElement.dataset.typeface = typeface;
}

/** Saves first so a blocked storage write leaves the current font in place; throws on failure. */
export function saveTypeface(typeface: Typeface): void {
	window.localStorage.setItem(TYPEFACE_KEY, typeface);
	applyTypeface(typeface);
	for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useTypeface(): Typeface {
	return useSyncExternalStore(
		subscribe,
		readTypeface,
		() => DEFAULT_TYPEFACE,
	);
}
