import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	type ChatComponents,
	type ChatConfig,
	useServerChatTheme,
} from "@semoss/chat";
import { getDesktopBridge } from "../desktop-bridge/desktop-bridge";
import { createDesktopFoldersHost } from "../local-folders/desktop-folders-host";
import { createDesktopToolsHost } from "../local-folders/desktop-tools-host";
import { DesktopPlusMenu } from "./desktop-plus-menu";
import { DesktopSlashCommands } from "./desktop-slash-commands";

/** The desktop's own components in the chat's places. One object, so the chat store is not remade. */
const DESKTOP_CHAT_COMPONENTS: ChatComponents = {
	PlusMenu: DesktopPlusMenu,
	SlashCommands: DesktopSlashCommands,
};

/**
 * The chat's config on the desktop: the server's playground theme over the
 * chat's defaults, the app's routes, the tools it runs over the folders the
 * user attaches from this machine, and the plus menu and "/" menu with Attach
 * Folder. Tool views are framed from the main process's second local origin,
 * so a tool's page cannot reach the desktop bridge. The desktop has no agent
 * pages, so chat UI shows no links to them.
 *
 * @param openSettings - Opens the settings dialog, for chat UI's links to it
 * and the account menu. Keep its identity stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useDesktopChatConfig = (
	openSettings: (page?: string) => void,
): ChatConfig => {
	const theme = useServerChatTheme();
	const navigate = useNavigate();
	const bridge = getDesktopBridge();
	// one per window, so each folder's source keeps its identity
	const [tools] = useState(() =>
		createDesktopToolsHost(createDesktopFoldersHost(bridge)),
	);
	const { toolFrameOrigin } = bridge;

	return useMemo<ChatConfig>(
		() => ({
			theme,
			options: {
				roomHref: (roomId) => `#/room/${roomId}`,
				toolFrameOrigin: toolFrameOrigin,
			},
			callbacks: {
				onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
				onOpenNewChat: () => navigate("/new"),
				onOpenSettings: openSettings,
			},
			tools: tools,
			components: DESKTOP_CHAT_COMPONENTS,
		}),
		[theme, navigate, tools, toolFrameOrigin, openSettings],
	);
};
