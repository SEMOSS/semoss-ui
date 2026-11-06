import { useContext } from "react";
import { useChat } from "../../host/chat.context";
import {
	SettingsDialogContext,
	type SettingsSectionId,
} from "./settings-dialog.context";

/**
 * How the chat opens settings at a page, such as Manage connectors: the
 * host's `onOpenSettings`, or else the chat's own settings dialog when the
 * host mounts its provider.
 *
 * @returns Opens settings, or undefined when the host has none to open.
 */
export const useOpenSettings = ():
	| ((page?: SettingsSectionId) => void)
	| undefined => {
	const { config } = useChat();
	const dialog = useContext(SettingsDialogContext);
	return config.onOpenSettings ?? dialog?.openSettings;
};
