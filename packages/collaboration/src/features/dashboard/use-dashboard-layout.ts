import { useState } from "react";
import {
	type DashboardPreferences,
	type DashboardPreset,
	type DashboardWidget,
	presetWidgets,
	readDashboardPreferences,
	saveDashboardPreferences,
} from "./dashboard-layout";

/** Preferences are owned by an account-keyed provider; edits are transactional. */
export function useDashboardLayout(storageKey: string): {
	preferences: DashboardPreferences;
	draft: DashboardPreferences;
	isEditing: boolean;
	error: string;
	begin: () => void;
	cancel: () => void;
	save: () => void;
	setWidgets: (widgets: DashboardWidget[]) => void;
	applyPreset: (name: DashboardPreset | string) => void;
	savePreset: (name: string) => string | undefined;
	reset: () => void;
} {
	const [initial] = useState(() => readDashboardPreferences(storageKey));
	const [preferences, setPreferences] = useState(initial.preferences);
	const [draft, setDraft] = useState(initial.preferences);
	const [isEditing, setIsEditing] = useState(false);
	const [error, setError] = useState(initial.error);
	return {
		preferences,
		draft,
		isEditing,
		error,
		begin: () => {
			setDraft(preferences);
			setIsEditing(true);
		},
		cancel: () => {
			setDraft(preferences);
			setIsEditing(false);
		},
		save: () => {
			try {
				saveDashboardPreferences(storageKey, draft);
				setPreferences(draft);
				setIsEditing(false);
				setError("");
			} catch {
				setError(
					"Your layout could not be saved in this browser. Your edits are still here; retry Save or cancel.",
				);
			}
		},
		setWidgets: (widgets) =>
			setDraft((current) => ({ ...current, widgets })),
		applyPreset: (name) =>
			setDraft((current) => ({
				...current,
				widgets: current.presets.find((preset) => preset.name === name)
					?.widgets ?? [
					...presetWidgets(
						name === "Focus" || name === "Meetings"
							? name
							: "Balanced",
					),
					...current.widgets.filter(
						(widget) => widget.kind === "app",
					),
				],
			})),
		savePreset: (value) => {
			const name = value.trim();
			if (!name || name.length > 60)
				return "Use a name between 1 and 60 characters.";
			if (["Balanced", "Focus", "Meetings"].includes(name))
				return "Choose a name other than a built-in preset.";
			if (
				draft.presets.length >= 20 &&
				!draft.presets.some((preset) => preset.name === name)
			)
				return "You can save up to 20 presets.";
			setDraft((current) => ({
				...current,
				presets: [
					...current.presets.filter((preset) => preset.name !== name),
					{ name, widgets: current.widgets },
				],
			}));
		},
		reset: () =>
			setDraft((current) => ({ ...current, widgets: presetWidgets() })),
	};
}
