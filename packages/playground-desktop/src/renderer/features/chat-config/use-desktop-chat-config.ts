import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	type ChatConfig,
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "@semoss/chat";
import { useConfig } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { getDesktopBridge } from "../desktop-bridge/desktop-bridge";
import { createDesktopFoldersHost } from "../local-folders/desktop-folders-host";

/**
 * The chat's config on the desktop: the server's playground theme over the
 * chat's defaults, the app's routes, and the folders the user attaches from
 * this machine. The desktop has no agent pages or settings dialog, so chat UI
 * shows no links to them.
 *
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useDesktopChatConfig = (): ChatConfig => {
	const serverTheme = useConfig((state) => state.theme);
	const navigate = useNavigate();
	// one per window, so each folder's source keeps its identity
	const [localFolders] = useState(() =>
		createDesktopFoldersHost(getDesktopBridge()),
	);

	const theme = useMemo<ChatTheme>(() => {
		// the server's THEME_MAP keeps the chat's theme under `playground`
		const playground = isRecord(serverTheme?.playground)
			? (serverTheme.playground as Partial<ChatTheme>)
			: undefined;
		return mergeChatTheme(DEFAULT_CHAT_THEME, playground);
	}, [serverTheme]);

	return useMemo<ChatConfig>(
		() => ({
			theme,
			// the desktop build sets no new-chat defaults of its own
			newChatDefaults: {},
			platformUrl: "",
			localFolders: localFolders,
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				openNewChat: () => navigate("/new"),
				onRoomDeleted: () => navigate("/new"),
			},
		}),
		[theme, navigate, localFolders],
	);
};
