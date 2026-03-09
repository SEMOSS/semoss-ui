import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTheme } from "@semoss/ui/next";
import {
	PRESET_CSS_KEYS,
	THEME_PRESET_STORAGE_KEY,
	THEME_PRESETS,
	type ThemePreset,
} from "@/stores/root/theme-presets";

/**
 * Apply a preset's CSS variable overrides to the document root.
 * Clears any previously-set preset overrides first so switching
 * from "deloitte" → "light" removes the green branding.
 */
function applyCssOverrides(preset: ThemePreset) {
	const root = document.documentElement;

	// Remove every key a preset could have set
	for (const key of PRESET_CSS_KEYS) {
		root.style.removeProperty(key);
	}

	// Apply the new preset's overrides (if any)
	if (preset.cssVariables) {
		for (const [key, value] of Object.entries(preset.cssVariables)) {
			root.style.setProperty(key, value);
		}
	}
}

/* ─── Shared external store ─────────────────────────────────────
 * All instances of useThemePreset() share the same module-level
 * preset id.  When one component calls setPreset(), every consumer
 * of the hook re-renders immediately.
 * ──────────────────────────────────────────────────────────────── */

let _presetId: string = (() => {
	try {
		return localStorage.getItem(THEME_PRESET_STORAGE_KEY) ?? "light";
	} catch {
		return "light";
	}
})();

const _listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	_listeners.add(listener);
	return () => {
		_listeners.delete(listener);
	};
}

function getSnapshot() {
	return _presetId;
}

function emitChange(id: string) {
	_presetId = id;
	for (const listener of _listeners) {
		listener();
	}
}

/**
 * Hook that exposes the current theme preset and a setter.
 *
 * - Persists the selection to `localStorage`
 * - Toggles light / dark mode via the UI `useTheme()` provider
 * - Applies (or clears) CSS variable overrides for branded presets
 * - Syncs across all components that call useThemePreset()
 */
export function useThemePreset() {
	const { setTheme } = useTheme();

	const currentPresetId = useSyncExternalStore(subscribe, getSnapshot);

	const currentPreset = useMemo(
		() =>
			THEME_PRESETS.find((p) => p.id === currentPresetId) ??
			THEME_PRESETS[0],
		[currentPresetId],
	);

	const setPreset = useCallback(
		(presetId: string) => {
			const preset =
				THEME_PRESETS.find((p) => p.id === presetId) ??
				THEME_PRESETS[0];

			// 1. Persist choice
			localStorage.setItem(THEME_PRESET_STORAGE_KEY, preset.id);

			// 2. Notify all hook consumers so they re-render
			emitChange(preset.id);

			// 3. Toggle light / dark mode (class on <html>)
			setTheme(preset.mode);

			// 4. Apply / clear CSS variable overrides
			applyCssOverrides(preset);
		},
		[setTheme],
	);

	return {
		/** All available presets */
		presets: THEME_PRESETS,
		/** The currently active preset */
		currentPreset,
		/** Switch to a different preset by id */
		setPreset,
	};
}
