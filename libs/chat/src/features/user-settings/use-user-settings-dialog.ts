import { useCallback, useState } from "react";

/** What {@link useUserSettingsDialog} returns. */
export interface UseUserSettingsDialogReturn {
	/** Whether the dialog is open. */
	isOpen: boolean;
	/** Open or close the dialog. */
	setIsOpen: (isOpen: boolean) => void;
	/** The id of the section shown; the dialog shows its first section for none or an unknown one. */
	section: string | undefined;
	/** Show another section. */
	setSection: (section: string) => void;
	/**
	 * Open the dialog. Stable, so a chat config that carries it is not rebuilt.
	 *
	 * @param section - The id of the section to show; the first section without one.
	 */
	openSettings: (section?: string) => void;
}

/**
 * The user's settings dialog's state, held by the host's layout: it renders
 * `UserSettingsDialog` with it inside the chat's providers, and hands
 * `openSettings` to the chat's config (`callbacks.onOpenSettings`), which is
 * how chat UI and the host's own menus open the dialog.
 *
 * @returns The dialog's state and the action that opens it.
 */
export const useUserSettingsDialog = (): UseUserSettingsDialogReturn => {
	const [isOpen, setIsOpen] = useState(false);
	const [section, setSection] = useState<string | undefined>(undefined);

	const openSettings = useCallback((next?: string) => {
		setSection(next);
		setIsOpen(true);
	}, []);

	return { isOpen, setIsOpen, section, setSection, openSettings };
};
