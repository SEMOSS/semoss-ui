import { type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";
import { type ChatConfig, ChatConfigContext } from "./chat-config.context";
import { NEW_CHAT_BUILD_DEFAULTS } from "./new-chat-build-defaults";
import { PLATFORM_URL } from "./platform-url";

interface PlaygroundChatConfigProviderProps {
	children: ReactNode;
}

/**
 * Give chat UI the playground's theme, env defaults, and routes. Renders
 * inside the router and the settings dialog, which it opens for chat UI.
 */
export const PlaygroundChatConfigProvider = ({
	children,
}: PlaygroundChatConfigProviderProps) => {
	const theme = usePlaygroundTheme();
	const navigate = useNavigate();
	const { openSettings } = useSettingsDialog();

	const config = useMemo<ChatConfig>(
		() => ({
			theme,
			newChatDefaults: NEW_CHAT_BUILD_DEFAULTS,
			platformUrl: PLATFORM_URL,
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				agentHref: (workspaceId) => `#/agent/${workspaceId}`,
				onRoomDeleted: () => navigate("/"),
				openSettings,
			},
		}),
		[theme, navigate, openSettings],
	);

	return (
		<ChatConfigContext.Provider value={config}>
			{children}
		</ChatConfigContext.Provider>
	);
};
