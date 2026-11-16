import type { RoomStore } from "../room/room.store";

/**
 * Clear what a room's options inherited from its agent (the agent itself, its
 * instructions, prompts, toolboxes and harness) without dropping the
 * knowledge and tools the user added by hand.
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
		mcp: options.mcp.filter((item) => !item.fromWorkspace),
		harnessType: undefined,
	};
}
