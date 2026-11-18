import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { ChatCallbacks, ChatConfig } from "@semoss/chat";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";
import { NEW_CHAT_BUILD_DEFAULTS } from "./new-chat-build-defaults";
import { PLATFORM_URL } from "./platform-url";

/**
 * The chat's config in the playground: its theme, the build's env defaults,
 * the platform URL, and its routes. Call it inside the router.
 *
 * @param host - What the layout gives the chat: how to open the settings
 * dialog, and what to do when a room's Workspace opens or closes. Keep both
 * stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const usePlaygroundChatConfig = ({
	onOpenSettings,
	onWorkbenchOpenChange,
}: Required<
	Pick<ChatCallbacks, "onOpenSettings" | "onWorkbenchOpenChange">
>): ChatConfig => {
	const theme = usePlaygroundTheme();
	const navigate = useNavigate();

	// Memoized so chat UI only rerenders when the theme or routes change.
	return useMemo<ChatConfig>(
		() => ({
			theme,
			options: {
				roomHref: (roomId) => `#/room/${roomId}`,
				agentHref: (workspaceId) => `#/agent/${workspaceId}`,
				new: NEW_CHAT_BUILD_DEFAULTS,
				platformUrl: PLATFORM_URL,
			},
			callbacks: {
				onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
				onOpenNewChat: () => navigate("/"),
				onOpenSettings,
				onWorkbenchOpenChange,
			},
		}),
		[theme, navigate, onOpenSettings, onWorkbenchOpenChange],
	);
};
