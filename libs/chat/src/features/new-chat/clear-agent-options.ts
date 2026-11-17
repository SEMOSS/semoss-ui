import type { RoomStore } from "../room/store/room.store";

/**
 * Clear what a room's options inherited from its agent (the agent itself, its
 * instructions, prompts and harness). The knowledge and tools the user added
 * are the options' `mcp`, which stays; the agent's own are never in it.
 *
 * @param options - The room's options.
 * @returns New options with the agent's configuration removed.
 */
export function clearAgentOptions(
	options: RoomStore["options"],
): RoomStore["options"] {
	return {
		...options,
		workspace: undefined,
		instructions: "",
		predefinedPrompts: [],
		harnessType: undefined,
	};
}
