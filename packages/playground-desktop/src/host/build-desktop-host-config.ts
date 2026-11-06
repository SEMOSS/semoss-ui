import {
	type ChatHostConfig,
	chatSettingsFromTheme,
	FOLDER_TOOL_LABELS,
} from "@semoss/chat";
import {
	CONNECTOR_TOOL_VIEW_LIBRARIES,
	createConnectorsIntegration,
	createConnectorToolProvider,
} from "@semoss/chat/connectors";
import { CHAT_FILE_PANELS } from "@semoss/chat/panels";
import {
	type ChatPreferencesAdapter,
	createChatFilesToolProvider,
} from "@semoss/sdk";
import type { ThemeMap } from "@semoss/shared";
import { isRecord } from "@semoss/utility/object";
import { createDesktopPanelsIntegration } from "../features/desktop-panels/desktop-panel.components";
import { createDesktopToolProvider } from "../features/desktop-tools/desktop-tool.provider";
import { createDesktopToolsIntegration } from "../features/desktop-tools/desktop-tools.integration";
import { DESKTOP_PANEL_COMPONENTS } from "./desktop-panel-components";

/** The chat settings an instance's playground theme may set. */
type InstanceChatTheme = Partial<ThemeMap["playground"]>;

/** Where the desktop app's chat sends the user. */
export type DesktopNavigate = (
	path: string,
	options?: { replace?: boolean },
) => void;

/**
 * The playground theme the instance's config carries, or none.
 *
 * @param serverTheme - The config's parsed theme (`useConfig((s) => s.theme)`).
 * @returns Its playground section.
 */
export const readInstanceChatTheme = (
	serverTheme: Record<string, unknown> | null,
): InstanceChatTheme =>
	isRecord(serverTheme?.playground)
		? (serverTheme.playground as InstanceChatTheme)
		: {};

/**
 * The desktop app's chat, as the instance's playground theme sets it up
 * (`chatSettingsFromTheme`): rooms run the room's files, connector and desktop tools within the theme's
 * limits; the Workspace offers files, the room's panels, the connector
 * viewers and the browser panel; navigation goes through the app's routes.
 *
 * @param options.theme - The instance's playground theme.
 * @param options.preferences - Where the picked model is kept.
 * @param options.navigate - The router's navigate.
 * @returns The host config `<ChatProvider>` takes.
 */
export const buildDesktopHostConfig = ({
	theme,
	preferences,
	navigate,
}: {
	theme: InstanceChatTheme;
	preferences: ChatPreferencesAdapter;
	navigate: DesktopNavigate;
}): ChatHostConfig => {
	const settings = chatSettingsFromTheme(theme);
	return {
		...settings,
		engine: {
			...settings.engine,
			clientTools: [
				createChatFilesToolProvider({ labels: FOLDER_TOOL_LABELS }),
				createConnectorToolProvider(),
				createDesktopToolProvider(),
			],
		},
		panelComponents: DESKTOP_PANEL_COMPONENTS,
		filePanels: CHAT_FILE_PANELS,
		toolViewLibraries: CONNECTOR_TOOL_VIEW_LIBRARIES,
		integrations: [
			createConnectorsIntegration(),
			createDesktopToolsIntegration(),
			createDesktopPanelsIntegration(),
		],
		preferences: preferences,
		navigation: {
			onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
			getRoomHref: (roomId) => `#/room/${roomId}`,
			onNewRoom: (options = {}) => {
				const params = new URLSearchParams();
				if (options.agentId) params.set("agentId", options.agentId);
				if (options.knowledgeId)
					params.set("knowledgeId", options.knowledgeId);
				if (options.prompt) params.set("prompt", options.prompt);
				const search = params.toString();
				navigate(search ? `/new?${search}` : "/new");
			},
			onLeaveRoom: () => navigate("/new"),
			getAgentHref: (agentId) => `#/agent/${agentId}`,
			onOpenAgents: () => navigate("/agent"),
			onOpenAgent: (agentId) => navigate(`/agent/${agentId}`),
			onEditAgent: (agentId) => navigate(`/agent/${agentId}/edit`),
			onNewAgent: () => navigate("/agent/new"),
			onOpenKnowledgeList: () =>
				navigate("/knowledge", { replace: true }),
			onOpenKnowledge: (knowledgeId) =>
				navigate(`/knowledge/${knowledgeId}`),
			getKnowledgeHref: (knowledgeId) => `#/knowledge/${knowledgeId}`,
			onBack: () => window.history.back(),
		},
	};
};
