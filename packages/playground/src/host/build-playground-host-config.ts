import type { NavigateFunction } from "react-router";
import {
	type ChatHostConfig,
	chatSettingsFromTheme,
	createSessionStoragePreferences,
	FOLDER_TOOL_LABELS,
} from "@semoss/chat";
import {
	CONNECTOR_TOOL_VIEW_LIBRARIES,
	createConnectorsIntegration,
	createConnectorToolProvider,
} from "@semoss/chat/connectors";
import { CHAT_FILE_PANELS } from "@semoss/chat/panels";
import { createChatFilesToolProvider } from "@semoss/sdk";
import type { ThemeMap } from "@semoss/shared";
import { PLAYGROUND_PANEL_COMPONENTS } from "./playground-panel-components";

const DEFAULT_MODEL_ID = import.meta.env.VITE_DEFAUlT_MODEL_ID || "";
const DEFAULT_MODEL_NAME = import.meta.env.VITE_DEFAUlT_MODEL_NAME || "";
const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL || "";

/**
 * The playground's chat, from its theme (the deployment's `VITE_THEME`
 * merged with the server's, which `RootStore` keeps): the theme's chat
 * settings (`chatSettingsFromTheme`), rooms running the room's files and
 * connector tools, the Workspace opening the room's panels, the file panels
 * and the connector viewers, the connectors integration in every room, and
 * navigation through the playground's routes.
 *
 * @param theme - The merged playground theme.
 * @param navigate - The router's navigate.
 * @returns The host config `<ChatProvider>` takes.
 */
export const buildPlaygroundHostConfig = (
	theme: ThemeMap["playground"],
	navigate: NavigateFunction,
): ChatHostConfig => {
	const settings = chatSettingsFromTheme(theme);
	return {
		...settings,
		engine: {
			...settings.engine,
			clientTools: [
				createChatFilesToolProvider({ labels: FOLDER_TOOL_LABELS }),
				createConnectorToolProvider(),
			],
		},
		defaultModel: {
			id: theme.defaultRoomSettings?.model?.engine_id || DEFAULT_MODEL_ID,
			name:
				theme.defaultRoomSettings?.model?.engine_display_name ||
				theme.defaultRoomSettings?.model?.engine_name ||
				DEFAULT_MODEL_NAME,
		},
		platformUrl: PLATFORM_URL,
		panelComponents: PLAYGROUND_PANEL_COMPONENTS,
		filePanels: CHAT_FILE_PANELS,
		toolViewLibraries: CONNECTOR_TOOL_VIEW_LIBRARIES,
		integrations: [createConnectorsIntegration()],
		preferences: createSessionStoragePreferences(),
		navigation: {
			onOpenRoom: (roomId) => navigate(`/room/${roomId}`),
			getRoomHref: (roomId) => `#/room/${roomId}`,
			onNewRoom: (options = {}) => {
				const params = new URLSearchParams();
				if (options.agentId) params.set("workspaceId", options.agentId);
				if (options.knowledgeId)
					params.set("knowledgeId", options.knowledgeId);
				if (options.prompt) params.set("prompt", options.prompt);
				const search = params.toString();
				navigate(search ? `/new?${search}` : "/new");
			},
			onLeaveRoom: () => navigate("/"),
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
			onBack: () => navigate(-1),
		},
	};
};
