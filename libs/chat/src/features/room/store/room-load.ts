import type { WorkspaceDetails } from "@semoss/sdk";
import type {
	Engine,
	MCPConfig,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";
import {
	type MessageData,
	type MessageKey,
	toMessageData,
} from "../../conversation/store/message-map";
import { getModelOrnamentName } from "../../conversation/store/response-placeholder";
import { ROOT_PLACEHOLDER_ID } from "../../tools/mcp/mcp-constants";
import { NO_AGENT_TOOLS, type RoomOptions } from "./room-snapshot";

/**
 * The hidden root every conversation of a loaded room hangs from.
 *
 * @param model - The model the room is on, which the root names.
 * @param key - The root's client key.
 * @returns The root's data.
 */
export const createRootMessage = (
	model: Engine | null,
	key: MessageKey,
): MessageData =>
	toMessageData(
		{
			io: "OUTPUT",
			messageId: ROOT_PLACEHOLDER_ID,
			visible: false,
			platform_generated: true,
			modelId: model?.engine_id || "",
			dateCreated: new Date().toISOString(),
			parts: [],
			tokens: 0,
			ornaments: { modelName: getModelOrnamentName(model) },
			modelType: "",
			pruneToolsAbove: false,
		} as ResponsePixelMessage,
		key,
		true,
	);

/**
 * The model a room last sent a message to: the last user's message names it.
 *
 * @param messages - The room's messages, in the backend's order.
 * @param fallback - The model when no message names one.
 * @returns The model's id.
 */
export const findActiveModelId = (
	messages: readonly PixelMessage[],
	fallback: string | undefined,
): string | undefined => {
	let modelId = fallback;
	for (const message of messages) {
		if (message.io === "INPUT") {
			modelId = message.modelId;
		}
	}
	return modelId;
};

/** A loaded room's options with its agent's, and what else the agent brings. */
export interface RoomAgentMerge {
	/** The options: the agent's name to show, and its prompt for empty instructions. */
	options: Partial<RoomOptions>;
	/** The agent's tools and knowledge. */
	agentTools: readonly MCPConfig[];
	/** The agent's opening message, when it has one switched on. */
	agentGreeting: string;
	/** The agent's default model, for a room that has never named one. */
	defaultModelId: string;
}

/**
 * Lay an agent over a loaded room's options. Without an agent, the options
 * lose their empty `workspace` field and the room has no agent tools.
 *
 * @param stored - The options the backend holds for the room.
 * @param workspace - The agent the room was started from, or null for none.
 * @returns The options, and the agent's tools, greeting, and default model.
 */
export const mergeAgentIntoRoom = (
	stored: Partial<RoomOptions>,
	workspace: WorkspaceDetails | null,
): RoomAgentMerge => {
	const options = { ...stored };
	const workspaceId = options.workspace?.workspace_id;
	if (!workspace || !workspaceId) {
		delete options.workspace;
		return {
			options,
			agentTools: NO_AGENT_TOOLS,
			agentGreeting: "",
			defaultModelId: "",
		};
	}
	// the name to show, read again on every load
	const name = workspace.display_name || workspace.name;
	if (name) {
		options.workspace = { workspace_id: workspaceId, name };
	}
	// empty instructions take the agent's
	if (workspace.system_prompt && !options.instructions) {
		options.instructions = workspace.system_prompt;
	}
	const config = workspace.config_json;
	return {
		options,
		agentTools: workspace.mcp,
		agentGreeting: config?.greeting_enabled ? (config.greeting ?? "") : "",
		defaultModelId: config?.model_id ?? "",
	};
};
