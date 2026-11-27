import type { MCPConfig } from "../../../types";
import type { RoomOptions } from "../../room/store/room-snapshot";

/** An agent a room names: its id, and its name when known. */
export type AgentRef = NonNullable<RoomOptions["workspace"]>;

/**
 * How the composer, Settings and the agent picker offer the agent a chat runs.
 *
 * - `fixed`: an open room, whose agent was set when it was created. It is
 *   shown, never picked, and the picker has no Agent tab.
 * - `saved`: a new chat picks a saved agent or none. With `withModeChoice`
 *   the Chat and Agent choice sets the mode (`enableAgentHarness`). With
 *   `noneIsDefaultAgent` no saved agent runs Default Agent, so the picker
 *   names the empty choice Default Agent rather than No Agent: with the Chat
 *   and Agent choice, or where every chat runs in agent mode (`agentModeOnly`).
 * - `savedOrDefault`: the agent picker decides the mode (`modeFollowsAgent`),
 *   offering No Agent and Default Agent as separate choices;
 *   `isDefaultAgent` is which of them is picked while no saved agent is.
 */
export type AgentChoice =
	| { readonly kind: "fixed" }
	| {
			readonly kind: "saved";
			readonly withModeChoice: boolean;
			readonly noneIsDefaultAgent: boolean;
	  }
	| { readonly kind: "savedOrDefault"; readonly isDefaultAgent: boolean };

/** What the agent picker (`MCPOverlay`) hands back when the user saves. */
export interface AgentOverlaySave {
	/** The room's own knowledge and toolboxes; never the agent's. */
	readonly mcp: MCPConfig[];
	/** The saved agent picked, or null for none. */
	readonly workspace?: AgentRef | null;
	/** Whether Default Agent is picked; only a `savedOrDefault` picker reports it. */
	readonly isDefaultAgent?: boolean;
}

/** What a save changes, the same for a room and a new chat. */
export interface AgentOverlayChange {
	/** The options to change: the room's own tools, and the agent when it can be picked. */
	readonly options: Partial<RoomOptions>;
	/** Whether Default Agent is picked, when it is a choice of its own. */
	readonly isDefaultAgent?: boolean;
}

/**
 * Turn the agent picker's save into the change it makes. A `fixed` agent is
 * never changed, whatever the picker reports; Default Agent is reported only
 * where it is a choice of its own.
 *
 * @param next - What the picker saved.
 * @param choice - How the chat offers its agent.
 * @returns The options to change, and whether Default Agent is picked.
 */
export const applyAgentOverlaySave = (
	next: AgentOverlaySave,
	choice: AgentChoice,
): AgentOverlayChange => {
	if (choice.kind === "fixed") return { options: { mcp: next.mcp } };
	const options: Partial<RoomOptions> =
		"workspace" in next
			? { mcp: next.mcp, workspace: next.workspace ?? undefined }
			: { mcp: next.mcp };
	return choice.kind === "savedOrDefault" && next.isDefaultAgent !== undefined
		? { options, isDefaultAgent: next.isDefaultAgent }
		: { options };
};
