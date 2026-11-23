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
import {
	playgroundThemeChatOptions,
	readPlaygroundBuildNewChat,
} from "@semoss/shared";
import { isIframed } from "@/features/navigation/is-iframed";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";
import { PLATFORM_URL } from "./platform-url";

/**
 * Fails to compile when the shared theme mapping names an option the chat no
 * longer has; a spread would drop it silently.
 */
type UnknownThemeOption = Exclude<
	keyof ReturnType<typeof playgroundThemeChatOptions>,
	keyof ChatOptions
>;
const THEME_OPTIONS_ARE_CHAT_OPTIONS: [UnknownThemeOption] extends [never]
	? true
	: never = true;
void THEME_OPTIONS_ARE_CHAT_OPTIONS;

/** The build's new-chat defaults, from its env. */
const NEW_CHAT_BUILD_DEFAULTS = readPlaygroundBuildNewChat(import.meta.env);

/** The composer with no plus or "/" menu, where the theme hides tools in a frame. */
const COMPONENTS_WITHOUT_TOOLS: ChatComponents = {
	PlusMenu: null,
	SlashCommands: null,
};

/** The chat's Workspace panels without the activity log. */
const {
	[ROOM_PANEL_TYPES.ACTIVITY_LOG]: _activityLog,
	...PANELS_WITHOUT_ACTIVITY
} = DEFAULT_WORKBENCH_PANELS;

/**
 * The chat's config in the playground: its theme as the chat's options and
 * places, the build's env defaults, the platform URL, and its routes. Where
 * the theme hides tools in a frame and the app is framed, the composer has no
 * plus or "/" menu; where it hides the activity log, the Workspace has no
 * blueprint for it. Call it inside the router.
 *
 * @param host - What the layout gives the chat: how to open the settings
 * dialog, and what to do when a room's Workspace opens or closes. Keep both
 * stable.
 * @returns The config, the same object while the theme and router are unchanged.
 */
export const useHostChatConfig = ({
	onOpenSettings,
	onWorkbenchOpenChange,
}: Required<
	Pick<ChatCallbacks, "onOpenSettings" | "onWorkbenchOpenChange">
>): ChatConfig => {
	const theme = usePlaygroundTheme();
	const navigate = useNavigate();
	const flags = theme.featureFlags;
	const hasToolMenus = !(flags?.hideToolsInIframe && isIframed);
	const hasActivityLog = flags?.showActivityLog !== false;

	// Its own memo, keyed on the theme alone, so chat UI reads new options only when it changes.
	const options = useMemo<ChatOptions>(
		() => ({
			...playgroundThemeChatOptions(
				theme,
				NEW_CHAT_BUILD_DEFAULTS,
				PLATFORM_URL,
			),
			roomHref: (roomId) => `#/room/${roomId}`,
			agentHref: (workspaceId) => `#/agent/${workspaceId}`,
			platformUrl: PLATFORM_URL,
		}),
		[theme],
	);

	// Memoized so chat UI only rerenders when the theme or routes change.
	return useMemo<ChatConfig>(
		() => ({
			options,
			callbacks: {
				onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
				onOpenNewChat: () => navigate("/new"),
				onOpenSettings,
				onWorkbenchOpenChange,
			},
			components: hasToolMenus ? undefined : COMPONENTS_WITHOUT_TOOLS,
			workbenchPanels: hasActivityLog
				? undefined
				: PANELS_WITHOUT_ACTIVITY,
		}),
		[
			options,
			hasToolMenus,
			hasActivityLog,
			navigate,
			onOpenSettings,
			onWorkbenchOpenChange,
		],
	);
};
