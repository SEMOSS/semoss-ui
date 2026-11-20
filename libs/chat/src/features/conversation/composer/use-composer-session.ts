import type { Engine, MCPConfig } from "../../../types";
import { useChatSession } from "../../chat/provider/use-chat-session";
import type { RoomStore } from "../../room/store/room.store";
import type { RoomOptions } from "../../room/store/room-snapshot";
import { useRoomSelector } from "../../room/store/use-room-selector";
import {
	type AgentChoice,
	type AgentOverlaySave,
	applyAgentOverlaySave,
} from "../../tools/mcp/agent-choice";

/**
 * What the composer and Settings both edit, the same shape for an open room
 * (`useComposerSession`) and a new chat's draft (`useDraftAgent`): the model,
 * the options, the agent, and how each changes.
 */
export interface ComposerSession {
	/** The model the chat answers with. */
	readonly model: Engine | null;
	/** The chat's options: instructions, knowledge, toolboxes, tools, and agent. */
	readonly options: RoomOptions;
	/** The tools and knowledge the chat's agent brings, listed as the agent's. */
	readonly agentTools: readonly MCPConfig[];
	/** Whether the chat runs in agent mode. */
	readonly isAgentMode: boolean;
	/** How the chat offers its agent. */
	readonly agent: AgentChoice;
	/** Picks the model; the pick also becomes the chat's selected model. */
	readonly onModelChange: (model: Engine | null) => void;
	/** Changes some options; one naming `workspace` changes the agent. */
	readonly onOptionsChange: (options: Partial<RoomOptions>) => void;
	/** Told whether Default Agent is picked; only a `savedOrDefault` agent calls it. */
	readonly onDefaultAgentChange?: (isDefaultAgent: boolean) => void;
}

/** An open room's agent choice, the same object every time. */
const FIXED_AGENT: AgentChoice = { kind: "fixed" };

/**
 * Apply what the agent picker saved to a session, through
 * {@link applyAgentOverlaySave}, as the composer and Settings both do.
 *
 * @param session - The room's or the draft's session.
 * @param next - What the picker saved.
 */
export const saveAgentOverlay = (
	session: ComposerSession,
	next: AgentOverlaySave,
): void => {
	const change = applyAgentOverlaySave(next, session.agent);
	session.onOptionsChange(change.options);
	if (change.isDefaultAgent !== undefined) {
		session.onDefaultAgentChange?.(change.isDefaultAgent);
	}
};

/**
 * An open room's composer session. Its agent is fixed at creation; a model
 * picked for it also becomes the chat's selected model, so the next new chat
 * starts with it.
 *
 * @param room - The open room.
 * @returns The room's model, options and agent, and how they change.
 */
export const useComposerSession = (room: RoomStore): ComposerSession => {
	const { chat } = useChatSession();
	const { model, options, agentTools, isAgentMode } = useRoomSelector(
		room,
		(current) => ({
			model: current.model,
			options: current.options,
			agentTools: current.agentTools,
			isAgentMode: current.mode === "agent",
		}),
	);
	return {
		model,
		options,
		agentTools,
		isAgentMode,
		agent: FIXED_AGENT,
		onModelChange: (next) => {
			if (!next) return;
			room.setModel(next);
			chat.setSelectedModel(next);
		},
		onOptionsChange: room.setOptions,
	};
};
