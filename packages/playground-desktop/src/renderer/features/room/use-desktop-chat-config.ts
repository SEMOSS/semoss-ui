import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
	type ChatConfig,
	type ChatTheme,
	DEFAULT_CHAT_THEME,
	mergeChatTheme,
} from "@semoss/chat";
import { useConfig } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";

/** The desktop build sets no new-chat defaults of its own. */
const NO_BUILD_DEFAULTS = {};

/**
 * The chat's config on the desktop: the server's playground theme over the
 * chat's defaults, and the app's routes. The desktop has no agent pages or
 * settings dialog, so chat UI shows no links to them.
 *
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useDesktopChatConfig = (): ChatConfig => {
	const serverTheme = useConfig((state) => state.theme);
	const navigate = useNavigate();

	const theme = useMemo<ChatTheme>(() => {
		const playground = isRecord(serverTheme?.playground)
			? (serverTheme.playground as Partial<ChatTheme>)
			: undefined;
		return mergeChatTheme(DEFAULT_CHAT_THEME, playground);
	}, [serverTheme]);

	return useMemo<ChatConfig>(
		() => ({
			theme,
			newChatDefaults: NO_BUILD_DEFAULTS,
			platformUrl: "",
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				openNewChat: () => navigate("/new"),
				onRoomDeleted: () => navigate("/new"),
			},
		}),
		[theme, navigate],
	);
};
