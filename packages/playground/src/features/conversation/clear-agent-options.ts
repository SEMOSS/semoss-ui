import type { RoomStore } from "@/stores/room/room.store";

/** Clears inherited agent configuration without dropping manually added context. */
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
