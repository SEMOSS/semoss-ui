import { type ComponentType, createContext, useContext } from "react";

/** A page of the settings dialog: General, or one the host adds. */
export type SettingsSectionId = string;

/** A page a host adds to the settings dialog, after General. */
export interface ChatSettingsPage {
	/** The page's id, as `openSettings` names it. */
	id: string;
	/** Its icon in the dialog's list. */
	icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	/** Its title's translation key, such as `sidebar:settings.sections.connectors`. */
	titleKey: string;
	/** The page. */
	Component: ComponentType;
}

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
 * The way to open the settings dialog from anywhere beneath its provider.
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
