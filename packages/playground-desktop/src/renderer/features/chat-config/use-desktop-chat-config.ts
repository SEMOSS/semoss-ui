import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { type ChatConfig, useServerChatTheme } from "@semoss/chat";
import { getDesktopBridge } from "../desktop-bridge/desktop-bridge";
import { createDesktopFoldersHost } from "../local-folders/desktop-folders-host";
import { useServerSettingsSection } from "../server-connection/use-server-settings-section";

/** The desktop build sets no new-chat defaults; one object, so the chat store is not remade. */
const NO_NEW_CHAT_DEFAULTS = {};

/**
 * The chat's config on the desktop: the server's playground theme over the
 * chat's defaults, the app's routes, the folders the user attaches from this
 * machine, and the settings dialog with the app's Server page after the
 * chat's own. The desktop has no agent pages, so chat UI shows no links to
 * them.
 *
 * @param openSettings - Opens the settings dialog, for chat UI's links to it
 * and the account menu. Keep its identity stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useDesktopChatConfig = (
	openSettings: (section?: string) => void,
): ChatConfig => {
	const theme = useServerChatTheme();
	const navigate = useNavigate();
	const serverSection = useServerSettingsSection();
	// one per window, so each folder's source keeps its identity
	const [localFolders] = useState(() =>
		createDesktopFoldersHost(getDesktopBridge()),
	);

	return useMemo<ChatConfig>(
		() => ({
			theme,
			// the desktop build sets no new-chat defaults of its own
			newChatDefaults: NO_NEW_CHAT_DEFAULTS,
			platformUrl: "",
			localFolders: localFolders,
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				openNewChat: () => navigate("/new"),
				onRoomDeleted: () => navigate("/new"),
				openSettings,
			},
			customize: {
				// the chat's pages, then the app's own
				settingsSections: (defaults) => [...defaults, serverSection],
			},
		}),
		[theme, navigate, localFolders, openSettings, serverSection],
	);
};
