import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
	type ChatCallbacks,
	type ChatComponents,
	type ChatConfig,
	type ChatOptions,
	DEFAULT_WORKBENCH_PANELS,
	ROOM_PANEL_TYPES,
} from "@semoss/chat";
import { Env } from "@semoss/sdk/react";
import {
	createMcpPlatformUrl,
	readPlaygroundBuildNewChat,
} from "@semoss/shared";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";
import { platformPathFor } from "../../../contract/server-connection";
import { getDesktopBridge } from "../desktop-bridge/desktop-bridge";
import type { DesktopToolsHost } from "../local-folders/desktop-tools-host";
import { DesktopPlusMenu } from "./desktop-plus-menu";
import { DesktopSlashCommands } from "./desktop-slash-commands";
import { themeToChatOptions } from "./theme-chat-options";

/** The desktop's own components in the chat's places. One object, so the chat store is not remade. */
const DESKTOP_CHAT_COMPONENTS: ChatComponents = {
	PlusMenu: DesktopPlusMenu,
	SlashCommands: DesktopSlashCommands,
};

/** The build's new-chat defaults, from the playground's `.env`. */
const NEW_CHAT_BUILD_DEFAULTS = readPlaygroundBuildNewChat(import.meta.env);

/** The chat's Workspace panels without the activity log. */
const {
	[ROOM_PANEL_TYPES.ACTIVITY_LOG]: _activityLog,
	...PANELS_WITHOUT_ACTIVITY
} = DEFAULT_WORKBENCH_PANELS;

/**
 * The chat's config on the desktop: the server's playground theme as the
 * chat's options (and, where it hides the activity log, Workspace panels
 * without it), the app's routes, the tools it runs over the folders the
 * user attaches from this machine, and the plus menu and "/" menu with Attach
 * Folder. Tool views, the platform's low code apps included, are framed from
 * the tool frame origin, another site than this page, so a tool's page runs in
 * another process and cannot reach the desktop bridge (AGENTS.md, Trust
 * boundaries). Without that origin, the chat's frames would land on this
 * page's own origin, where the main process refuses them. The desktop has no
 * agent pages, so chat UI shows no links to them.
 *
 * @param host - What the layout gives the chat: how to open the settings
 * dialog, for chat UI's links to it and the account menu, and what to do when
 * a room's Workspace opens or closes. Keep both stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useHostChatConfig = ({
	onOpenSettings,
	onWorkbenchOpenChange,
	tools,
}: Required<Pick<ChatCallbacks, "onOpenSettings" | "onWorkbenchOpenChange">> & {
	/** The window's tools host, over the folders the user attaches. */
	tools: DesktopToolsHost;
}): ChatConfig => {
	const theme = usePlaygroundTheme();
	const navigate = useNavigate();
	const bridge = getDesktopBridge();
	const { toolFrameOrigin } = bridge;
	const hasActivityLog = theme.featureFlags?.showActivityLog !== false;

	// Its own memo, keyed on the theme and origin, so chat UI reads new options only when they change.
	const options = useMemo<ChatOptions>(() => {
		const platformUrl = `${toolFrameOrigin ?? ""}${platformPathFor(Env.MODULE)}`;
		return {
			...themeToChatOptions(theme, NEW_CHAT_BUILD_DEFAULTS),
			roomHref: (roomId) => `#/room/${roomId}`,
			toolFrameOrigin: toolFrameOrigin,
			platformUrl,
			catalogItemHref: theme.featureFlags?.showPlatformLinks
				? createMcpPlatformUrl(platformUrl)
				: undefined,
		};
	}, [theme, toolFrameOrigin]);

	return useMemo<ChatConfig>(
		() => ({
			options,
			callbacks: {
				onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
				onOpenNewChat: () => navigate("/new"),
				onOpenSettings,
				onWorkbenchOpenChange,
			},
			tools,
			components: DESKTOP_CHAT_COMPONENTS,
			workbenchPanels: hasActivityLog
				? undefined
				: PANELS_WITHOUT_ACTIVITY,
		}),
		[
			options,
			hasActivityLog,
			navigate,
			tools,
			onOpenSettings,
			onWorkbenchOpenChange,
		],
	);
};
