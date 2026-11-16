import { type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router";
import { type ChatConfig, ChatConfigProvider } from "@semoss/chat";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";
import { NEW_CHAT_BUILD_DEFAULTS } from "./new-chat-build-defaults";
import { PLATFORM_URL } from "./platform-url";

/** Props for {@link PlaygroundChatConfigProvider}. */
interface PlaygroundChatConfigProviderProps {
	/** The chat UI that reads the config. */
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

	// Memoized so chat UI only rerenders when the theme or routes change.
	const config = useMemo<ChatConfig>(
		() => ({
			theme,
			newChatDefaults: NEW_CHAT_BUILD_DEFAULTS,
			platformUrl: PLATFORM_URL,
			navigation: {
				openRoom: (roomId) => navigate(`/room/${roomId}`),
				roomHref: (roomId) => `#/room/${roomId}`,
				agentHref: (workspaceId) => `#/agent/${workspaceId}`,
				openNewChat: () => navigate("/"),
				onRoomDeleted: () => navigate("/"),
				openSettings,
			},
		}),
		[theme, navigate, openSettings],
	);

	return <ChatConfigProvider config={config}>{children}</ChatConfigProvider>;
};
