import { useMemo } from "react";
import type { LocalFoldersHost } from "../../local-folders/store/local-folders-host";
import { ROOM_PANEL_COMPONENTS } from "../../workbench/panels/room-panel.components";
import type { ChatTheme } from "../config/chat-theme";
import type { NewChatBuildDefaults } from "../config/new-chat-preferences";
import { ChatStore } from "./chat.store";

/**
 * Create the session's chat store, with the chat's Workspace panels, and start
 * reading its models and rooms. A new theme makes a new store.
 *
 * @param theme - The chat theme.
 * @param newChatDefaults - The build's new-chat defaults.
 * @param localFolders - The host's way to the user's own files, for a host
 * that has one (the desktop app). Keep its identity stable.
 * @returns The chat store, the same one while the inputs are unchanged.
 */
export const useCreateChatStore = (
	theme: ChatTheme,
	newChatDefaults: NewChatBuildDefaults,
	localFolders?: LocalFoldersHost,
): ChatStore =>
	useMemo(() => {
		const store = new ChatStore(
			theme,
			ROOM_PANEL_COMPONENTS,
			newChatDefaults,
			{ localFolders: localFolders },
		);
		store.initialize();
		return store;
	}, [theme, newChatDefaults, localFolders]);
