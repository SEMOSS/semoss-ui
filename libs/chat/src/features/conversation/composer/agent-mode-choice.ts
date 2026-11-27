import type { ChatMode } from "../../../types";
import type { AgentModePolicy } from "../../chat/config/chat-options";

/**
 * Whether users pick a new chat's mode with the Chat and Agent choice. False
 * when the agent picker decides the mode instead (`follows-agent`), where No
 * Agent and Default Agent are separate choices, when every chat runs in agent
 * mode (`agent-only`), and when agent mode is not offered.
 *
 * @param policy - How the host has a new chat's mode chosen.
 * @returns True when the Chat and Agent choice is offered.
 */
export const canChooseAgentMode = (policy: AgentModePolicy): boolean =>
	policy === "choice";

/**
 * Whether a new chat can run in agent mode.
 *
 * @param policy - How the host has a new chat's mode chosen.
 * @returns True when agent mode is offered.
 */
export const offersAgentMode = (policy: AgentModePolicy): boolean =>
	policy !== "chat-only";

/**
 * The modes a new chat can start in, chat first: agent alone where every chat
 * runs in agent mode, chat alone where agent mode is not offered, else both.
 *
 * @param policy - How the host has a new chat's mode chosen.
 * @returns The modes offered.
 */
export const newChatModes = (policy: AgentModePolicy): readonly ChatMode[] => {
	if (policy === "agent-only") return ["agent"];
	return offersAgentMode(policy) ? ["chat", "agent"] : ["chat"];
};

/**
 * Whether the agent picker names its choice of no saved agent Default Agent
 * rather than No Agent: users pick the mode with the Chat and Agent choice, or
 * every chat runs in agent mode.
 *
 * @param policy - How the host has a new chat's mode chosen.
 * @returns True when the no-agent choice is Default Agent.
 */
export const offersDefaultAgent = (policy: AgentModePolicy): boolean =>
	policy === "choice" || policy === "agent-only";
