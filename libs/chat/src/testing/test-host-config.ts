import type { ChatHostConfig } from "../host/chat-host-config";
import { resolveChatHostConfig } from "../host/chat-rooms-client";

/**
 * A host config for tests: default feature switches, no Workspace panels,
 * and navigation that goes nowhere.
 *
 * @param overrides - What the test changes.
 * @returns The config, resolved as `<ChatProvider>` resolves it.
 */
export const createTestHostConfig = (
	overrides: Partial<ChatHostConfig> = {},
): ChatHostConfig =>
	resolveChatHostConfig({
		appName: "Test",
		engine: {},
		featureFlags: {},
		allowedFileTypes: [],
		allowedUrlPrefixes: [],
		gracefulErrors: [],
		navigation: {
			onOpenRoom: () => undefined,
			getRoomHref: (roomId) => `#/room/${roomId}`,
			onNewRoom: () => undefined,
			onLeaveRoom: () => undefined,
			getAgentHref: (agentId) => `#/agent/${agentId}`,
			onOpenAgents: () => undefined,
			onOpenAgent: () => undefined,
			onEditAgent: () => undefined,
			onNewAgent: () => undefined,
			onOpenKnowledgeList: () => undefined,
			onOpenKnowledge: () => undefined,
			getKnowledgeHref: (knowledgeId) => `#/knowledge/${knowledgeId}`,
			onBack: () => undefined,
		},
		...overrides,
	});
