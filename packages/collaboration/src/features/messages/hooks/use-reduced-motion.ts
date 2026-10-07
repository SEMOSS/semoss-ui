import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
	const query = window.matchMedia?.(QUERY);
	query?.addEventListener("change", onChange);
	return () => query?.removeEventListener("change", onChange);
}

/** Observe the system preference, including changes while the room is open. */
export function useReducedMotion(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia?.(QUERY).matches ?? false,
		() => false,
	);
}
