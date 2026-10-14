import { createContext, useContext } from "react";

/** A page of the settings dialog. */
export type SettingsSectionId = "general" | "connectors";

/** What {@link useSettingsDialog} returns. */
export interface SettingsDialogContextValue {
	/**
	 * Open the settings dialog.
	 *
	 * @param section - The page to show. The dialog shows General without one.
	 */
	openSettings: (section?: SettingsSectionId) => void;
}

/** Provided by `SettingsDialogProvider`, which also renders the dialog. */
export const SettingsDialogContext =
	createContext<SettingsDialogContextValue | null>(null);

/**
 * The way to open the settings dialog from anywhere inside the main layout.
 *
 * @return The actions on the dialog.
 * @throws Error when rendered outside `SettingsDialogProvider`.
 */
export const useSettingsDialog = (): SettingsDialogContextValue => {
	const context = useContext(SettingsDialogContext);
	if (!context) {
		throw new Error(
			"useSettingsDialog must be used within SettingsDialogProvider",
		);
	}
	return context;
};
